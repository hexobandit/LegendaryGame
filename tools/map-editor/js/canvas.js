// ================================================================
//  MAP EDITOR — Canvas: pan, zoom, coordinate transforms, grid
// ================================================================

function initCanvas() {
    editorCanvas = document.getElementById('editor-canvas');
    editorCtx = editorCanvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    var container = editorCanvas.parentElement;
    editorCanvas.width = container.clientWidth;
    editorCanvas.height = container.clientHeight;
    requestRender();
}

// ── Coordinate transforms ──

function screenToWorld(sx, sy) {
    return {
        x: (sx - view.panX) / view.zoom,
        y: (sy - view.panY) / view.zoom,
    };
}

function worldToScreen(wx, wy) {
    return {
        x: wx * view.zoom + view.panX,
        y: wy * view.zoom + view.panY,
    };
}

// ── Zoom ──

function zoomAt(sx, sy, factor) {
    var before = screenToWorld(sx, sy);
    view.zoom *= factor;
    view.zoom = Math.max(0.05, Math.min(4, view.zoom));
    var after = screenToWorld(sx, sy);
    view.panX += (after.x - before.x) * view.zoom;
    view.panY += (after.y - before.y) * view.zoom;
    requestRender();
}

function fitToArena() {
    if (!editorMap) return;
    var cw = editorCanvas.width;
    var ch = editorCanvas.height;
    var padding = 60;
    var zx = (cw - padding * 2) / editorMap.arenaWidth;
    var zy = (ch - padding * 2) / editorMap.arenaHeight;
    view.zoom = Math.min(zx, zy);
    view.panX = (cw - editorMap.arenaWidth * view.zoom) / 2;
    view.panY = (ch - editorMap.arenaHeight * view.zoom) / 2;
    requestRender();
}

// ── Pan ──

function startPan(sx, sy) {
    view.isPanning = true;
    view.panStartX = sx;
    view.panStartY = sy;
    view.panStartPanX = view.panX;
    view.panStartPanY = view.panY;
}

function updatePan(sx, sy) {
    if (!view.isPanning) return;
    view.panX = view.panStartPanX + (sx - view.panStartX);
    view.panY = view.panStartPanY + (sy - view.panStartY);
    requestRender();
}

function endPan() {
    view.isPanning = false;
}

// ── Grid snapping ──

function snapToGrid(x, y) {
    if (!snapToGridEnabled) return { x: x, y: y };
    return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
    };
}

// ── Render request (coalesced) ──

function requestRender() {
    if (renderRequested) return;
    renderRequested = true;
    requestAnimationFrame(function() {
        renderRequested = false;
        renderCanvas();
    });
}
