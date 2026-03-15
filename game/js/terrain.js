// ================================================================
//  TERRAIN — generation & tarmac detection
//  Reads layout from currentMap (radialRoads, terrain, arenaWidth/Height)
// ================================================================

/**
 * Check whether (x, y) is on a tarmac surface (center circle + radial roads).
 * Layout is driven by currentMap.radialRoads:
 *   { centerRadius, roadCount, roadWidth, startAngle }
 */
function isOnTarmac(x, y) {
    var aw = currentMap.arenaWidth;
    var ah = currentMap.arenaHeight;
    var cx = aw / 2, cy = ah / 2;
    var dx = x - cx, dy = y - cy, dist = Math.hypot(dx, dy);

    var rr = currentMap.radialRoads;
    if (dist < rr.centerRadius) return true;

    // Radial road spokes
    var maxRoadDist = Math.max(aw, ah) * 0.58;   // don't extend beyond arena
    if (dist < maxRoadDist) {
        var ang = Math.atan2(dy, dx);
        for (var i = 0; i < rr.roadCount; i++) {
            var roadAng = (i / rr.roadCount) * Math.PI * 2 + rr.startAngle;
            if (Math.cos(ang - roadAng) * dist > 0 &&
                Math.abs(Math.sin(ang - roadAng)) * dist < rr.roadWidth) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Populate the global terrain arrays using counts / ranges from currentMap.terrain.
 *
 * Expected currentMap.terrain shape:
 *   grassPatches:  { count, radiusMin, radiusMax }
 *   dirtPatches:   { count, radiusMin, radiusMax }
 *   mudPatches:    { count, radiusMin, radiusMax }
 *   waterPuddles:  { count, radiusMin, radiusMax }
 *   oilSlicks:     { count, rxMin, rxMax, ryMin, ryMax }
 *   bushes:        { count, radiusMin, radiusMax }
 *   bumps:         { count, radiusMin, radiusMax }
 */
function generateTerrain() {
    grassPatches = [];
    dirtPatches  = [];
    mudPatches   = [];
    waterPuddles = [];
    oilSlicks    = [];
    bushes       = [];
    bumps        = [];

    var aw = currentMap.arenaWidth;
    var ah = currentMap.arenaHeight;
    var t;

    // Grass patches
    t = currentMap.terrain.grassPatches;
    for (var i = 0; i < t.count; i++) {
        grassPatches.push({
            x: Math.random() * aw,
            y: Math.random() * ah,
            r: t.radiusMin + Math.random() * (t.radiusMax - t.radiusMin),
            shade: Math.random() * 0.15
        });
    }

    // Dirt patches
    t = currentMap.terrain.dirtPatches;
    for (var i = 0; i < t.count; i++) {
        dirtPatches.push({
            x: Math.random() * aw,
            y: Math.random() * ah,
            r: t.radiusMin + Math.random() * (t.radiusMax - t.radiusMin),
            shade: Math.random() * 0.1
        });
    }

    // Mud patches — placed on grass/dirt areas (avoid tarmac)
    t = currentMap.terrain.mudPatches;
    for (var i = 0; i < t.count; i++) {
        var mx = 200 + Math.random() * (aw - 400);
        var my = 200 + Math.random() * (ah - 400);
        if (isOnTarmac(mx, my)) continue;
        mudPatches.push({
            x: mx, y: my,
            r: t.radiusMin + Math.random() * (t.radiusMax - t.radiusMin)
        });
    }

    // Water puddles — scattered, some on roads too
    t = currentMap.terrain.waterPuddles;
    for (var i = 0; i < t.count; i++) {
        var wx = 200 + Math.random() * (aw - 400);
        var wy = 200 + Math.random() * (ah - 400);
        waterPuddles.push({
            x: wx, y: wy,
            r: t.radiusMin + Math.random() * (t.radiusMax - t.radiusMin),
            phase: Math.random() * Math.PI * 2  // for ripple animation
        });
    }

    // Oil slicks — on or near roads (elliptical: rx / ry)
    // Supports either { rxMin, rxMax, ryMin, ryMax } or { radiusMin, radiusMax }
    t = currentMap.terrain.oilSlicks;
    for (var i = 0; i < t.count; i++) {
        var ox = 300 + Math.random() * (aw - 600);
        var oy = 300 + Math.random() * (ah - 600);
        var ang = Math.random() * Math.PI * 2;
        var rMin = t.radiusMin || t.rxMin || 20;
        var rMax = t.radiusMax || t.rxMax || 50;
        var baseR = rMin + Math.random() * (rMax - rMin);
        oilSlicks.push({
            x: ox, y: oy,
            rx: t.rxMin ? (t.rxMin + Math.random() * (t.rxMax - t.rxMin)) : baseR * (0.8 + Math.random() * 0.4),
            ry: t.ryMin ? (t.ryMin + Math.random() * (t.ryMax - t.ryMin)) : baseR * (0.5 + Math.random() * 0.3),
            angle: ang
        });
    }

    // Bushes — on grass areas only (avoid tarmac + center)
    t = currentMap.terrain.bushes;
    for (var i = 0; i < t.count; i++) {
        var bx = 150 + Math.random() * (aw - 300);
        var by = 150 + Math.random() * (ah - 300);
        if (isOnTarmac(bx, by)) continue;
        if (Math.hypot(bx - aw / 2, by - ah / 2) < 400) continue;
        bushes.push({
            x: bx, y: by,
            r: t.radiusMin + Math.random() * (t.radiusMax - t.radiusMin),
            leaves: Array.from({length: 5 + (Math.random() * 5 | 0)}, function() {
                return {
                    dx: (Math.random() - .5) * 30,
                    dy: (Math.random() - .5) * 30,
                    r: 6 + Math.random() * 10,
                    shade: Math.random() * 0.3
                };
            })
        });
    }

    // Bumps / speed bumps — on roads only (avoid center)
    t = currentMap.terrain.bumps;
    for (var i = 0; i < t.count; i++) {
        var bx = 300 + Math.random() * (aw - 600);
        var by = 300 + Math.random() * (ah - 600);
        if (!isOnTarmac(bx, by)) { i--; continue; }
        if (Math.hypot(bx - aw / 2, by - ah / 2) < 200) continue;
        bumps.push({
            x: bx, y: by,
            r: t.radiusMin + Math.random() * (t.radiusMax - t.radiusMin),
            angle: Math.random() * Math.PI
        });
    }

    // Obstacles come from the map definition (e.g. walls, barrels)
    obstacles = currentMap.obstacles || [];
}
