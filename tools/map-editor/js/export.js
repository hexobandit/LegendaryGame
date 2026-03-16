// ================================================================
//  MAP EDITOR — Export / Import
// ================================================================

function exportMap() {
    var m = editorMap;
    var lines = [];

    lines.push('// ── ' + (m.name || m.id || 'Map') + ' ──');
    lines.push('MAPS.push({');
    lines.push("    id:              '" + m.id + "',");
    lines.push("    name:            '" + m.name + "',");
    lines.push("    description:     '" + (m.description || '') + "',");
    lines.push('');
    lines.push('    arenaWidth:      ' + m.arenaWidth + ',');
    lines.push('    arenaHeight:     ' + m.arenaHeight + ',');
    lines.push("    backgroundColor: '" + m.backgroundColor + "',");
    lines.push('');
    lines.push("    spawnLayout:     '" + (m.spawnLayout || 'circle') + "',");
    lines.push('    spawnCenterX:    ' + m.spawnCenterX + ',');
    lines.push('    spawnCenterY:    ' + m.spawnCenterY + ',');
    lines.push('    spawnRadius:     ' + m.spawnRadius + ',');
    lines.push('');
    lines.push("    wallStyle:       '" + (m.wallStyle || 'tires') + "',");
    lines.push('    surfaceDefault:  ' + (m.surfaceDefault ? "'" + m.surfaceDefault + "'" : 'null') + ',');
    lines.push('');
    lines.push("    roadLayout:      '" + m.roadLayout + "',");

    // Radial roads
    if (m.roadLayout === 'radial' && m.radialRoads) {
        var rr = m.radialRoads;
        lines.push('    radialRoads: {');
        lines.push('        centerRadius: ' + rr.centerRadius + ',');
        lines.push('        roadCount:    ' + rr.roadCount + ',');
        lines.push('        roadWidth:    ' + rr.roadWidth + ',');
        lines.push('        roadLength:   ' + rr.roadLength + ',');
        lines.push('        startAngle:   ' + roundNum(rr.startAngle) + ',');
        lines.push('    },');
    } else {
        lines.push('    radialRoads:     null,');
    }

    // Curvy roads
    if (m.curvyRoads.length > 0) {
        lines.push('    curvyRoads: [');
        for (var ri = 0; ri < m.curvyRoads.length; ri++) {
            var road = m.curvyRoads[ri];
            lines.push('        {');
            lines.push('            width: ' + (road.width || 60) + ',');
            if (road.color) lines.push("            color: '" + road.color + "',");
            if (road.edgeColor) lines.push("            edgeColor: '" + road.edgeColor + "',");
            if (road.centerColor) lines.push("            centerColor: '" + road.centerColor + "',");
            if (road.surface) lines.push("            surface: '" + road.surface + "',");
            if (road.closedLoop) lines.push('            closedLoop: true,');
            lines.push('            points: [');
            for (var pi = 0; pi < road.points.length; pi++) {
                var p = road.points[pi];
                lines.push('                { x: ' + Math.round(p.x) + ', y: ' + Math.round(p.y) + ' },');
            }
            lines.push('            ],');
            lines.push('        },');
        }
        lines.push('    ],');
    }

    // Terrain — group editor objects and surfaces into terrain config
    lines.push('');
    lines.push('    terrain: {');

    // Count-based entries for procedural stuff (set to 0 for editor maps)
    lines.push('        grassPatches: { count: 0, radiusMin: 0, radiusMax: 0 },');
    lines.push('        dirtPatches:  { count: 0, radiusMin: 0, radiusMax: 0 },');
    lines.push('        mudPatches:   { count: 0, radiusMin: 0, radiusMax: 0 },');

    // Water puddles from editor surfaces
    var waters = editorSurfaces.filter(function(s) { return s.type === 'water'; });
    if (waters.length > 0) {
        lines.push('        waterPuddles: { count: 0, radiusMin: 0, radiusMax: 0 },');
        lines.push('        ponds: [');
        for (var i = 0; i < waters.length; i++) {
            lines.push('            { x: ' + Math.round(waters[i].x) + ', y: ' + Math.round(waters[i].y) + ', r: ' + Math.round(waters[i].r) + ' },');
        }
        lines.push('        ],');
    } else {
        lines.push('        waterPuddles: { count: 0, radiusMin: 0, radiusMax: 0 },');
    }

    // Oil slicks
    var oils = editorSurfaces.filter(function(s) { return s.type === 'oil'; });
    if (oils.length > 0) {
        lines.push('        oilSlicks:    { count: 0, radiusMin: 0, radiusMax: 0 },');
        // Export as explicit entries via obstacles-style array
        // The game terrain.js doesn't support explicit oil yet, so we use count-based
        // TODO: patch terrain.js to support explicit oil arrays
    } else {
        lines.push('        oilSlicks:    { count: 0, radiusMin: 0, radiusMax: 0 },');
    }

    // Ice patches
    var ices = editorSurfaces.filter(function(s) { return s.type === 'ice'; });
    if (ices.length > 0) {
        lines.push('        icePatches:   { count: 0, radiusMin: 0, radiusMax: 0 },');
    }

    // Sand traps
    var sands = editorSurfaces.filter(function(s) { return s.type === 'sand'; });
    if (sands.length > 0) {
        lines.push('        sandTraps:    { count: 0, radiusMin: 0, radiusMax: 0 },');
    }

    // Bushes
    var bushObjs = editorObjects.filter(function(o) { return o.type === 'bush'; });
    lines.push('        bushes:       { count: 0, radiusMin: 0, radiusMax: 0 },');

    // Bumps
    var bumpObjs = editorObjects.filter(function(o) { return o.type === 'bump'; });
    lines.push('        bumps:        { count: 0, radiusMin: 0, radiusMax: 0 },');

    // Boulders
    var boulderObjs = editorObjects.filter(function(o) { return o.type === 'boulder'; });
    lines.push('        boulders:     { count: 0 },');

    // Ramps
    var rampObjs = editorObjects.filter(function(o) { return o.type === 'ramp'; });
    lines.push('        ramps:        { count: 0 },');

    // Palm trees
    var palmObjs = editorObjects.filter(function(o) { return o.type === 'palm_tree'; });
    if (palmObjs.length > 0) {
        lines.push('        palmTrees:    { count: 0 },');
    }

    // Breakables — group by type
    var breakableTypes = {};
    editorObjects.forEach(function(o) {
        var def = OBJECT_TYPES[o.type];
        if (def && def.category === 'breakable') {
            if (!breakableTypes[o.type]) breakableTypes[o.type] = 0;
            breakableTypes[o.type]++;
        }
    });
    var btKeys = Object.keys(breakableTypes);
    if (btKeys.length > 0) {
        lines.push('        breakables: [');
        for (var i = 0; i < btKeys.length; i++) {
            lines.push("            { type: '" + btKeys[i] + "', count: " + breakableTypes[btKeys[i]] + ' },');
        }
        lines.push('        ],');
    } else {
        lines.push('        breakables: [],');
    }

    // Pillars
    var pillarObjs = editorObjects.filter(function(o) { return o.type === 'pillar'; });

    lines.push('        flowerBushRatio: 0.3,');
    lines.push('    },');

    // Surface friction
    if (m.surfaceFriction && Object.keys(m.surfaceFriction).length > 0) {
        lines.push('');
        lines.push('    surfaceFriction: {');
        var sfKeys = Object.keys(m.surfaceFriction);
        for (var i = 0; i < sfKeys.length; i++) {
            lines.push('        ' + sfKeys[i] + ': ' + m.surfaceFriction[sfKeys[i]] + ',');
        }
        lines.push('    },');
    } else {
        lines.push('');
        lines.push('    surfaceFriction: null,');
    }

    // Explicit obstacles array (boulders, pillars, palm trunks)
    var explicitObs = [];
    boulderObjs.forEach(function(o) {
        explicitObs.push("        { x: " + Math.round(o.x) + ", y: " + Math.round(o.y) + ", r: " + Math.round(o.r || 25) + ", color: '#8a7a6a', type: 'boulder', seed: " + (Math.random() * 1000 | 0) + " },");
    });
    pillarObjs.forEach(function(o) {
        explicitObs.push("        { x: " + Math.round(o.x) + ", y: " + Math.round(o.y) + ", r: " + Math.round(o.r || 22) + ", color: '#777' },");
    });
    palmObjs.forEach(function(o) {
        explicitObs.push("        { x: " + Math.round(o.x) + ", y: " + Math.round(o.y) + ", r: 7, color: '#8a6a3a', type: 'palm_trunk' },");
    });

    if (explicitObs.length > 0) {
        lines.push('    obstacles: [');
        lines.push(explicitObs.join('\n'));
        lines.push('    ],');
    } else {
        lines.push('    obstacles:       [],');
    }

    // Ambient particles
    lines.push('    ambientParticles: null,');
    lines.push('});');

    return lines.join('\n');
}

