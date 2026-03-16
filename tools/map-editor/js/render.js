// ================================================================
//  MAP EDITOR — Canvas rendering
// ================================================================

function renderCanvas() {
    var c = editorCanvas, ctx = editorCtx;
    if (!c || !ctx || !editorMap) return;
    var w = c.width, h = c.height;

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(view.panX, view.panY);
    ctx.scale(view.zoom, view.zoom);

    var aw = editorMap.arenaWidth;
    var ah = editorMap.arenaHeight;

    // Arena background
    ctx.fillStyle = editorMap.backgroundColor || '#4a6e2a';
    ctx.fillRect(0, 0, aw, ah);

    // Grid
    if (showGrid) drawGrid(ctx, aw, ah);

    // Surfaces (below everything)
    drawSurfaces(ctx);

    // Roads
    drawRoads(ctx);

    // Objects
    drawObjects(ctx);

    // Spawn point
    drawSpawnPoint(ctx);

    // Arena border
    ctx.strokeStyle = COLOR_ARENA_BORDER;
    ctx.lineWidth = 2 / view.zoom;
    ctx.setLineDash([10 / view.zoom, 6 / view.zoom]);
    ctx.strokeRect(0, 0, aw, ah);
    ctx.setLineDash([]);

    // Road drawing preview
    if (roadDrawState && roadDrawState.points.length > 0) {
        drawRoadPreview(ctx);
    }

    // Wall drawing preview
    if (wallDrawState && wallDrawState.isDrawing) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 4 / view.zoom;
        ctx.beginPath();
        ctx.moveTo(wallDrawState.x1, wallDrawState.y1);
        ctx.lineTo(mouseWX, mouseWY);
        ctx.stroke();
    }

    // Selection box
    if (selectBoxStart && selectBoxEnd) {
        ctx.strokeStyle = COLOR_SELECTION;
        ctx.lineWidth = 1 / view.zoom;
        ctx.setLineDash([4 / view.zoom, 4 / view.zoom]);
        var bx = Math.min(selectBoxStart.wx, selectBoxEnd.wx);
        var by = Math.min(selectBoxStart.wy, selectBoxEnd.wy);
        var bw = Math.abs(selectBoxEnd.wx - selectBoxStart.wx);
        var bh = Math.abs(selectBoxEnd.wy - selectBoxStart.wy);
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(255,110,180,0.08)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.setLineDash([]);
    }

    ctx.restore();

    // Status bar update
    updateStatusBar();
}

function drawGrid(ctx, aw, ah) {
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1 / view.zoom;
    ctx.beginPath();
    for (var x = 0; x <= aw; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ah);
    }
    for (var y = 0; y <= ah; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(aw, y);
    }
    ctx.stroke();
}

function drawSurfaces(ctx) {
    for (var i = 0; i < editorSurfaces.length; i++) {
        var s = editorSurfaces[i];
        var st = SURFACE_TYPES[s.type];
        if (!st) continue;
        var isSelected = selection.indexOf(s._id) >= 0;

        ctx.save();
        ctx.globalAlpha = 0.5;

        if (s.type === 'oil' && s.rx && s.ry) {
            // Ellipse
            ctx.translate(s.x, s.y);
            ctx.rotate(s.angle || 0);
            ctx.fillStyle = st.editorFill;
            ctx.beginPath();
            ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2);
            ctx.fill();
            if (isSelected) {
                ctx.strokeStyle = COLOR_SELECTION;
                ctx.lineWidth = 2 / view.zoom;
                ctx.stroke();
            }
        } else {
            ctx.fillStyle = st.editorFill;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
            if (isSelected) {
                ctx.strokeStyle = COLOR_SELECTION;
                ctx.lineWidth = 2 / view.zoom;
                ctx.stroke();
            }
        }

        // Surface label
        ctx.globalAlpha = 1;
        var slabel = st.label;
        var sfontSize = Math.max(9, Math.min(13, 11 / view.zoom));
        ctx.font = 'bold ' + sfontSize + 'px Arial';
        ctx.textAlign = 'center';
        var stw = ctx.measureText(slabel).width;
        var spx = 4 / view.zoom, spy = 2 / view.zoom;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        roundedRect(ctx, s.x - stw / 2 - spx, s.y - sfontSize * 0.4 - spy, stw + spx * 2, sfontSize + spy * 2, 3 / view.zoom);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(slabel, s.x, s.y + sfontSize * 0.4);

        ctx.restore();
    }
}

