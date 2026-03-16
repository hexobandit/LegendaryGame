// ================================================================
//  MAP EDITOR — Tool implementations
// ================================================================

// ── Hit testing ──

function hitTestObjects(wx, wy) {
    // Test in reverse order (top-most first)
    for (var i = editorObjects.length - 1; i >= 0; i--) {
        var obj = editorObjects[i];
        if (hitTestObject(obj, wx, wy)) return { type: 'object', id: obj._id };
    }
    return null;
}

function hitTestObject(obj, wx, wy) {
    var def = OBJECT_TYPES[obj.type];
    if (!def) return false;

    if (def.shape === 'line') {
        return distToSegment(wx, wy, obj.x, obj.y, obj.x2 || obj.x + 100, obj.y2 || obj.y) < 10 / view.zoom;
    }
    if (def.shape === 'ramp') {
        var rw = obj.w || def.defaultW || 130;
        var rh = obj.h || def.defaultH || 65;
        return hitTestRotatedRect(wx, wy, obj.x, obj.y, rw, rh, obj.angle || 0);
    }
    if (def.shape === 'rect' || def.shape === 'square') {
        var rw = obj.w || def.w || (obj.r || def.fixedR || 14) * 2;
        var rh = obj.h || def.h || (obj.r || def.fixedR || 14) * 2;
        return hitTestRotatedRect(wx, wy, obj.x, obj.y, rw, rh, obj.angle || 0);
    }
    if (def.shape === 'bump') {
        var r = obj.r || def.defaultR || 15;
        return Math.hypot(wx - obj.x, wy - obj.y) < r * 2;
    }
    if (def.shape === 'palm') {
        return Math.hypot(wx - obj.x, wy - obj.y) < 25;
    }
    if (def.shape === 'bush') {
        var r = obj.r || def.defaultR || 25;
        return Math.hypot(wx - obj.x, wy - obj.y) < r;
    }
    // Default circle
    var r = obj.r || def.fixedR || def.defaultR || 15;
    return Math.hypot(wx - obj.x, wy - obj.y) < r;
}

function hitTestSurfaces(wx, wy) {
    for (var i = editorSurfaces.length - 1; i >= 0; i--) {
        var s = editorSurfaces[i];
        if (s.type === 'oil' && s.rx && s.ry) {
            // Ellipse hit test
            var cos = Math.cos(-(s.angle || 0)), sin = Math.sin(-(s.angle || 0));
            var dx = wx - s.x, dy = wy - s.y;
            var lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
            if ((lx * lx) / (s.rx * s.rx) + (ly * ly) / (s.ry * s.ry) < 1) {
                return { type: 'surface', id: s._id };
            }
        } else {
            if (Math.hypot(wx - s.x, wy - s.y) < s.r) {
                return { type: 'surface', id: s._id };
            }
        }
    }
    return null;
}

function hitTestRoads(wx, wy) {
    for (var ri = editorMap.curvyRoads.length - 1; ri >= 0; ri--) {
        var road = editorMap.curvyRoads[ri];
        if (!road.points || road.points.length < 2) continue;
        var hw = (road.width || 60) / 2;
        for (var i = 0; i < road.points.length - 1; i++) {
            if (distToSegment(wx, wy, road.points[i].x, road.points[i].y, road.points[i + 1].x, road.points[i + 1].y) < hw) {
                return { type: 'road', id: 'road-' + ri, index: ri };
            }
        }
    }
    return null;
}

function hitTestRoadWaypoints(wx, wy) {
    for (var ri = editorMap.curvyRoads.length - 1; ri >= 0; ri--) {
        if (selection.indexOf('road-' + ri) < 0) continue; // only for selected roads
        var road = editorMap.curvyRoads[ri];
        for (var pi = 0; pi < road.points.length; pi++) {
            if (Math.hypot(wx - road.points[pi].x, wy - road.points[pi].y) < 10 / view.zoom) {
                return { type: 'waypoint', roadIndex: ri, pointIndex: pi };
            }
        }
    }
    return null;
}

function hitTestAll(wx, wy) {
    var wp = hitTestRoadWaypoints(wx, wy);
    if (wp) return wp;
    var obj = hitTestObjects(wx, wy);
    if (obj) return obj;
    var surf = hitTestSurfaces(wx, wy);
    if (surf) return surf;
    var road = hitTestRoads(wx, wy);
    if (road) return road;
    return null;
}

// ── Geometry helpers ──

