// ================================================================
//  SURFACE DETECTION & PHYSICS
// ================================================================
function getSurface(x, y) {
    // Ice patches (highest priority hazard)
    for (let p of icePatches) {
        if (Math.hypot(x - p.x, y - p.y) < p.r) return 'ice';
    }
    // Sand traps
    for (let p of sandTraps) {
        if (Math.hypot(x - p.x, y - p.y) < p.r) return 'sandtrap';
    }
    // Check hazards first (they overlay base terrain)
    for (let p of oilSlicks) {
        let dx = x - p.x, dy = y - p.y;
        let cos = Math.cos(-p.angle), sin = Math.sin(-p.angle);
        let lx = dx*cos - dy*sin, ly = dx*sin + dy*cos;
        if ((lx*lx)/(p.rx*p.rx) + (ly*ly)/(p.ry*p.ry) < 1) return 'oil';
    }
    for (let p of waterPuddles) {
        if (Math.hypot(x - p.x, y - p.y) < p.r) return 'water';
    }
    for (let p of mudPatches) {
        if (Math.hypot(x - p.x, y - p.y) < p.r) return 'mud';
    }

    // Base terrain — check surfaceDefault first, then radial roads
    if (currentMap && currentMap.surfaceDefault === 'tarmac') return 'tarmac';

    let aW = (currentMap && currentMap.arenaWidth) || ARENA_W;
    let aH = (currentMap && currentMap.arenaHeight) || ARENA_H;
    let cx = aW / 2, cy = aH / 2;
    let dx = x - cx, dy = y - cy;
    let dist = Math.hypot(dx, dy);

    if (currentMap && currentMap.radialRoads) {
        let rr = currentMap.radialRoads;
        let centerRadius = rr.centerRadius || 520;
        let roadCount    = rr.roadCount    || 4;
        let roadWidth    = rr.roadWidth    || 52;
        let roadLength   = rr.roadLength   || 1820;
        let startAngle   = rr.startAngle   || (Math.PI / 4);

        if (dist < centerRadius) return 'tarmac';

        if (dist < roadLength) {
            let ang = Math.atan2(dy, dx);
            for (let i = 0; i < roadCount; i++) {
                let roadAng = (i / roadCount) * Math.PI * 2 + startAngle;
                let perpDist = Math.abs(Math.sin(ang - roadAng)) * dist;
                let alongDist = Math.cos(ang - roadAng) * dist;
                if (alongDist > 0 && perpDist < roadWidth) return 'tarmac';
            }
        }
    }

    // Curvy roads — check point-to-segment distance
    if (currentMap && currentMap.curvyRoads) {
        for (let ri = 0; ri < currentMap.curvyRoads.length; ri++) {
            let road = currentMap.curvyRoads[ri];
            let hw = road.width / 2;
            let pts = road.points;
            for (let i = 0; i < pts.length - 1; i++) {
                let p1 = pts[i], p2 = pts[i+1];
                let sdx = p2.x - p1.x, sdy = p2.y - p1.y;
                let segLen2 = sdx * sdx + sdy * sdy;
                if (segLen2 === 0) continue;
                let t = Math.max(0, Math.min(1, ((x - p1.x) * sdx + (y - p1.y) * sdy) / segLen2));
                let nearX = p1.x + t * sdx, nearY = p1.y + t * sdy;
                if (Math.hypot(x - nearX, y - nearY) < hw) return road.surface || 'tarmac';
            }
        }
    }

    if (!currentMap || !currentMap.radialRoads) {
        // Fallback: original hardcoded geometry
        if (dist < 520) return 'tarmac';

        if (dist < 1820) {
            let ang = Math.atan2(dy, dx);
            for (let i = 0; i < 4; i++) {
                let roadAng = (i / 4) * Math.PI * 2 + Math.PI / 4;
                let perpDist = Math.abs(Math.sin(ang - roadAng)) * dist;
                let alongDist = Math.cos(ang - roadAng) * dist;
                if (alongDist > 0 && perpDist < 52) return 'tarmac';
            }
        }
    }

    for (let p of dirtPatches) {
        if (Math.hypot(x - p.x, y - p.y) < p.r) return 'dirt';
    }

    return 'grass';
}

function getDamageMultiplier(car) {
    let hp = car.health / car.maxHealth;
    if (hp > 0.6) return CONFIG.dmgSpeedFull;
    if (hp > 0.3) {
        // Smooth lerp between full and med
        let t = (hp - 0.3) / 0.3;
        return CONFIG.dmgSpeedMed + t * (CONFIG.dmgSpeedFull - CONFIG.dmgSpeedMed);
    }
    // Smooth lerp between low and med
    let t = hp / 0.3;
    return CONFIG.dmgSpeedLow + t * (CONFIG.dmgSpeedMed - CONFIG.dmgSpeedLow);
}

