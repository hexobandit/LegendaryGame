// ================================================================
//  MAP EDITOR — UI Panels (palette, properties, map settings)
// ================================================================

function buildPalette() {
    var objPal = document.getElementById('object-palette');
    var surfPal = document.getElementById('surface-palette');
    if (!objPal || !surfPal) return;

    // Object palette
    objPal.innerHTML = '';
    for (var i = 0; i < OBJECT_PALETTE.length; i++) {
        var item = OBJECT_PALETTE[i];
        if (typeof item === 'object' && item.header) {
            var h = document.createElement('div');
            h.className = 'palette-header';
            h.textContent = item.header;
            objPal.appendChild(h);
            continue;
        }
        var def = OBJECT_TYPES[item];
        if (!def) continue;
        var btn = document.createElement('button');
        btn.className = 'palette-btn';
        btn.dataset.type = item;
        btn.title = def.label;

        // Color swatch
        var swatch = document.createElement('span');
        swatch.className = 'palette-swatch';
        swatch.style.backgroundColor = def.color;
        if (def.shape === 'square' || def.shape === 'rect') swatch.style.borderRadius = '2px';
        btn.appendChild(swatch);

        var label = document.createElement('span');
        label.textContent = def.label;
        btn.appendChild(label);

        btn.onclick = (function(t) {
            return function() {
                activeObjectType = t;
                setActiveTool('object');
                updatePaletteSelection();
            };
        })(item);

        objPal.appendChild(btn);
    }

    // Surface palette
    surfPal.innerHTML = '';
    var sh = document.createElement('div');
    sh.className = 'palette-header';
    sh.textContent = 'SURFACES';
    surfPal.appendChild(sh);

    for (var i = 0; i < SURFACE_PALETTE.length; i++) {
        var stype = SURFACE_PALETTE[i];
        var sdef = SURFACE_TYPES[stype];
        if (!sdef) continue;

        var btn = document.createElement('button');
        btn.className = 'palette-btn';
        btn.dataset.surface = stype;
        btn.title = sdef.label;

        var swatch = document.createElement('span');
        swatch.className = 'palette-swatch';
        swatch.style.backgroundColor = sdef.editorFill;
        btn.appendChild(swatch);

        var label = document.createElement('span');
        label.textContent = sdef.label;
        btn.appendChild(label);

        btn.onclick = (function(t) {
            return function() {
                activeSurfaceType = t;
                setActiveTool('surface');
                updatePaletteSelection();
            };
        })(stype);

        surfPal.appendChild(btn);
    }

    // Brush size slider
    var brushDiv = document.createElement('div');
    brushDiv.className = 'brush-control';
    brushDiv.innerHTML = '<label>Brush: <span id="brush-val">' + brushRadius + '</span></label>' +
        '<input type="range" id="brush-slider" min="10" max="200" value="' + brushRadius + '">';
    surfPal.appendChild(brushDiv);
    document.getElementById('brush-slider').oninput = function() {
        brushRadius = parseInt(this.value);
        document.getElementById('brush-val').textContent = brushRadius;
    };

    // Road width control (below surfaces)
    var roadDiv = document.createElement('div');
    roadDiv.id = 'road-width-control';
    roadDiv.className = 'brush-control';
    roadDiv.innerHTML = '<div class="palette-header">ROAD TOOL</div>' +
        '<label>Width: <span id="road-width-val">' + roadDefaultWidth + '</span></label>' +
        '<input type="range" id="road-width-slider" min="30" max="300" value="' + roadDefaultWidth + '">';
    surfPal.appendChild(roadDiv);
    document.getElementById('road-width-slider').oninput = function() {
        roadDefaultWidth = parseInt(this.value);
        document.getElementById('road-width-val').textContent = roadDefaultWidth;
        if (roadDrawState) roadDrawState.width = roadDefaultWidth;
    };

    updatePaletteSelection();
}

