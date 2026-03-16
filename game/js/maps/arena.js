// ── Classic Arena ─────────────────────────────────────────────
MAPS.push({
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
});
