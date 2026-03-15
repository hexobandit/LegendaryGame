// ================================================================
//  HUD (drawn on-canvas per viewport)
//  Extracted from destruction-derby.html
// ================================================================

function drawHUD(car, vx, vy, vw, vh) {
    ctx.save();
    ctx.beginPath(); ctx.rect(vx,vy,vw,vh); ctx.clip();

    const pad = gameMode === 'single' ? 14 : 12;
    const isP1 = car.playerIdx === 0;
    const accent = isP1 ? P1_COLOR : P2_COLOR;

    // Use map-aware arena dimensions for minimap scaling
    let mmArenaW = (typeof currentMap !== 'undefined' && currentMap.arenaWidth) ? currentMap.arenaWidth : ARENA_W;
    let mmArenaH = (typeof currentMap !== 'undefined' && currentMap.arenaHeight) ? currentMap.arenaHeight : ARENA_H;

    if (gameMode === 'single') {
        // ======= SINGLE PLAYER HUD =======

        // --- Top-left: Controls reminder ---
        let clx = vx+pad, cly = vy+pad;
        ctx.fillStyle='rgba(0,0,0,.55)';
        ctx.fillRect(clx, cly, 148, 90);
        ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=1;
        ctx.strokeRect(clx, cly, 148, 90);
        ctx.fillStyle='#777'; ctx.font='10px Arial'; ctx.textAlign='left';
        ctx.fillText('A/D or \u2190/\u2192  Steer', clx+8, cly+14);
        ctx.fillText('S or \u2193        Brake', clx+8, cly+28);
        ctx.fillText('W or \u2191        Nitro', clx+8, cly+42);
        ctx.fillText('Space         Handbrake', clx+8, cly+56);
        ctx.fillText('R             Reset', clx+8, cly+70);
        ctx.fillText('ESC           Pause', clx+8, cly+84);

        // --- Top-right: Stats panel (score, kills, deaths, AI left, timer) ---
        let trw = 190, trh = 112;
        let trx = vx+vw - pad - trw, tr_y = vy+pad;
        ctx.fillStyle='rgba(0,0,0,.65)';
        ctx.fillRect(trx, tr_y, trw, trh);
        ctx.strokeStyle=accent; ctx.lineWidth=1;
        ctx.strokeRect(trx, tr_y, trw, trh);

        ctx.fillStyle='#ff4'; ctx.font='bold 18px Courier New'; ctx.textAlign='left';
        ctx.fillText(`SCORE: ${score}`, trx+10, tr_y+22);

        let numAI = 11;
        let alive = cars.filter(c=>c.alive && c.playerIdx === -1).length;
        ctx.fillStyle='#aaa'; ctx.font='13px Courier New';
        ctx.fillText('KILLS ', trx+10, tr_y+44);
        ctx.fillStyle='#fff'; ctx.fillText(car.kills, trx+90, tr_y+44);

        ctx.fillStyle='#aaa';
        ctx.fillText('DEATHS', trx+10, tr_y+60);
        ctx.fillStyle='#fff'; ctx.fillText(car.deaths, trx+90, tr_y+60);

        ctx.fillStyle='#aaa';
        ctx.fillText('AI LEFT', trx+10, tr_y+76);
        ctx.fillStyle = alive > 0 ? '#f84' : '#4f4';
        ctx.fillText(`${alive}/${numAI}`, trx+90, tr_y+76);

        let mins = Math.floor(gameTime/60), secs = Math.floor(gameTime%60);
        ctx.fillStyle='#aaa';
        ctx.fillText('TIME  ', trx+10, tr_y+96);
        ctx.fillStyle='#fff';
        ctx.fillText(`${mins}:${secs.toString().padStart(2,'0')}`, trx+90, tr_y+96);

        // --- Bottom-left: Speed + Nitro ---
        let blx = vx+pad, bly = vy+vh - pad - 70;
        ctx.fillStyle='rgba(0,0,0,.65)';
        ctx.fillRect(blx, bly, 170, 70);
        ctx.strokeStyle=accent; ctx.lineWidth=1;
        ctx.strokeRect(blx, bly, 170, 70);

        let speed = Math.round(car.speed * 20);
        ctx.fillStyle='#4ff'; ctx.font='bold 28px Courier New'; ctx.textAlign='left';
        ctx.fillText(speed, blx+10, bly+30);
        ctx.fillStyle='#aaa'; ctx.font='13px Courier New';
        ctx.fillText('KMH', blx+90, bly+30);

        // Nitro bar (cooldown-based)
        ctx.fillStyle='#222'; ctx.fillRect(blx+10, bly+40, 150, 10);
        let nitroLabel, nitroBarW, nitroCol1, nitroCol2;
        if (car.nitroActive) {
            nitroBarW = 150 * (car.nitroBurnTimer / CONFIG.nitroBurnFrames);
            nitroCol1 = '#ff8800'; nitroCol2 = '#ffcc00';
            nitroLabel = 'BURN ' + Math.ceil(car.nitroBurnTimer / 60) + 's';
        } else if (car.nitroCooldown > 0) {
            nitroBarW = 150 * (1 - car.nitroCooldown / CONFIG.nitroCooldown);
            nitroCol1 = '#555'; nitroCol2 = '#777';
            nitroLabel = 'CHARGING ' + Math.ceil(car.nitroCooldown / 60) + 's';
        } else {
            nitroBarW = 150;
            nitroCol1 = '#00ccff'; nitroCol2 = '#00ff88';
            nitroLabel = 'READY';
        }
        let nitroGrad = ctx.createLinearGradient(blx+10, 0, blx+160, 0);
        nitroGrad.addColorStop(0, nitroCol1); nitroGrad.addColorStop(1, nitroCol2);
        ctx.fillStyle = nitroGrad;
        ctx.fillRect(blx+10, bly+40, nitroBarW, 10);
        ctx.fillStyle='#aaa'; ctx.font='9px Arial'; ctx.textAlign='center';
        ctx.fillText(nitroLabel, blx+85, bly+63);

        // --- Bottom-center: Health bar ---
        let hbw = 260, hbh = 20;
        let hbx = vx+vw/2 - hbw/2, hby = vy+vh - pad - 28;
        ctx.fillStyle='rgba(0,0,0,.65)';
        ctx.fillRect(hbx-4, hby-4, hbw+8, hbh+8);
        ctx.fillStyle='#333'; ctx.fillRect(hbx, hby, hbw, hbh);
        let hp = Math.max(0, car.health) / car.maxHealth;
        let hpColor = hp > .5 ? '#4f4' : hp > .25 ? '#ff4' : '#f44';
        ctx.fillStyle = hpColor;
        ctx.fillRect(hbx, hby, hbw * hp, hbh);
        ctx.strokeStyle = hpColor; ctx.lineWidth = 1;
        ctx.strokeRect(hbx, hby, hbw, hbh);
        ctx.fillStyle='#fff'; ctx.font='bold 12px Arial'; ctx.textAlign='center';
        ctx.fillText(`HP: ${Math.max(0,Math.round(car.health))}%`, hbx+hbw/2, hby+15);

        // --- Active power-up indicator (above health bar) ---
        if (car.alive && car.activePowerUp) {
            let puLabel = car.activePowerUp.toUpperCase();
            let puTime = Math.ceil(car.powerUpTimer / 60);
            let puColors = { shield: '#44ffff', damage: '#ff4444', speed: '#ffff44', magnet: '#ff66ff' };
            let puCol = puColors[car.activePowerUp] || '#fff';
            ctx.fillStyle='rgba(0,0,0,.6)';
            ctx.fillRect(vx+vw/2-70, hby-30, 140, 22);
            ctx.fillStyle=puCol; ctx.font='bold 13px Courier New'; ctx.textAlign='center';
            ctx.fillText(`${puLabel} ${puTime}s`, vx+vw/2, hby-14);
        }

        // --- If dead — show respawn countdown ---
        if (!car.alive) {
            ctx.fillStyle='rgba(0,0,0,.55)';
            ctx.fillRect(vx, vy, vw, vh);
            ctx.fillStyle='#f44'; ctx.font='bold 48px Arial'; ctx.textAlign='center';
            ctx.fillText('WRECKED!', vx+vw/2, vy+vh/2 - 30);
            let secLeft = Math.ceil(car.respawnTimer / 60);
            ctx.fillStyle='#fff'; ctx.font='bold 26px Arial';
            ctx.fillText(`Respawn in ${secLeft}...`, vx+vw/2, vy+vh/2 + 20);
        }

        // --- Minimap (bottom-right corner) ---
        let mmS = 140, mmx = vx+vw-pad-mmS, mmy = vy+vh-pad-mmS;
        ctx.fillStyle='rgba(20,30,10,.8)';
        ctx.fillRect(mmx, mmy, mmS, mmS);
        ctx.strokeStyle='#555'; ctx.lineWidth=1; ctx.strokeRect(mmx,mmy,mmS,mmS);
        ctx.fillStyle='#333';
        let mcx=mmx+mmS/2, mcy=mmy+mmS/2;
        ctx.beginPath();ctx.arc(mcx,mcy,mmS*520/mmArenaW,0,Math.PI*2);ctx.fill();
        for (let pu of powerUps) {
            let mx = mmx + (pu.x/mmArenaW)*mmS;
            let my = mmy + (pu.y/mmArenaH)*mmS;
            ctx.fillStyle = pu.color;
            ctx.fillRect(mx-2, my-2, 4, 4);
        }
        for (let c of cars) {
            if (!c.alive) continue;
            let mx = mmx + (c.x/mmArenaW)*mmS;
            let my = mmy + (c.y/mmArenaH)*mmS;
            ctx.fillStyle = c === car ? '#fff' : '#f44';
            let sz = c === car ? 5 : 3;
            ctx.fillRect(mx-sz/2, my-sz/2, sz, sz);
        }
        ctx.strokeStyle = accent; ctx.lineWidth = 1;
        let camRx = mmx + ((car.x - vw/2) / mmArenaW) * mmS;
        let camRy = mmy + ((car.y - vh/2) / mmArenaH) * mmS;
        let camRw = (vw / mmArenaW) * mmS;
        let camRh = (vh / mmArenaH) * mmS;
        ctx.strokeRect(camRx, camRy, camRw, camRh);

    } else {
        // ======= MULTIPLAYER HUD (per viewport) =======

        // --- Top: Player name & kills ---
        ctx.fillStyle='rgba(0,0,0,.65)';
        ctx.fillRect(vx+pad, vy+pad, 180, 78);
        ctx.strokeStyle=accent; ctx.lineWidth=1;
        ctx.strokeRect(vx+pad, vy+pad, 180, 78);

        ctx.fillStyle=accent; ctx.font='bold 16px Courier New'; ctx.textAlign='left';
        ctx.fillText(car.name, vx+pad+10, vy+pad+20);

        ctx.fillStyle='#aaa'; ctx.font='13px Courier New';
        ctx.fillText(`KILLS  `, vx+pad+10, vy+pad+40);
        ctx.fillStyle='#fff'; ctx.fillText(car.kills, vx+pad+80, vy+pad+40);

        ctx.fillStyle='#aaa';
        ctx.fillText(`HITS   `, vx+pad+10, vy+pad+56);
        ctx.fillStyle='#fff'; ctx.fillText(car.hits, vx+pad+80, vy+pad+56);

        let alive = cars.filter(c=>c.alive).length;
        ctx.fillStyle='#aaa';
        ctx.fillText(`ALIVE  `, vx+pad+10, vy+pad+72);
        ctx.fillStyle='#fff'; ctx.fillText(`${alive}/${cars.length}`, vx+pad+80, vy+pad+72);

        // --- Bottom-left: Speed + Nitro ---
        let blx = vx + pad, bly = vy + vh - pad - 70;
        ctx.fillStyle='rgba(0,0,0,.65)';
        ctx.fillRect(blx, bly, 160, 70);
        ctx.strokeStyle=accent; ctx.lineWidth=1;
        ctx.strokeRect(blx, bly, 160, 70);

        let speed = Math.round(car.speed * 20);
        ctx.fillStyle='#4ff'; ctx.font='bold 28px Courier New'; ctx.textAlign='left';
        ctx.fillText(speed, blx+10, bly+30);
        ctx.fillStyle='#aaa'; ctx.font='13px Courier New';
        ctx.fillText('KMH', blx+85, bly+30);

        // Nitro bar (cooldown-based)
        ctx.fillStyle='#222'; ctx.fillRect(blx+10, bly+40, 140, 10);
        let nitroLabel, nitroBarW, nitroCol1, nitroCol2;
        if (car.nitroActive) {
            nitroBarW = 140 * (car.nitroBurnTimer / CONFIG.nitroBurnFrames);
            nitroCol1 = '#ff8800'; nitroCol2 = '#ffcc00';
            nitroLabel = 'BURN ' + Math.ceil(car.nitroBurnTimer / 60) + 's';
        } else if (car.nitroCooldown > 0) {
            nitroBarW = 140 * (1 - car.nitroCooldown / CONFIG.nitroCooldown);
            nitroCol1 = '#555'; nitroCol2 = '#777';
            nitroLabel = 'CHARGING ' + Math.ceil(car.nitroCooldown / 60) + 's';
        } else {
            nitroBarW = 140;
            nitroCol1 = '#00ccff'; nitroCol2 = '#00ff88';
            nitroLabel = 'READY';
        }
        let nitroGrad = ctx.createLinearGradient(blx+10, 0, blx+150, 0);
        nitroGrad.addColorStop(0, nitroCol1); nitroGrad.addColorStop(1, nitroCol2);
        ctx.fillStyle = nitroGrad;
        ctx.fillRect(blx+10, bly+40, nitroBarW, 10);
        ctx.fillStyle='#aaa'; ctx.font='9px Arial'; ctx.textAlign='center';
        ctx.fillText(nitroLabel, blx+80, bly+63);

        // --- Bottom-center: Health bar ---
        let hbw = 200, hbh = 16;
        let hbx = vx + vw/2 - hbw/2, hby = vy + vh - pad - 22;
        ctx.fillStyle='rgba(0,0,0,.65)';
        ctx.fillRect(hbx-4, hby-4, hbw+8, hbh+8);
        ctx.fillStyle='#333'; ctx.fillRect(hbx, hby, hbw, hbh);
        let hp = Math.max(0, car.health) / car.maxHealth;
        let hpColor = hp > .5 ? '#4f4' : hp > .25 ? '#ff4' : '#f44';
        ctx.fillStyle = hpColor;
        ctx.fillRect(hbx, hby, hbw * hp, hbh);
        ctx.strokeStyle = hpColor; ctx.lineWidth = 1;
        ctx.strokeRect(hbx, hby, hbw, hbh);
        ctx.fillStyle='#fff'; ctx.font='bold 11px Arial'; ctx.textAlign='center';
        ctx.fillText(`${Math.max(0,Math.round(car.health))}%`, hbx+hbw/2, hby+12);

        // --- If dead — show respawn countdown ---
        if (!car.alive) {
            ctx.fillStyle='rgba(0,0,0,.55)';
            ctx.fillRect(vx, vy, vw, vh);
            ctx.fillStyle='#f44'; ctx.font='bold 36px Arial'; ctx.textAlign='center';
            ctx.fillText('WRECKED!', vx+vw/2, vy+vh/2 - 20);
            let secLeft = Math.ceil(car.respawnTimer / 60);
            ctx.fillStyle='#fff'; ctx.font='bold 22px Arial';
            ctx.fillText(`Respawn in ${secLeft}...`, vx+vw/2, vy+vh/2 + 20);
        }

        // --- Active power-up indicator ---
        if (car.alive && car.activePowerUp) {
            let puLabel = car.activePowerUp.toUpperCase();
            let puTime = Math.ceil(car.powerUpTimer / 60);
            let puColors = { shield: '#44ffff', damage: '#ff4444', speed: '#ffff44', magnet: '#ff66ff' };
            let puCol = puColors[car.activePowerUp] || '#fff';
            ctx.fillStyle='rgba(0,0,0,.6)';
            ctx.fillRect(vx+vw/2-60, vy+vh-pad-50, 120, 20);
            ctx.fillStyle=puCol; ctx.font='bold 12px Courier New'; ctx.textAlign='center';
            ctx.fillText(`${puLabel} ${puTime}s`, vx+vw/2, vy+vh-pad-36);
        }

        // --- Minimap (bottom-right corner of viewport) ---
        let mmS = 110, mmx = vx+vw-pad-mmS, mmy = vy+vh-pad-mmS;
        ctx.fillStyle='rgba(20,30,10,.8)';
        ctx.fillRect(mmx, mmy, mmS, mmS);
        ctx.strokeStyle='#555'; ctx.lineWidth=1; ctx.strokeRect(mmx,mmy,mmS,mmS);
        ctx.fillStyle='#333';
        let mcx=mmx+mmS/2, mcy=mmy+mmS/2;
        ctx.beginPath();ctx.arc(mcx,mcy,mmS*520/mmArenaW,0,Math.PI*2);ctx.fill();
        for (let pu of powerUps) {
            let mx = mmx + (pu.x/mmArenaW)*mmS;
            let my = mmy + (pu.y/mmArenaH)*mmS;
            ctx.fillStyle = pu.color;
            ctx.fillRect(mx-2, my-2, 4, 4);
        }
        for (let c of cars) {
            if (!c.alive) continue;
            let mx = mmx + (c.x/mmArenaW)*mmS;
            let my = mmy + (c.y/mmArenaH)*mmS;
            ctx.fillStyle = c === car ? '#fff' : c.playerIdx>=0 ? c.color : '#f44';
            let sz = c === car ? 4 : 2.5;
            ctx.fillRect(mx-sz/2, my-sz/2, sz, sz);
        }
        ctx.strokeStyle = accent; ctx.lineWidth = 1;
        let camRx = mmx + ((car.x - vw/2) / mmArenaW) * mmS;
        let camRy = mmy + ((car.y - vh/2) / mmArenaH) * mmS;
        let camRw = (vw / mmArenaW) * mmS;
        let camRh = (vh / mmArenaH) * mmS;
        ctx.strokeRect(camRx, camRy, camRw, camRh);

        // --- Controls reminder (top-right of viewport) ---
        let crx = vx + vw - pad - 110, cry = vy + pad;
        ctx.fillStyle='rgba(0,0,0,.5)';
        ctx.fillRect(crx, cry, 110, 68);
        ctx.fillStyle='#888'; ctx.font='10px Arial'; ctx.textAlign='left';
        if (isP1) {
            ctx.fillText('A/D  Steer', crx+8, cry+14);
            ctx.fillText('S    Brake', crx+8, cry+28);
            ctx.fillText('W    Nitro', crx+8, cry+42);
            ctx.fillText('Q    Drift', crx+8, cry+56);
        } else {
            ctx.fillText('\u2190/\u2192  Steer', crx+8, cry+14);
            ctx.fillText('\u2193    Brake', crx+8, cry+28);
            ctx.fillText('\u2191    Nitro', crx+8, cry+42);
            ctx.fillText('M    Drift', crx+8, cry+56);
        }

        // --- Timer (top-center) ---
        let mins = Math.floor(gameTime/60), secs = Math.floor(gameTime%60);
        ctx.fillStyle='rgba(0,0,0,.5)';
        ctx.fillRect(vx+vw/2-35, vy+pad, 70, 22);
        ctx.fillStyle='#fff'; ctx.font='bold 14px Courier New'; ctx.textAlign='center';
        ctx.fillText(`${mins}:${secs.toString().padStart(2,'0')}`, vx+vw/2, vy+pad+16);
    }

    ctx.restore();
}
