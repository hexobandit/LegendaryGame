// ================================================================
//  GAME — Canvas setup, main loop, rendering pipeline
// ================================================================

// Canvas init
canvas = document.getElementById('gameCanvas');
ctx = canvas.getContext('2d');

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

var paused = false;

// ── Render helpers ──
function renderWorld(camX, camY) {
    drawTerrain();
    drawSkidMarks();
    drawWalls();
    drawObstacles();
    drawBreakables();
    drawBushes();
    drawDebris();
    for (var i = 0; i < cars.length; i++) {
        var c = cars[i];
        if (!c.alive) {
            ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.angle);
            ctx.globalAlpha = 0.45; ctx.fillStyle = '#222';
            ctx.fillRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H);
            if (Math.random() < 0.2) particles.push(mkParticle(
                c.x + (Math.random() - 0.5) * 20, c.y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 0.5, -Math.random() * 0.8,
                ['#f80', '#f40', '#ff0'][Math.random() * 3 | 0],
                4 + Math.random() * 6, 0.03
            ));
            ctx.globalAlpha = 1; ctx.restore();
        }
    }
    drawPowerUps();
    for (var i = 0; i < cars.length; i++) if (cars[i].alive) drawCar(cars[i]);
    drawPalmFronds();
    drawParticles();
    drawFloatingTexts();
}

function drawDivider() {
    var cx = canvas.width / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - 2, 0, 4, canvas.height);
    ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();
}

function drawCountdown() {
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 120px Arial'; ctx.textAlign = 'center';
    var text = countdownVal > 0 ? countdownVal.toString() : 'GO!';
    if (countdownVal <= 0) ctx.fillStyle = '#4f4';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 40);
}

// ── Main Loop ──
var lastTime = 0;

function loop(ts) {
    var dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    // ---- Countdown ----
    if (gameState === 'countdown') {
        countdownTimer += dt;
        if (countdownTimer >= 1) {
            countdownTimer = 0;
            if (countdownVal > 0) playSfx('countdown');
            countdownVal--;
            if (countdownVal < 0) {
                gameState = 'playing';
                playSfx('go');
            } else if (countdownVal === 0) {
                playSfx('go');
            }
        }
    }

    // ---- Update ----
    if (gameState === 'playing') {
        gameTime += dt;

        if (gameMode === 'single') score += Math.round(dt * 10);

        updatePlayer(cars[0]);
        if (gameMode === 'multi') updatePlayer(cars[1]);

        var aiStartIdx = gameMode === 'single' ? 1 : 2;
        for (var i = aiStartIdx; i < cars.length; i++) updateAI(cars[i], dt);

        for (var i = 0; i < cars.length; i++) moveCar(cars[i]);
        checkCollisions();
        updatePowerUps();
        updateBreakables();

        // Respawn timer for dead players
        for (var i = 0; i < cars.length; i++) {
            var c = cars[i];
            if (!c.alive && c.playerIdx >= 0 && c.respawnTimer > 0) {
                c.respawnTimer--;
                if (c.respawnTimer <= 0) {
                    respawnCar(c);
                    playSfxThrottled('go', 100);
                }
            }
        }
        updateFX();
    } else if (gameState === 'countdown') {
        updateFX();
    }

    // ---- Render ----
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (cars.length > 0) {
        if (gameMode === 'single') {
            var fullW = canvas.width;
            var fullH = canvas.height;
            var player = cars[0];
            var camX = player.x - fullW / 2;
            var camY = player.y - fullH / 2;

            ctx.save();
            ctx.translate(-camX, -camY);
            renderWorld(camX, camY);
            ctx.restore();

            drawHUD(player, 0, 0, fullW, fullH);
            if (gameState === 'countdown') drawCountdown();
        } else {
            var halfW = Math.floor(canvas.width / 2);
            var fullH = canvas.height;

            // Left viewport (Player 1)
            var p1 = cars[0];
            var cam1x = p1.x - halfW / 2;
            var cam1y = p1.y - fullH / 2;

            ctx.save();
            ctx.beginPath(); ctx.rect(0, 0, halfW, fullH); ctx.clip();
            ctx.translate(-cam1x, -cam1y);
            renderWorld(cam1x, cam1y);
            ctx.restore();
            drawHUD(p1, 0, 0, halfW, fullH);

            // Right viewport (Player 2)
            var p2 = cars[1];
            var cam2x = p2.x - halfW / 2;
            var cam2y = p2.y - fullH / 2;

            ctx.save();
            ctx.beginPath(); ctx.rect(halfW, 0, halfW, fullH); ctx.clip();
            ctx.translate(halfW - cam2x, -cam2y);
            renderWorld(cam2x, cam2y);
            ctx.restore();
            drawHUD(p2, halfW, 0, halfW, fullH);

            drawDivider();
            if (gameState === 'countdown') drawCountdown();
        }
    }

    requestAnimationFrame(loop);
}

// ── Kick off ──
initIntro();
requestAnimationFrame(loop);
