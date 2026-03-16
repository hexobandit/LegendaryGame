// ── Parking Lot ──────────────────────────────────────────────
// A tight car park. Smash through everything!
MAPS.push({
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
});
