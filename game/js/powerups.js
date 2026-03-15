// ================================================================
//  POWER-UPS — types, spawning, updating, applying, drawing
//  References globals: powerUps, cars, obstacles, CONFIG,
//      ARENA_W, ARENA_H, ctx, particles, floatingTexts,
//      powerUpSpawnTimer, playSfxThrottled, mkParticle
// ================================================================

const POWERUP_TYPES = [
    { type: 'health',  icon: '+',  color: '#44ff44', glow: '#22aa22', label: 'REPAIR',       duration: 0   },
    { type: 'shield',  icon: 'O',  color: '#44ffff', glow: '#2288aa', label: 'SHIELD',       duration: 480 },
    { type: 'damage',  icon: '!',  color: '#ff4444', glow: '#aa2222', label: 'DOUBLE DMG',   duration: 420 },
    { type: 'speed',   icon: '>',  color: '#ffff44', glow: '#aaaa22', label: 'SPEED BOOST',  duration: 360 },
    { type: 'nitro',   icon: 'N',  color: '#ff8800', glow: '#aa5500', label: 'FULL NITRO',   duration: 0   },
    { type: 'magnet',  icon: 'M',  color: '#ff66ff', glow: '#aa44aa', label: 'MAGNET',       duration: 420 },
];

function spawnPowerUp() {
    let pW = (currentMap && currentMap.arenaWidth) || ARENA_W;
    let pH = (currentMap && currentMap.arenaHeight) || ARENA_H;
    let px, py, valid;
    for (let attempt = 0; attempt < 30; attempt++) {
        px = 150 + Math.random() * (pW - 300);
        py = 150 + Math.random() * (pH - 300);
        valid = true;
        for (let o of obstacles) { if (Math.hypot(o.x-px, o.y-py) < o.r + 40) { valid = false; break; } }
        if (valid) for (let p of powerUps) { if (Math.hypot(p.x-px, p.y-py) < 80) { valid = false; break; } }
        if (valid) break;
    }
    if (!valid) return;
    let def = POWERUP_TYPES[Math.random() * POWERUP_TYPES.length | 0];
    powerUps.push({
        x: px, y: py, ...def,
        bobPhase: Math.random() * Math.PI * 2,
        life: 900
    });
}

function updatePowerUps() {
    powerUpSpawnTimer--;
    if (powerUpSpawnTimer <= 0 && powerUps.length < 5) {
        spawnPowerUp();
        powerUpSpawnTimer = 240 + Math.random() * 120;
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].life--;
        powerUps[i].bobPhase += 0.06;
        if (powerUps[i].life <= 0) powerUps.splice(i, 1);
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
        let pu = powerUps[i];
        for (let car of cars) {
            if (!car.alive) continue;
            if (Math.hypot(car.x - pu.x, car.y - pu.y) < 30) {
                applyPowerUp(car, pu);
                powerUps.splice(i, 1);
                break;
            }
        }
    }

    for (let car of cars) {
        if (car.powerUpTimer > 0) {
            car.powerUpTimer--;
            if (car.powerUpTimer <= 0) car.activePowerUp = null;
        }
        if (car.activePowerUp === 'magnet' && car.alive) {
            for (let pu of powerUps) {
                let dx = car.x - pu.x, dy = car.y - pu.y;
                let dist = Math.hypot(dx, dy);
                if (dist < 250 && dist > 5) {
                    pu.x += (dx / dist) * 3;
                    pu.y += (dy / dist) * 3;
                }
            }
        }
    }
}

function applyPowerUp(car, pu) {
    playSfxThrottled('nitro', 50);

    floatingTexts.push({
        x: car.x, y: car.y - 35,
        text: pu.label, color: pu.color,
        alpha: 1, vy: -1, life: 50
    });

    for (let i = 0; i < 10; i++) {
        let a = (i/10) * Math.PI * 2;
        particles.push(mkParticle(
            pu.x + Math.cos(a)*15, pu.y + Math.sin(a)*15,
            Math.cos(a)*2.5, Math.sin(a)*2.5,
            pu.color, 4 + Math.random()*3, 0.05
        ));
    }

    if (pu.type === 'health') {
        car.health = Math.min(car.maxHealth, car.health + 40);
    } else if (pu.type === 'nitro') {
        car.nitro = CONFIG.nitroMax;
        car.nitroCooldown = 0;
        car.nitroActive = false;
        car.nitroBurnTimer = 0;
    } else {
        car.activePowerUp = pu.type;
        car.powerUpTimer = pu.duration;
    }
}

function drawPowerUps() {
    for (let pu of powerUps) {
        let bob = Math.sin(pu.bobPhase) * 4;
        let py = pu.y + bob;
        let flashAlpha = pu.life < 120 ? (Math.sin(pu.life * 0.3) * 0.3 + 0.5) : 0.8;

        ctx.globalAlpha = flashAlpha * 0.3;
        ctx.fillStyle = pu.glow;
        ctx.beginPath(); ctx.arc(pu.x, py, 22, 0, Math.PI*2); ctx.fill();

        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(pu.x, py, 14, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = pu.color; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(pu.x, py, 14, 0, Math.PI*2); ctx.stroke();

        ctx.fillStyle = pu.color;
        ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(pu.icon, pu.x, py + 5);

        ctx.globalAlpha = 1;
    }
}
