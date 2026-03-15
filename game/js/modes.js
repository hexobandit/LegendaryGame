// ================================================================
//  GAME MODE REGISTRY
//  Each mode defines spawn config, win conditions, per-frame logic,
//  and end-game results.
//
//  gameMode = 'single' | 'multi'   (controls split-screen / input)
//  gameVariant = 'normal' | 'hardcore' | 'timed' | 'teams' | 'infected'
//  activeMode = resolved GAME_MODES entry
// ================================================================

var GAME_MODES = {};
var activeMode = null;
var gameVariant = 'normal';

function registerMode(id, modeDef) {
    GAME_MODES[id] = modeDef;
}

function setActiveMode(id) {
    activeMode = GAME_MODES[id] || null;
}

// Helper: count alive AI
function countAliveAI() {
    var n = 0;
    for (var i = 0; i < cars.length; i++) {
        if (cars[i].playerIdx === -1 && cars[i].alive) n++;
    }
    return n;
}

// Helper: multiplayer winner by kills/deaths/damage
function multiWinner() {
    var p1 = cars[0], p2 = cars[1];
    if (p1.kills > p2.kills) return 'P1';
    if (p2.kills > p1.kills) return 'P2';
    if (p1.deaths < p2.deaths) return 'P1';
    if (p2.deaths < p1.deaths) return 'P2';
    if (p1.damageDealt > p2.damageDealt) return 'P1';
    if (p2.damageDealt > p1.damageDealt) return 'P2';
    return 'TIE';
}

function multiResultObj() {
    var w = multiWinner();
    var p1 = cars[0], p2 = cars[1];
    return {
        won: w !== 'TIE',
        winner: w,
        title: w === 'TIE' ? "IT'S A TIE!" : (w === 'P1' ? p1.name : p2.name) + ' WINS!',
        titleColor: w === 'TIE' ? '#aaa' : w === 'P1' ? P1_COLOR : P2_COLOR,
        sfx: w !== 'TIE' ? 'win' : 'lose',
    };
}

// ═══════════════════════════════════════════
//  NORMAL — classic derby, respawns, destroy all AI
// ═══════════════════════════════════════════

registerMode('normal-single', {
    id: 'normal-single',
    label: 'NORMAL',
    description: 'Destroy all AI cars.',
    playerCount: 1, aiCount: 11,
    respawn: true, teams: false, timeLimit: 0,

    update: function(dt) {
        score += Math.round(dt * 10);
    },
    checkWin: function() {
        return countAliveAI() === 0;
    },
    results: function() {
        var won = countAliveAI() === 0;
        return { won: won, title: won ? 'YOU WIN!' : 'GAME OVER', titleColor: won ? '#4f4' : '#f44', sfx: won ? 'win' : 'lose' };
    },
});

registerMode('normal-multi', {
    id: 'normal-multi',
    label: 'NORMAL',
    description: 'Most kills wins.',
    playerCount: 2, aiCount: 10,
    respawn: true, teams: false, timeLimit: 0,

    update: function(dt) {},
    checkWin: function() { return false; },
    results: multiResultObj,
});

// ═══════════════════════════════════════════
//  HARDCORE — one life, no respawns, last man standing
// ═══════════════════════════════════════════

registerMode('hardcore-single', {
    id: 'hardcore-single',
    label: 'HARDCORE',
    description: 'One life, no respawns.',
    playerCount: 1, aiCount: 11,
    respawn: false, teams: false, timeLimit: 0,

    update: function(dt) {
        score += Math.round(dt * 15);
    },
    checkWin: function() {
        var p = cars[0];
        if (!p.alive) return true;
        return countAliveAI() === 0;
    },
    results: function() {
        var p = cars[0];
        var won = p.alive && countAliveAI() === 0;
        return { won: won, title: won ? 'SURVIVOR!' : 'WRECKED!', titleColor: won ? '#4f4' : '#f44', sfx: won ? 'win' : 'lose' };
    },
});

registerMode('hardcore-multi', {
    id: 'hardcore-multi',
    label: 'HARDCORE',
    description: 'One life each.',
    playerCount: 2, aiCount: 10,
    respawn: false, teams: false, timeLimit: 0,

    update: function(dt) {},
    checkWin: function() {
        var alive = 0;
        for (var i = 0; i < cars.length; i++) {
            if (cars[i].alive) alive++;
        }
        return alive <= 1;
    },
    results: function() {
        var p1 = cars[0], p2 = cars[1];
        if (p1.alive && !p2.alive) return { won: true, title: p1.name + ' SURVIVES!', titleColor: P1_COLOR, sfx: 'win' };
        if (p2.alive && !p1.alive) return { won: true, title: p2.name + ' SURVIVES!', titleColor: P2_COLOR, sfx: 'win' };
        return { won: false, title: 'MUTUAL DESTRUCTION!', titleColor: '#f84', sfx: 'lose' };
    },
});

