// ================================================================
//  HUD (drawn on-canvas per viewport)
//  Score, HP, Speed, Nitro, Minimap — styled to match the game
// ================================================================

// ── Helpers ──
function hudRoundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function hudPanel(x, y, w, h, accent) {
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    hudRoundRect(x, y, w, h, 6);
    ctx.strokeStyle = accent || 'rgba(255,255,255,.12)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.stroke();
}
function hudBar(x, y, w, h, pct, col1, col2, bg) {
    // Background
    ctx.fillStyle = bg || '#1a1a1a';
    hudRoundRect(x, y, w, h, h / 2);
    // Fill
    if (pct > 0) {
        var fw = Math.max(h, w * Math.min(1, pct));
        var grad = ctx.createLinearGradient(x, 0, x + fw, 0);
        grad.addColorStop(0, col1); grad.addColorStop(1, col2);
        ctx.fillStyle = grad;
        hudRoundRect(x, y, fw, h, h / 2);
    }
}

function drawHUD(car, vx, vy, vw, vh) {
    ctx.save();
    ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();

    var pad = gameMode === 'single' ? 14 : 12;
    var isP1 = car.playerIdx === 0;
    var accent = isP1 ? P1_COLOR : P2_COLOR;

    // Map-aware arena dimensions for minimap
    var mmArenaW = (typeof currentMap !== 'undefined' && currentMap.arenaWidth) ? currentMap.arenaWidth : ARENA_W;
    var mmArenaH = (typeof currentMap !== 'undefined' && currentMap.arenaHeight) ? currentMap.arenaHeight : ARENA_H;

    if (gameMode === 'single') {
        // ═══════════════════════════════════════════════
        //  SINGLE PLAYER HUD
        // ═══════════════════════════════════════════════

        // ── Top-center: SCORE ──
        var sw = 180, sh = 40;
        var sx = vx + vw / 2 - sw / 2, sy = vy + pad;
        hudPanel(sx, sy, sw, sh, '#ff4');
        // Glow
        ctx.shadowColor = '#ff4'; ctx.shadowBlur = 8;
        ctx.fillStyle = '#ff4'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
        ctx.fillText('SCORE', sx + sw / 2, sy + 14);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Courier New';
        ctx.fillText(score, sx + sw / 2, sy + 34);

        // ── Top-right: Stats (kills, deaths, AI, time) ──
        var trw = 160, trh = 88;
        var trx = vx + vw - pad - trw, try_ = vy + pad;
        hudPanel(trx, try_, trw, trh, accent);

        var numAI = 11;
        var alive = cars.filter(function(c) { return c.alive && c.playerIdx === -1; }).length;
        var mins = Math.floor(gameTime / 60), secs = Math.floor(gameTime % 60);
        var timeStr = mins + ':' + secs.toString().padStart(2, '0');

        var stats = [
            { label: 'KILLS',   val: car.kills,              col: '#fff' },
            { label: 'DEATHS',  val: car.deaths,             col: '#f88' },
            { label: 'AI LEFT', val: alive + '/' + numAI,    col: alive > 0 ? '#f84' : '#4f4' },
            { label: 'TIME',    val: timeStr,                col: '#adf' },
        ];
        for (var i = 0; i < stats.length; i++) {
            var row_y = try_ + 16 + i * 18;
            ctx.fillStyle = '#777'; ctx.font = '11px Arial'; ctx.textAlign = 'left';
            ctx.fillText(stats[i].label, trx + 10, row_y);
            ctx.fillStyle = stats[i].col; ctx.font = 'bold 13px Courier New'; ctx.textAlign = 'right';
            ctx.fillText(stats[i].val, trx + trw - 10, row_y);
        }

        // ── Bottom-left: Speed + Nitro ──
        var blw = 160, blh = 72;
        var blx = vx + pad, bly = vy + vh - pad - blh;
        hudPanel(blx, bly, blw, blh, accent);

        var speed = Math.round(car.speed * 20);
        // Speed number — large
        ctx.fillStyle = '#4ff'; ctx.font = 'bold 32px Courier New'; ctx.textAlign = 'left';
        ctx.fillText(speed, blx + 10, bly + 32);
        // Unit
        ctx.fillStyle = '#556'; ctx.font = 'bold 11px Arial';
        ctx.fillText('KMH', blx + 100, bly + 32);

        // Speed bar (thin)
        var maxDisplaySpd = Math.round(CONFIG.nitroMaxSpeed * 20);
        var spdPct = Math.min(speed / maxDisplaySpd, 1);
        var spdCol = speed > 150 ? '#f44' : speed > 100 ? '#ff4' : '#4ff';
        hudBar(blx + 10, bly + 40, blw - 20, 5, spdPct, spdCol, spdCol);

        // Nitro bar
        var nitroLabel, nitroBarPct, nitroCol1, nitroCol2;
        if (car.nitroActive) {
            nitroBarPct = car.nitroBurnTimer / CONFIG.nitroBurnFrames;
            nitroCol1 = '#ff8800'; nitroCol2 = '#ffcc00';
            nitroLabel = 'BURN ' + Math.ceil(car.nitroBurnTimer / 60) + 's';
        } else if (car.nitroCooldown > 0) {
            nitroBarPct = 1 - car.nitroCooldown / CONFIG.nitroCooldown;
            nitroCol1 = '#444'; nitroCol2 = '#666';
            nitroLabel = 'CHARGING ' + Math.ceil(car.nitroCooldown / 60) + 's';
        } else {
            nitroBarPct = 1;
            nitroCol1 = '#00ccff'; nitroCol2 = '#00ff88';
            nitroLabel = 'NITRO READY';
        }
        hudBar(blx + 10, bly + 50, blw - 20, 8, nitroBarPct, nitroCol1, nitroCol2);
        ctx.fillStyle = '#888'; ctx.font = '9px Arial'; ctx.textAlign = 'center';
        ctx.fillText(nitroLabel, blx + blw / 2, bly + blh - 4);

        // ── Bottom-center: Health bar ──
        var hbw = 280, hbh = 22;
        var hbx = vx + vw / 2 - hbw / 2, hby = vy + vh - pad - 32;
        hudPanel(hbx - 6, hby - 6, hbw + 12, hbh + 16, accent);

        var hp = Math.max(0, car.health) / car.maxHealth;
        var hpCol1, hpCol2;
        if (hp > 0.5) { hpCol1 = '#2a2'; hpCol2 = '#4f4'; }
        else if (hp > 0.25) { hpCol1 = '#cc4'; hpCol2 = '#ff4'; }
        else { hpCol1 = '#a22'; hpCol2 = '#f44'; }

        hudBar(hbx, hby, hbw, hbh, hp, hpCol1, hpCol2);

        // HP text on top of bar
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
        ctx.fillText('HP  ' + Math.max(0, Math.round(car.health)) + ' / ' + car.maxHealth, hbx + hbw / 2, hby + 16);

        // Segment lines on bar
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1;
        for (var si = 1; si < 4; si++) {
            var lx = hbx + (hbw / 4) * si;
            ctx.beginPath(); ctx.moveTo(lx, hby + 1); ctx.lineTo(lx, hby + hbh - 1); ctx.stroke();
        }

        // ── Power-up indicator (above health bar) ──
        if (car.alive && car.activePowerUp) {
            var puLabel = car.activePowerUp.toUpperCase();
            var puTime = Math.ceil(car.powerUpTimer / 60);
            var puColors = { shield: '#44ffff', damage: '#ff4444', speed: '#ffff44', magnet: '#ff66ff' };
            var puCol = puColors[car.activePowerUp] || '#fff';
            hudPanel(vx + vw / 2 - 60, hby - 34, 120, 24, puCol);
            ctx.shadowColor = puCol; ctx.shadowBlur = 6;
            ctx.fillStyle = puCol; ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'center';
            ctx.fillText(puLabel + ' ' + puTime + 's', vx + vw / 2, hby - 17);
            ctx.shadowBlur = 0;
        }

        // ── Death overlay ──
        if (!car.alive) {
            ctx.fillStyle = 'rgba(0,0,0,.6)';
            ctx.fillRect(vx, vy, vw, vh);
            ctx.shadowColor = '#f44'; ctx.shadowBlur = 20;
            ctx.fillStyle = '#f44'; ctx.font = 'bold 48px Arial'; ctx.textAlign = 'center';
            ctx.fillText('WRECKED!', vx + vw / 2, vy + vh / 2 - 30);
            ctx.shadowBlur = 0;
            var secLeft = Math.ceil(car.respawnTimer / 60);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Arial';
            ctx.fillText('Respawn in ' + secLeft + '...', vx + vw / 2, vy + vh / 2 + 20);
        }

        // ── Minimap (bottom-right) ──
        var mmS = 140, mmx = vx + vw - pad - mmS, mmy = vy + vh - pad - mmS;
        ctx.fillStyle = 'rgba(10,15,5,.75)';
        hudRoundRect(mmx, mmy, mmS, mmS, 6);
        ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(mmx, mmy, mmS, mmS, 6); ctx.stroke();
        ctx.fillStyle = 'rgba(40,50,30,.5)';
        var mcx = mmx + mmS / 2, mcy = mmy + mmS / 2;
        ctx.beginPath(); ctx.arc(mcx, mcy, mmS * 520 / mmArenaW, 0, Math.PI * 2); ctx.fill();
        for (var pi = 0; pi < powerUps.length; pi++) {
            var pu = powerUps[pi];
            var mx = mmx + (pu.x / mmArenaW) * mmS;
            var my = mmy + (pu.y / mmArenaH) * mmS;
            ctx.fillStyle = pu.color;
            ctx.fillRect(mx - 2, my - 2, 4, 4);
        }
        for (var ci = 0; ci < cars.length; ci++) {
            var c = cars[ci];
            if (!c.alive) continue;
            var mx = mmx + (c.x / mmArenaW) * mmS;
            var my = mmy + (c.y / mmArenaH) * mmS;
            ctx.fillStyle = c === car ? '#fff' : '#f44';
            var sz = c === car ? 5 : 3;
            ctx.fillRect(mx - sz / 2, my - sz / 2, sz, sz);
        }
        ctx.strokeStyle = accent; ctx.lineWidth = 1;
        var camRx = mmx + ((car.x - vw / 2) / mmArenaW) * mmS;
        var camRy = mmy + ((car.y - vh / 2) / mmArenaH) * mmS;
        var camRw = (vw / mmArenaW) * mmS;
        var camRh = (vh / mmArenaH) * mmS;
        ctx.strokeRect(camRx, camRy, camRw, camRh);

    } else {
        // ═══════════════════════════════════════════════
        //  MULTIPLAYER HUD (per viewport)
        // ═══════════════════════════════════════════════

        // ── Top-left: Player name & stats ──
        var tlw = 160, tlh = 70;
        hudPanel(vx + pad, vy + pad, tlw, tlh, accent);

        ctx.fillStyle = accent; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left';
        ctx.fillText(car.name, vx + pad + 10, vy + pad + 18);

        var alive = cars.filter(function(c) { return c.alive; }).length;
        var mstats = [
            { label: 'KILLS', val: car.kills, col: '#fff' },
            { label: 'HITS',  val: car.hits,  col: '#fff' },
            { label: 'ALIVE', val: alive + '/' + cars.length, col: '#adf' },
        ];
        for (var i = 0; i < mstats.length; i++) {
            var row_y = vy + pad + 34 + i * 14;
            ctx.fillStyle = '#666'; ctx.font = '10px Arial'; ctx.textAlign = 'left';
            ctx.fillText(mstats[i].label, vx + pad + 10, row_y);
            ctx.fillStyle = mstats[i].col; ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'right';
            ctx.fillText(mstats[i].val, vx + pad + tlw - 10, row_y);
        }

        // ── Top-center: Timer ──
        var mins = Math.floor(gameTime / 60), secs = Math.floor(gameTime % 60);
        hudPanel(vx + vw / 2 - 35, vy + pad, 70, 24, 'rgba(255,255,255,.15)');
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Courier New'; ctx.textAlign = 'center';
        ctx.fillText(mins + ':' + secs.toString().padStart(2, '0'), vx + vw / 2, vy + pad + 17);

        // ── Top-right: Controls ──
        var crx = vx + vw - pad - 100, cry = vy + pad;
        hudPanel(crx, cry, 100, 56, 'rgba(255,255,255,.08)');
        ctx.fillStyle = '#777'; ctx.font = '9px Arial'; ctx.textAlign = 'left';
        if (isP1) {
            ctx.fillText('A/D Steer', crx + 6, cry + 13);
            ctx.fillText('S Brake  W Nitro', crx + 6, cry + 27);
            ctx.fillText('Q Drift', crx + 6, cry + 41);
        } else {
            ctx.fillText('\u2190/\u2192 Steer', crx + 6, cry + 13);
            ctx.fillText('\u2193 Brake  \u2191 Nitro', crx + 6, cry + 27);
            ctx.fillText('M Drift', crx + 6, cry + 41);
        }

        // ── Bottom-left: Speed + Nitro ──
        var blw = 150, blh = 66;
        var blx = vx + pad, bly = vy + vh - pad - blh;
        hudPanel(blx, bly, blw, blh, accent);

        var speed = Math.round(car.speed * 20);
        ctx.fillStyle = '#4ff'; ctx.font = 'bold 28px Courier New'; ctx.textAlign = 'left';
        ctx.fillText(speed, blx + 10, bly + 28);
        ctx.fillStyle = '#556'; ctx.font = 'bold 10px Arial';
        ctx.fillText('KMH', blx + 90, bly + 28);

        // Speed bar
        var maxDisplaySpd = Math.round(CONFIG.nitroMaxSpeed * 20);
        var spdPct = Math.min(speed / maxDisplaySpd, 1);
        var spdCol = speed > 150 ? '#f44' : speed > 100 ? '#ff4' : '#4ff';
        hudBar(blx + 10, bly + 36, blw - 20, 4, spdPct, spdCol, spdCol);

        // Nitro bar
        var nitroLabel, nitroBarPct, nitroCol1, nitroCol2;
        if (car.nitroActive) {
            nitroBarPct = car.nitroBurnTimer / CONFIG.nitroBurnFrames;
            nitroCol1 = '#ff8800'; nitroCol2 = '#ffcc00';
            nitroLabel = 'BURN ' + Math.ceil(car.nitroBurnTimer / 60) + 's';
        } else if (car.nitroCooldown > 0) {
            nitroBarPct = 1 - car.nitroCooldown / CONFIG.nitroCooldown;
            nitroCol1 = '#444'; nitroCol2 = '#666';
            nitroLabel = 'CHARGING ' + Math.ceil(car.nitroCooldown / 60) + 's';
        } else {
            nitroBarPct = 1;
            nitroCol1 = '#00ccff'; nitroCol2 = '#00ff88';
            nitroLabel = 'NITRO READY';
        }
        hudBar(blx + 10, bly + 45, blw - 20, 7, nitroBarPct, nitroCol1, nitroCol2);
        ctx.fillStyle = '#777'; ctx.font = '8px Arial'; ctx.textAlign = 'center';
        ctx.fillText(nitroLabel, blx + blw / 2, bly + blh - 4);

        // ── Bottom-center: Health bar ──
        var hbw = 200, hbh = 18;
        var hbx = vx + vw / 2 - hbw / 2, hby = vy + vh - pad - 28;
        hudPanel(hbx - 5, hby - 5, hbw + 10, hbh + 14, accent);

        var hp = Math.max(0, car.health) / car.maxHealth;
        var hpCol1, hpCol2;
        if (hp > 0.5) { hpCol1 = '#2a2'; hpCol2 = '#4f4'; }
        else if (hp > 0.25) { hpCol1 = '#cc4'; hpCol2 = '#ff4'; }
        else { hpCol1 = '#a22'; hpCol2 = '#f44'; }

        hudBar(hbx, hby, hbw, hbh, hp, hpCol1, hpCol2);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
        ctx.fillText(Math.max(0, Math.round(car.health)) + '%', hbx + hbw / 2, hby + 14);

        // Segment lines
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1;
        for (var si = 1; si < 4; si++) {
            var lx = hbx + (hbw / 4) * si;
            ctx.beginPath(); ctx.moveTo(lx, hby + 1); ctx.lineTo(lx, hby + hbh - 1); ctx.stroke();
        }

        // ── Power-up indicator ──
        if (car.alive && car.activePowerUp) {
            var puLabel = car.activePowerUp.toUpperCase();
            var puTime = Math.ceil(car.powerUpTimer / 60);
            var puColors = { shield: '#44ffff', damage: '#ff4444', speed: '#ffff44', magnet: '#ff66ff' };
            var puCol = puColors[car.activePowerUp] || '#fff';
            hudPanel(vx + vw / 2 - 55, hby - 30, 110, 22, puCol);
            ctx.shadowColor = puCol; ctx.shadowBlur = 6;
            ctx.fillStyle = puCol; ctx.font = 'bold 11px Courier New'; ctx.textAlign = 'center';
            ctx.fillText(puLabel + ' ' + puTime + 's', vx + vw / 2, hby - 14);
            ctx.shadowBlur = 0;
        }

        // ── Death overlay ──
        if (!car.alive) {
            ctx.fillStyle = 'rgba(0,0,0,.6)';
            ctx.fillRect(vx, vy, vw, vh);
            ctx.shadowColor = '#f44'; ctx.shadowBlur = 16;
            ctx.fillStyle = '#f44'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center';
            ctx.fillText('WRECKED!', vx + vw / 2, vy + vh / 2 - 20);
            ctx.shadowBlur = 0;
            var secLeft = Math.ceil(car.respawnTimer / 60);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial';
            ctx.fillText('Respawn in ' + secLeft + '...', vx + vw / 2, vy + vh / 2 + 20);
        }

        // ── Minimap (bottom-right) ──
        var mmS = 110, mmx = vx + vw - pad - mmS, mmy = vy + vh - pad - mmS;
        ctx.fillStyle = 'rgba(10,15,5,.75)';
        hudRoundRect(mmx, mmy, mmS, mmS, 5);
        ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(mmx, mmy, mmS, mmS, 5); ctx.stroke();
        ctx.fillStyle = 'rgba(40,50,30,.5)';
        var mcx = mmx + mmS / 2, mcy = mmy + mmS / 2;
        ctx.beginPath(); ctx.arc(mcx, mcy, mmS * 520 / mmArenaW, 0, Math.PI * 2); ctx.fill();
        for (var pi = 0; pi < powerUps.length; pi++) {
            var pu = powerUps[pi];
            var mx = mmx + (pu.x / mmArenaW) * mmS;
            var my = mmy + (pu.y / mmArenaH) * mmS;
            ctx.fillStyle = pu.color;
            ctx.fillRect(mx - 2, my - 2, 4, 4);
        }
        for (var ci = 0; ci < cars.length; ci++) {
            var c = cars[ci];
            if (!c.alive) continue;
            var mx = mmx + (c.x / mmArenaW) * mmS;
            var my = mmy + (c.y / mmArenaH) * mmS;
            ctx.fillStyle = c === car ? '#fff' : c.playerIdx >= 0 ? c.color : '#f44';
            var sz = c === car ? 4 : 2.5;
            ctx.fillRect(mx - sz / 2, my - sz / 2, sz, sz);
        }
        ctx.strokeStyle = accent; ctx.lineWidth = 1;
        var camRx = mmx + ((car.x - vw / 2) / mmArenaW) * mmS;
        var camRy = mmy + ((car.y - vh / 2) / mmArenaH) * mmS;
        var camRw = (vw / mmArenaW) * mmS;
        var camRh = (vh / mmArenaH) * mmS;
        ctx.strokeRect(camRx, camRy, camRw, camRh);
    }

    ctx.restore();
}
