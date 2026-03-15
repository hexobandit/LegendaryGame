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

    // Tarmac roads — only draw if map has radial roads
    let roadCfg = (typeof currentMap !== 'undefined' && currentMap.radialRoads) ? currentMap.radialRoads : null;

    if (roadCfg) {
        let centerRadius = roadCfg.centerRadius;
        let roadCount    = roadCfg.roadCount;
        let roadWidth    = roadCfg.roadWidth;
        let roadLength   = roadCfg.roadLength;
        let startAngle   = roadCfg.startAngle;

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
    }

    // Curvy roads
    if (currentMap && currentMap.curvyRoads) {
        for (let ri = 0; ri < currentMap.curvyRoads.length; ri++) {
            let road = currentMap.curvyRoads[ri];
            let pts = road.points;
            if (pts.length < 2) continue;

            // Helper: trace smooth path through points
            function traceCurvyPath() {
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length; i++) {
                    if (i < pts.length - 1) {
                        let mx = (pts[i].x + pts[i+1].x) / 2;
                        let my = (pts[i].y + pts[i+1].y) / 2;
                        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
                    } else {
                        ctx.quadraticCurveTo(pts[i-1].x * 0.3 + pts[i].x * 0.7,
                                             pts[i-1].y * 0.3 + pts[i].y * 0.7,
                                             pts[i].x, pts[i].y);
                    }
                }
            }

            // Road surface
            ctx.strokeStyle = road.color || '#3a3a3a';
            ctx.lineWidth = road.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            traceCurvyPath();
            ctx.stroke();

            // Edge lines
            for (let side = -1; side <= 1; side += 2) {
                ctx.strokeStyle = road.edgeColor || 'rgba(255,255,255,.2)';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.setLineDash([30, 20]);
                ctx.beginPath();
                // Offset path by road.width/2 on each side — approximate with perpendicular offset
                for (let i = 0; i < pts.length; i++) {
                    let dx, dy;
                    if (i < pts.length - 1) { dx = pts[i+1].x - pts[i].x; dy = pts[i+1].y - pts[i].y; }
                    else { dx = pts[i].x - pts[i-1].x; dy = pts[i].y - pts[i-1].y; }
                    let len = Math.hypot(dx, dy) || 1;
                    let nx = -dy / len * (road.width / 2 - 2) * side;
                    let ny = dx / len * (road.width / 2 - 2) * side;
                    if (i === 0) ctx.moveTo(pts[i].x + nx, pts[i].y + ny);
                    else ctx.lineTo(pts[i].x + nx, pts[i].y + ny);
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Center dashed line
            ctx.strokeStyle = road.centerColor || 'rgba(255,255,255,.15)';
            ctx.lineWidth = 2;
            ctx.setLineDash([15, 25]);
            ctx.lineCap = 'round';
            ctx.beginPath();
            traceCurvyPath();
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Start/finish line (checkered pattern)
    if (currentMap && currentMap.startFinishLine) {
        let sfl = currentMap.startFinishLine;
        let dx = sfl.x2 - sfl.x1, dy = sfl.y2 - sfl.y1;
        let len = Math.hypot(dx, dy);
        let nx = dx / len, ny = dy / len;
        let squareSize = 10;
        let numSquares = Math.floor(len / squareSize);
        let angle = Math.atan2(dy, dx);
        ctx.save();
        ctx.translate(sfl.x1, sfl.y1);
        ctx.rotate(angle);
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < numSquares; col++) {
                ctx.fillStyle = (row + col) % 2 === 0 ? '#fff' : '#222';
                ctx.fillRect(col * squareSize, row * squareSize - squareSize, squareSize, squareSize);
            }
        }
        ctx.restore();
    }

    // Parking grid lines
    if (currentMap && currentMap.terrain && currentMap.terrain.parkingGrid) {
        let pg = currentMap.terrain.parkingGrid;
        let blockH = pg.spaceD * 2 + pg.aisleW;
        ctx.strokeStyle = 'rgba(255,255,255,.12)';
        ctx.lineWidth = 2;

        for (let by = pg.startY; by + blockH < arenaH - 100; by += blockH) {
            // Top row boundary
            ctx.beginPath(); ctx.moveTo(pg.startX, by + pg.spaceD); ctx.lineTo(arenaW - 100, by + pg.spaceD); ctx.stroke();
            // Top row parking space lines
            for (let sx = pg.startX; sx < arenaW - 100; sx += pg.spaceW) {
                ctx.beginPath(); ctx.moveTo(sx, by); ctx.lineTo(sx, by + pg.spaceD); ctx.stroke();
            }
            // Bottom row boundary
            let botY = by + pg.spaceD + pg.aisleW;
            ctx.beginPath(); ctx.moveTo(pg.startX, botY); ctx.lineTo(arenaW - 100, botY); ctx.stroke();
            // Bottom row parking space lines
            for (let sx = pg.startX; sx < arenaW - 100; sx += pg.spaceW) {
                ctx.beginPath(); ctx.moveTo(sx, botY); ctx.lineTo(sx, botY + pg.spaceD); ctx.stroke();
            }
            // Aisle center line (dashed yellow)
            let aisleY = by + pg.spaceD + pg.aisleW / 2;
            ctx.setLineDash([15, 20]);
            ctx.strokeStyle = 'rgba(255,200,50,.1)';
            ctx.beginPath(); ctx.moveTo(pg.startX, aisleY); ctx.lineTo(arenaW - 100, aisleY); ctx.stroke();
            ctx.setLineDash([]);
            ctx.strokeStyle = 'rgba(255,255,255,.12)';
        }
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

    // Ice patches
    for (let ip of icePatches) {
        let ig = ctx.createRadialGradient(ip.x - ip.r * 0.1, ip.y - ip.r * 0.1, 0, ip.x, ip.y, ip.r);
        ig.addColorStop(0, 'rgba(220,240,255,0.75)');
        ig.addColorStop(0.5, 'rgba(180,210,240,0.55)');
        ig.addColorStop(1, 'rgba(150,190,220,0.25)');
        ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(ip.x, ip.y, ip.r, 0, Math.PI * 2); ctx.fill();
        // Cracks
        ctx.strokeStyle = 'rgba(200,230,255,0.5)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(ip.x - ip.r * 0.3, ip.y - ip.r * 0.4);
        ctx.lineTo(ip.x, ip.y); ctx.lineTo(ip.x + ip.r * 0.4, ip.y + ip.r * 0.2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ip.x, ip.y); ctx.lineTo(ip.x - ip.r * 0.2, ip.y + ip.r * 0.5); ctx.stroke();
        // Specular
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.ellipse(ip.x - ip.r * 0.15, ip.y - ip.r * 0.15, ip.r * 0.3, ip.r * 0.2, -0.3, 0, Math.PI * 2); ctx.fill();
    }

    // Sand traps
    for (let st of sandTraps) {
        let sg = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.r);
        sg.addColorStop(0, '#d4b868'); sg.addColorStop(0.6, '#c8a850'); sg.addColorStop(1, '#b89838');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
        // Ripple lines
        ctx.strokeStyle = 'rgba(160,130,60,.3)'; ctx.lineWidth = 0.8;
        for (let si = -2; si <= 2; si++) {
            ctx.beginPath();
            ctx.moveTo(st.x - st.r * 0.7, st.y + si * st.r * 0.2);
            ctx.quadraticCurveTo(st.x, st.y + si * st.r * 0.2 + 3, st.x + st.r * 0.7, st.y + si * st.r * 0.2 - 1);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(180,150,80,.2)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.stroke();
    }

    // Ramps / jump zones
    for (let r of ramps) {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.angle);
        let hw = r.w / 2, hh = r.h / 2;

        if (r.style === 'dirt_mound') {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath(); ctx.ellipse(4, 4, hw + 4, hh + 4, 0, 0, Math.PI * 2); ctx.fill();
            // Earth base gradient
            let dg = ctx.createRadialGradient(0, 0, 0, 0, 0, hw);
            dg.addColorStop(0, '#a08860');
            dg.addColorStop(0.6, '#7a6540');
            dg.addColorStop(1, '#5a4828');
            ctx.fillStyle = dg;
            ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2); ctx.fill();
            // Hilltop highlight
            ctx.fillStyle = 'rgba(180,150,100,0.4)';
            ctx.beginPath(); ctx.ellipse(-hw * 0.08, -hh * 0.08, hw * 0.45, hh * 0.45, 0, 0, Math.PI * 2); ctx.fill();
            // Contour lines
            ctx.strokeStyle = 'rgba(90,70,40,0.25)'; ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.ellipse(0, 0, hw * 0.65, hh * 0.65, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(0, 0, hw * 0.35, hh * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
            // Grass tufts around edge
            for (let gi = 0; gi < 10; gi++) {
                let ga = (gi / 10) * Math.PI * 2 + r.x * 0.01;
                ctx.fillStyle = ['#4a7a22', '#5a8a2a', '#3a6a1a'][gi % 3];
                ctx.beginPath();
                ctx.arc(Math.cos(ga) * hw * 0.88, Math.sin(ga) * hh * 0.88, 3 + Math.sin(gi * 1.7) * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            // Direction chevrons
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            for (let ci = 0; ci < 3; ci++) {
                let cx = -8 + ci * 10;
                ctx.beginPath(); ctx.moveTo(cx + 6, 0); ctx.lineTo(cx, -5); ctx.lineTo(cx, 5); ctx.closePath(); ctx.fill();
            }

        } else if (r.style === 'sand_dune') {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.beginPath(); ctx.ellipse(3, 3, hw + 3, hh + 5, 0, 0, Math.PI * 2); ctx.fill();
            // Sand body
            let sg = ctx.createRadialGradient(-hw * 0.2, 0, 0, 0, 0, hw);
            sg.addColorStop(0, '#e8c878');
            sg.addColorStop(0.5, '#d4b060');
            sg.addColorStop(1, '#b89848');
            ctx.fillStyle = sg;
            ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2); ctx.fill();
            // Wind ripple lines
            ctx.strokeStyle = 'rgba(160,120,50,0.3)'; ctx.lineWidth = 1;
            for (let wi = -3; wi <= 3; wi++) {
                ctx.beginPath();
                ctx.moveTo(-hw * 0.6, wi * hh * 0.2);
                ctx.quadraticCurveTo(0, wi * hh * 0.2 + 3, hw * 0.6, wi * hh * 0.2 - 1);
                ctx.stroke();
            }
            // Light crest
            ctx.fillStyle = 'rgba(255,240,200,0.3)';
            ctx.beginPath(); ctx.ellipse(hw * 0.1, -hh * 0.15, hw * 0.4, hh * 0.3, 0.2, 0, Math.PI * 2); ctx.fill();
            // Chevrons
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            for (let ci = 0; ci < 3; ci++) {
                let cx = -8 + ci * 10;
                ctx.beginPath(); ctx.moveTo(cx + 6, 0); ctx.lineTo(cx, -5); ctx.lineTo(cx, 5); ctx.closePath(); ctx.fill();
            }

        } else if (r.style === 'ice_ridge') {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath(); ctx.ellipse(3, 3, hw + 2, hh + 2, 0, 0, Math.PI * 2); ctx.fill();
            // Ice body
            let ig = ctx.createRadialGradient(0, 0, 0, 0, 0, hw);
            ig.addColorStop(0, 'rgba(200,230,255,0.8)');
            ig.addColorStop(0.5, 'rgba(140,190,230,0.7)');
            ig.addColorStop(1, 'rgba(100,160,210,0.5)');
            ctx.fillStyle = ig;
            ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2); ctx.fill();
            // Crystal facets
            ctx.strokeStyle = 'rgba(220,240,255,0.5)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-hw * 0.3, -hh * 0.8); ctx.lineTo(hw * 0.2, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(hw * 0.1, -hh * 0.6); ctx.lineTo(-hw * 0.1, hh * 0.4); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-hw * 0.5, hh * 0.3); ctx.lineTo(hw * 0.3, -hh * 0.2); ctx.stroke();
            // Specular highlight
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath(); ctx.ellipse(-hw * 0.15, -hh * 0.2, hw * 0.3, hh * 0.25, -0.3, 0, Math.PI * 2); ctx.fill();
            // Frost sparkles (animated)
            ctx.fillStyle = '#fff';
            for (let si = 0; si < 6; si++) {
                let sx = Math.sin(si * 2.1 + r.x * 0.01) * hw * 0.6;
                let sy = Math.cos(si * 1.7 + r.y * 0.01) * hh * 0.6;
                ctx.globalAlpha = 0.3 + Math.sin(performance.now() * 0.003 + si) * 0.2;
                ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;

        } else if (r.style === 'metal_ramp') {
            // Shadow / support structure
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(-hw - 3, -hh - 3, r.w + 6, r.h + 6);
            ctx.fillStyle = '#444';
            ctx.fillRect(-hw - 2, hh - 4, r.w + 4, 4);
            ctx.fillRect(-hw + 10, hh * 0.4, 3, hh * 0.55);
            ctx.fillRect(hw - 13, hh * 0.4, 3, hh * 0.55);
            // Main plate
            ctx.fillStyle = '#888';
            ctx.beginPath(); ctx.roundRect(-hw, -hh, r.w, r.h, 3); ctx.fill();
            // Diamond plate texture
            ctx.strokeStyle = 'rgba(170,170,170,0.3)'; ctx.lineWidth = 0.5;
            for (let dx = -hw; dx < hw; dx += 8) {
                ctx.beginPath(); ctx.moveTo(dx, -hh); ctx.lineTo(dx + r.h, hh); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(dx, hh); ctx.lineTo(dx + r.h, -hh); ctx.stroke();
            }
            // Hazard stripes on edges
            ctx.save();
            ctx.beginPath(); ctx.roundRect(-hw, -hh, r.w, r.h, 3); ctx.clip();
            for (let s = -hw - hh; s < hw + hh; s += 12) {
                ctx.fillStyle = ((s / 12 | 0) % 2 === 0) ? 'rgba(220,180,30,0.6)' : 'rgba(30,30,30,0.4)';
                ctx.save(); ctx.translate(s, -hh); ctx.rotate(0.785);
                ctx.fillRect(-3, 0, 6, 10); ctx.restore();
                ctx.save(); ctx.translate(s, hh - 8); ctx.rotate(0.785);
                ctx.fillRect(-3, 0, 6, 10); ctx.restore();
            }
            ctx.restore();
            // Rivets
            ctx.fillStyle = '#aaa';
            ctx.beginPath(); ctx.arc(-hw + 6, -hh + 6, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(hw - 6, -hh + 6, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(-hw + 6, hh - 6, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(hw - 6, hh - 6, 2, 0, Math.PI * 2); ctx.fill();
            // Arrow chevrons
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            for (let ci = 0; ci < 3; ci++) {
                let cx = -10 + ci * 12;
                ctx.beginPath();
                ctx.moveTo(cx + 8, 0); ctx.lineTo(cx, -8); ctx.lineTo(cx + 3, -8);
                ctx.lineTo(cx + 11, 0); ctx.lineTo(cx + 3, 8); ctx.lineTo(cx, 8);
                ctx.closePath(); ctx.fill();
            }
            // Edge highlight
            ctx.strokeStyle = 'rgba(200,200,200,0.3)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(-hw, -hh, r.w, r.h, 3); ctx.stroke();

        } else if (r.style === 'wrecked_car') {
            // Crushed car body acting as ramp
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(-hw - 2, -hh - 2, r.w + 4, r.h + 4);
            // Crushed body
            ctx.fillStyle = '#664';
            ctx.beginPath(); ctx.roundRect(-hw, -hh, r.w, r.h, 3); ctx.fill();
            // Rust
            ctx.fillStyle = 'rgba(120,60,20,.35)';
            ctx.fillRect(-hw + 2, -hh + 2, r.w - 4, r.h - 4);
            // Hood (ramp surface)
            ctx.fillStyle = '#887';
            ctx.beginPath();
            ctx.moveTo(hw, -hh + 2); ctx.lineTo(hw, hh - 2);
            ctx.lineTo(hw * 0.3, hh * 0.6); ctx.lineTo(hw * 0.3, -hh * 0.6);
            ctx.closePath(); ctx.fill();
            // Cracked windshield
            ctx.fillStyle = 'rgba(100,150,180,.25)';
            ctx.fillRect(hw * 0.1, -hh * 0.7, r.w * 0.1, r.h * 0.7);
            ctx.strokeStyle = 'rgba(200,220,240,.3)'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(hw * 0.12, -hh * 0.5); ctx.lineTo(hw * 0.18, hh * 0.2); ctx.stroke();
            // Wheel wells
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.arc(-hw * 0.5, -hh, hh * 0.4, 0, Math.PI); ctx.fill();
            ctx.beginPath(); ctx.arc(-hw * 0.5, hh, hh * 0.4, Math.PI, 0); ctx.fill();
            // Dents
            ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(-hw * 0.3, -hh * 0.2); ctx.lineTo(0, hh * 0.1); ctx.stroke();
            // Tire marks on hood
            ctx.strokeStyle = 'rgba(30,30,30,.25)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(hw * 0.35, -hh * 0.2); ctx.lineTo(hw - 2, -hh * 0.25); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(hw * 0.35, hh * 0.2); ctx.lineTo(hw - 2, hh * 0.25); ctx.stroke();
            ctx.lineCap = 'butt';
            // Edge
            ctx.strokeStyle = 'rgba(200,180,140,.3)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(-hw, -hh, r.w, r.h, 3); ctx.stroke();
        }

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
        // Flowers (if flowering bush)
        if (b.flowers) {
            for (let f of b.flowers) {
                for (let p = 0; p < 5; p++) {
                    let pa = (p/5)*Math.PI*2;
                    ctx.fillStyle = f.color;
                    ctx.beginPath();
                    ctx.arc(b.x + f.dx + Math.cos(pa)*2.2, b.y + f.dy + Math.sin(pa)*2.2, f.r * 0.7, 0, Math.PI*2);
                    ctx.fill();
                }
                ctx.fillStyle = '#ff0';
                ctx.beginPath(); ctx.arc(b.x + f.dx, b.y + f.dy, f.r * 0.4, 0, Math.PI*2); ctx.fill();
            }
        }
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
    for (let o of obstacles) {
        if (o.type === 'boulder') {
            // Irregular rock shape
            ctx.fillStyle = 'rgba(0,0,0,.15)';
            ctx.beginPath(); ctx.ellipse(o.x + 3, o.y + 3, o.r, o.r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#8a7a6a';
            let s = o.seed || 0;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                let a = (i / 8) * Math.PI * 2;
                let wobble = 0.8 + Math.sin(s + i * 2.3) * 0.2;
                let px = o.x + Math.cos(a) * o.r * wobble;
                let py = o.y + Math.sin(a) * o.r * wobble;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.fill();
            // Dark facet
            ctx.fillStyle = 'rgba(0,0,0,.12)';
            ctx.beginPath();
            ctx.moveTo(o.x, o.y);
            for (let i = 3; i < 7; i++) {
                let a = (i / 8) * Math.PI * 2;
                let wobble = 0.8 + Math.sin(s + i * 2.3) * 0.2;
                ctx.lineTo(o.x + Math.cos(a) * o.r * wobble, o.y + Math.sin(a) * o.r * wobble);
            }
            ctx.closePath(); ctx.fill();
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,.1)';
            ctx.beginPath(); ctx.arc(o.x - o.r * 0.2, o.y - o.r * 0.2, o.r * 0.35, 0, Math.PI * 2); ctx.fill();
            // Crack
            ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(o.x - o.r * 0.2, o.y); ctx.lineTo(o.x + o.r * 0.15, o.y + o.r * 0.25); ctx.stroke();

        } else if (o.type === 'palm_trunk') {
            // Tree trunk (small circle)
            ctx.fillStyle = 'rgba(0,0,0,.2)';
            ctx.beginPath(); ctx.arc(o.x + 2, o.y + 2, o.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#8a6a3a';
            ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
            // Bark rings
            ctx.strokeStyle = 'rgba(60,40,15,.4)'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.7, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.4, 0, Math.PI * 2); ctx.stroke();

        } else {
            // Default pillar/column
            ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(o.x + 3, o.y + 3, o.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = o.color; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(o.x - o.r * .2, o.y - o.r * .2, o.r * .45, 0, Math.PI * 2); ctx.fill();
        }
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

    // Resolve dimensions from carType (if present) or use defaults
    let cw = (car.carType && car.carType.width) ? car.carType.width : CAR_W;
    let ch = (car.carType && car.carType.height) ? car.carType.height : CAR_H;
    let bodyStyle = (car.carType && car.carType.bodyStyle) ? car.carType.bodyStyle : 'sedan';

    // ── Airborne: draw ground shadow first ──
    let jumpH = 0, carScale = 1;
    if (car.airborne) {
        jumpH = jumpArc(car.jumpT) * car.jumpHeight;
        carScale = 1 + jumpH * 0.8;
        let shadowScale = 1 - jumpH * 0.15;
        let shadowOffX = jumpH * 12;
        let shadowOffY = jumpH * 18;
        ctx.save();
        ctx.translate(car.x + shadowOffX, car.y + shadowOffY);
        ctx.rotate(car.angle);
        ctx.globalAlpha = 0.25 - jumpH * 0.12;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(0, 0, cw / 2 * shadowScale, ch / 2 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    ctx.save();
    ctx.translate(car.x, car.y);
    if (car.airborne) ctx.scale(carScale, carScale);
    ctx.rotate(car.angle);

    // Power-up glow ring
    if (car.activePowerUp) {
        let puCols = { shield: '#44ffff', damage: '#ff4444', speed: '#ffff44', magnet: '#ff66ff' };
        let glowCol = puCols[car.activePowerUp] || '#fff';
        ctx.globalAlpha = 0.25 + Math.sin(performance.now()*0.008)*0.15;
        ctx.strokeStyle = glowCol; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(cw, ch) * 0.65, 0, Math.PI*2); ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Shadow — heavier vehicles get extra offset for taller look
    let shadowOff = (['suv','truck_heavy','warrig','pickup','schoolbus'].indexOf(bodyStyle) >= 0) ? 5 : 3;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-cw/2+shadowOff,-ch/2+shadowOff,cw,ch);

    let col = car.color;
    if (car.invincible>0 && (car.invincible/3|0)%2) col='#fff';

    // Body — compact/miata get rounder corners, bus gets sharper
    let cornerRadius = (bodyStyle === 'compact' || bodyStyle === 'miata') ? 8 : bodyStyle === 'schoolbus' ? 3 : 4;
    ctx.fillStyle=col;
    ctx.beginPath();ctx.roundRect(-cw/2,-ch/2,cw,ch,cornerRadius);ctx.fill();

    // Windshield — sport gets a slightly lower (narrower) windshield
    if (bodyStyle === 'sport') {
        ctx.fillStyle='rgba(100,180,255,.55)';ctx.fillRect(cw/2-14,-ch/2+5,8,ch-10);
    } else if (bodyStyle === 'schoolbus') {
        ctx.fillStyle='rgba(100,180,255,.55)';ctx.fillRect(cw/2-10,-ch/2+2,6,ch-4);
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
        // Diagonal racing stripe (clipped to body)
        ctx.save();
        ctx.beginPath(); ctx.roundRect(-cw/2, -ch/2, cw, ch, 4); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,.2)';
        ctx.beginPath();
        ctx.moveTo(-5, -ch/2); ctx.lineTo(10, -ch/2);
        ctx.lineTo(-5, ch/2); ctx.lineTo(-20, ch/2);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        // Number circle on roof
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center';
        ctx.fillText('7', 0.5, 2.5);
        // Wing spoiler — overlaps tail
        ctx.fillStyle = '#222';
        ctx.fillRect(-cw/2 - 3, -ch/2 - 1.5, 8, ch + 3);
        ctx.fillStyle = col;
        ctx.fillRect(-cw/2 - 4, -ch/2 - 3, 10, 3);
        ctx.fillRect(-cw/2 - 4, ch/2, 10, 3);
        ctx.fillStyle = '#555';
        ctx.fillRect(-cw/2 + 2, -ch/2 + 2, 2, 2);
        ctx.fillRect(-cw/2 + 2, ch/2 - 4, 2, 2);
        // Twin exhaust glow
        ctx.fillStyle = '#f80'; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(-cw/2 - 2, -4, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-cw/2 - 2, 4, 3, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#444';
        ctx.beginPath(); ctx.arc(-cw/2 - 1, -4, 1.8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-cw/2 - 1, 4, 1.8, 0, Math.PI*2); ctx.fill();

    } else if (bodyStyle === 'suv') {
        // Thick roof rack bars
        ctx.fillStyle = '#888';
        ctx.fillRect(-cw/4 - 1, -ch/2 - 2, cw/2 + 2, 2.5);
        ctx.fillRect(-cw/4 - 1, ch/2 - 0.5, cw/2 + 2, 2.5);
        // Cross bars
        ctx.fillRect(-cw/6 - 0.5, -ch/2 - 2, 2, ch + 4);
        ctx.fillRect(cw/6 - 0.5, -ch/2 - 2, 2, ch + 4);
        // Wider fenders
        ctx.fillStyle = 'rgba(0,0,0,.35)';
        ctx.fillRect(cw/2 - 5, -ch/2 - 1.5, 6, 2);
        ctx.fillRect(cw/2 - 5, ch/2 - 0.5, 6, 2);
        ctx.fillRect(-cw/2 - 1, -ch/2 - 1.5, 6, 2);
        ctx.fillRect(-cw/2 - 1, ch/2 - 0.5, 6, 2);

    } else if (bodyStyle === 'truck') {
        // Bull bar on front
        ctx.strokeStyle='rgba(200,200,200,.7)';ctx.lineWidth=2.5;
        ctx.beginPath();
        ctx.moveTo(cw/2 + 2, -ch/2 + 1);
        ctx.lineTo(cw/2 + 4, -ch/2 + 1);
        ctx.lineTo(cw/2 + 4, ch/2 - 1);
        ctx.lineTo(cw/2 + 2, ch/2 - 1);
        ctx.stroke();
        ctx.beginPath();ctx.moveTo(cw/2, 0);ctx.lineTo(cw/2 + 4, 0);ctx.stroke();

    } else if (bodyStyle === 'truck_heavy') {
        // Heavy filled ram bar
        ctx.fillStyle = '#999';
        ctx.fillRect(cw/2, -ch/2, 5, ch);
        ctx.fillStyle = '#bbb';
        ctx.fillRect(cw/2 + 1, -ch/2 + 1, 3, ch - 2);
        ctx.fillStyle = '#777';
        ctx.fillRect(cw/2, -2, 5, 4);
        // Exhaust stacks
        ctx.fillStyle = '#555';
        ctx.fillRect(-2, -ch/2 - 4, 3, 5);
        ctx.fillRect(-2, ch/2 - 1, 3, 5);
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(-0.5, -ch/2 - 4, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-0.5, ch/2 + 4, 1.5, 0, Math.PI*2); ctx.fill();
        // Smoke hint
        ctx.fillStyle = 'rgba(100,100,100,.3)';
        ctx.beginPath(); ctx.arc(-0.5, -ch/2 - 7, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-0.5, ch/2 + 7, 2.5, 0, Math.PI*2); ctx.fill();

    } else if (bodyStyle === 'warrig') {
        // Front plow (V-shaped)
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.moveTo(cw/2 + 7, 0);
        ctx.lineTo(cw/2, -ch/2 - 1);
        ctx.lineTo(cw/2, ch/2 + 1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(cw/2 + 6, 0);
        ctx.lineTo(cw/2 + 1, -ch/2 + 1);
        ctx.lineTo(cw/2 + 1, ch/2 - 1);
        ctx.closePath(); ctx.fill();
        // Warning stripes on rear bed
        ctx.save();
        ctx.beginPath(); ctx.rect(-cw/2, -ch/2, cw/3, ch); ctx.clip();
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        for (let i = -30; i < 30; i += 6) {
            ctx.save(); ctx.translate(i, 0); ctx.rotate(0.7);
            ctx.fillRect(-1.5, -20, 3, 40);
            ctx.restore();
        }
        ctx.restore();
        // Armor side plates
        ctx.fillStyle = 'rgba(80,80,80,.5)';
        ctx.fillRect(-cw/4, -ch/2 - 2, cw/2, 2.5);
        ctx.fillRect(-cw/4, ch/2 - 0.5, cw/2, 2.5);
        // Exhaust stacks
        ctx.fillStyle = '#555';
        ctx.fillRect(2, -ch/2 - 3, 2.5, 4);
        ctx.fillRect(2, ch/2 - 1, 2.5, 4);

    } else if (bodyStyle === 'compact') {
        // Cover default windshield & lights with body color
        ctx.fillStyle = col;
        ctx.fillRect(cw/2 - 15, -ch/2 + 2, 12, ch - 4);
        ctx.fillRect(-cw/2, -ch/2 + 1, 4, 5);
        ctx.fillRect(-cw/2, ch/2 - 6, 4, 5);
        // Dome windshield
        ctx.fillStyle = 'rgba(120,200,255,.5)';
        ctx.beginPath(); ctx.arc(4, 0, 8, -1.3, 1.3); ctx.fill();
        ctx.strokeStyle = 'rgba(200,240,255,.3)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.arc(4, 0, 8, -1.3, 1.3); ctx.stroke();
        // Round headlights
        ctx.fillStyle = '#ffa';
        ctx.beginPath(); ctx.arc(cw/2 - 1, -ch/2 + 4, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cw/2 - 1, ch/2 - 4, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cw/2, -ch/2 + 3.5, 1, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cw/2, ch/2 - 3.5, 1, 0, Math.PI*2); ctx.fill();
        // Round tail lights
        ctx.fillStyle = '#f44';
        ctx.beginPath(); ctx.arc(-cw/2 + 1, -ch/2 + 4, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-cw/2 + 1, ch/2 - 4, 2.5, 0, Math.PI*2); ctx.fill();
        // Racing number circle
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-2, 0, 4.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.font = 'bold 6px Arial'; ctx.textAlign = 'center';
        ctx.fillText('3', -1.5, 2.2);

    } else if (bodyStyle === 'miata') {
        // ── MIATA — cute, small, curved windshield, smile grille ──
        // Cover default windshield
        ctx.fillStyle = col;
        ctx.fillRect(cw/2 - 15, -ch/2 + 2, 10, ch - 4);
        // Small curved windshield
        ctx.fillStyle = 'rgba(120,200,255,.45)';
        ctx.beginPath(); ctx.arc(3, 0, 7, -1.2, 1.2); ctx.fill();
        // Soft-top (convertible) hint
        ctx.fillStyle = 'rgba(0,0,0,.15)';
        ctx.beginPath(); ctx.roundRect(-5, -ch/2 + 2, 10, ch - 4, 3); ctx.fill();
        // Cute smile grille
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cw/2 - 1, -ch/4);
        ctx.quadraticCurveTo(cw/2 + 2, 0, cw/2 - 1, ch/4);
        ctx.stroke();
        // Small round tail lights
        ctx.fillStyle = '#f44';
        ctx.beginPath(); ctx.arc(-cw/2 + 1, -ch/2 + 4, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-cw/2 + 1, ch/2 - 4, 2, 0, Math.PI*2); ctx.fill();
        // Exhaust
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(-cw/2 - 1, ch/3, 1.5, 0, Math.PI*2); ctx.fill();

    } else if (bodyStyle === 'pickup') {
        // ── RAM PICKUP — big grille, open bed, chrome bumper ──
        // Open truck bed (rear half darker)
        ctx.fillStyle = 'rgba(0,0,0,.2)';
        ctx.fillRect(-cw/2, -ch/2 + 2, cw * 0.4, ch - 4);
        // Bed rails
        ctx.fillStyle = '#777';
        ctx.fillRect(-cw/2 + 2, -ch/2 - 1, cw * 0.35, 1.5);
        ctx.fillRect(-cw/2 + 2, ch/2 - 0.5, cw * 0.35, 1.5);
        // Big chrome grille — bold vertical bars
        ctx.fillStyle = '#ccc';
        ctx.fillRect(cw/2, -ch/2 + 1, 3, ch - 2);
        ctx.fillStyle = '#999';
        for (let i = 0; i < 4; i++) {
            var gy = -ch/2 + 3 + i * ((ch - 6) / 4);
            ctx.fillRect(cw/2, gy, 3, 1.5);
        }
        // Chrome front bumper
        ctx.fillStyle = '#bbb';
        ctx.fillRect(cw/2 + 2, -ch/2 + 2, 2, ch - 4);
        // Tow hitch on rear
        ctx.fillStyle = '#666';
        ctx.fillRect(-cw/2 - 4, -2, 5, 4);
        ctx.fillStyle = '#888';
        ctx.fillRect(-cw/2 - 3, -1, 3, 2);
        // Running boards
        ctx.fillStyle = '#555';
        ctx.fillRect(-cw/6, -ch/2 - 1, cw/3, 1.5);
        ctx.fillRect(-cw/6, ch/2 - 0.5, cw/3, 1.5);
        // Exhaust tip
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(-cw/2 - 2, ch/4, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#555';
        ctx.beginPath(); ctx.arc(-cw/2 - 2, ch/4, 1.2, 0, Math.PI*2); ctx.fill();

    } else if (bodyStyle === 'cop') {
        // ── COP CAR — black & white livery, light bar, front bumper ──
        // White hood (front half)
        ctx.fillStyle = '#eee';
        ctx.save();
        ctx.beginPath(); ctx.roundRect(-cw/2, -ch/2, cw, ch, 4); ctx.clip();
        ctx.fillRect(2, -ch/2, cw/2, ch);
        ctx.restore();
        // Black stripe down center of hood
        ctx.fillStyle = '#1a1a2e';
        ctx.save();
        ctx.beginPath(); ctx.roundRect(-cw/2, -ch/2, cw, ch, 4); ctx.clip();
        ctx.fillRect(6, -4.5, cw/2 - 6, 9);
        ctx.restore();
        // Police star on hood
        ctx.save();
        ctx.translate(cw/4 + 2, 0);
        ctx.fillStyle = '#cc9900'; ctx.globalAlpha = 0.7;
        var sr = 3.2, sp = 5;
        ctx.beginPath();
        for (var si = 0; si < sp * 2; si++) {
            var sa = -Math.PI/2 + si * Math.PI / sp;
            var sd = si % 2 === 0 ? sr : sr * 0.45;
            if (si === 0) ctx.moveTo(Math.cos(sa)*sd, Math.sin(sa)*sd);
            else ctx.lineTo(Math.cos(sa)*sd, Math.sin(sa)*sd);
        }
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        // Door line
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(2, -ch/2 + 1); ctx.lineTo(2, ch/2 - 1); ctx.stroke();
        // Front bumper bar
        ctx.fillStyle = '#999';
        ctx.fillRect(cw/2, -ch/2 + 1, 3, ch - 2);
        ctx.fillStyle = '#bbb';
        ctx.fillRect(cw/2 + 2, -ch/2 + 2, 2, ch - 4);
        // Light bar on roof
        var lightPhase = (performance.now() * 0.006) % (Math.PI * 2);
        // Left light (red)
        ctx.fillStyle = Math.sin(lightPhase) > 0 ? '#ff2222' : '#881111';
        ctx.beginPath(); ctx.arc(-2, -ch/2 - 2, 2.5, 0, Math.PI * 2); ctx.fill();
        // Right light (blue)
        ctx.fillStyle = Math.sin(lightPhase) > 0 ? '#1144aa' : '#2266ff';
        ctx.beginPath(); ctx.arc(-2, ch/2 + 2, 2.5, 0, Math.PI * 2); ctx.fill();
        // Light bar base
        ctx.fillStyle = '#444';
        ctx.fillRect(-5, -ch/2 - 0.5, 6, ch + 1);
        // Badge/shield on door
        ctx.fillStyle = '#cc9900'; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(-5, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

    } else if (bodyStyle === 'schoolbus') {
        // ── SCHOOL BUS — long, flat, iconic ──
        // Window row — many small windows
        ctx.fillStyle = 'rgba(100,180,255,.45)';
        for (let i = 0; i < 7; i++) {
            var wx = -cw/2 + 10 + i * (cw - 20) / 7;
            ctx.fillRect(wx, -ch/2 + 2, 4, 3);
            ctx.fillRect(wx, ch/2 - 5, 4, 3);
        }
        // Window dividers
        ctx.fillStyle = '#222';
        for (let i = 0; i <= 7; i++) {
            var wx = -cw/2 + 9 + i * (cw - 20) / 7;
            ctx.fillRect(wx, -ch/2 + 1.5, 1, 4);
            ctx.fillRect(wx, ch/2 - 5.5, 1, 4);
        }
        // Black bumpers
        ctx.fillStyle = '#222';
        ctx.fillRect(cw/2, -ch/2 + 1, 3, ch - 2);
        ctx.fillRect(-cw/2 - 2, -ch/2 + 1, 3, ch - 2);
        // STOP sign arm (folded)
        ctx.fillStyle = '#d00';
        ctx.fillRect(cw/4, -ch/2 - 3, 8, 3);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 2.5px Arial'; ctx.textAlign = 'center';
        ctx.fillText('STOP', cw/4 + 4, -ch/2 - 1);
        // Red flashing lights
        ctx.fillStyle = '#f22';
        ctx.beginPath(); ctx.arc(cw/2 - 4, -ch/2 - 0.5, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cw/2 - 4, ch/2 + 0.5, 2, 0, Math.PI*2); ctx.fill();
        // Amber side markers
        ctx.fillStyle = '#fa0'; ctx.globalAlpha = 0.8;
        ctx.fillRect(0, -ch/2 - 0.5, 3, 1.5);
        ctx.fillRect(0, ch/2 - 1, 3, 1.5);
        ctx.fillRect(-cw/4, -ch/2 - 0.5, 3, 1.5);
        ctx.fillRect(-cw/4, ch/2 - 1, 3, 1.5);
        ctx.globalAlpha = 1;
        // Rear emergency door
        ctx.strokeStyle = '#222'; ctx.lineWidth = 0.8;
        ctx.strokeRect(-cw/2 + 1, -ch/4, 5, ch/2);
        // Roof tint
        ctx.fillStyle = 'rgba(0,0,0,.1)';
        ctx.fillRect(-cw/3, -ch/2 + 4, cw * 0.6, ch - 8);
    }

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
    // Infected glow
    if (car.infected) {
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.sin(performance.now() * 0.008) * 0.15;
        ctx.fillStyle = '#33ff33';
        ctx.beginPath(); ctx.arc(car.x, car.y, 28, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // Team indicator dot above health bar
    if (car.team && typeof TEAM_COLORS !== 'undefined') {
        ctx.fillStyle = TEAM_COLORS[car.team] || '#fff';
        ctx.beginPath(); ctx.arc(car.x, car.y - 37, 4, 0, Math.PI * 2); ctx.fill();
    }

    let bw=32,bh=3,bx=car.x-bw/2,by=car.y-31;
    ctx.fillStyle='#333';ctx.fillRect(bx,by,bw,bh);
    let hp=car.health/car.maxHealth;
    ctx.fillStyle=hp>.5?'#4f4':hp>.25?'#ff4':'#f44';
    ctx.fillRect(bx,by,bw*hp,bh);
}

function drawBreakables() {
    for (let b of breakables) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        let dmgFade = b.hp / b.maxHp;

        if (b.type === 'trolley') {
            ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-6, -3, 16, 10);
            ctx.strokeStyle = 'rgba(170,170,170,' + (0.5 + dmgFade * 0.5) + ')';
            ctx.lineWidth = 1.5; ctx.strokeRect(-8, -5, 16, 10);
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();
            ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-8, -3); ctx.lineTo(-12, -3); ctx.lineTo(-12, 3); ctx.lineTo(-8, 3); ctx.stroke();
            ctx.fillStyle = '#333';
            [[-6,-6],[6,-6],[-6,6],[6,6]].forEach(function(p){ ctx.beginPath(); ctx.arc(p[0],p[1],2,0,Math.PI*2); ctx.fill(); });

        } else if (b.type === 'bin') {
            ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.arc(2, 2, b.r, 0, Math.PI*2); ctx.fill();
            let g = Math.round(68 * dmgFade);
            ctx.fillStyle = 'rgb(' + (50*dmgFade|0) + ',' + (g+20) + ',' + (50*dmgFade|0) + ')';
            ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#667766'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = '#556655'; ctx.beginPath(); ctx.arc(0, 0, b.r*0.65, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#889'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.stroke();

        } else if (b.type === 'crate') {
            ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(-10, -10, 24, 24);
            ctx.fillStyle = 'rgb(' + (138*dmgFade|0) + ',' + (106*dmgFade|0) + ',' + (58*dmgFade|0) + ')';
            ctx.fillRect(-12, -12, 24, 24);
            ctx.strokeStyle = 'rgba(60,40,15,.4)'; ctx.lineWidth = 0.7;
            for (let i = -10; i < 12; i += 4) { ctx.beginPath(); ctx.moveTo(i, -12); ctx.lineTo(i, 12); ctx.stroke(); }
            ctx.fillStyle = 'rgba(100,70,30,' + (0.5+dmgFade*0.3) + ')';
            ctx.fillRect(-13, -2, 26, 4); ctx.fillRect(-2, -13, 4, 26);
            ctx.fillStyle = '#bbb';
            [[-10,-10],[10,-10],[-10,10],[10,10]].forEach(function(p){ ctx.beginPath(); ctx.arc(p[0],p[1],1,0,Math.PI*2); ctx.fill(); });

        } else if (b.type === 'barrel') {
            ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.arc(2, 2, 14, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgb(' + (195*dmgFade|0) + ',' + (50*dmgFade|0) + ',' + (50*dmgFade|0) + ')';
            ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI*2); ctx.stroke();
            ctx.strokeStyle = '#777'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = '#fa0';
            ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(6, 3); ctx.lineTo(-6, 3); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#111'; ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center'; ctx.fillText('!', 0, 2);
            ctx.fillStyle = '#999'; ctx.beginPath(); ctx.arc(4, -4, 2.5, 0, Math.PI*2); ctx.fill();

        } else if (b.type === 'pallet') {
            ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(-11, -8, 26, 20);
            ctx.fillStyle = 'rgb(' + (106*dmgFade|0) + ',' + (80*dmgFade|0) + ',' + (48*dmgFade|0) + ')';
            ctx.fillRect(-14, -10, 28, 5); ctx.fillRect(-14, -5, 28, 5);
            ctx.fillStyle = 'rgb(' + (122*dmgFade|0) + ',' + (90*dmgFade|0) + ',' + (56*dmgFade|0) + ')';
            ctx.fillRect(-12, 0, 26, 5); ctx.fillRect(-12, 5, 26, 5);
            ctx.fillStyle = 'rgb(' + (90*dmgFade|0) + ',' + (64*dmgFade|0) + ',' + (40*dmgFade|0) + ')';
            ctx.fillRect(-14, -10, 3, 20); ctx.fillRect(11, -10, 3, 20); ctx.fillRect(-1, -10, 3, 20);

        } else if (b.type === 'bench') {
            ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(-16, -6, 36, 16);
            ctx.fillStyle = '#555'; ctx.fillRect(-14, -6, 3, 14); ctx.fillRect(11, -6, 3, 14);
            ctx.fillStyle = 'rgb(' + (138*dmgFade|0) + ',' + (106*dmgFade|0) + ',' + (58*dmgFade|0) + ')';
            for (let i = 0; i < 4; i++) ctx.fillRect(-16, -4 + i * 3.5, 32, 2.5);

        } else if (b.type === 'tire_stack') {
            ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.arc(2, 2, 15, 0, Math.PI*2); ctx.fill();
            let positions = [[0,0],[-5,-5],[5,-5],[5,5],[-5,5]];
            positions.forEach(function(p) {
                ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, Math.PI*2); ctx.stroke();
                ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, Math.PI*2); ctx.fill();
            });

        } else if (b.type === 'hay') {
            ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.arc(2, 2, 16, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgb(' + (200*dmgFade|0) + ',' + (160*dmgFade|0) + ',' + (64*dmgFade|0) + ')';
            ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = 'rgba(160,120,40,.35)'; ctx.lineWidth = 0.8;
            for (let r = 4; r < 14; r += 3) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.stroke(); }
            // Straw wisps
            ctx.strokeStyle = '#d8b050'; ctx.lineWidth = 1.2;
            for (let i = 0; i < 6; i++) {
                let a = (i/6)*Math.PI*2;
                ctx.beginPath(); ctx.moveTo(Math.cos(a)*13, Math.sin(a)*13);
                ctx.lineTo(Math.cos(a)*18, Math.sin(a)*18); ctx.stroke();
            }
            ctx.strokeStyle = '#8a6a20'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, 15, -0.5, 0.5); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 15, 2.6, 3.6); ctx.stroke();

        } else if (b.type === 'container') {
            ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-26, -13, 56, 30);
            ctx.fillStyle = 'rgb(' + (34*dmgFade|0) + ',' + (102*dmgFade|0) + ',' + (170*dmgFade|0) + ')';
            ctx.fillRect(-28, -14, 56, 28);
            // Corrugation
            ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 0.6;
            for (let i = -26; i < 28; i += 3) { ctx.beginPath(); ctx.moveTo(i, -14); ctx.lineTo(i, 14); ctx.stroke(); }
            // Door end
            ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(22, -14, 6, 28);
            ctx.fillStyle = '#888'; ctx.fillRect(24, -5, 2, 3); ctx.fillRect(24, 2, 2, 3);
            // Edge frame
            ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5; ctx.strokeRect(-28, -14, 56, 28);
            // Corner castings
            ctx.fillStyle = '#555';
            [[-28,-14],[-28,10],[24,-14],[24,10]].forEach(function(p){ ctx.fillRect(p[0], p[1], 4, 4); });
        }

        ctx.restore();
    }
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

// ── Palm Fronds — drawn AFTER cars so canopy overlaps ──
function drawPalmFronds() {
    for (var i = 0; i < palmTrees.length; i++) {
        var pt = palmTrees[i];
        ctx.save();
        ctx.translate(pt.x, pt.y);
        for (var f = 0; f < pt.fronds.length; f++) {
            var fr = pt.fronds[f];
            ctx.save();
            ctx.rotate(fr.angle);
            // Frond leaf shape — tapered bezier
            var green = Math.round(80 + fr.shade * 60);
            ctx.fillStyle = 'rgba(40,' + green + ',25,0.85)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(fr.len * 0.3, -fr.width * 0.5,
                              fr.len * 0.7, -fr.width * 0.35,
                              fr.len, 0);
            ctx.bezierCurveTo(fr.len * 0.7, fr.width * 0.35,
                              fr.len * 0.3, fr.width * 0.5,
                              0, 0);
            ctx.fill();
            // Central vein
            ctx.strokeStyle = 'rgba(30,60,15,0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(2, 0);
            ctx.lineTo(fr.len * 0.9, 0);
            ctx.stroke();
            // Leaf segments — small lines off the vein
            for (var s = 0.2; s < 0.85; s += 0.15) {
                var sx = fr.len * s;
                var leafW = fr.width * 0.3 * (1 - Math.abs(s - 0.5));
                ctx.strokeStyle = 'rgba(50,' + Math.round(green * 0.9) + ',30,0.4)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(sx, 0);
                ctx.lineTo(sx + 3, -leafW);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(sx, 0);
                ctx.lineTo(sx + 3, leafW);
                ctx.stroke();
            }
            ctx.restore();
        }
        // Center coconut cluster
        ctx.fillStyle = '#6b5a2e';
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7a6832';
        ctx.beginPath(); ctx.arc(-2, -2, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(2, -1, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 2, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}
