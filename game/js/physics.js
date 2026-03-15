// ================================================================
//  SURFACE DETECTION & PHYSICS
// ================================================================
function getSurface(x, y) {
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

    // Base terrain — read radial road layout from currentMap
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
    } else {
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
function moveCar(car) {
    if (!car.alive) return;
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
}

function checkCollisions() {
    for (let i = 0; i < cars.length; i++) {
        for (let j = i+1; j < cars.length; j++) {
            let a = cars[i], b = cars[j];
            if (!a.alive || !b.alive) continue;
            let dx = b.x-a.x, dy = b.y-a.y, dist = Math.hypot(dx,dy);
            if (dist < 35 && dist > 0) {
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

                    floatingTexts.push({
                        x: cx, y: cy - 20, text: `-${Math.round(dmg)}`,
                        color: '#ff4', alpha: 1, vy: -0.8, life: 80
                    });

                    // Occasional swear bubble on the car that got hit harder
                    if (impact > 3 && Math.random() < 0.3) {
                        let victim = dA > dB ? a : b;
                        let swears = ['#@$%!', 'HEY!!', 'OUCH!', '%@#$!', 'ARGH!', 'RUDE!', 'WTF!', '$#@%!', 'OW!!', 'NOOO!'];
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

        if (car.lastHitBy) {
            car.lastHitBy.kills++;
            if (gameMode === 'single' && car.lastHitBy.playerIdx === 0) {
                // Single player: award score for kills
                score += 500;
                playSfx('kill');
                floatingTexts.push({
                    x: car.x, y: car.y - 30,
                    text: `+500 DESTROYED ${car.name}!`,
                    color: car.lastHitBy.color, alpha: 1, vy: -0.5, life: 120
                });
            } else if (gameMode === 'multi' && car.lastHitBy.playerIdx >= 0) {
                // Multiplayer: kill notification
                playSfx('kill');
                floatingTexts.push({
                    x: car.x, y: car.y - 30,
                    text: `\u{1F4A5} ${car.lastHitBy.name} destroyed ${car.name}!`,
                    color: car.lastHitBy.color, alpha: 1, vy: -0.5, life: 120
                });
            }
        }

        // Killer celebration bubble (any car that gets a kill)
        if (car.lastHitBy && car.lastHitBy.alive && Math.random() < 0.5) {
            let killer = car.lastHitBy;
            let cheers = ['WOOHOO!', 'YEAH!!', 'GET REKT!', 'BOOM!', 'HAHA!', 'EZ!', 'LATER!', 'BYE BYE!', 'CRUSHED!', 'OWNED!', 'TOO EASY!', 'YESSS!'];
            floatingTexts.push({
                x: killer.x, y: killer.y - 42,
                text: cheers[Math.random() * cheers.length | 0],
                color: '#fff', alpha: 1, vy: -0.35, life: 110,
                bubble: true, bubbleColor: killer.color
            });
        }

        // Players auto-respawn after 5 seconds
        if (car.playerIdx >= 0) {
            car.deaths = (car.deaths || 0) + 1;
            car.respawnTimer = 300; // 5 seconds at 60fps
        }

        // Game ends when all AI are destroyed
        let aiAlive = cars.filter(c => c.playerIdx === -1 && c.alive).length;
        if (aiAlive === 0) {
            setTimeout(() => endGame(), 1000);
        }
    }
}
