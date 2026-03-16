// ── Frozen Lake ──────────────────────────────────────────────
// Icy wilderness with a winding road and a frozen lake in the corner.
MAPS.push({
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
});