// ═══════════════════════════════════════════
//  TIMED — 3 minutes, most kills wins
// ═══════════════════════════════════════════

var TIMED_DURATION = 180; // seconds

registerMode('timed-single', {
    id: 'timed-single',
    label: 'TIMED',
    description: '3 minutes. Most kills wins!',
    playerCount: 1, aiCount: 11,
    respawn: true, teams: false, timeLimit: TIMED_DURATION,

    update: function(dt) {
        score += Math.round(dt * 10);
    },
    checkWin: function() {
        return gameTime >= TIMED_DURATION;
    },
    results: function() {
        var p = cars[0];
        return { won: p.kills > 0, title: 'TIME\'S UP!', titleColor: '#ff4', sfx: p.kills > 0 ? 'win' : 'lose' };
    },
});

registerMode('timed-multi', {
    id: 'timed-multi',
    label: 'TIMED',
    description: '3 minutes. Most kills wins!',
    playerCount: 2, aiCount: 10,
    respawn: true, teams: false, timeLimit: TIMED_DURATION,

    update: function(dt) {},
    checkWin: function() {
        return gameTime >= TIMED_DURATION;
    },
    results: function() {
        var res = multiResultObj();
        res.title = res.title.replace('WINS', 'WINS');
        return res;
    },
});

// ═══════════════════════════════════════════
//  TEAMS — Red vs Blue, friendly fire OFF
// ═══════════════════════════════════════════

var TEAM_RED  = 'red';
var TEAM_BLUE = 'blue';
var TEAM_COLORS = { red: '#e04040', blue: '#4080e0' };

registerMode('teams-single', {
    id: 'teams-single',
    label: 'TEAMS',
    description: 'Red vs Blue teams.',
    playerCount: 1, aiCount: 11,
    respawn: true, teams: true, timeLimit: 0,
    friendlyFire: false,

    assignTeams: function() {
        var myTeam = selectedTeamP1 || TEAM_RED;
        var enemyTeam = myTeam === TEAM_RED ? TEAM_BLUE : TEAM_RED;
        cars[0].team = myTeam;
        cars[0].color = TEAM_COLORS[myTeam];
        for (var i = 1; i < cars.length; i++) {
            cars[i].team = (i % 2 === 0) ? myTeam : enemyTeam;
            cars[i].color = TEAM_COLORS[cars[i].team];
        }
    },
    update: function(dt) {
        score += Math.round(dt * 10);
    },
    checkWin: function() {
        var redAlive = 0, blueAlive = 0;
        for (var i = 0; i < cars.length; i++) {
            if (!cars[i].alive) continue;
            if (cars[i].team === TEAM_RED) redAlive++;
            else if (cars[i].team === TEAM_BLUE) blueAlive++;
        }
        return redAlive === 0 || blueAlive === 0;
    },
    results: function() {
        var redAlive = 0, blueAlive = 0;
        for (var i = 0; i < cars.length; i++) {
            if (!cars[i].alive) continue;
            if (cars[i].team === TEAM_RED) redAlive++;
            else if (cars[i].team === TEAM_BLUE) blueAlive++;
        }
        var myTeam = cars[0].team || TEAM_RED;
        var myTeamAlive = myTeam === TEAM_RED ? redAlive : blueAlive;
        var won = myTeamAlive > 0;
        var winTeam = redAlive > 0 ? TEAM_RED : TEAM_BLUE;
        return { won: won, title: (winTeam === TEAM_RED ? 'RED' : 'BLUE') + ' TEAM WINS!', titleColor: TEAM_COLORS[winTeam], sfx: won ? 'win' : 'lose' };
    },
});

