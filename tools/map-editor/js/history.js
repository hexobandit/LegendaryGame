// ================================================================
//  MAP EDITOR — Undo / Redo
// ================================================================

var undoStack = [];
var redoStack = [];
var UNDO_LIMIT = 100;

function pushUndo(action) {
    undoStack.push(action);
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    redoStack = [];
    isDirty = true;
    updateUndoButtons();
}

function undo() {
    if (undoStack.length === 0) return;
    var action = undoStack.pop();
    redoStack.push(action);
    applyAction(action, true);
    updateUndoButtons();
    requestRender();
    refreshPropertiesPanel();
}

function redo() {
    if (redoStack.length === 0) return;
    var action = redoStack.pop();
    undoStack.push(action);
    applyAction(action, false);
    updateUndoButtons();
    requestRender();
    refreshPropertiesPanel();
}

function applyAction(action, isUndo) {
    if (action.type === 'batch') {
        var list = isUndo ? action.actions.slice().reverse() : action.actions;
        for (var i = 0; i < list.length; i++) applyAction(list[i], isUndo);
        return;
    }

    if (action.type === 'add') {
        if (isUndo) {
            removeById(action.target, action.data._id);
        } else {
            addToList(action.target, cloneObj(action.data));
        }
    } else if (action.type === 'remove') {
        if (isUndo) {
            addToList(action.target, cloneObj(action.data));
        } else {
            removeById(action.target, action.data._id);
        }
    } else if (action.type === 'modify') {
        var obj = findById(action.target, action.id);
        if (obj) {
            var vals = isUndo ? action.before : action.after;
            for (var k in vals) obj[k] = vals[k];
        }
    } else if (action.type === 'settings') {
        var vals = isUndo ? action.before : action.after;
        for (var k in vals) editorMap[k] = vals[k];
        refreshMapSettings();
    } else if (action.type === 'road-add') {
        if (isUndo) {
            editorMap.curvyRoads.splice(action.index, 1);
        } else {
            editorMap.curvyRoads.splice(action.index, 0, cloneObj(action.data));
        }
    } else if (action.type === 'road-remove') {
        if (isUndo) {
            editorMap.curvyRoads.splice(action.index, 0, cloneObj(action.data));
        } else {
            editorMap.curvyRoads.splice(action.index, 1);
        }
    } else if (action.type === 'road-modify') {
        var road = editorMap.curvyRoads[action.index];
        if (road) {
            var vals = isUndo ? action.before : action.after;
            for (var k in vals) road[k] = vals[k];
        }
    }
}

function getList(target) {
    if (target === 'object') return editorObjects;
    if (target === 'surface') return editorSurfaces;
    return null;
}

function addToList(target, obj) {
    var list = getList(target);
    if (list) list.push(obj);
}

function removeById(target, id) {
    var list = getList(target);
    if (!list) return;
    for (var i = list.length - 1; i >= 0; i--) {
        if (list[i]._id === id) { list.splice(i, 1); return; }
    }
}

function findById(target, id) {
    var list = getList(target);
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
        if (list[i]._id === id) return list[i];
    }
    return null;
}

function cloneObj(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function clearHistory() {
    undoStack = [];
    redoStack = [];
    updateUndoButtons();
}

function updateUndoButtons() {
    var ub = document.getElementById('btn-undo');
    var rb = document.getElementById('btn-redo');
    if (ub) ub.disabled = undoStack.length === 0;
    if (rb) rb.disabled = redoStack.length === 0;
}
