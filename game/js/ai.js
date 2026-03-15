// ================================================================
//  UPDATE — AI
//  Extracted from destruction-derby.html with car type multipliers
//  Globals: cars, CONFIG, ARENA_W, ARENA_H, obstacles, particles,
//           applyFriction(), getDamageMultiplier(),
//           playSfxThrottled(), mkParticle(), addSkid()
// ================================================================

function updateAI(car, dt) {
    if (!car.alive) return;
    if (car.airborne) return; // No control while airborne
    car.aiTimer -= dt;
    let spd = Math.hypot(car.vx, car.vy);

    // Infected mode: override AI behavior
    var infectedMode = activeMode && activeMode.id && activeMode.id.indexOf('infected') >= 0;
    // Robbery mode: cops always chase players
    var robberyMode = activeMode && activeMode.isCops;
    // CTF mode: chase flag carrier or go to flag
    var ctfMode = activeMode && activeMode.isCTF;

    if (car.aiTimer <= 0) {
        car.aiTimer = 1 + Math.random() * 2;

        if (ctfMode) {
            // CTF: if carrying flag, flee; otherwise chase carrier or go to flag
            car.aiState = (ctfFlag && ctfFlag.carrier === car) ? 'flee' : 'chase';
        } else if (robberyMode && car.isCop) {
            // Cop AI: always chase — relentless pursuit
            car.aiState = 'chase';
        } else if (infectedMode) {
            // Infected AI: always chase uninfected targets
            // Uninfected AI: always flee from infected cars
            car.aiState = car.infected ? 'chase' : 'flee';
        } else {
            car.aiState = car.health < 25 ? 'flee' : (Math.random() < 0.7 ? 'chase' : 'roam');
        }

        if (car.aiState === 'chase') {
            if (ctfMode && ctfFlag) {
                // CTF: chase the flag carrier, or go toward loose flag
                if (ctfFlag.carrier && ctfFlag.carrier !== car && ctfFlag.carrier.alive) {
                    car.aiTarget = ctfFlag.carrier;
                } else {
                    // No carrier — create a virtual target at flag position
                    car.aiTarget = { x: ctfFlag.x, y: ctfFlag.y, alive: true };
                }
            } else {
                let best = null, bestD = Infinity;
                for (let o of cars) {
                    if (o === car || !o.alive) continue;
                    // Infected mode: infected only chase uninfected
                    if (infectedMode && car.infected && o.infected) continue;
                    // Teams mode: never chase teammates
                    if (car.team && o.team && car.team === o.team) continue;
                    // Robbery mode: cops only chase players
                    if (robberyMode && car.isCop && o.playerIdx < 0) continue;
                    let d = Math.hypot(o.x - car.x, o.y - car.y);
                    if (o.playerIdx >= 0) d *= 0.55; // prefer humans
                    if (d < bestD) { bestD = d; best = o; }
                }
                car.aiTarget = best;
            }
        }
    }

    let targetAng = car.angle;
    let targetDist = Infinity;
    if (car.aiState === 'chase' && car.aiTarget?.alive) {
        // Infected mode: stop chasing if target got infected
        if (infectedMode && car.infected && car.aiTarget.infected) {
            car.aiTimer = 0; // force re-evaluate next frame
        } else {
            targetAng = Math.atan2(car.aiTarget.y - car.y, car.aiTarget.x - car.x);
            targetDist = Math.hypot(car.aiTarget.x - car.x, car.aiTarget.y - car.y);
        }
    } else if (car.aiState === 'flee') {
        // Flee: find nearest threat
        let best = null, bestD = Infinity;
        for (let o of cars) {
            if (o === car || !o.alive) continue;
            // Infected mode: uninfected only flee from infected cars
            if (infectedMode && !car.infected && !o.infected) continue;
            // Teams mode: only flee from enemy team cars
            if (car.team && o.team && car.team === o.team) continue;
            let d = Math.hypot(o.x - car.x, o.y - car.y);
            if (d < bestD) { bestD = d; best = o; }
        }
        if (best) targetAng = Math.atan2(car.y - best.y, car.x - best.x);
    } else {
        if (Math.random() < 0.02) car.aiSteerDir = (Math.random()-.5)*0.06;
        targetAng = car.angle + car.aiSteerDir;
    }

    // Wall / obstacle avoid — use currentMap dimensions
    let aW = (currentMap && currentMap.arenaWidth) || ARENA_W;
    let aH = (currentMap && currentMap.arenaHeight) || ARENA_H;
    const wm = 160;
    let nearWall = false;
    if (car.x < wm) { targetAng = 0; if (car.x < 120) nearWall = true; }
    if (car.x > aW - wm) { targetAng = Math.PI; if (car.x > aW - 120) nearWall = true; }
    if (car.y < wm) { targetAng = Math.PI/2; if (car.y < 120) nearWall = true; }
    if (car.y > aH - wm) { targetAng = -Math.PI/2; if (car.y > aH - 120) nearWall = true; }
    let nearObs = false;
    for (let obs of obstacles) {
        let obsDist = Math.hypot(obs.x-car.x, obs.y-car.y);
        if (obsDist < obs.r + 80) targetAng = Math.atan2(car.y-obs.y, car.x-obs.x);
        if (obsDist < obs.r + 50) nearObs = true;
    }

    let diff = targetAng - car.angle;
    while (diff > Math.PI) diff -= Math.PI*2;
    while (diff < -Math.PI) diff += Math.PI*2;
    if (diff > 0.05) car.angle += CONFIG.turnSpeed * (car.carType?.turnMult || 1) * 0.8;
    else if (diff < -0.05) car.angle -= CONFIG.turnSpeed * (car.carType?.turnMult || 1) * 0.8;

    // Track AI turning for skid marks
    let aiAngleDelta = car.angle - car.prevAngle;
    while (aiAngleDelta > Math.PI) aiAngleDelta -= Math.PI*2;
    while (aiAngleDelta < -Math.PI) aiAngleDelta += Math.PI*2;
    if (Math.abs(aiAngleDelta) > 0.01) car.turnTimer++;
    else car.turnTimer = Math.max(0, car.turnTimer - 2);
    car.prevAngle = car.angle;

    // --- AI Nitro usage (cooldown-based) ---
    var nitroRange = (infectedMode && car.infected) ? 700 : (robberyMode && car.isCop) ? 600 : 400;
    if (car.aiState === 'chase' && car.aiTarget?.alive && targetDist < nitroRange
        && car.nitro >= CONFIG.nitroMax && car.nitroCooldown <= 0 && !car.nitroActive) {
        car.nitroActive = true;
        car.nitroBurnTimer = CONFIG.nitroBurnFrames + (car.carType?.nitroBonus || 0);
    }

    // AI nitro burn timer
    if (car.nitroActive) {
        car.nitroBurnTimer--;
        if (car.nitroBurnTimer <= 0) {
            car.nitroActive = false;
            car.nitroCooldown = CONFIG.nitroCooldown;
            car.nitro = 0;
        }
    }

    // AI cooldown tick
    if (car.nitroCooldown > 0) {
        car.nitroCooldown--;
        if (car.nitroCooldown <= 0) {
            car.nitro = CONFIG.nitroMax;
        }
    }

    let aiUseNitro = car.nitroActive;

    // --- AI Power-up speed boost + damage penalty ---
    let speedMult = car.activePowerUp === 'speed' ? 1.35 : 1;
    // Infected AI gets a speed boost — they're frenzied hunters
    if (infectedMode && car.infected) speedMult *= 1.15;
    // Cop AI gets a speed boost — pursuit mode
    if (robberyMode && car.isCop) speedMult *= 1.1;
    let dmgMult = getDamageMultiplier(car);

    let accel = (aiUseNitro ? CONFIG.nitroAccel : CONFIG.autoAccel * (car.carType?.accelMult || 1) * 0.82) * speedMult * dmgMult;
    let cap = (aiUseNitro ? CONFIG.nitroMaxSpeed : CONFIG.maxSpeed * (car.carType?.maxSpeedMult || 1) * 0.82) * speedMult * dmgMult;

    // Wobble steering when badly damaged
    let hp = car.health / car.maxHealth;
    if (hp < 0.4) {
        let wobbleIntensity = CONFIG.dmgWobble * (1 - hp / 0.4);
        car.angle += Math.sin(performance.now() * 0.008 + car.x) * wobbleIntensity
                   + Math.sin(performance.now() * 0.013) * wobbleIntensity * 0.5;
    }

    // Auto accel
    car.vx += Math.cos(car.angle) * accel;
    car.vy += Math.sin(car.angle) * accel;

    // --- AI Braking ---
    if (nearWall && spd > 2) {
        car.vx *= 0.88;
        car.vy *= 0.88;
    }
    if (nearObs && spd > 2) {
        car.vx *= 0.92;
        car.vy *= 0.92;
    }
    if (car.aiState === 'chase' && car.aiTarget?.alive && spd > 2) {
        let dirToTargetX = car.aiTarget.x - car.x;
        let dirToTargetY = car.aiTarget.y - car.y;
        let dotProduct = car.vx * dirToTargetX + car.vy * dirToTargetY;
        if (dotProduct < 0) {
            car.vx *= 0.95;
            car.vy *= 0.95;
        }
    }

    // --- AI Nitro effects ---
    if (aiUseNitro) {
        if (car.nitroSfxCooldown <= 0) {
            playSfxThrottled('nitro', 300);
            car.nitroSfxCooldown = 18;
        }
        let nCount = Math.random() < 0.5 ? 1 : 2;
        for (let i = 0; i < nCount; i++) {
            particles.push(mkParticle(
                car.x - Math.cos(car.angle) * 22,
                car.y - Math.sin(car.angle) * 22,
                -Math.cos(car.angle)*2 + (Math.random()-.5)*1,
                -Math.sin(car.angle)*2 + (Math.random()-.5)*1,
                ['#ff4400','#ff8800','#ffcc00'][Math.random()*3|0],
                4 + Math.random()*5, 0.06
            ));
        }
    }
    if (car.nitroSfxCooldown > 0) car.nitroSfxCooldown--;

    // Surface-aware friction with lateral grip
    applyFriction(car, false);
    spd = Math.hypot(car.vx, car.vy);
    if (spd > cap) {
        var newSpd = spd * 0.97;
        if (newSpd < cap) newSpd = cap;
        car.vx = car.vx / spd * newSpd;
        car.vy = car.vy / spd * newSpd;
    }
    car.speed = spd;

    // AI sharp-turn skid marks
    if (car.turnTimer > 8 && spd > 2.5) {
        addSkid(car);
        if (car.turnTimer % 4 === 0) {
            particles.push(mkParticle(
                car.x - Math.cos(car.angle)*16, car.y - Math.sin(car.angle)*16,
                (Math.random()-.5)*0.6, (Math.random()-.5)*0.6, '#aaa', 4+Math.random()*3, 0.04
            ));
        }
    } else if (Math.abs(diff) > 0.8 && spd > 3) {
        addSkid(car);
    }
}
