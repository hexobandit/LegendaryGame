// ================================================================
//  MAP EDITOR — Main init, event wiring, keyboard shortcuts
// ================================================================

function initEditor() {
    // Try loading autosave
    if (!loadAutosave()) {
        editorMap = JSON.parse(JSON.stringify(DEFAULT_MAP));
    }

    initCanvas();
    buildPalette();
    buildMapSettings();
    refreshPropertiesPanel();
    updateUndoButtons();
    fitToArena();

    // Canvas events
    editorCanvas.addEventListener('mousedown', onCanvasMouseDown);
    editorCanvas.addEventListener('mousemove', onCanvasMouseMove);
    editorCanvas.addEventListener('mouseup', onCanvasMouseUp);
    editorCanvas.addEventListener('wheel', onCanvasWheel, { passive: false });
    editorCanvas.addEventListener('dblclick', onCanvasDblClick);
    editorCanvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

    // Keyboard
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Autosave every 30 seconds
    setInterval(autosave, 30000);

    // Unsaved changes warning
    window.addEventListener('beforeunload', function(e) {
        if (isDirty) {
            autosave();
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Toolbar buttons
    setupToolbarButtons();

    requestRender();
}

function setupToolbarButtons() {
    // Tool buttons
    var toolBtns = document.querySelectorAll('#toolbar .tool-btn');
    for (var i = 0; i < toolBtns.length; i++) {
        toolBtns[i].addEventListener('click', function() {
            setActiveTool(this.dataset.tool);
        });
    }

    // Grid toggle
    var gridBtn = document.getElementById('btn-grid');
    if (gridBtn) gridBtn.onclick = function() {
        showGrid = !showGrid;
        this.classList.toggle('active', showGrid);
        requestRender();
    };

    // Snap toggle
    var snapBtn = document.getElementById('btn-snap');
    if (snapBtn) snapBtn.onclick = function() {
        snapToGridEnabled = !snapToGridEnabled;
        this.classList.toggle('active', snapToGridEnabled);
    };

    // Zoom buttons
    var zoomInBtn = document.getElementById('btn-zoom-in');
    var zoomOutBtn = document.getElementById('btn-zoom-out');
    var fitBtn = document.getElementById('btn-fit');
    if (zoomInBtn) zoomInBtn.onclick = function() { zoomAt(editorCanvas.width / 2, editorCanvas.height / 2, 1.3); };
    if (zoomOutBtn) zoomOutBtn.onclick = function() { zoomAt(editorCanvas.width / 2, editorCanvas.height / 2, 1 / 1.3); };
    if (fitBtn) fitBtn.onclick = fitToArena;

    // Undo/Redo
    var undoBtn = document.getElementById('btn-undo');
    var redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.onclick = undo;
    if (redoBtn) redoBtn.onclick = redo;

    // Export/Import
    var exportBtn = document.getElementById('btn-export');
    var importBtn = document.getElementById('btn-import');
    if (exportBtn) exportBtn.onclick = showExportModal;
    if (importBtn) importBtn.onclick = showImportModal;

    // New map
    var newBtn = document.getElementById('btn-new');
    if (newBtn) newBtn.onclick = function() {
        if (isDirty && !confirm('Discard current map?')) return;
        editorMap = JSON.parse(JSON.stringify(DEFAULT_MAP));
        editorObjects = [];
        editorSurfaces = [];
        nextId = 1;
        selection = [];
        clearHistory();
        clearAutosave();
        isDirty = false;
        buildMapSettings();
        buildPalette();
        refreshPropertiesPanel();
        fitToArena();
    };
}

function onKeyDown(e) {
    // Ignore when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    if (e.code === 'Space') { spaceHeld = true; e.preventDefault(); return; }

    if (e.ctrlKey || e.metaKey) {
        if (e.code === 'KeyZ') {
            e.preventDefault();
            if (e.shiftKey) redo(); else undo();
            return;
        }
        if (e.code === 'KeyY') { e.preventDefault(); redo(); return; }
        if (e.code === 'KeyD') { e.preventDefault(); duplicateSelected(); return; }
        if (e.code === 'KeyS') { e.preventDefault(); autosave(); return; }
        if (e.code === 'KeyE') { e.preventDefault(); showExportModal(); return; }
        if (e.code === 'KeyA') {
            e.preventDefault();
            selection = [];
            for (var i = 0; i < editorObjects.length; i++) selection.push(editorObjects[i]._id);
            for (var i = 0; i < editorSurfaces.length; i++) selection.push(editorSurfaces[i]._id);
            refreshPropertiesPanel();
            requestRender();
            return;
        }
    }

    // Tool shortcuts
    if (e.code === 'KeyV') setActiveTool('select');
    if (e.code === 'KeyO') setActiveTool('object');
    if (e.code === 'KeyR' && !e.ctrlKey) {
        if (selection.length > 0) {
            // Rotate selected by 15°
            rotateSelected(15);
        } else {
            setActiveTool('road');
        }
    }
    if (e.code === 'KeyS' && !e.ctrlKey) setActiveTool('surface');
    if (e.code === 'KeyE' && !e.ctrlKey) setActiveTool('eraser');
    if (e.code === 'KeyP') setActiveTool('spawn');
    if (e.code === 'KeyW') setActiveTool('wall');
    if (e.code === 'KeyG') {
        showGrid = !showGrid;
        var gb = document.getElementById('btn-grid');
        if (gb) gb.classList.toggle('active', showGrid);
        requestRender();
    }
    if (e.code === 'KeyN' && !e.ctrlKey) {
        snapToGridEnabled = !snapToGridEnabled;
        var sb = document.getElementById('btn-snap');
        if (sb) sb.classList.toggle('active', snapToGridEnabled);
    }
    if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        deleteSelected();
    }
    if (e.code === 'Escape') {
        if (roadDrawState) { roadDrawState = null; requestRender(); }
        else if (wallDrawState) { wallDrawState = null; requestRender(); }
        else { selection = []; refreshPropertiesPanel(); requestRender(); }
    }
    if (e.code === 'Enter' && roadDrawState) {
        finishRoad();
    }
    if (e.code === 'Home') fitToArena();

    // Brush size
    if (e.code === 'BracketLeft') { brushRadius = Math.max(10, brushRadius - 5); updateBrushSlider(); }
    if (e.code === 'BracketRight') { brushRadius = Math.min(200, brushRadius + 5); updateBrushSlider(); }

    // Arrow nudge
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        var step = e.shiftKey ? 10 : 1;
        var dx = 0, dy = 0;
        if (e.code === 'ArrowLeft') dx = -step;
        if (e.code === 'ArrowRight') dx = step;
        if (e.code === 'ArrowUp') dy = -step;
        if (e.code === 'ArrowDown') dy = step;
        nudgeSelected(dx, dy);
    }
}

function onKeyUp(e) {
    if (e.code === 'Space') spaceHeld = false;
}

function rotateSelected(degrees) {
    var rad = degrees * Math.PI / 180;
    var items = getSelectedItems();
    var actions = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var before = { angle: item.angle || 0 };
        item.angle = (item.angle || 0) + rad;
        var target = findById('object', item._id) ? 'object' : 'surface';
        actions.push({ type: 'modify', target: target, id: item._id, before: before, after: { angle: item.angle } });
    }
    if (actions.length > 0) pushUndo(actions.length === 1 ? actions[0] : { type: 'batch', actions: actions });
    refreshPropertiesPanel();
    requestRender();
}

function nudgeSelected(dx, dy) {
    var items = getSelectedItems();
    if (items.length === 0) return;
    var actions = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var before = { x: item.x, y: item.y };
        item.x += dx;
        item.y += dy;
        if (item.x2 !== undefined) { item.x2 += dx; item.y2 += dy; before.x2 = item.x2 - dx; before.y2 = item.y2 - dy; }
        var target = findById('object', item._id) ? 'object' : 'surface';
        var after = { x: item.x, y: item.y };
        if (item.x2 !== undefined) { after.x2 = item.x2; after.y2 = item.y2; }
        actions.push({ type: 'modify', target: target, id: item._id, before: before, after: after });
    }
    pushUndo(actions.length === 1 ? actions[0] : { type: 'batch', actions: actions });
    refreshPropertiesPanel();
    requestRender();
}

function updateBrushSlider() {
    var el = document.getElementById('brush-slider');
    var val = document.getElementById('brush-val');
    if (el) el.value = brushRadius;
    if (val) val.textContent = brushRadius;
}

// Boot
window.addEventListener('DOMContentLoaded', initEditor);