registerMode('teams-multi', {
    id: 'teams-multi',
    label: 'TEAMS',
    description: 'Pick teams, destroy enemy.',
    playerCount: 2, aiCount: 10,
    respawn: true, teams: true, timeLimit: 0,
    friendlyFire: false,

    assignTeams: function() {
        var p1Team = selectedTeamP1 || TEAM_RED;
        var p2Team = selectedTeamP2 || TEAM_BLUE;
        cars[0].team = p1Team;
        cars[0].color = TEAM_COLORS[p1Team];
        cars[1].team = p2Team;
        cars[1].color = TEAM_COLORS[p2Team];
        for (var i = 2; i < cars.length; i++) {
            cars[i].team = (i % 2 === 0) ? TEAM_RED : TEAM_BLUE;
            cars[i].color = TEAM_COLORS[cars[i].team];
        }
    },
    update: function(dt) {},
    checkWin: function() {
        var redAlive = 0, blueAlive = 0;
        for (var i = 0; i < cars.length; i++) {
            if (!cars[i].alive) continue;
            if (cars[i].team === TEAM_RED) redAlive++;
            else if (cars[i].team === TEAM_BLUE) blueAlive++;
        }
        return redAlive === 0 || blueAlive === 0;
    },
    results: function() {
        var redAlive = 0, blueAlive = 0;
        for (var i = 0; i < cars.length; i++) {
            if (!cars[i].alive) continue;
            if (cars[i].team === TEAM_RED) redAlive++;
            else if (cars[i].team === TEAM_BLUE) blueAlive++;
        }
        var winTeam = redAlive > 0 ? TEAM_RED : TEAM_BLUE;
        // Players win if either of them is on the winning team
        var playerWon = (cars[0].team === winTeam) || (cars[1].team === winTeam);
        return { won: playerWon, title: (winTeam === TEAM_RED ? 'RED' : 'BLUE') + ' TEAM WINS!', titleColor: TEAM_COLORS[winTeam], sfx: playerWon ? 'win' : 'lose' };
    },
});

// ═══════════════════════════════════════════
//  INFECTED — one car starts infected, spreads on kill
// ═══════════════════════════════════════════

// Track who was last to get infected
var lastSurvivor = null;

function infectedSetup() {
    lastSurvivor = null;
    var aiCars = [];
    for (var i = 0; i < cars.length; i++) {
        if (cars[i].playerIdx === -1) aiCars.push(cars[i]);
    }
    if (aiCars.length > 0) {
        var victim = aiCars[Math.random() * aiCars.length | 0];
        victim.infected = true;
        victim.color = '#33ff33';
        victim.name = '!!' + victim.name + '!!';
    }
}

function infectedUpdate() {
    // Track the last clean car standing
    var cleanCars = [];
    for (var i = 0; i < cars.length; i++) {
        if (cars[i].alive && !cars[i].infected) cleanCars.push(cars[i]);
    }
    if (cleanCars.length === 1) lastSurvivor = cleanCars[0];
    if (cleanCars.length === 0 && !lastSurvivor) {
        // Everyone got infected same frame — no winner
        lastSurvivor = null;
    }
}

function infectedCheckWin() {
    var clean = 0;
    for (var i = 0; i < cars.length; i++) {
        if (cars[i].alive && !cars[i].infected) clean++;
    }
    return clean === 0;
}

registerMode('infected-single', {
    id: 'infected-single',
    label: 'INFECTED',
    description: 'Touch spreads infection.',
    playerCount: 1, aiCount: 11,
    respawn: false, teams: false, timeLimit: 0,

    setup: infectedSetup,
    update: function(dt) {
        score += Math.round(dt * 12);
        infectedUpdate();
    },
    checkWin: infectedCheckWin,
    results: function() {
        var p = cars[0];
        var won = lastSurvivor && lastSurvivor.playerIdx === 0;
        var title = won ? 'LAST SURVIVOR!' : (lastSurvivor ? lastSurvivor.name + ' SURVIVED!' : 'ALL INFECTED!');
        return { won: won, title: title, titleColor: won ? '#4f4' : '#3f3', sfx: won ? 'win' : 'lose' };
    },
});

registerMode('infected-multi', {
    id: 'infected-multi',
    label: 'INFECTED',
    description: 'Touch spreads infection.',
    playerCount: 2, aiCount: 10,
    respawn: false, teams: false, timeLimit: 0,

    setup: infectedSetup,
    update: function(dt) {
        infectedUpdate();
    },
    checkWin: infectedCheckWin,
    results: function() {
        var p1 = cars[0], p2 = cars[1];
        if (lastSurvivor === p1) return { won: true, title: p1.name + ' LAST SURVIVOR!', titleColor: P1_COLOR, sfx: 'win' };
        if (lastSurvivor === p2) return { won: true, title: p2.name + ' LAST SURVIVOR!', titleColor: P2_COLOR, sfx: 'win' };
        if (lastSurvivor) return { won: false, title: lastSurvivor.name + ' SURVIVED!', titleColor: '#3f3', sfx: 'lose' };
        return { won: false, title: 'ALL INFECTED!', titleColor: '#3f3', sfx: 'lose' };
    },
});

