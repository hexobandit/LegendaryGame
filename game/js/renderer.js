// ================================================================
//  RENDERER — All drawing functions
//  Extracted from destruction-derby.html and modified for map support
// ================================================================

function drawTerrain() {
    // Use map background color (fallback to original green)
    ctx.fillStyle = (typeof currentMap !== 'undefined' && currentMap.backgroundColor) ? currentMap.backgroundColor : '#4a6e2a';
    let arenaW = (typeof currentMap !== 'undefined' && currentMap.arenaWidth) ? currentMap.arenaWidth : ARENA_W;
    let arenaH = (typeof currentMap !== 'undefined' && currentMap.arenaHeight) ? currentMap.arenaHeight : ARENA_H;
    ctx.fillRect(0, 0, arenaW, arenaH);

    for (let p of grassPatches){ctx.fillStyle=`rgba(60,100,30,${.05+p.shade})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
    for (let p of dirtPatches){ctx.fillStyle=`rgba(120,100,60,${.3+p.shade})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}

    // Mud patches
    for (let p of mudPatches) {
        // Dark wet mud base
        ctx.fillStyle='#3d2b1a';
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
        // Wet sheen highlight
        ctx.fillStyle='rgba(80,55,30,0.6)';
        ctx.beginPath();ctx.arc(p.x-p.r*0.15,p.y-p.r*0.15,p.r*0.7,0,Math.PI*2);ctx.fill();
        // Edge blend
        ctx.strokeStyle='rgba(61,43,26,0.4)';ctx.lineWidth=6;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r+2,0,Math.PI*2);ctx.stroke();
    }

    // Tarmac roads — read layout from currentMap.radialRoads if available
    let roadCfg = (typeof currentMap !== 'undefined' && currentMap.radialRoads) ? currentMap.radialRoads : null;
    let centerRadius = roadCfg ? roadCfg.centerRadius : 520;
    let roadCount    = roadCfg ? roadCfg.roadCount    : 4;
    let roadWidth    = roadCfg ? roadCfg.roadWidth    : 104;
    let roadLength   = roadCfg ? roadCfg.roadLength   : 1300;
    let startAngle   = roadCfg ? roadCfg.startAngle   : Math.PI / 4;

    ctx.fillStyle='#3a3a3a';
    ctx.beginPath();ctx.arc(arenaW/2, arenaH/2, centerRadius, 0, Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=2;ctx.setLineDash([20,30]);
    ctx.beginPath();ctx.arc(arenaW/2, arenaH/2, centerRadius * 0.615, 0, Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(arenaW/2, arenaH/2, centerRadius * 0.308, 0, Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle='#3a3a3a';
    for (let i = 0; i < roadCount; i++){
        let a = (i / roadCount) * Math.PI * 2 + startAngle;
        ctx.save();ctx.translate(arenaW/2, arenaH/2);ctx.rotate(a);
        ctx.fillRect(0, -roadWidth/2, roadLength, roadWidth);
        ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=2;ctx.setLineDash([15,25]);
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(roadLength,0);ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=3;ctx.setLineDash([40,20]);
        ctx.beginPath();ctx.moveTo(centerRadius, -(roadWidth/2 - 2));ctx.lineTo(roadLength, -(roadWidth/2 - 2));ctx.stroke();
        ctx.beginPath();ctx.moveTo(centerRadius, (roadWidth/2 - 2));ctx.lineTo(roadLength, (roadWidth/2 - 2));ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    // Water puddles
    let t = performance.now() * 0.001;
    for (let w of waterPuddles) {
        // Dark shadow under water
        ctx.fillStyle='rgba(20,50,80,0.5)';
        ctx.beginPath();ctx.arc(w.x,w.y,w.r+3,0,Math.PI*2);ctx.fill();
        // Water base
        ctx.fillStyle='rgba(40,120,200,0.55)';
        ctx.beginPath();ctx.arc(w.x,w.y,w.r,0,Math.PI*2);ctx.fill();
        // Animated ripples
        ctx.strokeStyle='rgba(140,200,255,0.3)';ctx.lineWidth=1;
        let r1 = w.r * 0.4 + Math.sin(t*2 + w.phase)*w.r*0.15;
        let r2 = w.r * 0.7 + Math.sin(t*1.5 + w.phase+1)*w.r*0.1;
        ctx.beginPath();ctx.arc(w.x,w.y,r1,0,Math.PI*2);ctx.stroke();
        ctx.beginPath();ctx.arc(w.x,w.y,r2,0,Math.PI*2);ctx.stroke();
        // Specular highlight
        ctx.fillStyle='rgba(200,240,255,0.2)';
        ctx.beginPath();ctx.arc(w.x-w.r*0.2,w.y-w.r*0.25,w.r*0.3,0,Math.PI*2);ctx.fill();
    }

    // Oil slicks
    for (let o of oilSlicks) {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.angle);
        // Rainbow-ish sheen
        let oilGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, o.rx);
        oilGrad.addColorStop(0, 'rgba(30,30,30,0.7)');
        oilGrad.addColorStop(0.4, 'rgba(80,40,120,0.5)');
        oilGrad.addColorStop(0.7, 'rgba(40,80,60,0.4)');
        oilGrad.addColorStop(1, 'rgba(20,20,20,0.2)');
        ctx.fillStyle = oilGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI*2);
        ctx.fill();
        // Shiny highlight
        ctx.fillStyle='rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.ellipse(-o.rx*0.2, -o.ry*0.2, o.rx*0.4, o.ry*0.3, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }

    // Bumps / speed bumps
    for (let b of bumps) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        // Yellow/black striped bump
        ctx.fillStyle='rgba(200,180,50,0.7)';
        ctx.fillRect(-b.r, -5, b.r*2, 10);
        for (let s = -b.r; s < b.r; s += 8) {
            ctx.fillStyle = (((s/8|0)%2===0)?'rgba(40,40,40,0.5)':'rgba(220,200,50,0.6)');
            ctx.fillRect(s, -5, 4, 10);
        }
        ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1;
        ctx.strokeRect(-b.r, -5, b.r*2, 10);
        ctx.restore();
    }

    // Ambient particles (map-specific, e.g. snow, leaves, dust)
    if (typeof currentMap !== 'undefined' && currentMap.ambientParticles) {
        let ap = currentMap.ambientParticles;
        let count = ap.spawnRate || 2;
        for (let i = 0; i < count; i++) {
            if (Math.random() < 0.3) {
                let px = Math.random() * arenaW;
                let py = Math.random() * arenaH;
                let vx = (ap.direction === 'left' ? -1 : ap.direction === 'right' ? 1 : (Math.random() - 0.5)) * (ap.speed || 1);
                let vy = (ap.direction === 'down' ? 1 : ap.direction === 'up' ? -1 : (Math.random() - 0.5)) * (ap.speed || 1);
                particles.push(mkParticle(
                    px, py, vx, vy,
                    ap.color || '#fff',
                    ap.size || (2 + Math.random() * 3),
                    ap.decay || 0.005
                ));
            }
        }
    }
}