function drawRoads(ctx) {
    // Radial roads
    if (editorMap.roadLayout === 'radial' && editorMap.radialRoads) {
        var rr = editorMap.radialRoads;
        var cx = editorMap.arenaWidth / 2;
        var cy = editorMap.arenaHeight / 2;
        ctx.fillStyle = 'rgba(100,100,100,0.6)';
        ctx.beginPath();
        ctx.arc(cx, cy, rr.centerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100,100,100,0.6)';
        ctx.lineWidth = rr.roadWidth;
        ctx.lineCap = 'round';
        for (var i = 0; i < rr.roadCount; i++) {
            var a = rr.startAngle + (i / rr.roadCount) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * rr.roadLength, cy + Math.sin(a) * rr.roadLength);
            ctx.stroke();
        }
    }

    // Curvy roads
    for (var ri = 0; ri < editorMap.curvyRoads.length; ri++) {
        var road = editorMap.curvyRoads[ri];
        if (!road.points || road.points.length < 2) continue;
        var isSelected = selection.indexOf('road-' + ri) >= 0;

        // Road fill
        ctx.strokeStyle = road.color || 'rgba(100,100,100,0.6)';
        ctx.lineWidth = road.width || 60;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(road.points[0].x, road.points[0].y);
        for (var i = 1; i < road.points.length; i++) {
            ctx.lineTo(road.points[i].x, road.points[i].y);
        }
        ctx.stroke();

        // Edge lines
        if (road.edgeColor) {
            ctx.strokeStyle = road.edgeColor;
            ctx.lineWidth = (road.width || 60) + 4;
            ctx.beginPath();
            ctx.moveTo(road.points[0].x, road.points[0].y);
            for (var i = 1; i < road.points.length; i++) {
                ctx.lineTo(road.points[i].x, road.points[i].y);
            }
            ctx.stroke();
            // Re-draw road on top
            ctx.strokeStyle = road.color || 'rgba(100,100,100,0.6)';
            ctx.lineWidth = road.width || 60;
            ctx.beginPath();
            ctx.moveTo(road.points[0].x, road.points[0].y);
            for (var i = 1; i < road.points.length; i++) {
                ctx.lineTo(road.points[i].x, road.points[i].y);
            }
            ctx.stroke();
        }

        // Selection highlight + waypoints
        if (isSelected) {
            ctx.strokeStyle = COLOR_SELECTION;
            ctx.lineWidth = 2 / view.zoom;
            ctx.setLineDash([6 / view.zoom, 4 / view.zoom]);
            ctx.beginPath();
            ctx.moveTo(road.points[0].x, road.points[0].y);
            for (var i = 1; i < road.points.length; i++) {
                ctx.lineTo(road.points[i].x, road.points[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw waypoints
            for (var i = 0; i < road.points.length; i++) {
                var p = road.points[i];
                ctx.fillStyle = i === 0 ? '#4f4' : i === road.points.length - 1 ? '#f44' : COLOR_SELECTION;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6 / view.zoom, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1 / view.zoom;
                ctx.stroke();
            }
        }

        // Road label at midpoint
        var midIdx = Math.floor(road.points.length / 2);
        var mp = road.points[midIdx];
        var rlabel = 'Road #' + ri + ' (' + (road.surface || 'tarmac') + ', w:' + (road.width || 60) + ')';
        var rfontSize = Math.max(9, Math.min(13, 11 / view.zoom));
        ctx.font = 'bold ' + rfontSize + 'px Arial';
        ctx.textAlign = 'center';
        var rtw = ctx.measureText(rlabel).width;
        var rpx = 4 / view.zoom, rpy = 2 / view.zoom;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        roundedRect(ctx, mp.x - rtw / 2 - rpx, mp.y - rfontSize * 0.4 - rpy - (road.width || 60) / 2 - 10 / view.zoom, rtw + rpx * 2, rfontSize + rpy * 2, 3 / view.zoom);
        ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.fillText(rlabel, mp.x, mp.y + rfontSize * 0.4 - (road.width || 60) / 2 - 10 / view.zoom);
    }
}

function drawRoadPreview(ctx) {
    var pts = roadDrawState.points;
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = (roadDrawState.width || 60);
    ctx.globalAlpha = 0.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }
    // Preview line to cursor
    ctx.lineTo(mouseWX, mouseWY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Waypoint dots
    for (var i = 0; i < pts.length; i++) {
        ctx.fillStyle = i === 0 ? '#4f4' : COLOR_HOVER;
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 5 / view.zoom, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawObjects(ctx) {
    for (var i = 0; i < editorObjects.length; i++) {
        var obj = editorObjects[i];
        var def = OBJECT_TYPES[obj.type];
        if (!def) continue;
        var isSelected = selection.indexOf(obj._id) >= 0;
        var isHovered = hoverTarget && hoverTarget.type === 'object' && hoverTarget.id === obj._id;

        ctx.save();

        if (def.shape === 'circle' || def.shape === 'bush' || def.shape === 'palm') {
            var r = obj.r || def.fixedR || def.defaultR || 15;
            ctx.fillStyle = def.color;
            if (def.shape === 'bush') {
                // Multiple green circles
                ctx.globalAlpha = 0.7;
                for (var li = 0; li < 4; li++) {
                    var lx = obj.x + (Math.sin(li * 2.1) * r * 0.5);
                    var ly = obj.y + (Math.cos(li * 2.7) * r * 0.5);
                    ctx.beginPath();
                    ctx.arc(lx, ly, r * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            } else if (def.shape === 'palm') {
                // Trunk dot
                ctx.fillStyle = '#8a6a3a';
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, 5, 0, Math.PI * 2);
                ctx.fill();
                // Frond suggestions
                ctx.fillStyle = '#2a8a2a';
                ctx.globalAlpha = 0.5;
                for (var fi = 0; fi < 5; fi++) {
                    var fa = (fi / 5) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.ellipse(obj.x + Math.cos(fa) * 18, obj.y + Math.sin(fa) * 18, 14, 6, fa, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                r = 25; // hit area
            } else {
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, r, 0, Math.PI * 2);
                ctx.fill();
            }

            // Selection/hover outline
            if (isSelected || isHovered) {
                ctx.strokeStyle = isSelected ? COLOR_SELECTION : COLOR_HOVER;
                ctx.lineWidth = 2 / view.zoom;
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, r + 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (def.shape === 'square') {
            var r = obj.r || def.fixedR || 14;
            ctx.fillStyle = def.color;
            ctx.save();
            ctx.translate(obj.x, obj.y);
            ctx.rotate(obj.angle || 0);
            ctx.fillRect(-r, -r, r * 2, r * 2);
            ctx.restore();
            if (isSelected || isHovered) {
                ctx.strokeStyle = isSelected ? COLOR_SELECTION : COLOR_HOVER;
                ctx.lineWidth = 2 / view.zoom;
                ctx.save();
                ctx.translate(obj.x, obj.y);
                ctx.rotate(obj.angle || 0);
                ctx.strokeRect(-r - 2, -r - 2, r * 2 + 4, r * 2 + 4);
                ctx.restore();
            }
        } else if (def.shape === 'rect') {
            var rw = obj.w || def.w || 40;
            var rh = obj.h || def.h || 20;
            ctx.fillStyle = def.color;
            ctx.save();
            ctx.translate(obj.x, obj.y);
            ctx.rotate(obj.angle || 0);
            ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
            ctx.restore();
            if (isSelected || isHovered) {
                ctx.strokeStyle = isSelected ? COLOR_SELECTION : COLOR_HOVER;
                ctx.lineWidth = 2 / view.zoom;
                ctx.save();
                ctx.translate(obj.x, obj.y);
                ctx.rotate(obj.angle || 0);
                ctx.strokeRect(-rw / 2 - 2, -rh / 2 - 2, rw + 4, rh + 4);
                ctx.restore();
            }
        } else if (def.shape === 'ramp') {
            var rw = obj.w || def.defaultW || 130;
            var rh = obj.h || def.defaultH || 65;
            ctx.save();
            ctx.translate(obj.x, obj.y);
            ctx.rotate(obj.angle || 0);
            // Ramp body
            ctx.fillStyle = def.color;
            ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
            // Arrow
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.moveTo(rw / 2 - 5, 0);
            ctx.lineTo(rw / 4, -rh / 4);
            ctx.lineTo(rw / 4, rh / 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            if (isSelected || isHovered) {
                ctx.strokeStyle = isSelected ? COLOR_SELECTION : COLOR_HOVER;
                ctx.lineWidth = 2 / view.zoom;
                ctx.save();
                ctx.translate(obj.x, obj.y);
                ctx.rotate(obj.angle || 0);
                ctx.strokeRect(-rw / 2 - 2, -rh / 2 - 2, rw + 4, rh + 4);
                ctx.restore();
            }
        } else if (def.shape === 'bump') {
            var r = obj.r || def.defaultR || 15;
            ctx.save();
            ctx.translate(obj.x, obj.y);
            ctx.rotate(obj.angle || 0);
            ctx.fillStyle = def.color;
            ctx.fillRect(-r * 2, -r / 2, r * 4, r);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1 / view.zoom;
            ctx.setLineDash([3 / view.zoom, 3 / view.zoom]);
            ctx.strokeRect(-r * 2, -r / 2, r * 4, r);
            ctx.setLineDash([]);
            ctx.restore();
            if (isSelected || isHovered) {
                ctx.strokeStyle = isSelected ? COLOR_SELECTION : COLOR_HOVER;
                ctx.lineWidth = 2 / view.zoom;
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, r * 2 + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (def.shape === 'line') {
            // Wall
            ctx.strokeStyle = def.color;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(obj.x, obj.y);
            ctx.lineTo(obj.x2 || obj.x + 100, obj.y2 || obj.y);
            ctx.stroke();
            if (isSelected || isHovered) {
                ctx.strokeStyle = isSelected ? COLOR_SELECTION : COLOR_HOVER;
                ctx.lineWidth = 2 / view.zoom;
                ctx.setLineDash([4 / view.zoom, 4 / view.zoom]);
                ctx.beginPath();
                ctx.moveTo(obj.x, obj.y);
                ctx.lineTo(obj.x2 || obj.x + 100, obj.y2 || obj.y);
                ctx.stroke();
                ctx.setLineDash([]);
                // Endpoint dots
                ctx.fillStyle = COLOR_SELECTION;
                ctx.beginPath(); ctx.arc(obj.x, obj.y, 5 / view.zoom, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(obj.x2 || obj.x + 100, obj.y2 || obj.y, 5 / view.zoom, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Label — always visible, bold, with background
        var labelText = def.label;
        var fontSize = Math.max(9, Math.min(13, 11 / view.zoom));
        ctx.font = 'bold ' + fontSize + 'px Arial';
        ctx.textAlign = 'center';
        var labelY = obj.y + (obj.r || def.fixedR || def.defaultR || 20) + (14 / view.zoom);
        if (def.shape === 'line') labelY = ((obj.y + (obj.y2 || obj.y)) / 2) - (12 / view.zoom);
        if (def.shape === 'ramp' || def.shape === 'bump') labelY = obj.y + (obj.h || def.defaultH || 40) / 2 + (14 / view.zoom);
        // Background pill
        var tw = ctx.measureText(labelText).width;
        var px = 4 / view.zoom, py = 2 / view.zoom;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        roundedRect(ctx, obj.x - tw / 2 - px, labelY - fontSize * 0.8 - py, tw + px * 2, fontSize + py * 2, 3 / view.zoom);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(labelText, obj.x, labelY);

        ctx.restore();
    }
}

function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function drawSpawnPoint(ctx) {
    var sx = editorMap.spawnCenterX;
    var sy = editorMap.spawnCenterY;
    var sr = editorMap.spawnRadius;

    // Spawn radius circle
    ctx.strokeStyle = COLOR_SPAWN;
    ctx.lineWidth = 2 / view.zoom;
    ctx.setLineDash([8 / view.zoom, 4 / view.zoom]);
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosshair
    var ch = 20 / view.zoom;
    ctx.strokeStyle = COLOR_SPAWN;
    ctx.lineWidth = 2 / view.zoom;
    ctx.beginPath();
    ctx.moveTo(sx - ch, sy); ctx.lineTo(sx + ch, sy);
    ctx.moveTo(sx, sy - ch); ctx.lineTo(sx, sy + ch);
    ctx.stroke();

    // Label
    ctx.fillStyle = COLOR_SPAWN;
    ctx.font = 'bold ' + (11 / view.zoom) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPAWN', sx, sy - ch - 4 / view.zoom);
}

function updateStatusBar() {
    var pos = document.getElementById('status-pos');
    var counts = document.getElementById('status-counts');
    if (pos) pos.textContent = 'Mouse: (' + Math.round(mouseWX) + ', ' + Math.round(mouseWY) + ')';
    if (counts) counts.textContent = 'Objects: ' + editorObjects.length + '  Surfaces: ' + editorSurfaces.length + '  Roads: ' + editorMap.curvyRoads.length;
}