function applyFriction(car, isHandbrake) {
    let surface = getSurface(car.x, car.y);

    // Decompose velocity into forward and lateral components
    let fx = Math.cos(car.angle), fy = Math.sin(car.angle);
    let forwardSpd = car.vx * fx + car.vy * fy;
    let lateralSpd = car.vx * (-fy) + car.vy * fx;

    // Forward friction (rolling resistance)
    let fwd, lat;
    switch (surface) {
        case 'tarmac': fwd = CONFIG.tarmacFriction; lat = CONFIG.tarmacGrip; break;
        case 'dirt':   fwd = CONFIG.dirtFriction;   lat = CONFIG.dirtGrip;   break;
        case 'mud':    fwd = CONFIG.mudFriction;     lat = CONFIG.mudGrip;    break;
        case 'water':  fwd = CONFIG.waterFriction;   lat = CONFIG.waterGrip;  break;
        case 'oil':    fwd = CONFIG.oilFriction;     lat = CONFIG.oilGrip;    break;
        case 'ice':    fwd = CONFIG.iceFriction;     lat = CONFIG.iceGrip;    break;
        case 'sandtrap': fwd = CONFIG.sandTrapFriction; lat = CONFIG.sandTrapGrip; break;
        default:       fwd = CONFIG.grassFriction;   lat = CONFIG.grassGrip;  break;
    }

    // Map-specific surface friction overrides (keys match CONFIG names, e.g. grassGrip, tarmacFriction)
    if (currentMap && currentMap.surfaceFriction) {
        let sf = currentMap.surfaceFriction;
        let fKey = surface + 'Friction';
        let gKey = surface + 'Grip';
        if (sf[fKey] !== undefined) fwd = sf[fKey];
        if (sf[gKey] !== undefined) lat = sf[gKey];
    }

    // Handbrake overrides lateral grip
    if (isHandbrake) lat = CONFIG.handbrakeGrip;

    // Car type grip bonus
    if (car.carType && car.carType.gripBonus) {
        lat += car.carType.gripBonus;
    }

    // Clamp grip between 0.5 and 0.99
    lat = Math.max(0.5, Math.min(0.99, lat));

    forwardSpd *= fwd;
    lateralSpd *= lat;

    // Reconstruct velocity from components
    car.vx = fx * forwardSpd + (-fy) * lateralSpd;
    car.vy = fy * forwardSpd + fx * lateralSpd;

    return surface;
}

// ================================================================
//  MOVEMENT & COLLISIONS
// ================================================================
function jumpArc(t) { return 4 * t * (1 - t); }

