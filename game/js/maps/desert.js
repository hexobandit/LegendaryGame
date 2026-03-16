// ── Desert Oasis ─────────────────────────────────────────────
// No asphalt. Just sand, a big lagoon, and palm-like bushes.
MAPS.push({
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
});
