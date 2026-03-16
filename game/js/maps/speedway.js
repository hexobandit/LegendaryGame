// ── Oval Speedway ───────────────────────────────────────────
// A racing oval. Tarmac track on grass.
MAPS.push({
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
});