// ═══════════════════════════════════════════
//  CAPTURE THE FLAG — hold the flag, earn points
//  1pt/sec while holding, +25 bonus every 10s
// ═══════════════════════════════════════════

var CTF_DURATION = 180; // 3 minutes
var CTF_POINTS_PER_SEC = 1;
var CTF_BONUS_INTERVAL = 10;
var CTF_BONUS_POINTS = 25;
var CTF_PICKUP_RADIUS = 40;

function ctfSetup() {
    var aw = currentMap.arenaWidth;
    var ah = currentMap.arenaHeight;
    // Spawn flag at random location away from center (where cars spawn)
    var fx, fy;
    for (var attempt = 0; attempt < 30; attempt++) {
        fx = 200 + Math.random() * (aw - 400);
        fy = 200 + Math.random() * (ah - 400);
        var distFromCenter = Math.hypot(fx - aw/2, fy - ah/2);
        if (distFromCenter > 400) break;
    }
    ctfFlag = { x: fx, y: fy, carrier: null, bobPhase: 0 };
    ctfScores = {};
    ctfHoldTimer = 0;
    ctfBonusTimer = 0;
    for (var i = 0; i < cars.length; i++) {
        ctfScores[i] = 0;
    }
}

function ctfUpdate(dt) {
    if (!ctfFlag) return;
    ctfFlag.bobPhase += dt * 4;

    // Flag pickup — any alive car can grab it if no carrier
    if (!ctfFlag.carrier) {
        for (var i = 0; i < cars.length; i++) {
            var c = cars[i];
            if (!c.alive) continue;
            if (Math.hypot(c.x - ctfFlag.x, c.y - ctfFlag.y) < CTF_PICKUP_RADIUS) {
                ctfFlag.carrier = c;
                ctfHoldTimer = 0;
                ctfBonusTimer = 0;
                playSfxThrottled('nitro', 100);
                floatingTexts.push({
                    x: c.x, y: c.y - 45,
                    text: 'GOT THE FLAG!',
                    color: '#fff', alpha: 1, vy: -0.8, life: 100,
                    bubble: true, bubbleColor: '#ffaa00'
                });
                break;
            }
        }
    }

    // Carrier scoring
    if (ctfFlag.carrier && ctfFlag.carrier.alive) {
        var carrier = ctfFlag.carrier;
        var ci = cars.indexOf(carrier);
        // Flag follows carrier
        ctfFlag.x = carrier.x;
        ctfFlag.y = carrier.y;

        // Points per second
        ctfHoldTimer += dt;
        if (ci >= 0) {
            ctfScores[ci] = (ctfScores[ci] || 0) + Math.round(dt * CTF_POINTS_PER_SEC);
        }
        // Player score
        if (carrier.playerIdx >= 0) {
            score += Math.round(dt * CTF_POINTS_PER_SEC);
        }

        // Bonus every 10 seconds
        ctfBonusTimer += dt;
        if (ctfBonusTimer >= CTF_BONUS_INTERVAL) {
            ctfBonusTimer -= CTF_BONUS_INTERVAL;
            if (ci >= 0) ctfScores[ci] = (ctfScores[ci] || 0) + CTF_BONUS_POINTS;
            if (carrier.playerIdx >= 0) score += CTF_BONUS_POINTS;
            floatingTexts.push({
                x: carrier.x, y: carrier.y - 50,
                text: '+' + CTF_BONUS_POINTS + ' HOLD BONUS!',
                color: '#fff', alpha: 1, vy: -0.9, life: 90,
                bubble: true, bubbleColor: '#ffcc00'
            });
            playSfxThrottled('kill', 100);
        }
    } else if (ctfFlag.carrier) {
        // Carrier died — drop flag
        ctfDropFlag();
    }
}

