// ================================================================
//  CAR FACTORY — car creation & spawning
//  References globals: cars, CONFIG, CAR_W, CAR_H, gameMode,
//      P1_COLOR, P2_COLOR, currentMap, CAR_TYPES,
//      selectedCarTypeP1, selectedCarTypeP2
// ================================================================

const CAR_COLORS = [
    '#ff6eb4', '#6eb4ff',
    '#e03030', '#30c030', '#e0e030', '#e07020',
    '#c040c0', '#30c0c0', '#e0e0e0', '#ff9030',
    '#90ff60', '#a060ff', '#ffaacc'
];
const CAR_NAMES = [
    'PLAYER 1', 'PLAYER 2',
    'CRUSHER', 'MANIAC', 'WRECKER', 'SMASHER',
    'BRUISER', 'DEMON', 'HAVOC', 'FURY',
    'BRAWLER', 'VANDAL', 'CHAOS'
];

/**
 * Create a single car object.
 * @param {number}  x
 * @param {number}  y
 * @param {number}  angle
 * @param {string}  color
 * @param {string}  name
 * @param {number}  playerIdx  0=P1, 1=P2, -1=AI
 * @param {object}  [carType]  optional car type with width/height/maxHealth
 */
function createCar(x, y, angle, color, name, playerIdx, carType) {
    var w  = (carType && carType.width)  ? carType.width  : CAR_W;
    var h  = (carType && carType.height) ? carType.height : CAR_H;
    var hp = (carType && carType.hp)     ? carType.hp     : 100;

    return {
        x: x, y: y, angle: angle, vx: 0, vy: 0, speed: 0,
        color: color, name: name, playerIdx: playerIdx, // 0=p1, 1=p2 (multi only), -1=AI
        carType: carType || null,
        health: hp, maxHealth: hp, alive: true,
        nitro: CONFIG.nitroMax, handbrake: false, drifting: false,
        nitroCooldown: 0, nitroActive: false, nitroBurnTimer: 0,
        width: w, height: h,
        kills: 0, hits: 0, damageDealt: 0,
        aiTarget: null, aiState: 'roam', aiTimer: 0, aiSteerDir: 0,
        damageCooldown: 0, lastHitBy: null, spinTimer: 0, invincible: 0,
        nitroSfxCooldown: 0, driftSfxCooldown: 0,
        turnTimer: 0, prevAngle: angle,
        respawnTimer: 0, deaths: 0,
        activePowerUp: null, powerUpTimer: 0,
        airborne: false, jumpT: 0, jumpDuration: 0, jumpHeight: 0,
        jumpVx: 0, jumpVy: 0, lastRamp: null
    };
}

/**
 * Spawn all cars (players + AI) using currentMap for positioning.
 * Player cars use selectedCarTypeP1 / selectedCarTypeP2 (falls back to
 * CAR_TYPES[0] if unset).  AI cars receive a random type from CAR_TYPES.
 */
function spawnCars() {
    cars = [];
    CAR_COLORS[0] = P1_COLOR;
    CAR_COLORS[1] = P2_COLOR;

    var cx = currentMap.spawnCenterX;
    var cy = currentMap.spawnCenterY;
    var sr = currentMap.spawnRadius;
    var aw = currentMap.arenaWidth;
    var ah = currentMap.arenaHeight;

    // Fallback spawn center to arena center if not specified
    if (cx == null) cx = aw / 2;
    if (cy == null) cy = ah / 2;
    if (sr == null) sr = 550;

    var defaultType = (typeof CAR_TYPES !== 'undefined' && CAR_TYPES.length > 0)
        ? CAR_TYPES[0] : null;
    var p1Type = selectedCarTypeP1 || defaultType;
    var p2Type = selectedCarTypeP2 || defaultType;

    if (gameMode === 'single') {
        // Single player: 1 player + 11 AI
        cars.push(createCar(cx, cy, -Math.PI / 2, P1_COLOR, 'PLAYER', 0, p1Type));
        var numAI = 11;
        for (var i = 0; i < numAI; i++) {
            var ang = (i / numAI) * Math.PI * 2;
            var dist = sr + Math.random() * (sr * 1.1);
            var aiType = (typeof CAR_TYPES !== 'undefined' && CAR_TYPES.length > 0)
                ? CAR_TYPES[Math.random() * CAR_TYPES.length | 0] : null;
            cars.push(createCar(
                cx + Math.cos(ang) * dist,
                cy + Math.sin(ang) * dist,
                ang + Math.PI,
                CAR_COLORS[i + 2], CAR_NAMES[i + 2], -1, aiType
            ));
        }
    } else {
        // Multiplayer: 2 players + 10 AI
        cars.push(createCar(cx - 120, cy, -Math.PI / 2, P1_COLOR, CAR_NAMES[0], 0, p1Type));
        cars.push(createCar(cx + 120, cy, -Math.PI / 2, P2_COLOR, CAR_NAMES[1], 1, p2Type));
        var numAI = 10;
        for (var i = 0; i < numAI; i++) {
            var ang = (i / numAI) * Math.PI * 2;
            var dist = sr + Math.random() * (sr * 0.85);
            var aiType = (typeof CAR_TYPES !== 'undefined' && CAR_TYPES.length > 0)
                ? CAR_TYPES[Math.random() * CAR_TYPES.length | 0] : null;
            cars.push(createCar(
                cx + Math.cos(ang) * dist,
                cy + Math.sin(ang) * dist,
                ang + Math.PI,
                CAR_COLORS[i + 2], CAR_NAMES[i + 2], -1, aiType
            ));
        }
    }
}