function moveCar(car) {
    if (!car.alive) return;

    // ── Airborne state ──
    if (car.airborne) {
        car.jumpT += 0.0167 / car.jumpDuration;
        car.x += car.vx; car.y += car.vy;

        // Wall clamping
        let aW = (currentMap && currentMap.arenaWidth) || ARENA_W;
        let aH = (currentMap && currentMap.arenaHeight) || ARENA_H;
        const m = 60;
        if (car.x < m) { car.x = m; car.vx *= -0.3; }
        if (car.x > aW - m) { car.x = aW - m; car.vx *= -0.3; }
        if (car.y < m) { car.y = m; car.vy *= -0.3; }
        if (car.y > aH - m) { car.y = aH - m; car.vy *= -0.3; }

        if (car.jumpT >= 1) {
            // Landing
            car.airborne = false;
            car.jumpT = 0;
            car.vx *= CONFIG.jumpLandingLoss;
            car.vy *= CONFIG.jumpLandingLoss;
            // Landing dust cloud
            for (let i = 0; i < 14; i++) {
                let a = Math.random() * Math.PI * 2;
                let s = 0.5 + Math.random() * 2.5;
                particles.push(mkParticle(
                    car.x + (Math.random() - 0.5) * 24,
                    car.y + (Math.random() - 0.5) * 24,
                    Math.cos(a) * s, Math.sin(a) * s,
                    ['#a98','#876','#998','#887'][Math.random()*4|0],
                    3 + Math.random() * 6, 0.025
                ));
            }
            playSfxThrottled('bump', 100);
            // Landing floating text
            if (car.playerIdx >= 0) {
                floatingTexts.push({
                    x: car.x, y: car.y - 35,
                    text: 'LANDED!',
                    color: '#fff', alpha: 1, vy: -0.6, life: 60,
                    bubble: true, bubbleColor: '#ff4'
                });
            }
        }
        car.speed = Math.hypot(car.vx, car.vy);
        return;
    }

    if (car.spinTimer > 0) { car.spinTimer--; car.angle += 0.15; }
    car.x += car.vx; car.y += car.vy;

    // Surface particles — kick up grass/dirt when driving off-road
    let spd = Math.hypot(car.vx, car.vy);
    if (spd > 2) {
        let surface = getSurface(car.x, car.y);
        if (surface === 'grass' && Math.random() < 0.3) {
            particles.push(mkParticle(
                car.x - Math.cos(car.angle)*16 + (Math.random()-.5)*12,
                car.y - Math.sin(car.angle)*16 + (Math.random()-.5)*12,
                (Math.random()-.5)*1.5, -Math.random()*1,
                ['#5a8a2a','#4a7a22','#6a9a3a'][Math.random()*3|0],
                2+Math.random()*3, 0.04
            ));
        } else if (surface === 'dirt' && Math.random() < 0.35) {
            particles.push(mkParticle(
                car.x - Math.cos(car.angle)*16 + (Math.random()-.5)*12,
                car.y - Math.sin(car.angle)*16 + (Math.random()-.5)*12,
                (Math.random()-.5)*1.5, -Math.random()*1,
                ['#8a7a55','#7a6a45','#9a8a65'][Math.random()*3|0],
                2+Math.random()*3, 0.04
            ));
        } else if (surface === 'mud' && Math.random() < 0.5) {
            particles.push(mkParticle(
                car.x + (Math.random()-.5)*16, car.y + (Math.random()-.5)*16,
                (Math.random()-.5)*2.5, -Math.random()*2,
                ['#3d2b1a','#4a3520','#55402a','#2a1a0a'][Math.random()*4|0],
                3+Math.random()*4, 0.03
            ));
        }
    }

    // Wall collision — use currentMap dimensions
    let aW = (currentMap && currentMap.arenaWidth) || ARENA_W;
    let aH = (currentMap && currentMap.arenaHeight) || ARENA_H;
    const m = 60;
    if (car.x < m) { car.x = m; car.vx *= -0.5; }
    if (car.x > aW-m) { car.x = aW-m; car.vx *= -0.5; }
    if (car.y < m) { car.y = m; car.vy *= -0.5; }
    if (car.y > aH-m) { car.y = aH-m; car.vy *= -0.5; }

    // Obstacle collision
    for (let obs of obstacles) {
        let dx = car.x - obs.x, dy = car.y - obs.y;
        let dist = Math.hypot(dx, dy), minD = obs.r + 20;
        if (dist < minD && dist > 0) {
            let nx = dx/dist, ny = dy/dist;
            car.x = obs.x + nx*minD; car.y = obs.y + ny*minD;
            let dot = car.vx*nx + car.vy*ny;
            car.vx -= 1.5*dot*nx; car.vy -= 1.5*dot*ny;
            car.vx *= 0.6; car.vy *= 0.6;
            if (Math.abs(dot) > 2) {
                car.health -= Math.abs(dot)*2;
                spawnSparks(car.x - nx*20, car.y - ny*20, 5);
                playSfxThrottled('bump', 80);
            }
        }
    }
    if (car.damageCooldown > 0) car.damageCooldown--;
    if (car.invincible > 0) car.invincible--;

    // --- Hazard interactions ---
    let carSpd = Math.hypot(car.vx, car.vy);

    // Bushes — slow down + leaf particles
    for (let b of bushes) {
        if (Math.hypot(car.x - b.x, car.y - b.y) < b.r + 15) {
            car.vx *= CONFIG.bushSlowdown;
            car.vy *= CONFIG.bushSlowdown;
            if (carSpd > 1.5 && Math.random() < 0.6) {
                particles.push(mkParticle(
                    car.x + (Math.random()-.5)*20, car.y + (Math.random()-.5)*20,
                    (Math.random()-.5)*3 + car.vx*0.3, (Math.random()-.5)*3 + car.vy*0.3,
                    ['#3a7a1a','#4a9a2a','#2a6a10','#5aaa3a'][Math.random()*4|0],
                    3+Math.random()*5, 0.03
                ));
            }
        }
    }

    // Bumps — bounce + possible spin
    for (let b of bumps) {
        let bd = Math.hypot(car.x - b.x, car.y - b.y);
        if (bd < b.r + 12 && carSpd > 2) {
            if (!car._lastBump || car._lastBump !== b) {
                car._lastBump = b;
                // Kick the car sideways/upward
                let kickAngle = Math.atan2(car.vy, car.vx) + (Math.random()-.5)*0.8;
                car.vx += Math.cos(kickAngle) * CONFIG.bumpBounce * 0.5;
                car.vy += Math.sin(kickAngle) * CONFIG.bumpBounce * 0.5;
                if (Math.random() < CONFIG.bumpSpinChance) car.spinTimer = 8;
                playSfxThrottled('bump', 150);
            }
        } else if (car._lastBump === b) {
            car._lastBump = null;
        }
    }

    // Water splashes
    for (let w of waterPuddles) {
        if (Math.hypot(car.x - w.x, car.y - w.y) < w.r && carSpd > 2 && Math.random() < 0.4) {
            particles.push(mkParticle(
                car.x + (Math.random()-.5)*16, car.y + (Math.random()-.5)*16,
                (Math.random()-.5)*2, -Math.random()*2.5,
                ['#6ac8ff','#88ddff','#aaeeff','#fff'][Math.random()*4|0],
                2+Math.random()*4, 0.04
            ));
        }
    }

    // Breakable collisions (all types)
    for (let i = breakables.length - 1; i >= 0; i--) {
        let b = breakables[i];
        let bdx = car.x - b.x, bdy = car.y - b.y;
        let bdist = Math.hypot(bdx, bdy);
        let bMinD = b.r + 15;
        if (bdist < bMinD && bdist > 0) {
            let bnx = bdx / bdist, bny = bdy / bdist;
            let impact = Math.hypot(car.vx, car.vy);

            // Push breakable away — mass affects push distance
            let pushMult = 0.8 / (b.mass || 1);
            b.x -= bnx * (bMinD - bdist + 5);
            b.y -= bny * (bMinD - bdist + 5);
            b.vx = -bnx * impact * pushMult;
            b.vy = -bny * impact * pushMult;
            b.spinRate = (Math.random() - 0.5) * 0.3 / (b.mass || 1);

            // Damage the breakable
            b.hp -= impact * 3;

            // Type-specific car interaction
            if (b.type === 'tire_stack') {
                // Bouncy — car bounces back
                car.vx += bnx * impact * 0.35;
                car.vy += bny * impact * 0.35;
                car.vx *= 0.75;
                car.vy *= 0.75;
            } else if (b.type === 'hay') {
                // Cushion — absorbs impact, more slowdown, less damage to breakable
                car.vx *= 0.82;
                car.vy *= 0.82;
                b.hp += impact * 1.5; // Hay is spongy, takes less net damage
            } else {
                // Normal minor slowdown
                car.vx *= 0.95;
                car.vy *= 0.95;
            }

            playSfxThrottled('bump', 100);

            if (b.hp <= 0) {
                // Barrel explosion!
                if (b.type === 'barrel') {
                    for (let ci = 0; ci < cars.length; ci++) {
                        let ec = cars[ci];
                        if (!ec.alive) continue;
                        let ed = Math.hypot(ec.x - b.x, ec.y - b.y);
                        if (ed < CONFIG.barrelBlastRadius && ed > 0) {
                            let blastForce = 1 - ed / CONFIG.barrelBlastRadius;
                            let enx = (ec.x - b.x) / ed;
                            let eny = (ec.y - b.y) / ed;
                            ec.vx += enx * blastForce * 6;
                            ec.vy += eny * blastForce * 6;
                            if (ec.invincible <= 0) {
                                ec.health -= CONFIG.barrelBlastDamage * blastForce;
                                checkDeath(ec);
                            }
                        }
                    }
                    spawnExplosion(b.x, b.y, '#f80');
                    playSfx('explode');
                }

                // Destroy — spawn debris and sparks
                let debrisCount = b.type === 'container' ? 14 : 8;
                for (let j = 0; j < debrisCount; j++) {
                    let da = Math.random() * Math.PI * 2;
                    debris.push({
                        x: b.x, y: b.y,
                        vx: Math.cos(da) * (2 + Math.random() * 3),
                        vy: Math.sin(da) * (2 + Math.random() * 3),
                        angle: Math.random() * Math.PI * 2,
                        spin: (Math.random() - 0.5) * 0.3,
                        size: 3 + Math.random() * 5,
                        color: b.color,
                        life: 60 + Math.random() * 60
                    });
                }
                spawnSparks(b.x, b.y, b.type === 'barrel' ? 12 : 6);
                breakables.splice(i, 1);
            }
        }
    }

    // Ramp launch detection
    for (let ri = 0; ri < ramps.length; ri++) {
        let r = ramps[ri];
        let rdx = car.x - r.x, rdy = car.y - r.y;
        let rcos = Math.cos(-r.angle), rsin = Math.sin(-r.angle);
        let lx = rdx * rcos - rdy * rsin;
        let ly = rdx * rsin + rdy * rcos;
        if (Math.abs(lx) < r.w / 2 && Math.abs(ly) < r.h / 2) {
            if (carSpd > CONFIG.jumpMinSpeed && car.lastRamp !== r) {
                car.airborne = true;
                car.lastRamp = r;
                car.jumpVx = car.vx;
                car.jumpVy = car.vy;
                let speedFactor = Math.min(carSpd / CONFIG.nitroMaxSpeed, 1);
                car.jumpHeight = CONFIG.jumpHeightMin + speedFactor * (CONFIG.jumpHeightMax - CONFIG.jumpHeightMin);
                car.jumpDuration = CONFIG.jumpDurMin + speedFactor * (CONFIG.jumpDurMax - CONFIG.jumpDurMin);
                car.jumpT = 0;
                // Takeoff dust
                for (let ti = 0; ti < 8; ti++) {
                    let ta = Math.random() * Math.PI * 2;
                    particles.push(mkParticle(
                        car.x + (Math.random() - 0.5) * 16,
                        car.y + (Math.random() - 0.5) * 16,
                        Math.cos(ta) * 1.5, Math.sin(ta) * 1.5,
                        '#aa9', 3 + Math.random() * 4, 0.035
                    ));
                }
                playSfxThrottled('nitro', 200);
                // Floating text
                if (car.playerIdx >= 0) {
                    floatingTexts.push({
                        x: car.x, y: car.y - 30,
                        text: 'AIR!',
                        color: '#fff', alpha: 1, vy: -0.8, life: 50,
                        bubble: true, bubbleColor: '#ff4'
                    });
                }
                break;
            }
        } else if (car.lastRamp === r) {
            car.lastRamp = null;
        }
    }
}