function ctfDropFlag() {
    if (!ctfFlag || !ctfFlag.carrier) return;
    var dropper = ctfFlag.carrier;
    ctfFlag.carrier = null;
    ctfHoldTimer = 0;
    ctfBonusTimer = 0;
    // Flag stays at last position (already updated to carrier pos)
    floatingTexts.push({
        x: ctfFlag.x, y: ctfFlag.y - 40,
        text: 'FLAG DROPPED!',
        color: '#fff', alpha: 1, vy: -0.8, life: 90,
        bubble: true, bubbleColor: '#ff4444'
    });
    playSfxThrottled('explode', 100);
}

function ctfGetWinner() {
    var bestIdx = -1, bestScore = -1;
    for (var i = 0; i < cars.length; i++) {
        if ((ctfScores[i] || 0) > bestScore) {
            bestScore = ctfScores[i] || 0;
            bestIdx = i;
        }
    }
    return bestIdx;
}

registerMode('ctf-single', {
    id: 'ctf-single',
    label: 'CTF',
    description: 'Grab flag, hold for points.',
    playerCount: 1, aiCount: 11,
    respawn: true, teams: false, timeLimit: CTF_DURATION,
    isCTF: true,

    setup: ctfSetup,
    update: function(dt) {
        ctfUpdate(dt);
    },
    checkWin: function() {
        return gameTime >= CTF_DURATION;
    },
    results: function() {
        var wi = ctfGetWinner();
        var won = wi === 0;
        var winCar = wi >= 0 ? cars[wi] : null;
        var title = won ? 'FLAG CHAMPION!' : (winCar ? winCar.name + ' WINS!' : 'TIME\'S UP!');
        return { won: won, title: title, titleColor: won ? '#ffcc00' : '#f84', sfx: won ? 'win' : 'lose' };
    },
});

registerMode('ctf-multi', {
    id: 'ctf-multi',
    label: 'CTF',
    description: 'Grab flag, hold for points.',
    playerCount: 2, aiCount: 10,
    respawn: true, teams: false, timeLimit: CTF_DURATION,
    isCTF: true,

    setup: ctfSetup,
    update: function(dt) {
        ctfUpdate(dt);
    },
    checkWin: function() {
        return gameTime >= CTF_DURATION;
    },
    results: function() {
        var wi = ctfGetWinner();
        var p1Score = ctfScores[0] || 0;
        var p2Score = ctfScores[1] || 0;
        if (wi === 0) return { won: true, title: cars[0].name + ' FLAG CHAMP!', titleColor: P1_COLOR, sfx: 'win' };
        if (wi === 1) return { won: true, title: cars[1].name + ' FLAG CHAMP!', titleColor: P2_COLOR, sfx: 'win' };
        var winCar = wi >= 0 ? cars[wi] : null;
        return { won: false, title: winCar ? winCar.name + ' WINS!' : 'DRAW!', titleColor: '#f84', sfx: 'lose' };
    },
});

// ═══════════════════════════════════════════
//  ROBBERY — player is the robber, AI are cops
//  Survive for 3 minutes to escape! Or destroy all cops.
// ═══════════════════════════════════════════

var ROBBERY_DURATION = 180; // 3 minutes to escape
var ROBBERY_SPAWN_INTERVAL = 10; // seconds between new cop spawns
var robberySpawnTimer = 0;
var robberyCopCount = 0;

function getCopType() {
    for (var i = 0; i < CAR_TYPES.length; i++) {
        if (CAR_TYPES[i].id === 'cop') return CAR_TYPES[i];
    }
    return null;
}

function setupCops() {
    var copType = getCopType();
    if (!copType) return;
    var idx = 0;
    for (var i = 0; i < cars.length; i++) {
        if (cars[i].playerIdx === -1) {
            cars[i].carType = copType;
            cars[i].width = copType.width;
            cars[i].height = copType.height;
            cars[i].health = copType.hp;
            cars[i].maxHealth = copType.hp;
            cars[i].color = '#1a1a2e';
            cars[i].isCop = true;
            if (typeof COP_NAMES !== 'undefined') {
                cars[i].name = COP_NAMES[idx % COP_NAMES.length];
            }
            idx++;
        }
    }
    robberyCopCount = idx;
    robberySpawnTimer = 0;
}

