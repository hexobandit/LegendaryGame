// ================================================================
//  TERRAIN — generation & tarmac detection
//  Reads layout from currentMap (radialRoads, terrain, arenaWidth/Height)
// ================================================================

// Default properties for each breakable type
var BREAKABLE_DEFAULTS = {
    trolley:    { r: 12, hp: 12, color: '#999', mass: 0.6 },
    bin:        { r: 14, hp: 25, color: '#454', mass: 0.8 },
    crate:      { r: 14, hp: 18, color: '#8a6a3a', mass: 1.0 },
    barrel:     { r: 15, hp: 20, color: '#c33', mass: 1.2 },
    pallet:     { r: 16, hp: 30, color: '#6a5030', mass: 1.5 },
    bench:      { r: 14, hp: 10, color: '#8a6a3a', mass: 0.8 },
    tire_stack: { r: 16, hp: 50, color: '#333', mass: 1.0 },
    hay:        { r: 17, hp: 20, color: '#c8a040', mass: 0.7 },
    container:  { r: 28, hp: 200, color: '#2266aa', mass: 8.0 },
};

function isOnTarmac(x, y) {
    if (currentMap.surfaceDefault === 'tarmac') return true;

    var rr = currentMap.radialRoads;
    if (!rr) return false;

    var aw = currentMap.arenaWidth;
    var ah = currentMap.arenaHeight;
    var cx = aw / 2, cy = ah / 2;
    var dx = x - cx, dy = y - cy, dist = Math.hypot(dx, dy);

    if (dist < rr.centerRadius) return true;

    var maxRoadDist = Math.max(aw, ah) * 0.58;
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

function generateTerrain() {
    grassPatches = [];
    dirtPatches  = [];
    mudPatches   = [];
    waterPuddles = [];
    oilSlicks    = [];
    bushes       = [];
    bumps        = [];
    breakables   = [];
    ramps        = [];
    icePatches   = [];
    sandTraps    = [];
    palmTrees    = [];

    var aw = currentMap.arenaWidth;
    var ah = currentMap.arenaHeight;
    var t;

    // Copy obstacles (so we can add generated ones without mutating map data)
    obstacles = (currentMap.obstacles || []).slice();

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

    // Mud patches — avoid tarmac
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

    // Ponds — large water bodies defined in map config
    if (currentMap.terrain.ponds) {
        for (var i = 0; i < currentMap.terrain.ponds.length; i++) {
            var pond = currentMap.terrain.ponds[i];
            waterPuddles.push({
                x: pond.x, y: pond.y, r: pond.r,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // Water puddles
    t = currentMap.terrain.waterPuddles;
    for (var i = 0; i < t.count; i++) {
        var wx = 200 + Math.random() * (aw - 400);
        var wy = 200 + Math.random() * (ah - 400);
        waterPuddles.push({
            x: wx, y: wy,
            r: t.radiusMin + Math.random() * (t.radiusMax - t.radiusMin),
            phase: Math.random() * Math.PI * 2
        });
    }

    // Oil slicks
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

    // Oil trails — long thin elongated oil slicks
    if (currentMap.terrain.oilTrails) {
        var otc = currentMap.terrain.oilTrails;
        for (var i = 0; i < otc.count; i++) {
            var otx = 300 + Math.random() * (aw - 600);
            var oty = 300 + Math.random() * (ah - 600);
            oilSlicks.push({
                x: otx, y: oty,
                rx: 60 + Math.random() * 50,
                ry: 6 + Math.random() * 6,
                angle: Math.random() * Math.PI * 2,
                trail: true
            });
        }
    }

    // Ice patches
    if (currentMap.terrain.icePatches) {
        var ipc = currentMap.terrain.icePatches;
        for (var i = 0; i < ipc.count; i++) {
            var ix = 200 + Math.random() * (aw - 400);
            var iy = 200 + Math.random() * (ah - 400);
            icePatches.push({
                x: ix, y: iy,
                r: ipc.radiusMin + Math.random() * (ipc.radiusMax - ipc.radiusMin)
            });
        }
    }

    // Sand traps
    if (currentMap.terrain.sandTraps) {
        var stc = currentMap.terrain.sandTraps;
        for (var i = 0; i < stc.count; i++) {
            var sx = 300 + Math.random() * (aw - 600);
            var sy = 300 + Math.random() * (ah - 600);
            if (Math.hypot(sx - aw / 2, sy - ah / 2) < 350) continue;
            sandTraps.push({
                x: sx, y: sy,
                r: stc.radiusMin + Math.random() * (stc.radiusMax - stc.radiusMin)
            });
        }
    }

    // Bushes — avoid tarmac + center
    t = currentMap.terrain.bushes;
    var flowerRatio = currentMap.terrain.flowerBushRatio || 0;
    for (var i = 0; i < t.count; i++) {
        var bx = 150 + Math.random() * (aw - 300);
        var by = 150 + Math.random() * (ah - 300);
        if (isOnTarmac(bx, by)) continue;
        if (Math.hypot(bx - aw / 2, by - ah / 2) < 400) continue;
        var bush = {
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
        };
        // Flowering bush variant
        if (Math.random() < flowerRatio) {
            bush.flowers = [];
            var fc = 4 + (Math.random() * 4 | 0);
            var fColors = ['#f6a','#fa4','#ff6','#faf','#f84','#f66'];
            for (var fi = 0; fi < fc; fi++) {
                bush.flowers.push({
                    dx: (Math.random() - .5) * 24,
                    dy: (Math.random() - .5) * 24,
                    r: 2 + Math.random() * 2,
                    color: fColors[Math.random() * fColors.length | 0]
                });
            }
        }
        bushes.push(bush);
    }

    // Pond-edge bushes — clustered around water bodies like a real oasis
    if (currentMap.terrain.pondBushes && currentMap.terrain.ponds) {
        var pb = currentMap.terrain.pondBushes;
        for (var pi = 0; pi < currentMap.terrain.ponds.length; pi++) {
            var pond = currentMap.terrain.ponds[pi];
            for (var i = 0; i < pb.countPerPond; i++) {
                var ang = Math.random() * Math.PI * 2;
                var dist = pond.r + 10 + Math.random() * pb.spread;
                var bx = pond.x + Math.cos(ang) * dist;
                var by = pond.y + Math.sin(ang) * dist;
                if (bx < 100 || bx > aw - 100 || by < 100 || by > ah - 100) continue;
                var pbush = {
                    x: bx, y: by,
                    r: pb.radiusMin + Math.random() * (pb.radiusMax - pb.radiusMin),
                    leaves: Array.from({length: 6 + (Math.random() * 6 | 0)}, function() {
                        return {
                            dx: (Math.random() - .5) * 35,
                            dy: (Math.random() - .5) * 35,
                            r: 7 + Math.random() * 12,
                            shade: Math.random() * 0.3
                        };
                    })
                };
                if (Math.random() < flowerRatio) {
                    pbush.flowers = [];
                    var fc = 3 + (Math.random() * 3 | 0);
                    var fColors = ['#f6a','#fa4','#ff6','#faf'];
                    for (var fi = 0; fi < fc; fi++) {
                        pbush.flowers.push({
                            dx: (Math.random() - .5) * 24,
                            dy: (Math.random() - .5) * 24,
                            r: 2 + Math.random() * 2,
                            color: fColors[Math.random() * fColors.length | 0]
                        });
                    }
                }
                bushes.push(pbush);
            }
        }
    }

    // Bumps — on roads only (with attempt limit to avoid infinite loops)
    t = currentMap.terrain.bumps;
    var bumpAttempts = 0;
    for (var i = 0; i < t.count && bumpAttempts < t.count * 20; i++) {
        var bx = 300 + Math.random() * (aw - 600);
        var by = 300 + Math.random() * (ah - 600);
        bumpAttempts++;
        if (!isOnTarmac(bx, by)) { i--; continue; }
        if (Math.hypot(bx - aw / 2, by - ah / 2) < 200) continue;
        bumps.push({
            x: bx, y: by,
            r: t.radiusMin + Math.random() * (t.radiusMax - t.radiusMin),
            angle: Math.random() * Math.PI
        });
    }

    // Boulders — add to obstacles with type
    if (currentMap.terrain.boulders) {
        var bc = currentMap.terrain.boulders;
        for (var i = 0; i < bc.count; i++) {
            var bx = 300 + Math.random() * (aw - 600);
            var by = 300 + Math.random() * (ah - 600);
            if (Math.hypot(bx - aw / 2, by - ah / 2) < 400) continue;
            obstacles.push({
                x: bx, y: by,
                r: bc.radiusMin + Math.random() * (bc.radiusMax - bc.radiusMin),
                color: '#8a7a6a',
                type: 'boulder',
                seed: Math.random() * 1000 | 0
            });
        }
    }

    // Palm trees — trunk as obstacle, fronds stored for visual rendering
    if (currentMap.terrain.palmTrees) {
        var ptc = currentMap.terrain.palmTrees;
        for (var i = 0; i < ptc.count; i++) {
            var px = 300 + Math.random() * (aw - 600);
            var py = 300 + Math.random() * (ah - 600);
            if (Math.hypot(px - aw / 2, py - ah / 2) < 400) continue;
            // Check distance from ponds — place near them preferentially
            var nearPond = false;
            if (currentMap.terrain.ponds) {
                for (var pi = 0; pi < currentMap.terrain.ponds.length; pi++) {
                    var pond = currentMap.terrain.ponds[pi];
                    if (Math.hypot(px - pond.x, py - pond.y) < pond.r + 200) nearPond = true;
                }
            }
            if (!nearPond && Math.random() < 0.5) continue; // Prefer near ponds
            // Trunk obstacle
            obstacles.push({
                x: px, y: py, r: 7,
                color: '#8a6a3a', type: 'palm_trunk'
            });
            // Frond visual data
            var frondCount = 5 + (Math.random() * 3 | 0);
            var fronds = [];
            for (var fi = 0; fi < frondCount; fi++) {
                var fa = (fi / frondCount) * Math.PI * 2 + Math.random() * 0.4;
                fronds.push({
                    angle: fa,
                    len: 22 + Math.random() * 14,
                    width: 8 + Math.random() * 5,
                    shade: 0.7 + Math.random() * 0.3
                });
            }
            palmTrees.push({ x: px, y: py, fronds: fronds });
        }
    }

    // Pillars — concrete columns generated in a grid
    if (currentMap.terrain.pillars) {
        var pg = currentMap.terrain.pillars;
        for (var row = 0; row < pg.rows; row++) {
            for (var col = 0; col < pg.cols; col++) {
                obstacles.push({
                    x: pg.startX + col * pg.spacingX,
                    y: pg.startY + row * pg.spacingY,
                    r: pg.r,
                    color: pg.color
                });
            }
        }
    }

    // Breakables — all types from BREAKABLE_DEFAULTS
    if (currentMap.terrain.breakables) {
        var blist = currentMap.terrain.breakables;
        for (var bi = 0; bi < blist.length; bi++) {
            var bdef = blist[bi];
            var defaults = BREAKABLE_DEFAULTS[bdef.type];
            if (!defaults) continue;
            for (var i = 0; i < bdef.count; i++) {
                var bx = 200 + Math.random() * (aw - 400);
                var by = 200 + Math.random() * (ah - 400);
                // Avoid spawn area center
                if (Math.hypot(bx - aw / 2, by - ah / 2) < 300) continue;
                // Avoid existing obstacles
                var tooClose = false;
                for (var oi = 0; oi < obstacles.length; oi++) {
                    if (Math.hypot(bx - obstacles[oi].x, by - obstacles[oi].y) < obstacles[oi].r + 30) {
                        tooClose = true; break;
                    }
                }
                if (tooClose) continue;
                breakables.push({
                    x: bx, y: by, type: bdef.type,
                    r: defaults.r, hp: defaults.hp, maxHp: defaults.hp,
                    angle: Math.random() * Math.PI * 2,
                    color: defaults.color, mass: defaults.mass,
                    vx: 0, vy: 0, spinRate: 0
                });
            }
        }
    }

    // Ramps — jump zones scattered around the arena
    var rampConfigs = currentMap.terrain.ramps;
    if (rampConfigs && !Array.isArray(rampConfigs)) rampConfigs = [rampConfigs];
    if (rampConfigs) {
        for (var ri = 0; ri < rampConfigs.length; ri++) {
            var rc = rampConfigs[ri];
            for (var i = 0; i < rc.count; i++) {
                var rx = 300 + Math.random() * (aw - 600);
                var ry = 300 + Math.random() * (ah - 600);
                if (Math.hypot(rx - aw / 2, ry - ah / 2) < 400) continue;
                var rampOk = true;
                for (var oi = 0; oi < obstacles.length; oi++) {
                    if (Math.hypot(rx - obstacles[oi].x, ry - obstacles[oi].y) < obstacles[oi].r + 80) {
                        rampOk = false; break;
                    }
                }
                for (var wi = 0; wi < waterPuddles.length; wi++) {
                    if (Math.hypot(rx - waterPuddles[wi].x, ry - waterPuddles[wi].y) < waterPuddles[wi].r + 60) {
                        rampOk = false; break;
                    }
                }
                if (!rampOk) continue;
                ramps.push({
                    x: rx, y: ry,
                    w: rc.wMin + Math.random() * (rc.wMax - rc.wMin),
                    h: rc.hMin + Math.random() * (rc.hMax - rc.hMin),
                    angle: Math.random() * Math.PI * 2,
                    style: rc.style
                });
            }
        }
    }
}