// Draw bushes (after obstacles, before cars — they're passable)
function drawBushes() {
    for (let b of bushes) {
        // Shadow
        ctx.fillStyle='rgba(0,0,0,0.15)';
        ctx.beginPath();ctx.arc(b.x+3,b.y+3,b.r,0,Math.PI*2);ctx.fill();
        // Leaf clusters
        for (let l of b.leaves) {
            let shade = 0.6 + l.shade;
            ctx.fillStyle=`rgba(${40*shade|0},${100*shade|0},${25*shade|0},0.85)`;
            ctx.beginPath();
            ctx.arc(b.x + l.dx, b.y + l.dy, l.r, 0, Math.PI*2);
            ctx.fill();
        }
        // Highlight on top
        ctx.fillStyle='rgba(80,160,40,0.4)';
        ctx.beginPath();ctx.arc(b.x-b.r*0.15,b.y-b.r*0.2,b.r*0.5,0,Math.PI*2);ctx.fill();
    }
}

function drawWalls() {
    let wW = (currentMap && currentMap.arenaWidth) || ARENA_W;
    let wH = (currentMap && currentMap.arenaHeight) || ARENA_H;
    ctx.fillStyle='#222';
    const sp=60;
    for (let x=30;x<wW;x+=sp){drawTire(x,30);drawTire(x,wH-30);}
    for (let y=30;y<wH;y+=sp){drawTire(30,y);drawTire(wW-30,y);}
}

function drawTire(x,y) {
    ctx.fillStyle='#222';ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#444';ctx.lineWidth=1.5;ctx.stroke();
}