function updateBreakables() {
    for (let b of breakables) {
        if (b.vx || b.vy) {
            b.x += b.vx; b.y += b.vy;
            b.vx *= 0.9; b.vy *= 0.9;
            if (Math.abs(b.vx) < 0.1 && Math.abs(b.vy) < 0.1) { b.vx = 0; b.vy = 0; }
        }
        if (b.spinRate) {
            b.angle += b.spinRate;
            b.spinRate *= 0.95;
            if (Math.abs(b.spinRate) < 0.005) b.spinRate = 0;
        }
        // Keep in bounds
        let aW = (currentMap && currentMap.arenaWidth) || ARENA_W;
        let aH = (currentMap && currentMap.arenaHeight) || ARENA_H;
        if (b.x < 80) b.x = 80; if (b.x > aW - 80) b.x = aW - 80;
        if (b.y < 80) b.y = 80; if (b.y > aH - 80) b.y = aH - 80;
    }
}

function checkCollisions() {
    for (let i = 0; i < cars.length; i++) {
        for (let j = i+1; j < cars.length; j++) {
            let a = cars[i], b = cars[j];
            if (!a.alive || !b.alive) continue;
            if (a.airborne || b.airborne) continue;
            // Team friendly fire check
            if (activeMode && activeMode.friendlyFire === false && a.team && b.team && a.team === b.team) continue;
            let dx = b.x-a.x, dy = b.y-a.y, dist = Math.hypot(dx,dy);
            if (dist < 35 && dist > 0) {
                // Infection spreads on contact
                if (a.infected !== b.infected && activeMode && activeMode.id.indexOf('infected') >= 0) {
                    let victim = a.infected ? b : a;
                    if (!victim.infected) {
                        victim.infected = true;
                        victim.color = '#33ff33';
                        spawnInfectionCloud(victim.x, victim.y);
                        floatingTexts.push({
                            x: victim.x, y: victim.y - 45,
                            text: 'INFECTED!', color: '#fff', alpha: 1, vy: -0.8, life: 120,
                            bubble: true, bubbleColor: '#33ff33'
                        });
                        playSfxThrottled('explode', 100);
                    }
                }

                let nx = dx/dist, ny = dy/dist, overlap = 35-dist;

                // Mass-based separation and velocity exchange
                let totalMass = (a.carType?.mass||1) + (b.carType?.mass||1);
                let aRatio = (b.carType?.mass||1) / totalMass;
                let bRatio = (a.carType?.mass||1) / totalMass;

                a.x -= nx*overlap*aRatio; a.y -= ny*overlap*aRatio;
                b.x += nx*overlap*bRatio; b.y += ny*overlap*bRatio;
                let rvx = a.vx-b.vx, rvy = a.vy-b.vy;
                let impact = Math.abs(rvx*nx + rvy*ny);
                let dot = rvx*nx + rvy*ny;
                a.vx -= dot*nx*aRatio; a.vy -= dot*ny*aRatio;
                b.vx += dot*nx*bRatio; b.vy += dot*ny*bRatio;

                if (impact > 1.5) {
                    let dmg = impact * CONFIG.collisionDmg * (2+Math.random());
                    let aS = Math.hypot(a.vx,a.vy), bS = Math.hypot(b.vx,b.vy);
                    let dB = dmg*(aS/(aS+bS+.1)) * (a.activePowerUp === 'damage' ? 2 : 1) * (a.carType?.collisionDmgMult || 1);
                    let dA = dmg*(bS/(aS+bS+.1)) * (b.activePowerUp === 'damage' ? 2 : 1) * (b.carType?.collisionDmgMult || 1);

                    if (a.damageCooldown<=0 && a.invincible<=0) {
                        let finalDA = a.activePowerUp === 'shield' ? dA * 0.3 : dA;
                        a.health -= finalDA; a.lastHitBy = b; a.damageCooldown = 10;
                    }
                    if (b.damageCooldown<=0 && b.invincible<=0) {
                        let finalDB = b.activePowerUp === 'shield' ? dB * 0.3 : dB;
                        b.health -= finalDB; b.lastHitBy = a; b.damageCooldown = 10;
                    }

                    // Track hits & damage for human players
                    if (a.playerIdx >= 0) { a.hits++; a.damageDealt += dB; }
                    if (b.playerIdx >= 0) { b.hits++; b.damageDealt += dA; }

                    if (impact > 5) { if (dA > dB) a.spinTimer = 15; else b.spinTimer = 15; }

                    let cx = (a.x+b.x)/2, cy = (a.y+b.y)/2;
                    spawnSparks(cx, cy, impact*2|0);
                    spawnSmoke(cx, cy, impact|0);

                    if (impact > 4) playSfxThrottled('hit', 60);
                    else playSfxThrottled('bump', 60);

                    if (impact > 4) {
                        for (let k = 0; k < 3; k++) {
                            debris.push({
                                x: cx, y: cy,
                                vx: (Math.random()-.5)*5, vy: (Math.random()-.5)*5,
                                angle: Math.random()*Math.PI*2, spin: (Math.random()-.5)*.2,
                                size: 3+Math.random()*5,
                                color: Math.random()<.5 ? a.color : b.color,
                                life: 60+Math.random()*60
                            });
                        }
                    }

                    // Impact commentary — pick callout based on severity & mode
                    let callout = null;
                    let bubCol = '#ff4';
                    let rng = Math.random();
                    let isCopMode = activeMode && activeMode.isCops;
                    let isInfMode = activeMode && activeMode.id && activeMode.id.indexOf('infected') >= 0;
                    let isCTFMode = activeMode && activeMode.isCTF;
                    if (impact > 8 && rng < 0.7) {
                        let epic = isCopMode
                            ? ['WRECKED!', 'TOTALED!', 'TAKEDOWN!', 'RAMMED!', 'PIT STOP!', 'CODE RED!', 'LIGHTS OUT!', 'DISPATCHED!', 'FLATLINED!', 'TERMINATED!']
                            : isInfMode
                            ? ['CONTAMINATED!', 'TOXIC SLAM!', 'BIOHAZARD!', 'MUTATION!', 'OUTBREAK!', 'EPIDEMIC!', 'VIRAL HIT!', 'PLAGUE STRIKE!', 'CONTAGION!', 'PATIENT ZERO!']
                            : isCTFMode
                            ? ['FLAG JACKED!', 'FUMBLE!', 'INTERCEPTED!', 'SACKED!', 'FLAG DOWN!', 'TURNOVER!', 'STOLEN!', 'STRIPPED!', 'PICKED OFF!', 'FLAGGED!']
                            : ['WASTED!', 'OBLITERATED!', 'BULLDOZED!', 'YEETED!', 'DESTRUCTION!',
                            'ANNIHILATED!', 'FATALITY!', 'DECIMATED!', 'VAPORIZED!', 'DELETED!',
                            'SENT TO ORBIT!', 'RIP BOZO!', 'GET REKT!', 'SKILL ISSUE!', 'UNINSTALL!'];
                        callout = epic[Math.random() * epic.length | 0];
                        bubCol = isCopMode ? '#4466ff' : isInfMode ? '#33ff33' : isCTFMode ? '#ffaa00' : '#ff6644';
                    } else if (impact > 5 && rng < 0.55) {
                        let heavy = isCopMode
                            ? ['PULL OVER!', 'BUSTED!', 'PURSUIT!', 'ROADBLOCK!', 'SIRENS!', 'BADGE SLAM!', 'CUFFED!', 'JUSTICE!', 'NO ESCAPE!', 'BOOKED!']
                            : isInfMode
                            ? ['INFECTED!', 'SPREADING!', 'SICK HIT!', 'TOXIC!', 'MUTATING!', 'GROSS!', 'VIRAL!', 'SPORES!', 'OOZE!', 'SICKLY!']
                            : isCTFMode
                            ? ['DROP IT!', 'MY FLAG!', 'GIVE IT!', 'TACKLE!', 'BLITZ!', 'FLAGGED!', 'SNATCH!', 'GRABBED!', 'MINE NOW!', 'HAND OVER!']
                            : ['CRUNCHED!', 'PANCAKED!', 'BODIED!', 'SLAMMED!', 'BOOM!',
                            'NICE HIT!', 'SAVAGE!', 'BRUTAL!', 'OOF!', 'CRUMPLED!',
                            'TOTALED!', 'BONK!', 'KAPOW!', 'SMASHED!', 'POW!'];
                        callout = heavy[Math.random() * heavy.length | 0];
                        bubCol = isCopMode ? '#4466ff' : isInfMode ? '#33ff33' : isCTFMode ? '#ffaa00' : '#ffaa22';
                    } else if (impact > 3 && rng < 0.4) {
                        let medium = isCopMode
                            ? ['STOP!', 'HALT!', 'FREEZE!', 'SLOW DOWN!', 'VIOLATION!', 'TICKET!', 'SUSPECT!', 'YIELD!']
                            : isInfMode
                            ? ['COUGH!', 'SNEEZE!', 'ITCHY!', 'QUEASY!', 'UGHH!', 'YUCK!', 'GROSS!', 'SLIMY!']
                            : isCTFMode
                            ? ['GIMME!', 'DIBS!', 'FLAG ME!', 'COMING!', 'NEED IT!', 'YOINK!', 'GOT YA!', 'HEY FLAG!']
                            : ['OUCH!', 'YIKES!', 'BONK!', 'BOP!', 'CLANK!',
                            'THWACK!', 'DENIED!', 'NOPE!', 'BRUH!', 'ZOINKS!',
                            'WATCH IT!', 'MY PAINT!', 'NOT COOL!', 'EXCUSE ME?!', 'REALLY?!'];
                        callout = medium[Math.random() * medium.length | 0];
                        bubCol = isCopMode ? '#6688cc' : isInfMode ? '#66ff66' : isCTFMode ? '#ffcc44' : '#ffdd44';
                    } else if (impact > 1.5 && rng < 0.2) {
                        let light = isCopMode
                            ? ['move along', 'license?', 'step out', 'ID please', 'sir...']
                            : isInfMode
                            ? ['*cough*', 'achoo', 'ew', 'gross', '*drip*']
                            : isCTFMode
                            ? ['flag?', 'mine!', 'dibs', 'coming!', '*vroom*']
                            : ['tap tap', 'boop', 'nudge', 'excuse me', 'beep beep',
                            'oopsie', 'sorry!', 'my bad', 'lol', '*bonk*'];
                        callout = light[Math.random() * light.length | 0];
                        bubCol = isCopMode ? '#8899bb' : isInfMode ? '#99ff99' : isCTFMode ? '#ffdd88' : '#aaddff';
                    }

                    // Damage number — plain text, color-coded by severity
                    let dmgNum = Math.round(dmg);
                    let dmgCol = dmgNum >= 40 ? '#ff4444' : dmgNum >= 25 ? '#ff8844' : dmgNum >= 15 ? '#ffcc44' : '#aaddff';
                    floatingTexts.push({
                        x: cx, y: cy - 20, text: '-' + dmgNum,
                        color: dmgCol, alpha: 1, vy: -0.8, life: 80
                    });

                    // Callout bubble (if any)
                    if (callout) {
                        floatingTexts.push({
                            x: cx, y: cy - 40, text: callout,
                            color: '#fff', alpha: 1, vy: -0.9, life: 100,
                            bubble: true, bubbleColor: bubCol
                        });
                    }

                    // CTF: big hit knocks flag loose
                    if (ctfFlag && impact > 5) {
                        if (ctfFlag.carrier === a || ctfFlag.carrier === b) {
                            var flagHolder = ctfFlag.carrier;
                            ctfDropFlag();
                            // Knock flag away from impact
                            ctfFlag.x = flagHolder.x + (Math.random() - 0.5) * 80;
                            ctfFlag.y = flagHolder.y + (Math.random() - 0.5) * 80;
                        }
                    }

                    // Occasional swear/reaction bubble on the victim
                    if (impact > 3 && Math.random() < 0.3) {
                        let victim = dA > dB ? a : b;
                        let hasFlag = ctfFlag && ctfFlag.carrier === victim;
                        let swears = isCopMode
                            ? (victim.isCop
                                ? ['DISPATCH!', 'BACKUP!', '10-4!', 'SUSPECT!', 'PURSUIT!', 'RUNNER!', 'ENGAGE!', 'COPY THAT!']
                                : ['OH NO!', 'THE COPS!', 'FLOOR IT!', 'GOTTA GO!', 'NOT TODAY!', 'THEY FOUND ME!', 'LOSE THEM!', 'FASTER!'])
                            : isInfMode
                            ? (victim.infected
                                ? ['BRAINS!', 'HUNGRY!', 'JOIN US!', 'ONE OF US!', 'FRESH MEAT!', '*GROAN*']
                                : ['STAY BACK!', 'DON\'T TOUCH!', 'EWW!', 'GET AWAY!', 'NO NO NO!', 'QUARANTINE!', 'HELP!', 'I\'M CLEAN!'])
                            : isCTFMode
                            ? (hasFlag
                                ? ['MY FLAG!', 'BACK OFF!', 'NOT YOURS!', 'CAN\'T HAVE IT!', 'MINE MINE!', 'FINDERS KEEPERS!', 'GO AWAY!', 'NO TOUCH!']
                                : ['GIMME FLAG!', 'WHERE IS IT!', 'I WANT IT!', 'DIBS NEXT!', 'MOVE!', 'OUTTA WAY!', 'NEED FLAG!', 'FLAG ME!'])
                            : ['#@$%!', 'HEY!!', 'OUCH!', '%@#$!', 'ARGH!', 'RUDE!',
                            'WTF!', '$#@%!', 'OW!!', 'NOOO!', 'WHY?!', 'BRO!!',
                            'DUDE!!', 'COME ON!', 'SERIOUSLY?!', 'I JUST FIXED THAT!',
                            'MY BUMPER!', 'INSURANCE!', 'NOT AGAIN!', 'MOM HELP!'];
                        floatingTexts.push({
                            x: victim.x, y: victim.y - 40,
                            text: swears[Math.random() * swears.length | 0],
                            color: '#fff', alpha: 1, vy: -0.4, life: 100,
                            bubble: true, bubbleColor: victim.color
                        });
                    }
                }
                checkDeath(a);
                checkDeath(b);
            }
        }
    }
}