function spawnNewCop() {
    var copType = getCopType();
    if (!copType) return;
    var aw = currentMap.arenaWidth;
    var ah = currentMap.arenaHeight;
    // Spawn at random edge
    var edge = Math.random() * 4 | 0;
    var x, y, angle;
    var margin = 120;
    if (edge === 0) { x = margin; y = margin + Math.random() * (ah - margin * 2); angle = 0; }
    else if (edge === 1) { x = aw - margin; y = margin + Math.random() * (ah - margin * 2); angle = Math.PI; }
    else if (edge === 2) { x = margin + Math.random() * (aw - margin * 2); y = margin; angle = Math.PI / 2; }
    else { x = margin + Math.random() * (aw - margin * 2); y = ah - margin; angle = -Math.PI / 2; }

    var name = (typeof COP_NAMES !== 'undefined') ? COP_NAMES[robberyCopCount % COP_NAMES.length] : 'COP';
    var cop = createCar(x, y, angle, '#1a1a2e', name, -1, copType);
    cop.isCop = true;
    cop.invincible = 60; // 1 second spawn protection
    cars.push(cop);
    robberyCopCount++;

    // "Backup arriving" floating text
    floatingTexts.push({
        x: x, y: y - 40, text: 'BACKUP!',
        color: '#fff', alpha: 1, vy: -0.8, life: 90,
        bubble: true, bubbleColor: '#4466ff'
    });
    playSfxThrottled('countdown', 200);
}

registerMode('robbery-single', {
    id: 'robbery-single',
    label: 'ROBBERY',
    description: 'Escape cops for 3min.',
    playerCount: 1, aiCount: 2,
    respawn: false, teams: false, timeLimit: ROBBERY_DURATION,
    isCops: true,

    setup: setupCops,
    update: function(dt) {
        score += Math.round(dt * 15);
        robberySpawnTimer += dt;
        if (robberySpawnTimer >= ROBBERY_SPAWN_INTERVAL) {
            robberySpawnTimer -= ROBBERY_SPAWN_INTERVAL;
            spawnNewCop();
        }
    },
    checkWin: function() {
        var p = cars[0];
        if (!p.alive) return true;
        if (gameTime >= ROBBERY_DURATION) return true;
        // Also win if all cops destroyed
        var copsAlive = 0;
        for (var i = 0; i < cars.length; i++) {
            if (cars[i].isCop && cars[i].alive) copsAlive++;
        }
        return copsAlive === 0;
    },
    results: function() {
        var p = cars[0];
        var copsAlive = 0;
        for (var i = 0; i < cars.length; i++) {
            if (cars[i].isCop && cars[i].alive) copsAlive++;
        }
        if (!p.alive) return { won: false, title: 'BUSTED!', titleColor: '#f44', sfx: 'lose' };
        if (copsAlive === 0) return { won: true, title: 'COPS DESTROYED!', titleColor: '#4f4', sfx: 'win' };
        return { won: true, title: 'GETAWAY!', titleColor: '#4f4', sfx: 'win' };
    },
});

registerMode('robbery-multi', {
    id: 'robbery-multi',
    label: 'ROBBERY',
    description: 'Escape cops together.',
    playerCount: 2, aiCount: 2,
    respawn: false, teams: false, timeLimit: ROBBERY_DURATION,
    isCops: true,

    setup: setupCops,
    update: function(dt) {
        robberySpawnTimer += dt;
        if (robberySpawnTimer >= ROBBERY_SPAWN_INTERVAL) {
            robberySpawnTimer -= ROBBERY_SPAWN_INTERVAL;
            spawnNewCop();
        }
    },
    checkWin: function() {
        var p1 = cars[0], p2 = cars[1];
        if (!p1.alive && !p2.alive) return true;
        if (gameTime >= ROBBERY_DURATION) return true;
        var copsAlive = 0;
        for (var i = 0; i < cars.length; i++) {
            if (cars[i].isCop && cars[i].alive) copsAlive++;
        }
        return copsAlive === 0;
    },
    results: function() {
        var p1 = cars[0], p2 = cars[1];
        var copsAlive = 0;
        for (var i = 0; i < cars.length; i++) {
            if (cars[i].isCop && cars[i].alive) copsAlive++;
        }
        if (!p1.alive && !p2.alive) return { won: false, title: 'BOTH BUSTED!', titleColor: '#f44', sfx: 'lose' };
        if (!p1.alive) return { won: false, title: p1.name + ' BUSTED!', titleColor: '#f84', sfx: 'lose' };
        if (!p2.alive) return { won: false, title: p2.name + ' BUSTED!', titleColor: '#f84', sfx: 'lose' };
        if (copsAlive === 0) return { won: true, title: 'COPS DESTROYED!', titleColor: '#4f4', sfx: 'win' };
        return { won: true, title: 'GETAWAY!', titleColor: '#4f4', sfx: 'win' };
    },
});