function updatePaletteSelection() {
    var btns = document.querySelectorAll('.palette-btn');
    for (var i = 0; i < btns.length; i++) {
        var btn = btns[i];
        var isActive = false;
        if (activeTool === 'object' && btn.dataset.type === activeObjectType) isActive = true;
        if (activeTool === 'surface' && btn.dataset.surface === activeSurfaceType) isActive = true;
        btn.classList.toggle('active', isActive);
    }
}

// ── Properties Panel ──

function refreshPropertiesPanel() {
    var panel = document.getElementById('properties-panel');
    if (!panel) return;

    if (selection.length === 0) {
        panel.innerHTML = '<div class="panel-empty">Select an object to edit properties</div>';
        return;
    }

    if (selection.length > 1) {
        panel.innerHTML = '<div class="panel-header">SELECTION</div>' +
            '<div class="prop-row">' + selection.length + ' items selected</div>' +
            '<button class="prop-btn delete-btn" onclick="deleteSelected()">DELETE ALL</button>' +
            '<button class="prop-btn" onclick="duplicateSelected()">DUPLICATE</button>';
        return;
    }

    var id = selection[0];
    var html = '';

    // Road?
    if (typeof id === 'string' && id.indexOf('road-') === 0) {
        var ri = parseInt(id.replace('road-', ''));
        var road = editorMap.curvyRoads[ri];
        if (!road) { panel.innerHTML = ''; return; }

        html += '<div class="panel-header">ROAD #' + ri + '</div>';
        html += propInput('Width', 'road-width', road.width || 60, 'number', 10, 300);
        html += propInput('Color', 'road-color', road.color || '#666666', 'color');
        html += propInput('Edge Color', 'road-edge-color', road.edgeColor || '', 'color');
        html += propInput('Surface', 'road-surface', road.surface || 'tarmac', 'select', null, null,
            ['tarmac', 'dirt', 'grass', 'mud', 'sand', 'ice']);
        html += '<div class="prop-row">' + road.points.length + ' waypoints</div>';
        html += '<button class="prop-btn delete-btn" onclick="deleteSelected()">DELETE ROAD</button>';
        panel.innerHTML = html;
        bindRoadInputs(ri);
        return;
    }

    // Object or surface?
    var obj = findById('object', id);
    var target = 'object';
    if (!obj) {
        obj = findById('surface', id);
        target = 'surface';
    }
    if (!obj) { panel.innerHTML = ''; return; }

    if (target === 'surface') {
        var sdef = SURFACE_TYPES[obj.type];
        html += '<div class="panel-header">' + (sdef ? sdef.label : obj.type).toUpperCase() + '</div>';
        html += propInput('X', 'prop-x', Math.round(obj.x), 'number');
        html += propInput('Y', 'prop-y', Math.round(obj.y), 'number');
        if (obj.type === 'oil') {
            html += propInput('RX', 'prop-rx', Math.round(obj.rx || 40), 'number', 5, 200);
            html += propInput('RY', 'prop-ry', Math.round(obj.ry || 20), 'number', 5, 200);
            html += propInput('Angle', 'prop-angle', Math.round((obj.angle || 0) * 180 / Math.PI), 'number', -180, 180);
        } else {
            html += propInput('Radius', 'prop-r', Math.round(obj.r), 'number', 5, 300);
        }
        html += '<button class="prop-btn delete-btn" onclick="deleteSelected()">DELETE</button>';
        html += '<button class="prop-btn" onclick="duplicateSelected()">DUPLICATE</button>';
        panel.innerHTML = html;
        bindSurfaceInputs(obj, target);
        return;
    }

    var def = OBJECT_TYPES[obj.type];
    html += '<div class="panel-header">' + (def ? def.label : obj.type).toUpperCase() + '</div>';
    html += propInput('X', 'prop-x', Math.round(obj.x), 'number');
    html += propInput('Y', 'prop-y', Math.round(obj.y), 'number');

    if (def && !def.fixedR && def.defaultR) {
        html += propInput('Radius', 'prop-r', Math.round(obj.r || def.defaultR), 'number', def.minR, def.maxR);
    }
    if (def && (def.shape === 'ramp')) {
        html += propInput('Width', 'prop-w', Math.round(obj.w || def.defaultW), 'number', 40, 300);
        html += propInput('Height', 'prop-h', Math.round(obj.h || def.defaultH), 'number', 20, 150);
        html += propInput('Angle', 'prop-angle', Math.round((obj.angle || 0) * 180 / Math.PI), 'number', -180, 180);
        html += propInput('Style', 'prop-style', obj.style || 'dirt_mound', 'select', null, null, RAMP_STYLES);
    }
    if (def && (def.shape === 'rect' || def.shape === 'square' || def.shape === 'bump')) {
        html += propInput('Angle', 'prop-angle', Math.round((obj.angle || 0) * 180 / Math.PI), 'number', -180, 180);
    }
    if (def && def.shape === 'line') {
        html += propInput('X2', 'prop-x2', Math.round(obj.x2 || obj.x + 100), 'number');
        html += propInput('Y2', 'prop-y2', Math.round(obj.y2 || obj.y), 'number');
    }

    html += '<button class="prop-btn delete-btn" onclick="deleteSelected()">DELETE</button>';
    html += '<button class="prop-btn" onclick="duplicateSelected()">DUPLICATE</button>';
    panel.innerHTML = html;
    bindObjectInputs(obj, target);
}