function distToSegment(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function hitTestRotatedRect(px, py, cx, cy, w, h, angle) {
    var cos = Math.cos(-angle), sin = Math.sin(-angle);
    var dx = px - cx, dy = py - cy;
    var lx = dx * cos - dy * sin;
    var ly = dx * sin + dy * cos;
    return Math.abs(lx) < w / 2 && Math.abs(ly) < h / 2;
}

// ── Mouse event routing ──

function onCanvasMouseDown(e) {
    var rect = editorCanvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;
    var world = screenToWorld(sx, sy);
    var wx = world.x, wy = world.y;

    // Middle click or space+click = pan
    if (e.button === 1 || (e.button === 0 && spaceHeld)) {
        startPan(sx, sy);
        e.preventDefault();
        return;
    }
    if (e.button !== 0) return;

    if (activeTool === 'select') {
        selectMouseDown(wx, wy, e.shiftKey);
    } else if (activeTool === 'object') {
        objectMouseDown(wx, wy);
    } else if (activeTool === 'road') {
        roadMouseDown(wx, wy);
    } else if (activeTool === 'surface') {
        surfaceMouseDown(wx, wy);
    } else if (activeTool === 'eraser') {
        eraserMouseDown(wx, wy);
    } else if (activeTool === 'spawn') {
        spawnMouseDown(wx, wy);
    } else if (activeTool === 'wall') {
        wallMouseDown(wx, wy);
    }
}

function onCanvasMouseMove(e) {
    var rect = editorCanvas.getBoundingClientRect();
    mouseSX = e.clientX - rect.left;
    mouseSY = e.clientY - rect.top;
    var world = screenToWorld(mouseSX, mouseSY);
    mouseWX = world.x;
    mouseWY = world.y;

    if (view.isPanning) {
        updatePan(mouseSX, mouseSY);
        return;
    }

    if (activeTool === 'select') {
        selectMouseMove(mouseWX, mouseWY, e);
    } else if (activeTool === 'road') {
        requestRender(); // preview line to cursor
    } else if (activeTool === 'wall' && wallDrawState && wallDrawState.isDrawing) {
        requestRender();
    } else if (activeTool === 'eraser' && e.buttons === 1) {
        eraserMouseDown(mouseWX, mouseWY);
    } else if (activeTool === 'surface' && e.buttons === 1) {
        surfaceMouseDown(mouseWX, mouseWY);
    } else {
        // Update hover
        var hit = hitTestAll(mouseWX, mouseWY);
        if (hit !== hoverTarget) {
            hoverTarget = hit;
            requestRender();
        }
    }

    updateStatusBar();
}

function onCanvasMouseUp(e) {
    if (view.isPanning) {
        endPan();
        return;
    }
    if (activeTool === 'select') {
        selectMouseUp();
    }
}

function onCanvasWheel(e) {
    e.preventDefault();
    var rect = editorCanvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;
    var factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    zoomAt(sx, sy, factor);
}

function onCanvasDblClick(e) {
    var rect = editorCanvas.getBoundingClientRect();
    var sx = e.clientX - rect.left;
    var sy = e.clientY - rect.top;
    var world = screenToWorld(sx, sy);

    if (activeTool === 'road' && roadDrawState && roadDrawState.points.length >= 2) {
        finishRoad();
        return;
    }

    // Double-click on empty = fit to arena
    var hit = hitTestAll(world.x, world.y);
    if (!hit) fitToArena();
}

// ── SELECT TOOL ──

function selectMouseDown(wx, wy, shiftKey) {
    var hit = hitTestAll(wx, wy);

    if (hit && hit.type === 'waypoint') {
        // Start dragging waypoint
        var road = editorMap.curvyRoads[hit.roadIndex];
        var pt = road.points[hit.pointIndex];
        dragState = {
            type: 'waypoint',
            roadIndex: hit.roadIndex,
            pointIndex: hit.pointIndex,
            startWX: pt.x,
            startWY: pt.y,
            offsetX: wx - pt.x,
            offsetY: wy - pt.y,
            before: { points: cloneObj(road.points) },
        };
        return;
    }

    if (hit) {
        var id = hit.id;
        if (shiftKey) {
            // Toggle selection
            var idx = selection.indexOf(id);
            if (idx >= 0) selection.splice(idx, 1);
            else selection.push(id);
        } else {
            if (selection.indexOf(id) < 0) {
                selection = [id];
            }
            // Start drag
            dragState = {
                type: 'move',
                startWX: wx,
                startWY: wy,
                items: getSelectedItems(),
            };
            // Store original positions
            dragState.originals = {};
            for (var i = 0; i < dragState.items.length; i++) {
                var item = dragState.items[i];
                dragState.originals[item._id || item.id] = { x: item.x, y: item.y, x2: item.x2, y2: item.y2 };
            }
        }
    } else {
        if (!shiftKey) selection = [];
        // Start selection box
        selectBoxStart = { wx: wx, wy: wy };
        selectBoxEnd = { wx: wx, wy: wy };
    }
    refreshPropertiesPanel();
    requestRender();
}

function selectMouseMove(wx, wy, e) {
    if (dragState) {
        if (dragState.type === 'move') {
            var dx = wx - dragState.startWX;
            var dy = wy - dragState.startWY;
            for (var i = 0; i < dragState.items.length; i++) {
                var item = dragState.items[i];
                var orig = dragState.originals[item._id || item.id];
                var snapped = snapToGrid(orig.x + dx, orig.y + dy);
                item.x = snapped.x;
                item.y = snapped.y;
                if (item.x2 !== undefined) {
                    item.x2 = orig.x2 + dx;
                    item.y2 = orig.y2 + dy;
                }
            }
            requestRender();
            refreshPropertiesPanel();
        } else if (dragState.type === 'waypoint') {
            var road = editorMap.curvyRoads[dragState.roadIndex];
            var snapped = snapToGrid(wx - dragState.offsetX, wy - dragState.offsetY);
            road.points[dragState.pointIndex].x = snapped.x;
            road.points[dragState.pointIndex].y = snapped.y;
            requestRender();
        }
    } else if (selectBoxStart) {
        selectBoxEnd = { wx: wx, wy: wy };
        requestRender();
    } else {
        // Hover
        var hit = hitTestAll(wx, wy);
        var newHover = hit;
        if (JSON.stringify(newHover) !== JSON.stringify(hoverTarget)) {
            hoverTarget = newHover;
            requestRender();
        }
    }
}

function selectMouseUp() {
    if (dragState) {
        if (dragState.type === 'move') {
            // Push undo for move
            var actions = [];
            for (var i = 0; i < dragState.items.length; i++) {
                var item = dragState.items[i];
                var orig = dragState.originals[item._id || item.id];
                if (item.x !== orig.x || item.y !== orig.y) {
                    var target = findById('object', item._id) ? 'object' : 'surface';
                    var before = { x: orig.x, y: orig.y };
                    var after = { x: item.x, y: item.y };
                    if (item.x2 !== undefined) {
                        before.x2 = orig.x2; before.y2 = orig.y2;
                        after.x2 = item.x2; after.y2 = item.y2;
                    }
                    actions.push({ type: 'modify', target: target, id: item._id, before: before, after: after });
                }
            }
            if (actions.length > 0) {
                pushUndo(actions.length === 1 ? actions[0] : { type: 'batch', actions: actions });
            }
        } else if (dragState.type === 'waypoint') {
            var road = editorMap.curvyRoads[dragState.roadIndex];
            pushUndo({
                type: 'road-modify',
                index: dragState.roadIndex,
                before: { points: dragState.before.points },
                after: { points: cloneObj(road.points) },
            });
        }
        dragState = null;
    }

    if (selectBoxStart && selectBoxEnd) {
        // Select everything in box
        var x1 = Math.min(selectBoxStart.wx, selectBoxEnd.wx);
        var y1 = Math.min(selectBoxStart.wy, selectBoxEnd.wy);
        var x2 = Math.max(selectBoxStart.wx, selectBoxEnd.wx);
        var y2 = Math.max(selectBoxStart.wy, selectBoxEnd.wy);

        for (var i = 0; i < editorObjects.length; i++) {
            var obj = editorObjects[i];
            if (obj.x >= x1 && obj.x <= x2 && obj.y >= y1 && obj.y <= y2) {
                if (selection.indexOf(obj._id) < 0) selection.push(obj._id);
            }
        }
        for (var i = 0; i < editorSurfaces.length; i++) {
            var s = editorSurfaces[i];
            if (s.x >= x1 && s.x <= x2 && s.y >= y1 && s.y <= y2) {
                if (selection.indexOf(s._id) < 0) selection.push(s._id);
            }
        }

        selectBoxStart = null;
        selectBoxEnd = null;
        refreshPropertiesPanel();
        requestRender();
    }
}

function getSelectedItems() {
    var items = [];
    for (var i = 0; i < selection.length; i++) {
        var id = selection[i];
        // Objects
        for (var j = 0; j < editorObjects.length; j++) {
            if (editorObjects[j]._id === id) items.push(editorObjects[j]);
        }
        // Surfaces
        for (var j = 0; j < editorSurfaces.length; j++) {
            if (editorSurfaces[j]._id === id) items.push(editorSurfaces[j]);
        }
    }
    return items;
}

// ── OBJECT TOOL ──

function objectMouseDown(wx, wy) {
    var snapped = snapToGrid(wx, wy);
    var def = OBJECT_TYPES[activeObjectType];
    if (!def) return;

    if (def.shape === 'line') {
        // Switch to wall tool mode
        activeTool = 'wall';
        wallMouseDown(snapped.x, snapped.y);
        setActiveTool('wall');
        return;
    }

    var obj = {
        _id: newId(),
        type: activeObjectType,
        x: snapped.x,
        y: snapped.y,
        angle: 0,
    };

    if (def.fixedR) obj.r = def.fixedR;
    else if (def.defaultR) obj.r = def.defaultR;
    if (def.shape === 'ramp') {
        obj.w = def.defaultW;
        obj.h = def.defaultH;
        obj.style = RAMP_STYLES[0];
    }
    if (def.shape === 'rect' && def.w) { obj.w = def.w; obj.h = def.h; }

    editorObjects.push(obj);
    pushUndo({ type: 'add', target: 'object', data: cloneObj(obj) });
    selection = [obj._id];
    refreshPropertiesPanel();
    requestRender();
}

// ── WALL TOOL ──

function wallMouseDown(wx, wy) {
    var snapped = snapToGrid(wx, wy);
    if (!wallDrawState || !wallDrawState.isDrawing) {
        wallDrawState = { x1: snapped.x, y1: snapped.y, isDrawing: true };
    } else {
        // Finish wall
        var obj = {
            _id: newId(),
            type: 'wall',
            x: wallDrawState.x1,
            y: wallDrawState.y1,
            x2: snapped.x,
            y2: snapped.y,
            angle: 0,
        };
        editorObjects.push(obj);
        pushUndo({ type: 'add', target: 'object', data: cloneObj(obj) });
        selection = [obj._id];
        wallDrawState = null;
        refreshPropertiesPanel();
        requestRender();
    }
}

// ── ROAD TOOL ──

function roadMouseDown(wx, wy) {
    var snapped = snapToGrid(wx, wy);
    if (!roadDrawState) {
        roadDrawState = {
            points: [{ x: snapped.x, y: snapped.y }],
            width: roadDefaultWidth || 120,
            color: 'rgba(100,100,100,0.6)',
            edgeColor: null,
            centerColor: null,
            surface: 'tarmac',
        };
    } else {
        roadDrawState.points.push({ x: snapped.x, y: snapped.y });
    }
    requestRender();
}

function finishRoad() {
    if (!roadDrawState || roadDrawState.points.length < 2) {
        roadDrawState = null;
        requestRender();
        return;
    }

    var road = {
        points: roadDrawState.points,
        width: roadDrawState.width,
        color: roadDrawState.color,
        edgeColor: roadDrawState.edgeColor,
        centerColor: roadDrawState.centerColor,
        surface: roadDrawState.surface,
    };

    editorMap.curvyRoads.push(road);
    editorMap.roadLayout = 'curvy';
    var idx = editorMap.curvyRoads.length - 1;
    pushUndo({ type: 'road-add', index: idx, data: cloneObj(road) });
    selection = ['road-' + idx];
    roadDrawState = null;
    refreshPropertiesPanel();
    requestRender();
}

// ── SURFACE TOOL ──

var lastSurfaceX = -999, lastSurfaceY = -999;

function surfaceMouseDown(wx, wy) {
    // Minimum spacing to avoid overlap spam
    if (Math.hypot(wx - lastSurfaceX, wy - lastSurfaceY) < brushRadius * 0.5) return;
    lastSurfaceX = wx;
    lastSurfaceY = wy;

    var snapped = snapToGrid(wx, wy);
    var s = {
        _id: newId(),
        type: activeSurfaceType,
        x: snapped.x,
        y: snapped.y,
        r: brushRadius,
    };

    if (activeSurfaceType === 'oil') {
        s.rx = brushRadius;
        s.ry = brushRadius * 0.5;
        s.angle = 0;
    }

    editorSurfaces.push(s);
    pushUndo({ type: 'add', target: 'surface', data: cloneObj(s) });
    requestRender();
}

// ── ERASER TOOL ──

function eraserMouseDown(wx, wy) {
    var eraseR = brushRadius;
    var removed = false;

    for (var i = editorObjects.length - 1; i >= 0; i--) {
        var obj = editorObjects[i];
        if (Math.hypot(wx - obj.x, wy - obj.y) < eraseR) {
            pushUndo({ type: 'remove', target: 'object', data: cloneObj(obj) });
            editorObjects.splice(i, 1);
            removed = true;
        }
    }
    for (var i = editorSurfaces.length - 1; i >= 0; i--) {
        var s = editorSurfaces[i];
        if (Math.hypot(wx - s.x, wy - s.y) < eraseR) {
            pushUndo({ type: 'remove', target: 'surface', data: cloneObj(s) });
            editorSurfaces.splice(i, 1);
            removed = true;
        }
    }

    if (removed) requestRender();
}

// ── SPAWN TOOL ──

function spawnMouseDown(wx, wy) {
    var snapped = snapToGrid(wx, wy);
    var before = { spawnCenterX: editorMap.spawnCenterX, spawnCenterY: editorMap.spawnCenterY };
    editorMap.spawnCenterX = snapped.x;
    editorMap.spawnCenterY = snapped.y;
    pushUndo({ type: 'settings', before: before, after: { spawnCenterX: snapped.x, spawnCenterY: snapped.y } });
    refreshMapSettings();
    requestRender();
}

// ── Delete selected ──

function deleteSelected() {
    if (selection.length === 0) return;
    var actions = [];

    for (var i = 0; i < selection.length; i++) {
        var id = selection[i];

        // Check road
        if (typeof id === 'string' && id.indexOf('road-') === 0) {
            var ri = parseInt(id.replace('road-', ''));
            if (editorMap.curvyRoads[ri]) {
                actions.push({ type: 'road-remove', index: ri, data: cloneObj(editorMap.curvyRoads[ri]) });
            }
            continue;
        }

        // Check objects
        var obj = findById('object', id);
        if (obj) {
            actions.push({ type: 'remove', target: 'object', data: cloneObj(obj) });
            continue;
        }

        // Check surfaces
        var surf = findById('surface', id);
        if (surf) {
            actions.push({ type: 'remove', target: 'surface', data: cloneObj(surf) });
        }
    }

    if (actions.length > 0) {
        pushUndo(actions.length === 1 ? actions[0] : { type: 'batch', actions: actions });
        // Apply removals
        for (var i = 0; i < actions.length; i++) {
            var a = actions[i];
            if (a.type === 'remove') removeById(a.target, a.data._id);
            if (a.type === 'road-remove') editorMap.curvyRoads.splice(a.index, 1);
        }
    }

    selection = [];
    refreshPropertiesPanel();
    requestRender();
}

// ── Duplicate selected ──

function duplicateSelected() {
    if (selection.length === 0) return;
    var newSelection = [];
    var actions = [];

    for (var i = 0; i < selection.length; i++) {
        var id = selection[i];
        var obj = findById('object', id);
        if (obj) {
            var copy = cloneObj(obj);
            copy._id = newId();
            copy.x += 30;
            copy.y += 30;
            editorObjects.push(copy);
            actions.push({ type: 'add', target: 'object', data: cloneObj(copy) });
            newSelection.push(copy._id);
            continue;
        }
        var surf = findById('surface', id);
        if (surf) {
            var copy = cloneObj(surf);
            copy._id = newId();
            copy.x += 30;
            copy.y += 30;
            editorSurfaces.push(copy);
            actions.push({ type: 'add', target: 'surface', data: cloneObj(copy) });
            newSelection.push(copy._id);
        }
    }

    if (actions.length > 0) {
        pushUndo(actions.length === 1 ? actions[0] : { type: 'batch', actions: actions });
    }

    selection = newSelection;
    refreshPropertiesPanel();
    requestRender();
}

// ── Tool switching ──

function setActiveTool(tool) {
    activeTool = tool;
    if (tool !== 'road') { roadDrawState = null; }
    if (tool !== 'wall') { wallDrawState = null; }

    // Update toolbar buttons
    var btns = document.querySelectorAll('#toolbar .tool-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('active', btns[i].dataset.tool === tool);
    }

    // Update cursor
    if (tool === 'object' || tool === 'surface' || tool === 'eraser') {
        editorCanvas.style.cursor = 'crosshair';
    } else if (tool === 'road' || tool === 'wall') {
        editorCanvas.style.cursor = 'crosshair';
    } else if (tool === 'spawn') {
        editorCanvas.style.cursor = 'move';
    } else {
        editorCanvas.style.cursor = 'default';
    }

    requestRender();
}
