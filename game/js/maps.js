// ================================================================
//  MAPS — Add or tweak arenas here!
//
//  HOW TO ADD A NEW MAP:
//  1. Copy any map block below (from { to },)
//  2. Paste it at the end of the array (before the closing ];)
//  3. Change the id, name, and description
//  4. Adjust sizes, terrain counts, and colors to taste
//
//  WHAT THE FIELDS MEAN:
//    id              — Unique short name (used in code, no spaces)
//    name            — Display name shown to the player
//    description     — One-line summary of the map's personality
//
//    arenaWidth      — Total arena width in pixels
//    arenaHeight     — Total arena height in pixels
//    backgroundColor — Hex color for the ground fill
//    backgroundImage — Path to a background image (null = use solid color)
//
//    spawnLayout     — How cars are placed at start: 'circle'
//    spawnCenterX    — X center of the spawn circle (usually arenaWidth / 2)
//    spawnCenterY    — Y center of the spawn circle (usually arenaHeight / 2)
//    spawnRadius     — How far from center cars spawn
//
//    wallStyle       — Visual style of arena walls: 'tires', 'concrete', 'ice'
//
//    roadLayout      — Road pattern: 'radial' (spokes from center)
//    radialRoads     — Settings for the radial road pattern:
//      centerRadius  — Radius of the central tarmac circle
//      roadCount     — Number of roads radiating outward
//      roadWidth     — Total width of each road in pixels
//      roadLength    — How far each road extends from center
//      startAngle    — Angle offset for the first road (radians)
//
//    terrain         — How many of each terrain feature to scatter:
//      grassPatches  — { count, radiusMin, radiusMax }
//      dirtPatches   — { count, radiusMin, radiusMax }
//      mudPatches    — { count, radiusMin, radiusMax }
//      waterPuddles  — { count, radiusMin, radiusMax }
//      oilSlicks     — { count, radiusMin, radiusMax }
//      bushes        — { count, radiusMin, radiusMax }
//      bumps         — { count, radiusMin, radiusMax }
//
//    surfaceFriction — Override default grip/friction values (null = use CONFIG).
//                      Any key from CONFIG can be overridden here, e.g.:
//                      { grassGrip: 0.80, tarmacGrip: 0.92 }
//
//    obstacles       — Array of fixed obstacles (empty [] for now)
//
//    ambientParticles — Floating particles for atmosphere (null = none).
//                       { type, count, color, sizeMin, sizeMax, speedMin, speedMax }
// ================================================================
const MAPS = [

    // ── Classic Arena ─────────────────────────────────────────────
    // The original arena. Green grass, tire walls, four roads.
    {
        id:              'arena',
        name:            'Classic Arena',
        description:     'The original arena. Green grass, tire walls, four roads.',

        arenaWidth:      3200,
        arenaHeight:     3200,
        backgroundColor: '#4a6e2a',
        backgroundImage: null,

        spawnLayout:     'circle',
        spawnCenterX:    1600,    // arenaWidth / 2
        spawnCenterY:    1600,    // arenaHeight / 2
        spawnRadius:     550,

        wallStyle:       'tires',

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
        },

        surfaceFriction: null,   // Use default CONFIG values

        obstacles:       [],

        ambientParticles: null,  // No ambient particles
    },

    // ── Dustbowl ──────────────────────────────────────────────────
    // A scorching desert arena. Sandy terrain, oil everywhere,
    // and narrow roads that are hard to stay on.
    {
        id:              'desert',
        name:            'Dustbowl',
        description:     'A scorching desert arena. Sandy terrain, oil everywhere.',

        arenaWidth:      3600,
        arenaHeight:     3600,
        backgroundColor: '#c2a55a',
        backgroundImage: null,

        spawnLayout:     'circle',
        spawnCenterX:    1800,    // arenaWidth / 2
        spawnCenterY:    1800,    // arenaHeight / 2
        spawnRadius:     550,

        wallStyle:       'tires',

        roadLayout:      'radial',
        radialRoads: {
            centerRadius: 400,
            roadCount:    6,
            roadWidth:    80,
            roadLength:   1500,
            startAngle:   0,
        },

        terrain: {
            grassPatches: { count: 180, radiusMin: 15, radiusMax: 60  },
            dirtPatches:  { count: 120, radiusMin: 10, radiusMax: 40  },
            mudPatches:   { count: 8,   radiusMin: 30, radiusMax: 80  },
            waterPuddles: { count: 4,   radiusMin: 25, radiusMax: 65  },
            oilSlicks:    { count: 10,  radiusMin: 20, radiusMax: 50  },
            bushes:       { count: 6,   radiusMin: 18, radiusMax: 40  },
            bumps:        { count: 14,  radiusMin: 12, radiusMax: 22  },
        },

        // Sand has less grip than normal grass
        surfaceFriction: {
            grassGrip:    0.80,
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

    // ── Frozen Lake ───────────────────────────────────────────────
    // An icy arena where nothing grips. Water puddles are frozen
    // patches, and the whole surface is treacherous.
    {
        id:              'snow',
        name:            'Frozen Lake',
        description:     'An icy arena where nothing grips. The whole surface is treacherous.',

        arenaWidth:      3200,
        arenaHeight:     3200,
        backgroundColor: '#d8e8f0',
        backgroundImage: null,

        spawnLayout:     'circle',
        spawnCenterX:    1600,    // arenaWidth / 2
        spawnCenterY:    1600,    // arenaHeight / 2
        spawnRadius:     550,

        wallStyle:       'tires',

        roadLayout:      'radial',
        radialRoads: {
            centerRadius: 480,
            roadCount:    4,
            roadWidth:    90,
            roadLength:   1200,
            startAngle:   Math.PI / 4,
        },

        terrain: {
            grassPatches: { count: 200, radiusMin: 15, radiusMax: 60  },
            dirtPatches:  { count: 60,  radiusMin: 10, radiusMax: 40  },
            mudPatches:   { count: 6,   radiusMin: 30, radiusMax: 80  },
            waterPuddles: { count: 15,  radiusMin: 25, radiusMax: 65  },
            oilSlicks:    { count: 8,   radiusMin: 20, radiusMax: 50  },
            bushes:       { count: 10,  radiusMin: 18, radiusMax: 40  },
            bumps:        { count: 8,   radiusMin: 12, radiusMax: 22  },
        },

        // Everything is icy — reduced grip across the board
        surfaceFriction: {
            tarmacGrip:   0.92,
            grassGrip:    0.93,
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

];