function propInput(label, id, value, type, min, max, options) {
    var html = '<div class="prop-row"><label>' + label + '</label>';
    if (type === 'select' && options) {
        html += '<select id="' + id + '">';
        for (var i = 0; i < options.length; i++) {
            html += '<option value="' + options[i] + '"' + (value === options[i] ? ' selected' : '') + '>' + options[i] + '</option>';
        }
        html += '</select>';
    } else if (type === 'color') {
        html += '<input type="color" id="' + id + '" value="' + (value || '#666666') + '">';
    } else if (type === 'text') {
        html += '<input type="text" id="' + id + '" value="' + (value || '') + '">';
    } else {
        html += '<input type="number" id="' + id + '" value="' + value + '"';
        if (min !== undefined && min !== null) html += ' min="' + min + '"';
        if (max !== undefined && max !== null) html += ' max="' + max + '"';
        html += '>';
    }
    html += '</div>';
    return html;
}

function bindObjectInputs(obj, target) {
    bindProp('prop-x', obj, target, 'x', parseFloat);
    bindProp('prop-y', obj, target, 'y', parseFloat);
    bindProp('prop-r', obj, target, 'r', parseFloat);
    bindProp('prop-w', obj, target, 'w', parseFloat);
    bindProp('prop-h', obj, target, 'h', parseFloat);
    bindProp('prop-x2', obj, target, 'x2', parseFloat);
    bindProp('prop-y2', obj, target, 'y2', parseFloat);
    bindPropAngle('prop-angle', obj, target);
    bindPropSelect('prop-style', obj, target, 'style');
}

function bindSurfaceInputs(obj, target) {
    bindProp('prop-x', obj, target, 'x', parseFloat);
    bindProp('prop-y', obj, target, 'y', parseFloat);
    bindProp('prop-r', obj, target, 'r', parseFloat);
    bindProp('prop-rx', obj, target, 'rx', parseFloat);
    bindProp('prop-ry', obj, target, 'ry', parseFloat);
    bindPropAngle('prop-angle', obj, target);
}