function roundNum(n) {
    return Math.round(n * 1000) / 1000;
}

// ── Export modal ──

function showExportModal() {
    var modal = document.getElementById('export-modal');
    var textarea = document.getElementById('export-text');
    if (!modal || !textarea) return;
    textarea.value = exportMap();
    modal.style.display = 'flex';
}

function hideExportModal() {
    document.getElementById('export-modal').style.display = 'none';
}

function copyExport() {
    var textarea = document.getElementById('export-text');
    textarea.select();
    document.execCommand('copy');
    var btn = document.getElementById('copy-btn');
    btn.textContent = 'COPIED!';
    setTimeout(function() { btn.textContent = 'COPY TO CLIPBOARD'; }, 1500);
}

function downloadExport() {
    var text = document.getElementById('export-text').value;
    var blob = new Blob([text], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (editorMap.id || 'map') + '.js';
    a.click();
}

// ── Import ──

function showImportModal() {
    var modal = document.getElementById('import-modal');
    if (modal) modal.style.display = 'flex';
}

function hideImportModal() {
    document.getElementById('import-modal').style.display = 'none';
}

function importFromText() {
    var textarea = document.getElementById('import-text');
    if (!textarea) return;
    var text = textarea.value.trim();

    // Strip comment lines at the top
    text = text.replace(/^\/\/.*\n?/gm, '').trim();

    // Strip MAPS.push( ... ); wrapper if present
    var pushMatch = text.match(/^MAPS\.push\s*\(([\s\S]*)\)\s*;?\s*$/);
    if (pushMatch) {
        text = pushMatch[1].trim();
    }

    try {
        // Wrap in parens to make it an expression
        var mapData = eval('(' + text + ')');
        loadMapData(mapData);
        hideImportModal();
    } catch (e) {
        alert('Import failed: ' + e.message);
    }
}

function loadMapData(data) {
    // Reset
    editorObjects = [];
    editorSurfaces = [];
    clearHistory();
    selection = [];
    nextId = 1;

    // Map settings
    editorMap = {
        id: data.id || 'imported',
        name: data.name || 'Imported Map',
        description: data.description || '',
        arenaWidth: data.arenaWidth || 3200,
        arenaHeight: data.arenaHeight || 3200,
        backgroundColor: data.backgroundColor || '#4a6e2a',
        surfaceDefault: data.surfaceDefault || null,
        wallStyle: data.wallStyle || 'tires',
        roadLayout: data.roadLayout || 'none',
        radialRoads: data.radialRoads ? cloneObj(data.radialRoads) : null,
        curvyRoads: data.curvyRoads ? cloneObj(data.curvyRoads) : [],
        spawnCenterX: data.spawnCenterX || data.arenaWidth / 2 || 1600,
        spawnCenterY: data.spawnCenterY || data.arenaHeight / 2 || 1600,
        spawnRadius: data.spawnRadius || 550,
        spawnLayout: data.spawnLayout || 'circle',
        surfaceFriction: data.surfaceFriction ? cloneObj(data.surfaceFriction) : {},
        ambientParticles: data.ambientParticles || null,
    };

    // Import explicit obstacles
    if (data.obstacles) {
        for (var i = 0; i < data.obstacles.length; i++) {
            var obs = data.obstacles[i];
            var type = 'boulder';
            if (obs.type === 'palm_trunk') type = 'palm_tree';
            else if (obs.color === '#777') type = 'pillar';
            editorObjects.push({
                _id: newId(),
                type: type,
                x: obs.x,
                y: obs.y,
                r: obs.r || 25,
                angle: 0,
            });
        }
    }

    // Import ponds as water surfaces
    if (data.terrain && data.terrain.ponds) {
        for (var i = 0; i < data.terrain.ponds.length; i++) {
            var pond = data.terrain.ponds[i];
            editorSurfaces.push({
                _id: newId(),
                type: 'water',
                x: pond.x,
                y: pond.y,
                r: pond.r,
            });
        }
    }

    buildMapSettings();
    buildPalette();
    fitToArena();
    requestRender();
}

// ── localStorage save/load ──

function autosave() {
    var data = {
        map: editorMap,
        objects: editorObjects,
        surfaces: editorSurfaces,
        nextId: nextId,
    };
    try {
        localStorage.setItem('mapeditor_autosave', JSON.stringify(data));
    } catch (e) {}
}

function loadAutosave() {
    try {
        var data = JSON.parse(localStorage.getItem('mapeditor_autosave'));
        if (data && data.map) {
            editorMap = data.map;
            editorObjects = data.objects || [];
            editorSurfaces = data.surfaces || [];
            nextId = data.nextId || 1;
            return true;
        }
    } catch (e) {}
    return false;
}

function clearAutosave() {
    localStorage.removeItem('mapeditor_autosave');
}
