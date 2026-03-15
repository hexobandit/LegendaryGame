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
    drawCTFFlag();
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

function drawCTFFlag() {
    if (!ctfFlag) return;
    // Don't draw on the ground if someone is carrying it (it'll draw above their car)
    var fx = ctfFlag.x, fy = ctfFlag.y;
    var bob = ctfFlag.carrier ? 0 : Math.sin(ctfFlag.bobPhase) * 5;

    if (!ctfFlag.carrier) {
        // Ground glow
        ctx.globalAlpha = 0.25 + Math.sin(ctfFlag.bobPhase * 0.5) * 0.1;
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath(); ctx.arc(fx, fy + bob, 28, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Flag pole
    var poleX = ctfFlag.carrier ? fx + 12 : fx;
    var poleY = ctfFlag.carrier ? fy - 22 : fy + bob;
    var poleH = 24;
    ctx.strokeStyle = '#654';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(poleX, poleY);
    ctx.lineTo(poleX, poleY - poleH);
    ctx.stroke();

    // Flag triangle (waving)
    var wave = Math.sin(ctfFlag.bobPhase * 2) * 3;
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(poleX, poleY - poleH);
    ctx.lineTo(poleX + 14 + wave, poleY - poleH + 6);
    ctx.lineTo(poleX, poleY - poleH + 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cc8800';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Star on flag
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('\u2605', poleX + 7 + wave * 0.5, poleY - poleH + 9);

    // Arrow indicator above flag when on ground
    if (!ctfFlag.carrier) {
        var arrowBob = Math.sin(ctfFlag.bobPhase * 1.5) * 4;
        ctx.fillStyle = '#ffaa00';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(fx, fy + bob - 38 + arrowBob);
        ctx.lineTo(fx - 6, fy + bob - 46 + arrowBob);
        ctx.lineTo(fx + 6, fy + bob - 46 + arrowBob);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }
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

    // FPS counter
    fpsFrames++;
    if (ts - fpsLastTime >= 1000) {
        fpsDisplay = fpsFrames;
        fpsFrames = 0;
        fpsLastTime = ts;
    }

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

    // ---- Slow-mo death sequence ----
    if (slomoActive) {
        slomoTimer += dt;
        var slomoProgress = Math.min(slomoTimer / slomoDuration, 1);
        // Ramp down from 1.0 to 0.08
        var slomoScale = 1 - slomoProgress * 0.92;
        dt *= slomoScale;
        // Fade to black
        slomoFade = slomoProgress;
        if (slomoProgress >= 1) {
            slomoActive = false;
            endGame();
        }
    }

    // ---- Update ----
    if (gameState === 'playing') {
        gameTime += dt;

        // Mode-specific per-frame logic
        if (activeMode && activeMode.update) activeMode.update(dt);
        else if (gameMode === 'single') score += Math.round(dt * 10);

        updatePlayer(cars[0]);
        if (gameMode === 'multi') updatePlayer(cars[1]);

        var aiStartIdx = gameMode === 'single' ? 1 : 2;
        for (var i = aiStartIdx; i < cars.length; i++) updateAI(cars[i], dt);

        for (var i = 0; i < cars.length; i++) moveCar(cars[i]);
        checkCollisions();
        updatePowerUps();
        updateBreakables();

        // Respawn timer — only if mode allows respawns
        var allowRespawn = !activeMode || activeMode.respawn !== false;
        for (var i = 0; i < cars.length; i++) {
            var c = cars[i];
            if (!c.alive && c.playerIdx >= 0 && allowRespawn && c.respawnTimer > 0) {
                c.respawnTimer--;
                if (c.respawnTimer <= 0) {
                    respawnCar(c);
                    playSfxThrottled('go', 100);
                }
            }
        }

        // Check win condition (skip if slomo is handling the transition)
        if (!slomoActive && activeMode && activeMode.checkWin && activeMode.checkWin()) {
            endGame();
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

    // Slow-mo fade overlay
    if (slomoActive && slomoFade > 0) {
        ctx.fillStyle = 'rgba(0,0,0,' + (slomoFade * 0.85) + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(loop);
}

// ── Kick off ──
initIntro();
requestAnimationFrame(loop);
