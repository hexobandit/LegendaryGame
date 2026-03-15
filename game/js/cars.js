// ================================================================
//  CAR TYPES — Add or tweak car classes here!
//
//  HOW TO ADD A NEW CAR:
//  1. Copy any car block below (from { to },)
//  2. Paste it at the end of the array (before the closing ];)
//  3. Change the id, name, and description
//  4. Adjust the multipliers to taste
//
//  WHAT THE FIELDS MEAN:
//    id            — Unique short name (used in code, no spaces)
//    name          — Display name shown to the player
//    description   — One-line summary of the car's personality
//    bodyStyle     — Visual style: 'sedan', 'sport', 'suv', 'truck',
//                     'truck_heavy', 'warrig', 'compact'
//    width         — Car width in pixels  (default is 40)
//    height        — Car height in pixels (default is 22)
//    hp            — Starting health points (100 = normal)
//    mass          — Weight multiplier (1.0 = normal). Heavier = harder to push
//    maxSpeedMult  — Multiplier on CONFIG.maxSpeed   (1.0 = normal)
//    accelMult     — Multiplier on CONFIG.autoAccel  (1.0 = normal)
//    turnMult      — Multiplier on CONFIG.turnSpeed   (1.0 = normal)
//    collisionDmgMult — Multiplier on collision damage DEALT (1.0 = normal)
//    gripBonus     — Added to lateral grip values (negative = less grip).
//                     e.g. 0.02 means tires grip 2% better; -0.02 means worse
// ================================================================
const CAR_TYPES = [

    // ── Stock ─────────────────────────────────────────────────────
    // The balanced all-rounder. No surprises — just solid.
    {
        id:               'normal',
        name:             'Stock',
        description:      'Balanced all-rounder. No surprises, just solid.',
        bodyStyle:        'sedan',
        width:            40,
        height:           22,
        hp:               100,
        mass:             1.0,
        maxSpeedMult:     1.0,
        accelMult:        1.0,
        turnMult:         1.0,
        collisionDmgMult: 1.0,
        gripBonus:        0.0,
    },

    // ── Speedster ─────────────────────────────────────────────────
    // Fast and agile, but fragile. Hit hard, don't get hit.
    {
        id:               'sport',
        name:             'Speedster',
        description:      'Fast and agile, but fragile. Hit hard, don\'t get hit.',
        bodyStyle:        'sport',
        width:            40,
        height:           22,
        hp:               80,
        mass:             0.8,
        maxSpeedMult:     1.25,
        accelMult:        1.15,
        turnMult:         1.1,
        collisionDmgMult: 1.0,
        gripBonus:        0.02,
    },

    // ── Bruiser ───────────────────────────────────────────────────
    // Big and heavy. Shrugs off hits and crushes lighter cars.
    {
        id:               'suv',
        name:             'Bruiser',
        description:      'Big and heavy. Shrugs off hits and crushes lighter cars.',
        bodyStyle:        'suv',
        width:            40,
        height:           22,
        hp:               140,
        mass:             1.4,
        maxSpeedMult:     0.85,
        accelMult:        0.9,
        turnMult:         0.85,
        collisionDmgMult: 1.3,
        gripBonus:        -0.02,
    },

    // ── Ironclad ─────────────────────────────────────────────────
    // Classic armored brute. Built like a vault on wheels.
    {
        id:               'truck',
        name:             'Ironclad',
        description:      'Classic armored brute. Built like a vault on wheels.',
        bodyStyle:        'truck',
        width:            40,
        height:           22,
        hp:               180,
        mass:             1.8,
        maxSpeedMult:     0.7,
        accelMult:        0.75,
        turnMult:         0.7,
        collisionDmgMult: 1.5,
        gripBonus:        0.0,
    },

    // ── Crusher ──────────────────────────────────────────────────
    // Heavy ram bar up front. Hits like a freight train.
    {
        id:               'truck_heavy',
        name:             'Crusher',
        description:      'Heavy ram bar up front. Hits like a freight train.',
        bodyStyle:        'truck_heavy',
        width:            42,
        height:           24,
        hp:               150,
        mass:             1.6,
        maxSpeedMult:     0.78,
        accelMult:        0.82,
        turnMult:         0.75,
        collisionDmgMult: 1.6,
        gripBonus:        0.0,
    },

    // ── War Rig ──────────────────────────────────────────────────
    // Armored war machine with a front plow. The ultimate destroyer.
    {
        id:               'warrig',
        name:             'War Rig',
        description:      'Armored war machine with a front plow. The ultimate destroyer.',
        bodyStyle:        'warrig',
        width:            46,
        height:           26,
        hp:               220,
        mass:             2.0,
        maxSpeedMult:     0.6,
        accelMult:        0.6,
        turnMult:         0.55,
        collisionDmgMult: 1.8,
        gripBonus:        -0.04,
    },

    // ── Zippy ─────────────────────────────────────────────────────
    // Tiny bubble car. Darts around like a go-kart. Paper-thin armor.
    {
        id:               'compact',
        name:             'Zippy',
        description:      'Tiny bubble car. Darts around like a go-kart. Paper-thin armor.',
        bodyStyle:        'compact',
        width:            34,
        height:           18,
        hp:               70,
        mass:             0.6,
        maxSpeedMult:     1.1,
        accelMult:        1.2,
        turnMult:         1.3,
        collisionDmgMult: 1.0,
        gripBonus:        0.04,
    },

    // ── Miata ────────────────────────────────────────────────────
    // Lightweight funster. Impossible to catch in tight spaces.
    {
        id:               'miata',
        name:             'Miata',
        description:      'Lightweight funster. Impossible to catch in tight spaces.',
        bodyStyle:        'miata',
        width:            36,
        height:           19,
        hp:               72,
        mass:             0.65,
        maxSpeedMult:     1.15,
        accelMult:        1.18,
        turnMult:         1.35,
        collisionDmgMult: 0.85,
        gripBonus:        0.06,
    },

    // ── Ram ──────────────────────────────────────────────────────
    // Beefy pickup. Heavy rear end swings wide on turns.
    {
        id:               'pickup',
        name:             'Ram',
        description:      'Beefy pickup. Heavy rear end swings wide on turns.',
        bodyStyle:        'pickup',
        width:            44,
        height:           24,
        hp:               160,
        mass:             1.7,
        maxSpeedMult:     0.82,
        accelMult:        0.85,
        turnMult:         0.72,
        collisionDmgMult: 1.5,
        gripBonus:        -0.01,
    },

    // ── School Bus ───────────────────────────────────────────────
    // Enormous and slow. Impossible to stop once moving.
    {
        id:               'schoolbus',
        name:             'School Bus',
        description:      'Enormous and slow. Impossible to stop once moving.',
        bodyStyle:        'schoolbus',
        width:            56,
        height:           22,
        hp:               250,
        mass:             2.5,
        maxSpeedMult:     0.5,
        accelMult:        0.45,
        turnMult:         0.4,
        collisionDmgMult: 2.2,
        gripBonus:        -0.06,
    },

];
