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
//    bodyStyle     — Visual style: 'sedan', 'sport', 'suv', 'truck', 'compact'
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

    // ── Tank ──────────────────────────────────────────────────────
    // An absolute unit. Slow as molasses, but nearly unstoppable.
    {
        id:               'truck',
        name:             'Tank',
        description:      'An absolute unit. Slow as molasses, but nearly unstoppable.',
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

    // ── Zippy ─────────────────────────────────────────────────────
    // Tiny and nimble. Darts around like a go-kart. Paper-thin armor.
    {
        id:               'compact',
        name:             'Zippy',
        description:      'Tiny and nimble. Darts around like a go-kart. Paper-thin armor.',
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

];