function bindRoadInputs(ri) {
    var road = editorMap.curvyRoads[ri];
    bindEl('road-width', function(val) {
        var before = { width: road.width };
        road.width = parseFloat(val);
        pushUndo({ type: 'road-modify', index: ri, before: before, after: { width: road.width } });
        requestRender();
    });
    bindEl('road-color', function(val) {
        var before = { color: road.color };
        road.color = val;
        pushUndo({ type: 'road-modify', index: ri, before: before, after: { color: val } });
        requestRender();
    });
    bindEl('road-edge-color', function(val) {
        var before = { edgeColor: road.edgeColor };
        road.edgeColor = val;
        pushUndo({ type: 'road-modify', index: ri, before: before, after: { edgeColor: val } });
        requestRender();
    });
    bindEl('road-surface', function(val) {
        var before = { surface: road.surface };
        road.surface = val;
        pushUndo({ type: 'road-modify', index: ri, before: before, after: { surface: val } });
    });
}

function bindProp(elId, obj, target, key, parser) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.oninput = function() {
        var val = parser ? parser(el.value) : el.value;
        if (isNaN(val)) return;
        var before = {}; before[key] = obj[key];
        var after = {}; after[key] = val;
        obj[key] = val;
        pushUndo({ type: 'modify', target: target, id: obj._id, before: before, after: after });
        requestRender();
    };
}

function bindPropAngle(elId, obj, target) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.oninput = function() {
        var deg = parseFloat(el.value);
        if (isNaN(deg)) return;
        var before = { angle: obj.angle };
        obj.angle = deg * Math.PI / 180;
        pushUndo({ type: 'modify', target: target, id: obj._id, before: before, after: { angle: obj.angle } });
        requestRender();
    };
}

function bindPropSelect(elId, obj, target, key) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.onchange = function() {
        var before = {}; before[key] = obj[key];
        var after = {}; after[key] = el.value;
        obj[key] = el.value;
        pushUndo({ type: 'modify', target: target, id: obj._id, before: before, after: after });
        requestRender();
    };
}

function bindEl(elId, callback) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.oninput = function() { callback(el.value); };
    el.onchange = function() { callback(el.value); };
}

// ── Map Settings Panel ──