function drawObstacles() {
    for (let o of obstacles){
        ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.arc(o.x+3,o.y+3,o.r,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=o.color;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.arc(o.x-o.r*.2,o.y-o.r*.2,o.r*.45,0,Math.PI*2);ctx.fill();
    }
}

function drawSkidMarks() {
    ctx.lineCap = 'round';
    for (let s of skidMarks) {
        ctx.globalAlpha = s.alpha * 0.6;
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = s.w;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function drawCar(car) {
    if (!car.alive) return;
    ctx.save();
    ctx.translate(car.x,car.y);ctx.rotate(car.angle);

    // Resolve dimensions from carType (if present) or use defaults
    let cw = (car.carType && car.carType.width) ? car.carType.width : CAR_W;
    let ch = (car.carType && car.carType.height) ? car.carType.height : CAR_H;
    let bodyStyle = (car.carType && car.carType.bodyStyle) ? car.carType.bodyStyle : 'sedan';

    // Power-up glow ring
    if (car.activePowerUp) {
        let puCols = { shield: '#44ffff', damage: '#ff4444', speed: '#ffff44', magnet: '#ff66ff' };
        let glowCol = puCols[car.activePowerUp] || '#fff';
        ctx.globalAlpha = 0.25 + Math.sin(performance.now()*0.008)*0.15;
        ctx.strokeStyle = glowCol; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(cw, ch) * 0.65, 0, Math.PI*2); ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Shadow — SUV gets extra offset for taller look
    let shadowOff = bodyStyle === 'suv' ? 5 : 3;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-cw/2+shadowOff,-ch/2+shadowOff,cw,ch);

    let col = car.color;
    if (car.invincible>0 && (car.invincible/3|0)%2) col='#fff';

    // Body — compact gets rounder corners
    let cornerRadius = bodyStyle === 'compact' ? 8 : 4;
    ctx.fillStyle=col;
    ctx.beginPath();ctx.roundRect(-cw/2,-ch/2,cw,ch,cornerRadius);ctx.fill();

    // Windshield — sport gets a slightly lower (narrower) windshield
    if (bodyStyle === 'sport') {
        ctx.fillStyle='rgba(100,180,255,.55)';ctx.fillRect(cw/2-14,-ch/2+5,8,ch-10);
    } else {
        ctx.fillStyle='rgba(100,180,255,.55)';ctx.fillRect(cw/2-14,-ch/2+3,8,ch-6);
    }

    // Rear
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-cw/2,-ch/2+2,8,ch-4);

    // Roof stripe
    ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(-5,-2,10,4);

    // Headlights
    ctx.fillStyle='#ffa';ctx.fillRect(cw/2-3,-ch/2+2,3,4);ctx.fillRect(cw/2-3,ch/2-6,3,4);
    // Tail lights
    ctx.fillStyle='#f00';ctx.fillRect(-cw/2,-ch/2+2,3,4);ctx.fillRect(-cw/2,ch/2-6,3,4);

    // === Body style variations ===
    if (bodyStyle === 'sport') {
        // Spoiler fin on rear
        ctx.fillStyle='rgba(0,0,0,.6)';
        ctx.fillRect(-cw/2 - 5, -ch/2 + 1, 5, ch - 2);
        ctx.fillStyle = col;
        ctx.fillRect(-cw/2 - 4, -ch/2 + 2, 3, ch - 4);
    } else if (bodyStyle === 'suv') {
        // Roof rack line
        ctx.strokeStyle='rgba(180,180,180,.5)';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(-cw/4, -ch/2);ctx.lineTo(cw/4, -ch/2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(-cw/4, ch/2);ctx.lineTo(cw/4, ch/2);ctx.stroke();
        // Cross bars
        ctx.beginPath();ctx.moveTo(-cw/6, -ch/2);ctx.lineTo(-cw/6, ch/2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(cw/6, -ch/2);ctx.lineTo(cw/6, ch/2);ctx.stroke();
    } else if (bodyStyle === 'truck') {
        // Bull bar on front
        ctx.strokeStyle='rgba(200,200,200,.7)';ctx.lineWidth=2.5;
        ctx.beginPath();
        ctx.moveTo(cw/2 + 2, -ch/2 + 1);
        ctx.lineTo(cw/2 + 4, -ch/2 + 1);
        ctx.lineTo(cw/2 + 4, ch/2 - 1);
        ctx.lineTo(cw/2 + 2, ch/2 - 1);
        ctx.stroke();
        // Center bull bar strut
        ctx.beginPath();ctx.moveTo(cw/2, 0);ctx.lineTo(cw/2 + 4, 0);ctx.stroke();
    }
    // 'compact' and 'sedan' (default) — no extra decoration beyond the rounder corners for compact

    // Player badge (human players)
    if (car.playerIdx >= 0) {
        ctx.fillStyle='rgba(255,255,255,.35)';
        ctx.font='bold 10px Arial';ctx.textAlign='center';
        if (gameMode === 'single') {
            ctx.fillText('P1', 0, 4);
        } else {
            ctx.fillText(car.playerIdx===0?'P1':'P2', 0, 4);
        }
    } else {
        // AI roof marker — diamond shape
        ctx.fillStyle='rgba(255,255,255,.45)';
        ctx.beginPath();
        ctx.moveTo(0, -4); ctx.lineTo(4, 0); ctx.lineTo(0, 4); ctx.lineTo(-4, 0);
        ctx.closePath(); ctx.fill();
    }

    // AI body variation — spoiler or wider bumper (only if no carType bodyStyle override)
    if (car.playerIdx < 0 && bodyStyle === 'sedan') {
        let carIdx = cars.indexOf(car);
        if (carIdx % 2 === 0) {
            ctx.fillStyle='rgba(0,0,0,.5)';
            ctx.fillRect(-cw/2 - 4, -ch/2 + 2, 4, ch - 4);
            ctx.fillStyle=col;
            ctx.fillRect(-cw/2 - 3, -ch/2 + 3, 3, ch - 6);
        } else {
            ctx.fillStyle='rgba(0,0,0,.4)';
            ctx.fillRect(cw/2, -ch/2 - 2, 3, ch + 4);
            ctx.fillStyle=col;
            ctx.fillRect(cw/2, -ch/2 - 1, 2, ch + 2);
        }
    }

    // Damage cracks
    if (car.health<60){ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1;for(let i=0;i<((100-car.health)/15|0);i++){let sx=(Math.random()-.5)*cw*.8,sy=(Math.random()-.5)*ch*.8;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+(Math.random()-.5)*12,sy+(Math.random()-.5)*12);ctx.stroke();}}

    // Smoke
    if (car.health<40&&Math.random()<.3) particles.push(mkParticle(car.x+(Math.random()-.5)*10,car.y+(Math.random()-.5)*10,(Math.random()-.5)*.5,-Math.random()*.5,car.health<20?'#333':'#888',5+Math.random()*8,.02));

    ctx.restore();

    // Player marker (multiplayer only: small triangle above the OTHER player's car)
    if (gameMode === 'multi' && car.playerIdx >= 0) {
        let markerColor = car.playerIdx === 0 ? P1_COLOR : P2_COLOR;
        let my = car.y - 38;
        // Pulsing triangle pointing down
        let pulse = 0.6 + Math.sin(performance.now() * 0.005) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = markerColor;
        ctx.beginPath();
        ctx.moveTo(car.x, my + 8);
        ctx.lineTo(car.x - 6, my);
        ctx.lineTo(car.x + 6, my);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    let bw=32,bh=3,bx=car.x-bw/2,by=car.y-31;
    ctx.fillStyle='#333';ctx.fillRect(bx,by,bw,bh);
    let hp=car.health/car.maxHealth;
    ctx.fillStyle=hp>.5?'#4f4':hp>.25?'#ff4':'#f44';
    ctx.fillRect(bx,by,bw*hp,bh);
}

function drawDebris() {
    for (let d of debris){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.angle);ctx.globalAlpha=Math.min(1,d.life/30);ctx.fillStyle=d.color;ctx.fillRect(-d.size/2,-d.size/2,d.size,d.size);ctx.globalAlpha=1;ctx.restore();}
}

function drawParticles() {
    for (let p of particles){ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
}

function drawFloatingTexts() {
    ctx.textAlign='center';
    for (let f of floatingTexts){
        ctx.globalAlpha=f.alpha;
        if (f.bubble) {
            ctx.font='bold 13px Arial';
            let tw = ctx.measureText(f.text).width;
            let pw = tw + 14, ph = 22;
            let bx = f.x - pw/2, by = f.y - ph + 4;
            // Bubble background
            let r = 6;
            ctx.fillStyle = f.bubbleColor || '#fff';
            ctx.beginPath();
            ctx.moveTo(bx+r, by);
            ctx.lineTo(bx+pw-r, by);
            ctx.quadraticCurveTo(bx+pw, by, bx+pw, by+r);
            ctx.lineTo(bx+pw, by+ph-r);
            ctx.quadraticCurveTo(bx+pw, by+ph, bx+pw-r, by+ph);
            // Tail
            ctx.lineTo(f.x+4, by+ph);
            ctx.lineTo(f.x, by+ph+6);
            ctx.lineTo(f.x-4, by+ph);
            ctx.lineTo(bx+r, by+ph);
            ctx.quadraticCurveTo(bx, by+ph, bx, by+ph-r);
            ctx.lineTo(bx, by+r);
            ctx.quadraticCurveTo(bx, by, bx+r, by);
            ctx.closePath();
            ctx.fill();
            // Border
            ctx.strokeStyle='rgba(0,0,0,0.4)';
            ctx.lineWidth=1.5;
            ctx.stroke();
            // Text
            ctx.fillStyle='#fff';
            ctx.fillText(f.text, f.x, f.y);
        } else {
            ctx.font='bold 14px Arial';
            ctx.fillStyle=f.color;
            ctx.fillText(f.text,f.x,f.y);
        }
    }
    ctx.globalAlpha=1;
}
