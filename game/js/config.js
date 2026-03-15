// ================================================================
//  CONFIG — Tweak these values to tune the feel!
//  Open the browser console and type: CONFIG
//  to inspect current values at runtime.
// ================================================================
var CONFIG = {
    // ── Acceleration ──
    autoAccel:      0.22,   // Forward push per frame (auto-throttle)
    brakeForce:     0.25,   // Braking deceleration per frame
    maxSpeed:       7.5,    // Normal top speed (px/frame)

    // ── Steering ──
    turnSpeed:      0.048,  // Normal steering rate (rad/frame)
    handbrakeTurn:  0.07,   // Handbrake steering rate

    // ── Surface Forward Friction ──
    // Per-frame velocity multiplier: lower = more drag = slower top speed
    // Range: 0.93 (very draggy) to 0.99 (almost frictionless)
    tarmacFriction: 0.978,  // Road — smooth, fast
    grassFriction:  0.965,  // Grass — noticeable drag
    dirtFriction:   0.955,  // Dirt — heavy drag

    // ── Lateral Grip (the big one for "ice" vs "grip") ──
    // Per-frame sideways velocity multiplier: lower = more grip
    // 0.70 = super grippy kart, 0.95 = ice skating
    tarmacGrip:     0.82,   // Tires grip well on road
    grassGrip:      0.88,   // Less grip on grass
    dirtGrip:       0.85,   // Moderate grip on dirt
    handbrakeGrip:  0.96,   // Very slidey during handbrake/drift

    // ── Nitro ──
    nitroAccel:     0.5,    // Nitro forward push
    nitroMaxSpeed:  12,     // Nitro speed cap
    nitroBurnFrames: 120,   // Duration of nitro burn (~2 sec at 60fps)
    nitroCooldown:  480,    // Cooldown after burn (~8 sec)
    nitroMax:       100,    // Nitro tank capacity

    // ── Collision ──
    collisionDmg:   0.9,    // Damage multiplier on impacts

    // ── Damage Penalties ──
    // Speed multiplier at various health levels (1.0 = full speed)
    dmgSpeedFull:   1.0,    // Above 60% health
    dmgSpeedMed:    0.82,   // 30-60% health — noticeably slower
    dmgSpeedLow:    0.55,   // Below 30% health — crawling
    dmgWobble:      0.04,   // Steering wobble intensity when badly damaged

    // ── Hazard Surfaces ──
    mudFriction:    0.935,  // Mud: very draggy
    mudGrip:        0.92,   // Mud: car slides around
    waterFriction:  0.92,   // Water: major slowdown
    waterGrip:      0.90,   // Water: slippery
    oilFriction:    0.985,  // Oil: almost no rolling drag (slidy)
    oilGrip:        0.97,   // Oil: nearly zero lateral grip — black ice

    // ── Bushes ──
    bushSlowdown:   0.92,   // Per-frame speed mult when in a bush

    // ── Bumps ──
    bumpBounce:     3.0,    // Upward kick strength from bumps
    bumpSpinChance: 0.3,    // Chance of brief spin on bump hit
};

// ── Fixed constants (not usually tweaked) ──
const ARENA_W = 3200;
const ARENA_H = 3200;
const CAR_W   = 40;
const CAR_H   = 22;

const PLAYER_COLOR_OPTIONS = [
    '#ff6eb4', '#ff3388', '#ff4466', '#e03030', '#ff6030',
    '#ff9030', '#ffcc00', '#88dd22', '#30c030', '#20ccaa',
    '#30c0c0', '#6eb4ff', '#3060e0', '#6060ff', '#a060ff',
    '#c040c0', '#e0e0e0', '#ffaacc', '#aaffdd', '#ffe066'
];