function respawnCar(car) {
    let rW = (currentMap && currentMap.arenaWidth) || ARENA_W;
    let rH = (currentMap && currentMap.arenaHeight) || ARENA_H;
    let bestX, bestY, bestDist = 0;
    for (let attempt = 0; attempt < 20; attempt++) {
        let rx = 200 + Math.random() * (rW - 400);
        let ry = 200 + Math.random() * (rH - 400);
        let minDist = Infinity;
        for (let c of cars) {
            if (!c.alive || c === car) continue;
            let d = Math.hypot(c.x - rx, c.y - ry);
            if (d < minDist) minDist = d;
        }
        for (let o of obstacles) {
            let d = Math.hypot(o.x - rx, o.y - ry) - o.r;
            if (d < minDist) minDist = d;
        }
        if (minDist > bestDist) { bestDist = minDist; bestX = rx; bestY = ry; }
    }
    car.x = bestX; car.y = bestY;
    car.vx = 0; car.vy = 0; car.speed = 0;
    car.angle = Math.random() * Math.PI * 2;
    car.prevAngle = car.angle;
    car.health = car.maxHealth;
    car.alive = true;
    car.spinTimer = 0;
    car.turnTimer = 0;
    car.invincible = 120;
    car.nitro = CONFIG.nitroMax;
    car.nitroCooldown = 0;
    car.nitroActive = false;
    car.nitroBurnTimer = 0;
    car.lastHitBy = null;
    car.airborne = false;
    car.jumpT = 0;
    car.lastRamp = null;
    for (let i = 0; i < 15; i++) {
        let a = (i / 15) * Math.PI * 2;
        particles.push(mkParticle(
            car.x + Math.cos(a) * 30, car.y + Math.sin(a) * 30,
            Math.cos(a) * 2, Math.sin(a) * 2,
            car.color, 5 + Math.random() * 4, 0.04
        ));
    }
}

