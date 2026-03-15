// ================================================================
//  MAPS — Add or tweak arenas here!
//
//  WHAT THE FIELDS MEAN:
//    id              — Unique short name (used in code, no spaces)
//    name            — Display name shown to the player
//    description     — One-line summary
//    arenaWidth/Height — Total arena size in pixels
//    backgroundColor — Hex color for the ground fill
//    surfaceDefault  — If 'tarmac', entire map is tarmac. Otherwise null.
//    radialRoads     — Radial road layout config (null = no roads)
//    terrain         — Terrain feature counts and configs
//    surfaceFriction — Override default grip/friction values (null = CONFIG)
//    ambientParticles — Floating particles for atmosphere (null = none)
// ================================================================
const MAPS = [

    // ── Classic Arena ─────────────────────────────────────────────
    {
        id:              'arena',
        name:            'Classic Arena',
        description:     'Grass, tire walls, roads.',

        arenaWidth:      3200,
        arenaHeight:     3200,
        backgroundColor: '#4a6e2a',

        spawnLayout:     'circle',
        spawnCenterX:    1600,
        spawnCenterY:    1600,
        spawnRadius:     550,

        wallStyle:       'tires',
        surfaceDefault:  null,

        roadLayout:      'radial',
        radialRoads: {
            centerRadius: 520,
            roadCount:    4,
            roadWidth:    104,
            roadLength:   1300,
            startAngle:   Math.PI / 4,
        },

        terrain: {
            grassPatches: { count: 250, radiusMin: 15, radiusMax: 60  },
            dirtPatches:  { count: 90,  radiusMin: 10, radiusMax: 40  },
            mudPatches:   { count: 12,  radiusMin: 30, radiusMax: 80  },
            waterPuddles: { count: 8,   radiusMin: 25, radiusMax: 65  },
            oilSlicks:    { count: 6,   radiusMin: 20, radiusMax: 50  },
            bushes:       { count: 18,  radiusMin: 18, radiusMax: 40  },
            bumps:        { count: 10,  radiusMin: 12, radiusMax: 22  },
            ramps:        { count: 5, style: 'dirt_mound', wMin: 110, wMax: 160, hMin: 55, hMax: 85 },
            boulders:     { count: 5, radiusMin: 18, radiusMax: 28 },
            flowerBushRatio: 0.3,
            breakables: [
                { type: 'crate', count: 6 },
                { type: 'barrel', count: 3 },
                { type: 'hay', count: 5 },
                { type: 'bench', count: 4 },
                { type: 'tire_stack', count: 3 },
            ],
        },

        surfaceFriction: null,
        obstacles:       [],
        ambientParticles: null,
    },

    // ── Desert Oasis ─────────────────────────────────────────────
    // No asphalt. Just sand, a big lagoon, and palm-like bushes.
    {
        id:              'desert',
        name:            'Desert Oasis',
        description:     'Sandy trails and lagoon.',

        arenaWidth:      3600,
        arenaHeight:     3600,
        backgroundColor: '#c2a55a',

        spawnLayout:     'circle',
        spawnCenterX:    1800,
        spawnCenterY:    1800,
        spawnRadius:     550,

        wallStyle:       'tires',
        surfaceDefault:  null,

        roadLayout:      'curvy',
        radialRoads:     null,
        curvyRoads: [
            {
                width: 80,
                color: '#a08040',
                edgeColor: 'rgba(80,60,20,.35)',
                centerColor: 'rgba(60,40,10,.2)',
                surface: 'dirt',
                points: [
                    { x: 400,  y: 3200 },
                    { x: 700,  y: 2600 },
                    { x: 1200, y: 2400 },
                    { x: 1500, y: 1800 },
                    { x: 1200, y: 1200 },
                    { x: 1800, y: 800  },
                    { x: 2500, y: 1100 },
                    { x: 2800, y: 1700 },
                    { x: 2400, y: 2300 },
                    { x: 2900, y: 2800 },
                    { x: 3200, y: 3200 },
                ],
            },
        ],

        terrain: {
            grassPatches: { count: 0,   radiusMin: 0,  radiusMax: 0   },
            dirtPatches:  { count: 220, radiusMin: 15, radiusMax: 70  },
            mudPatches:   { count: 6,   radiusMin: 25, radiusMax: 60  },
            waterPuddles: { count: 4,   radiusMin: 30, radiusMax: 70  },
            oilSlicks:    { count: 5,   radiusMin: 20, radiusMax: 45  },
            bushes:       { count: 25,  radiusMin: 20, radiusMax: 50  },
            pondBushes:   { countPerPond: 18, radiusMin: 18, radiusMax: 45, spread: 80 },
            bumps:        { count: 0,   radiusMin: 0,  radiusMax: 0   },
            ramps:        { count: 4, style: 'sand_dune', wMin: 130, wMax: 180, hMin: 60, hMax: 90 },
            ponds: [
                { x: 1800, y: 1500, r: 280 },
                { x: 1500, y: 2100, r: 200 },
            ],
            boulders:     { count: 8, radiusMin: 16, radiusMax: 30 },
            sandTraps:    { count: 6, radiusMin: 30, radiusMax: 55 },
            oilTrails:    { count: 2 },
            palmTrees:    { count: 12 },
            flowerBushRatio: 0.4,
            breakables: [
                { type: 'barrel', count: 2 },
                { type: 'pallet', count: 3 },
                { type: 'hay', count: 6 },
                { type: 'crate', count: 3 },
            ],
        },

        surfaceFriction: {
            grassGrip:      0.84,
            grassFriction:  0.958,
            dirtGrip:       0.83,
        },

        obstacles:       [],

        ambientParticles: {
            type:     'sand',
            count:    40,
            color:    'rgba(194,165,90,0.4)',
            sizeMin:  1,
            sizeMax:  3,
            speedMin: 0.5,
            speedMax: 2.0,
        },
    },

    // ── Frozen Lake ──────────────────────────────────────────────
    // Icy wilderness with a winding road and a frozen lake in the corner.
    {
        id:              'snow',
        name:            'Frozen Lake',
        description:     'Icy roads, frozen lake.',

        arenaWidth:      3200,
        arenaHeight:     3200,
        backgroundColor: '#d8e8f0',

        spawnLayout:     'circle',
        spawnCenterX:    1600,
        spawnCenterY:    1600,
        spawnRadius:     550,

        wallStyle:       'tires',
        surfaceDefault:  null,

        roadLayout:      'curvy',
        radialRoads:     null,
        curvyRoads: [
            {
                width: 90,
                points: [
                    { x: 300,  y: 2800 },
                    { x: 700,  y: 2200 },
                    { x: 1300, y: 2500 },
                    { x: 1600, y: 1800 },
                    { x: 1200, y: 1200 },
                    { x: 1700, y: 700  },
                    { x: 2300, y: 1000 },
                    { x: 2500, y: 1700 },
                    { x: 2100, y: 2300 },
                    { x: 2900, y: 2800 },
                ],
            },
        ],

        terrain: {
            grassPatches: { count: 200, radiusMin: 15, radiusMax: 60  },
            dirtPatches:  { count: 60,  radiusMin: 10, radiusMax: 40  },
            mudPatches:   { count: 6,   radiusMin: 30, radiusMax: 80  },
            waterPuddles: { count: 10,  radiusMin: 25, radiusMax: 65  },
            oilSlicks:    { count: 8,   radiusMin: 20, radiusMax: 50  },
            bushes:       { count: 30,  radiusMin: 18, radiusMax: 40  },
            bumps:        { count: 8,   radiusMin: 12, radiusMax: 22  },
            ramps:        { count: 5, style: 'ice_ridge', wMin: 100, wMax: 150, hMin: 50, hMax: 80 },
            boulders:     { count: 6, radiusMin: 16, radiusMax: 26 },
            icePatches:   { count: 14, radiusMin: 35, radiusMax: 65 },
            ponds: [
                { x: 2650, y: 450, r: 300 },
            ],
            pondBushes:   { countPerPond: 28, radiusMin: 18, radiusMax: 45, spread: 90 },
            flowerBushRatio: 0,
            breakables: [
                { type: 'crate', count: 4 },
                { type: 'barrel', count: 2 },
                { type: 'tire_stack', count: 4 },
                { type: 'bench', count: 3 },
            ],
        },

        // Everything is icy — drastically reduced grip
        surfaceFriction: {
            tarmacGrip:     0.94,
            grassGrip:      0.95,
            dirtGrip:       0.94,
            tarmacFriction: 0.988,
            grassFriction:  0.985,
            dirtFriction:   0.982,
            mudGrip:        0.96,
            waterGrip:      0.97,
        },

        obstacles:       [],

        ambientParticles: {
            type:     'snow',
            count:    60,
            color:    'rgba(255,255,255,0.6)',
            sizeMin:  2,
            sizeMax:  5,
            speedMin: 0.3,
            speedMax: 1.5,
        },
    },

    // ── Parking Lot ──────────────────────────────────────────────
    // A tight car park. Smash through everything!
    {
        id:              'parking',
        name:            'Parking Lot',
        description:     'Tight car park chaos.',

        arenaWidth:      2400,
        arenaHeight:     2400,
        backgroundColor: '#383838',

        spawnLayout:     'circle',
        spawnCenterX:    1200,
        spawnCenterY:    1200,
        spawnRadius:     420,

        wallStyle:       'tires',
        surfaceDefault:  'tarmac',

        roadLayout:      'none',
        radialRoads:     null,

        terrain: {
            grassPatches: { count: 0,   radiusMin: 0,  radiusMax: 0  },
            dirtPatches:  { count: 0,   radiusMin: 0,  radiusMax: 0  },
            mudPatches:   { count: 0,   radiusMin: 0,  radiusMax: 0  },
            waterPuddles: { count: 0,   radiusMin: 0,  radiusMax: 0  },
            oilSlicks:    { count: 8,   radiusMin: 18, radiusMax: 45  },
            bushes:       { count: 0,   radiusMin: 0,  radiusMax: 0  },
            bumps:        { count: 5,   radiusMin: 12, radiusMax: 22  },
            ramps: [
                { count: 2, style: 'metal_ramp', wMin: 120, wMax: 160, hMin: 55, hMax: 80 },
                { count: 2, style: 'wrecked_car', wMin: 55, wMax: 65, hMin: 28, hMax: 34 },
            ],
            pillars:      { rows: 3, cols: 3, startX: 350, startY: 320, spacingX: 600, spacingY: 600, r: 22, color: '#777' },
            oilTrails:    { count: 3 },
            breakables: [
                { type: 'trolley', count: 16 },
                { type: 'bin',     count: 10 },
                { type: 'crate',   count: 4 },
                { type: 'barrel',  count: 3 },
                { type: 'pallet',  count: 5 },
                { type: 'bench',   count: 3 },
                { type: 'tire_stack', count: 3 },
                { type: 'container',  count: 2 },
            ],
            parkingGrid: {
                startX: 160, startY: 160,
                spaceW: 50,
                spaceD: 80,
                aisleW: 110,
            },
        },

        surfaceFriction: null,
        obstacles:       [],
        ambientParticles: null,
    },

    // ── Oval Speedway ───────────────────────────────────────────
    // A racing oval. Tarmac track on grass.
    {
        id:              'speedway',
        name:            'Oval Speedway',
        description:     'Race around the oval.',

        arenaWidth:      4000,
        arenaHeight:     3000,
        backgroundColor: '#4a6e2a',

        spawnLayout:     'grid',
        spawnCenterX:    2000,
        spawnCenterY:    1500,
        spawnRadius:     500,

        wallStyle:       'tires',
        surfaceDefault:  null,

        roadLayout:      'curvy',
        radialRoads:     null,
        curvyRoads: [
            {
                width: 140,
                surface: 'tarmac',
                closedLoop: true,
                points: (function() {
                    // Generate oval: center (2000,1500), rx=1500, ry=1000, 24 points
                    var pts = [];
                    var cx = 2000, cy = 1500, rx = 1500, ry = 1000, n = 24;
                    for (var i = 0; i < n; i++) {
                        var a = (i / n) * Math.PI * 2;
                        pts.push({ x: Math.round(cx + Math.cos(a) * rx), y: Math.round(cy + Math.sin(a) * ry) });
                    }
                    // Close the loop
                    pts.push({ x: pts[0].x, y: pts[0].y });
                    return pts;
                })(),
            },
        ],

        // Track waypoints (same oval, used by AI and lap detection)
        trackWaypoints: (function() {
            var pts = [];
            var cx = 2000, cy = 1500, rx = 1500, ry = 1000, n = 24;
            for (var i = 0; i < n; i++) {
                var a = (i / n) * Math.PI * 2;
                pts.push({ x: Math.round(cx + Math.cos(a) * rx), y: Math.round(cy + Math.sin(a) * ry) });
            }
            return pts;
        })(),
        trackLaps: 3,

        // Start/finish line — across the track at waypoint 0 (right side of oval)
        startFinishLine: { x1: 3500, y1: 1420, x2: 3500, y2: 1580 },

        terrain: {
            grassPatches: { count: 180, radiusMin: 15, radiusMax: 60  },
            dirtPatches:  { count: 40,  radiusMin: 10, radiusMax: 35  },
            mudPatches:   { count: 0,   radiusMin: 0,  radiusMax: 0   },
            waterPuddles: { count: 0,   radiusMin: 0,  radiusMax: 0   },
            oilSlicks:    { count: 4,   radiusMin: 18, radiusMax: 40  },
            bushes:       { count: 10,  radiusMin: 18, radiusMax: 35  },
            bumps:        { count: 0,   radiusMin: 0,  radiusMax: 0   },
            ramps:        { count: 0 },
            boulders:     { count: 0 },
            flowerBushRatio: 0.3,
            breakables: [
                { type: 'tire_stack', count: 6 },
                { type: 'barrel', count: 2 },
            ],
        },

        surfaceFriction: null,
        obstacles:       [],
        ambientParticles: null,
    },

];
