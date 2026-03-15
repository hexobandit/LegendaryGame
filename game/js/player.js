// ================================================================
//  UPDATE — PLAYER (auto-throttle)
//  Extracted from destruction-derby.html with car type multipliers
//  Globals: keys, gameMode, CONFIG, particles,
//           applyFriction(), getDamageMultiplier(),
//           playSfxThrottled(), mkParticle(), addSkid()
// ================================================================

function updatePlayer(car) {
    if (!car.alive) return;

    let left, right, brake, nitroKey, handbrakeKey;

    if (gameMode === 'single' && car.playerIdx === 0) {
        // Single player: BOTH WASD and Arrows work
        // Reset position with R key
        if (keys['KeyR']) {
            car.vx = 0; car.vy = 0; car.speed = 0;
            car.spinTimer = 0;
            keys['KeyR'] = false;
        }
        left  = keys['KeyA'] || keys['ArrowLeft'];
        right = keys['KeyD'] || keys['ArrowRight'];
        brake = keys['KeyS'] || keys['ArrowDown'];
        nitroKey = keys['KeyW'] || keys['ArrowUp'];
        handbrakeKey = keys['Space'];
    } else if (car.playerIdx === 0) {
        // Multiplayer P1: WASD
        left  = keys['KeyA'];
        right = keys['KeyD'];
        brake = keys['KeyS'];
        nitroKey = keys['KeyW'];
        handbrakeKey = keys['KeyQ'];
    } else {
        // Multiplayer P2: Arrows
        left  = keys['ArrowLeft'];
        right = keys['ArrowRight'];
        brake = keys['ArrowDown'];
        nitroKey = keys['ArrowUp'];
        handbrakeKey = keys['KeyM'];
    }

    car.handbrake = handbrakeKey;
    let spd = Math.hypot(car.vx, car.vy);
    let turnRate = car.handbrake ? CONFIG.handbrakeTurn : CONFIG.turnSpeed * (car.carType?.turnMult || 1);
    if (spd < 1) turnRate *= spd;

    let isTurning = left || right;
    if (left)  car.angle -= turnRate;
    if (right) car.angle += turnRate;

    // Track how long the player has been turning
    let angleDelta = car.angle - car.prevAngle;
    while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    if (isTurning && Math.abs(angleDelta) > 0.01) {
        car.turnTimer++;
    } else {
        car.turnTimer = Math.max(0, car.turnTimer - 2);
    }
    car.prevAngle = car.angle;

    // Nitro activation: cooldown-based system
    if (nitroKey && car.nitro >= CONFIG.nitroMax && car.nitroCooldown <= 0 && !car.nitroActive) {
        car.nitroActive = true;
        car.nitroBurnTimer = CONFIG.nitroBurnFrames + (car.carType?.nitroBonus || 0);
    }

    // Nitro burn timer
    if (car.nitroActive) {
        car.nitroBurnTimer--;
        if (car.nitroBurnTimer <= 0) {
            car.nitroActive = false;
            car.nitroCooldown = CONFIG.nitroCooldown;
            car.nitro = 0;
        }
    }

    // Cooldown tick
    if (car.nitroCooldown > 0) {
        car.nitroCooldown--;
        if (car.nitroCooldown <= 0) {
            car.nitro = CONFIG.nitroMax; // fully recharged
        }
    }

    let useNitro = car.nitroActive;
    let speedMult = car.activePowerUp === 'speed' ? 1.35 : 1;
    let dmgMult = getDamageMultiplier(car);
    let accel = (useNitro ? CONFIG.nitroAccel : CONFIG.autoAccel * (car.carType?.accelMult || 1)) * speedMult * dmgMult;
    let maxSpd = (useNitro ? CONFIG.nitroMaxSpeed : CONFIG.maxSpeed * (car.carType?.maxSpeedMult || 1)) * speedMult * dmgMult;

    // Wobble steering when badly damaged
    let hp = car.health / car.maxHealth;
    if (hp < 0.4) {
        let wobbleIntensity = CONFIG.dmgWobble * (1 - hp / 0.4);
        car.angle += Math.sin(performance.now() * 0.008 + car.x) * wobbleIntensity
                   + Math.sin(performance.now() * 0.013) * wobbleIntensity * 0.5;
    }

    // Auto-throttle (always on unless braking hard and nearly stopped)
    if (!brake || spd > 1) {
        car.vx += Math.cos(car.angle) * accel;
        car.vy += Math.sin(car.angle) * accel;
    }
    if (brake) {
        car.vx -= Math.cos(car.angle) * CONFIG.brakeForce;
        car.vy -= Math.sin(car.angle) * CONFIG.brakeForce;
    }

    // Nitro effects — particles & sound
    if (useNitro) {
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
    applyFriction(car, car.handbrake);

    spd = Math.hypot(car.vx, car.vy);
    if (spd > maxSpd) { car.vx = car.vx/spd*maxSpd; car.vy = car.vy/spd*maxSpd; }

    // Drift FX — handbrake
    if (car.handbrake && spd > 3) {
        car.drifting = true;
        addSkid(car);
        particles.push(mkParticle(
            car.x - Math.cos(car.angle)*18, car.y - Math.sin(car.angle)*18,
            (Math.random()-.5)*1.5, (Math.random()-.5)*1.5, '#999', 8+Math.random()*6, 0.03
        ));
        if (car.driftSfxCooldown <= 0) {
            playSfxThrottled('drift', 120);
            car.driftSfxCooldown = 8;
        }
    }
    // Sharp-turn skid marks (after turning for > 8 frames at speed)
    else if (car.turnTimer > 8 && spd > 2.5) {
        car.drifting = true;
        addSkid(car);
        if (car.turnTimer % 3 === 0) {
            particles.push(mkParticle(
                car.x - Math.cos(car.angle)*16, car.y - Math.sin(car.angle)*16,
                (Math.random()-.5)*0.8, (Math.random()-.5)*0.8, '#aaa', 5+Math.random()*4, 0.04
            ));
        }
        if (car.driftSfxCooldown <= 0) {
            playSfxThrottled('drift', 200);
            car.driftSfxCooldown = 12;
        }
    } else {
        car.drifting = false;
    }
    if (car.driftSfxCooldown > 0) car.driftSfxCooldown--;

    car.speed = spd;
}