function checkDeath(car) {
    if (car.health <= 0 && car.alive) {
        car.alive = false; car.health = 0;
        spawnExplosion(car.x, car.y, car.color);
        playSfx('explode');

        // CTF: drop flag on death
        if (ctfFlag && ctfFlag.carrier === car) {
            ctfDropFlag();
        }

        if (car.lastHitBy) {
            car.lastHitBy.kills++;
            if (gameMode === 'single' && car.lastHitBy.playerIdx === 0) {
                // Single player: award score for kills
                score += 500;
                playSfx('kill');
                floatingTexts.push({
                    x: car.x, y: car.y - 30,
                    text: `+500 DESTROYED ${car.name}!`,
                    color: '#fff', alpha: 1, vy: -0.5, life: 120,
                    bubble: true, bubbleColor: car.lastHitBy.color
                });
            } else if (gameMode === 'multi' && car.lastHitBy.playerIdx >= 0) {
                // Multiplayer: kill notification
                playSfx('kill');
                floatingTexts.push({
                    x: car.x, y: car.y - 30,
                    text: `\u{1F4A5} ${car.lastHitBy.name} destroyed ${car.name}!`,
                    color: '#fff', alpha: 1, vy: -0.5, life: 120,
                    bubble: true, bubbleColor: car.lastHitBy.color
                });
            }
        }

        // Killer celebration bubble (any car that gets a kill)
        if (car.lastHitBy && car.lastHitBy.alive && Math.random() < 0.5) {
            let killer = car.lastHitBy;
            let isCopM = activeMode && activeMode.isCops;
            let isInfM = activeMode && activeMode.id && activeMode.id.indexOf('infected') >= 0;
            let isCTFM = activeMode && activeMode.isCTF;
            let cheers = isCopM
                ? (killer.isCop
                    ? ['SUSPECT DOWN!', 'BOOKED!', '10-4!', 'NEUTRALIZED!', 'JUSTICE!', 'CUFFED!', 'CASE CLOSED!', 'BUSTED!']
                    : ['ESCAPED!', 'SEE YA!', 'CAN\'T CATCH ME!', 'FREEDOM!', 'TOO SLOW!', 'LATER COPPER!', 'VROOM!', 'LOST THEM!'])
                : isInfM
                ? (killer.infected
                    ? ['JOIN US!', 'ONE MORE!', 'WELCOME!', 'TASTY!', 'FRESH!', 'GOTCHA!', '*SLURP*', 'OURS NOW!']
                    : ['STAY CLEAN!', 'NOT TODAY!', 'IMMUNE!', 'NOPE!', 'BACK OFF!', 'CLEAN KILL!'])
                : isCTFM
                ? ['MY FLAG NOW!', 'DROPPED IT!', 'FUMBLE!', 'FLAG THIEF!', 'YOINK!', 'INTERCEPTED!', 'FLAG SECURED!', 'NICE TRY!']
                : ['WOOHOO!', 'YEAH!!', 'GET REKT!', 'BOOM!', 'HAHA!', 'EZ!', 'LATER!', 'BYE BYE!', 'CRUSHED!', 'OWNED!', 'TOO EASY!', 'YESSS!'];
            floatingTexts.push({
                x: killer.x, y: killer.y - 42,
                text: cheers[Math.random() * cheers.length | 0],
                color: '#fff', alpha: 1, vy: -0.35, life: 110,
                bubble: true, bubbleColor: killer.color
            });
        }

        // Players auto-respawn after 5 seconds (if mode allows)
        if (car.playerIdx >= 0) {
            car.deaths = (car.deaths || 0) + 1;
            var allowRespawn = !activeMode || activeMode.respawn !== false;
            if (!allowRespawn && !slomoActive) {
                // No-respawn mode: trigger epic explosion + slow-mo death
                spawnEpicExplosion(car.x, car.y, car.color);
                slomoActive = true;
                slomoTimer = 0;
                slomoFade = 0;
            } else {
                car.respawnTimer = 300; // 5 seconds at 60fps
            }
        }
    }
}
