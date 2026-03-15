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
const COP_NAMES = [
    'SGT. JONES', 'OFC. SMITH', 'DET. CLARK', 'CPT. REED',
    'OFC. DIAZ', 'LT. BAKER', 'SGT. WOLFE', 'OFC. NASH',
    'DET. STONE', 'CPT. GRANT', 'OFC. HUNT', 'LT. CROSS'
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
        jumpVx: 0, jumpVy: 0, lastRamp: null,
        team: null, infected: false, isCop: false
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

    // Use mode registry for counts if available
    var numPlayers = (activeMode && activeMode.playerCount) || (gameMode === 'single' ? 1 : 2);
    var numAI = (activeMode && activeMode.aiCount != null) ? activeMode.aiCount : (gameMode === 'single' ? 11 : 10);

    // Grid spawn for racing tracks
    if (currentMap.spawnLayout === 'grid' && currentMap.trackWaypoints && currentMap.trackWaypoints.length >= 2) {
        var wps = currentMap.trackWaypoints;
        // Start facing from waypoint 0 toward waypoint 1
        var dirX = wps[1].x - wps[0].x;
        var dirY = wps[1].y - wps[0].y;
        var dirLen = Math.hypot(dirX, dirY);
        var fwdX = dirX / dirLen, fwdY = dirY / dirLen;
        var latX = -fwdY, latY = fwdX; // perpendicular (left)
        var faceAngle = Math.atan2(dirY, dirX);
        var startX = wps[0].x, startY = wps[0].y;

        var totalCars = numPlayers + numAI;
        var allSlots = [];
        for (var gi = 0; gi < totalCars; gi++) {
            var row = Math.floor(gi / 2);
            var col = gi % 2;
            var gx = startX - fwdX * (row + 1) * 55 + latX * (col === 0 ? -28 : 28);
            var gy = startY - fwdY * (row + 1) * 55 + latY * (col === 0 ? -28 : 28);
            allSlots.push({ x: gx, y: gy });
        }

        // Players get front slots
        if (numPlayers === 1) {
            cars.push(createCar(allSlots[0].x, allSlots[0].y, faceAngle, P1_COLOR, (typeof playerName !== 'undefined' && playerName) || 'PLAYER', 0, p1Type));
        } else {
            cars.push(createCar(allSlots[0].x, allSlots[0].y, faceAngle, P1_COLOR, (typeof playerName !== 'undefined' && playerName) || CAR_NAMES[0], 0, p1Type));
            cars.push(createCar(allSlots[1].x, allSlots[1].y, faceAngle, P2_COLOR, (typeof player2Name !== 'undefined' && player2Name) || CAR_NAMES[1], 1, p2Type));
        }
        for (var i = 0; i < numAI; i++) {
            var slot = allSlots[numPlayers + i];
            var aiType = (typeof CAR_TYPES !== 'undefined' && CAR_TYPES.length > 0)
                ? CAR_TYPES[Math.random() * CAR_TYPES.length | 0] : null;
            cars.push(createCar(
                slot.x, slot.y, faceAngle,
                CAR_COLORS[(i + 2) % CAR_COLORS.length],
                CAR_NAMES[(i + 2) % CAR_NAMES.length],
                -1, aiType
            ));
        }
    } else if (numPlayers === 1) {
        cars.push(createCar(cx, cy, -Math.PI / 2, P1_COLOR, (typeof playerName !== 'undefined' && playerName) || 'PLAYER', 0, p1Type));
    } else {
        cars.push(createCar(cx - 120, cy, -Math.PI / 2, P1_COLOR, (typeof playerName !== 'undefined' && playerName) || CAR_NAMES[0], 0, p1Type));
        cars.push(createCar(cx + 120, cy, -Math.PI / 2, P2_COLOR, (typeof player2Name !== 'undefined' && player2Name) || CAR_NAMES[1], 1, p2Type));
    }

    if (currentMap.spawnLayout !== 'grid' || !currentMap.trackWaypoints) {
    for (var i = 0; i < numAI; i++) {
        var ang = (i / numAI) * Math.PI * 2;
        var dist = sr + Math.random() * (sr * (numPlayers === 1 ? 1.1 : 0.85));
        var aiType = (typeof CAR_TYPES !== 'undefined' && CAR_TYPES.length > 0)
            ? CAR_TYPES[Math.random() * CAR_TYPES.length | 0] : null;
        cars.push(createCar(
            cx + Math.cos(ang) * dist,
            cy + Math.sin(ang) * dist,
            ang + Math.PI,
            CAR_COLORS[(i + 2) % CAR_COLORS.length],
            CAR_NAMES[(i + 2) % CAR_NAMES.length],
            -1, aiType
        ));
    }
    }

    // Mode-specific post-spawn setup (teams, infected, etc.)
    if (activeMode && activeMode.assignTeams) activeMode.assignTeams();
    if (activeMode && activeMode.setup) activeMode.setup();
}
