// ================================================================
//  SCORING SYSTEM — combo multiplier, score events, drift/speed/near-miss
// ================================================================

var scoreComboCount = 0;
var scoreComboTimer = 0;
var scoreMultiplier = 1;
var nearMissCooldowns = {};  // "i-j" -> frames remaining
var scoreTextCooldown = 0;   // min gap between score texts
var driftScoreTimer = 0;     // accumulator for drift scoring
var speedBonusAccum = 0;     // accumulator for speed bonus

// ── Core ──

function awardScore(points, label, x, y, color) {
    var finalPts = Math.round(points * scoreMultiplier);
    score += finalPts;
    bumpCombo();

    // Spam prevention: no floating text for tiny awards or too-frequent texts
    if (finalPts >= 20 && scoreTextCooldown <= 0) {
        var displayLabel = label ? '+' + finalPts + ' ' + label : '+' + finalPts;
        floatingTexts.push({
            x: x, y: y - 25,
            text: displayLabel,
            color: color || '#ff4', alpha: 1, vy: -0.7, life: 80
        });
        scoreTextCooldown = 15;
    }
}

function bumpCombo() {
    scoreComboCount++;
    scoreComboTimer = 3; // 3 second decay
    scoreMultiplier = Math.min(5, 1 + scoreComboCount * 0.25);
}

function resetScoring() {
    scoreComboCount = 0;
    scoreComboTimer = 0;
    scoreMultiplier = 1;
    nearMissCooldowns = {};
    scoreTextCooldown = 0;
    driftScoreTimer = 0;
    speedBonusAccum = 0;
}

// ── Per-frame update ──

function updateScoring(dt) {
    // Combo decay
    if (scoreComboTimer > 0) {
        scoreComboTimer -= dt;
        if (scoreComboTimer <= 0) {
            scoreComboTimer = 0;
            scoreComboCount = 0;
            scoreMultiplier = 1;
        }
    }

    // Score text cooldown (frame-based)
    if (scoreTextCooldown > 0) scoreTextCooldown--;

    // Near-miss cooldown decay (frame-based)
    for (var key in nearMissCooldowns) {
        nearMissCooldowns[key]--;
        if (nearMissCooldowns[key] <= 0) delete nearMissCooldowns[key];
    }

    // Skip drift/speed scoring for racing modes
    if (activeMode && activeMode.isRacing) return;

    // Player drift & speed checks
    for (var pi = 0; pi < cars.length; pi++) {
        var car = cars[pi];
        if (car.playerIdx < 0 || !car.alive) continue;
        checkDriftScore(car, dt);
        checkSpeedBonus(car, dt);
    }
}

// ── Drift scoring: +25 every 0.5s while handbrake drifting at speed > 3 ──
// Must hold handbrake for 1s before points start counting

var driftHoldTimer = 0;     // how long handbrake has been held
var DRIFT_HOLD_MIN = 0.5;   // seconds of handbrake before scoring kicks in

function checkDriftScore(car, dt) {
    if (car.handbrake && car.speed > 3) {
        driftHoldTimer += dt;
        if (driftHoldTimer >= DRIFT_HOLD_MIN) {
            driftScoreTimer += dt;
            if (driftScoreTimer >= 0.5) {
                driftScoreTimer -= 0.5;
                awardScore(25, 'DRIFT', car.x, car.y, '#ff4');
            }
        }
    } else {
        driftHoldTimer = 0;
        driftScoreTimer = 0;
    }
}

// ── Speed bonus: +50 per second above speed 8 ──

function checkSpeedBonus(car, dt) {
    if (car.speed > 8) {
        speedBonusAccum += dt;
        if (speedBonusAccum >= 1) {
            speedBonusAccum -= 1;
            awardScore(50, 'SPEED', car.x, car.y, '#4ff');
        }
    } else {
        speedBonusAccum = 0;
    }
}

// ── Near-miss check (called from checkCollisions) ──

function checkNearMiss(i, j, dist) {
    var a = cars[i], b = cars[j];
    if (!a.alive || !b.alive) return;
    // At least one must be a player
    if (a.playerIdx < 0 && b.playerIdx < 0) return;
    // Both must be moving
    if (a.speed < 2 || b.speed < 2) return;

    // Collision radius based on actual car sizes
    var aR = Math.max(a.width || 40, a.height || 22) * 0.5;
    var bR = Math.max(b.width || 40, b.height || 22) * 0.5;
    var touchDist = aR + bR;          // cars touching edge-to-edge
    var nearDist = touchDist + 20;    // near-miss zone extends 20px beyond touch

    if (dist > touchDist && dist < nearDist) {
        var key = Math.min(i, j) + '-' + Math.max(i, j);
        if (nearMissCooldowns[key]) return; // on cooldown
        nearMissCooldowns[key] = 60; // 1 second cooldown at 60fps

        var playerCar = a.playerIdx >= 0 ? a : b;
        var otherCar = a.playerIdx >= 0 ? b : a;
        var pts = 150;

        // Infected near-miss with infected cars = double
        if (activeMode && activeMode.id && activeMode.id.indexOf('infected') >= 0) {
            if (otherCar.infected) pts = 300;
        }

        awardScore(pts, 'NEAR MISS!', playerCar.x, playerCar.y, '#f0f');
    }
}

// ── Kill scoring (called from checkDeath) ──

function scoreKill(killer, victim) {
    if (killer.playerIdx < 0) return; // only score for players

    var basePts = 500;

    // Mass tier bonus
    var mass = victim.carType ? victim.carType.mass : 1;
    if (mass >= 1.8) basePts += 500;
    else if (mass >= 1.2) basePts += 250;
    else if (mass >= 0.8) basePts += 100;
    // mass < 0.8: no bonus

    // Hardcore multiplier
    if (activeMode && activeMode.id && activeMode.id.indexOf('hardcore') >= 0) {
        basePts = Math.round(basePts * 1.5);
    }

    awardScore(basePts, 'DESTROYED ' + victim.name + '!', victim.x, victim.y, '#fff');
    playSfx('kill');
}

// ── Hit scoring (called from checkCollisions) ──

function scoreHit(attacker, dmgDealt, cx, cy) {
    if (attacker.playerIdx < 0) return;
    // Racing: no hit scoring
    if (activeMode && activeMode.isRacing) return;
    var pts = Math.round(dmgDealt * 3);
    if (pts > 0) {
        awardScore(pts, 'HIT', cx, cy, '#fa4');
    }
}

// ── Airtime scoring ──

function scoreAirtimeLaunch(car) {
    if (car.playerIdx < 0) return;
    if (activeMode && activeMode.isRacing) return;
    awardScore(100, 'AIR!', car.x, car.y, '#ff4');
}

function scoreAirtimeLand(car, jumpDuration) {
    if (car.playerIdx < 0) return;
    if (activeMode && activeMode.isRacing) return;
    var pts = 50 + Math.round(jumpDuration * 200);
    awardScore(pts, 'LANDED!', car.x, car.y, '#ff4');
}