function buildMapSettings() {
    var panel = document.getElementById('map-settings');
    if (!panel || !editorMap) return;

    panel.innerHTML =
        '<div class="panel-header">MAP SETTINGS</div>' +
        propInput('Name', 'ms-name', editorMap.name, 'text') +
        propInput('ID', 'ms-id', editorMap.id, 'text') +
        propInput('Arena Width', 'ms-aw', editorMap.arenaWidth, 'number', 800, 8000) +
        propInput('Arena Height', 'ms-ah', editorMap.arenaHeight, 'number', 800, 8000) +
        propInput('BG Color', 'ms-bg', editorMap.backgroundColor, 'color') +
        '<div class="prop-row"><label>Surface Default</label>' +
            '<select id="ms-surfdef">' +
            '<option value=""' + (!editorMap.surfaceDefault ? ' selected' : '') + '>None (grass)</option>' +
            '<option value="tarmac"' + (editorMap.surfaceDefault === 'tarmac' ? ' selected' : '') + '>Tarmac</option>' +
            '</select></div>' +
        '<div class="prop-row"><label>Road Layout</label>' +
            '<select id="ms-roadlayout">' +
            '<option value="none"' + (editorMap.roadLayout === 'none' ? ' selected' : '') + '>None</option>' +
            '<option value="curvy"' + (editorMap.roadLayout === 'curvy' ? ' selected' : '') + '>Curvy</option>' +
            '<option value="radial"' + (editorMap.roadLayout === 'radial' ? ' selected' : '') + '>Radial</option>' +
            '</select></div>' +
        '<div id="radial-settings" style="display:' + (editorMap.roadLayout === 'radial' ? 'block' : 'none') + '">' +
            propInput('Center Radius', 'ms-rr-cr', editorMap.radialRoads ? editorMap.radialRoads.centerRadius : 520, 'number', 100, 2000) +
            propInput('Road Count', 'ms-rr-rc', editorMap.radialRoads ? editorMap.radialRoads.roadCount : 4, 'number', 1, 12) +
            propInput('Road Width', 'ms-rr-rw', editorMap.radialRoads ? editorMap.radialRoads.roadWidth : 104, 'number', 20, 300) +
            propInput('Road Length', 'ms-rr-rl', editorMap.radialRoads ? editorMap.radialRoads.roadLength : 1300, 'number', 200, 4000) +
            propInput('Start Angle°', 'ms-rr-sa', editorMap.radialRoads ? Math.round(editorMap.radialRoads.startAngle * 180 / Math.PI) : 45, 'number', 0, 360) +
        '</div>' +
        '<div class="section-divider"></div>' +
        propInput('Spawn X', 'ms-sx', editorMap.spawnCenterX, 'number') +
        propInput('Spawn Y', 'ms-sy', editorMap.spawnCenterY, 'number') +
        propInput('Spawn Radius', 'ms-sr', editorMap.spawnRadius, 'number', 100, 2000) +
        '<div class="prop-row"><label>Description</label>' +
            '<input type="text" id="ms-desc" value="' + (editorMap.description || '') + '" style="width:100%">' +
        '</div>';

    bindMapSetting('ms-name', 'name');
    bindMapSetting('ms-id', 'id');
    bindMapSettingNum('ms-aw', 'arenaWidth');
    bindMapSettingNum('ms-ah', 'arenaHeight');
    bindMapSetting('ms-bg', 'backgroundColor');
    bindMapSetting('ms-desc', 'description');

    var surfDef = document.getElementById('ms-surfdef');
    if (surfDef) surfDef.onchange = function() {
        var before = { surfaceDefault: editorMap.surfaceDefault };
        editorMap.surfaceDefault = this.value || null;
        pushUndo({ type: 'settings', before: before, after: { surfaceDefault: editorMap.surfaceDefault } });
        requestRender();
    };

    var roadLayout = document.getElementById('ms-roadlayout');
    if (roadLayout) roadLayout.onchange = function() {
        var before = { roadLayout: editorMap.roadLayout };
        editorMap.roadLayout = this.value;
        if (this.value === 'radial' && !editorMap.radialRoads) {
            editorMap.radialRoads = { centerRadius: 520, roadCount: 4, roadWidth: 104, roadLength: 1300, startAngle: Math.PI / 4 };
        }
        pushUndo({ type: 'settings', before: before, after: { roadLayout: editorMap.roadLayout } });
        document.getElementById('radial-settings').style.display = this.value === 'radial' ? 'block' : 'none';
        requestRender();
    };

    bindRadialSetting('ms-rr-cr', 'centerRadius');
    bindRadialSetting('ms-rr-rc', 'roadCount');
    bindRadialSetting('ms-rr-rw', 'roadWidth');
    bindRadialSetting('ms-rr-rl', 'roadLength');

    var saEl = document.getElementById('ms-rr-sa');
    if (saEl) saEl.oninput = function() {
        if (!editorMap.radialRoads) return;
        editorMap.radialRoads.startAngle = parseFloat(this.value) * Math.PI / 180;
        requestRender();
    };

    bindMapSettingNum('ms-sx', 'spawnCenterX');
    bindMapSettingNum('ms-sy', 'spawnCenterY');
    bindMapSettingNum('ms-sr', 'spawnRadius');
}

function bindMapSetting(elId, key) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.oninput = function() {
        editorMap[key] = el.value;
        isDirty = true;
        requestRender();
    };
}

function bindMapSettingNum(elId, key) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.oninput = function() {
        var val = parseFloat(el.value);
        if (isNaN(val)) return;
        editorMap[key] = val;
        isDirty = true;
        requestRender();
    };
}

function bindRadialSetting(elId, key) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.oninput = function() {
        if (!editorMap.radialRoads) return;
        editorMap.radialRoads[key] = parseFloat(el.value);
        requestRender();
    };
}

function refreshMapSettings() {
    buildMapSettings();
}
