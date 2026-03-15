// ================================================================
//  UI — Step-based menu flow, car/map pickers, endGame, high scores
// ================================================================

var selectedMap = 'arena';  // default map id
var currentMenuStep = 2;    // tracks which step is shown

function resolveActiveMode() {
    var suffix = gameMode === 'single' ? '-single' : '-multi';
    setActiveMode(gameVariant + suffix);
}

// ================================================================
//  MENU NAVIGATION
// ================================================================

function navigateMenu(step) {
    // Hide all step overlays
    for (var i = 2; i <= 5; i++) {
        var el = document.getElementById('menu-step-' + i);
        if (el) el.style.display = 'none';
    }

    currentMenuStep = step;

    // Build content for target step
    if (step === 2) buildPlayerModeCards();
    if (step === 3) buildGameModeCards();
    if (step === 4) buildCarSetupPanel();
    if (step === 5) buildMapSelectCards();

    // Build step dots for this step
    buildStepDots(step);

    // Show target step
    var target = document.getElementById('menu-step-' + step);
    if (target) target.style.display = 'flex';
}

function buildStepDots(activeStep) {
    for (var s = 2; s <= 5; s++) {
        var dotsEl = document.getElementById('dots-step-' + s);
        if (!dotsEl) continue;
        dotsEl.innerHTML = '';
        for (var i = 2; i <= 5; i++) {
            var dot = document.createElement('div');
            dot.className = 'step-dot';
            if (i === activeStep) dot.className += ' active';
            else if (i < activeStep) dot.className += ' done';
            dotsEl.appendChild(dot);
        }
    }
}

// ================================================================
//  STEP 2: PLAYER MODE SELECTION
// ================================================================

function buildPlayerModeCards() {
    var container = document.getElementById('player-mode-cards');
    if (!container) return;
    container.innerHTML = '';

    var modes = [
        { id: 'single', title: 'SINGLE PLAYER', desc: 'You vs 11 AI', carCount: 1, color: '#ff6eb4' },
        { id: 'multi',  title: 'LOCAL MULTIPLAYER', desc: 'Split-screen with a friend', carCount: 2, color: '#6eb4ff' },
        { id: 'online', title: 'ONLINE MULTIPLAYER', desc: 'Coming Soon', carCount: 4, color: '#666', disabled: true }
    ];

    modes.forEach(function(m) {
        var card = document.createElement('div');
        card.className = 'menu-card' + (m.disabled ? ' disabled' : '');

        // Canvas preview
        var cvs = document.createElement('canvas');
        cvs.width = 180; cvs.height = 80;
        cvs.className = 'card-preview';
        card.appendChild(cvs);

        // Draw preview cars
        var pctx = cvs.getContext('2d');
        drawPlayerModePreview(pctx, m.id, cvs.width, cvs.height);

        var title = document.createElement('div');
        title.className = 'card-title';
        title.style.color = m.color;
        title.textContent = m.title;
        card.appendChild(title);

        var desc = document.createElement('div');
        desc.className = 'card-desc';
        desc.textContent = m.desc;
        card.appendChild(desc);

        if (m.disabled) {
            var badge = document.createElement('div');
            badge.className = 'coming-soon';
            badge.textContent = 'COMING SOON';
            card.appendChild(badge);
        }

        if (!m.disabled) {
            card.onclick = function() {
                ensureAudio();
                gameMode = m.id;
                resolveActiveMode();
                navigateMenu(3);
            };
        }
        container.appendChild(card);
    });
}

function drawPlayerModePreview(pctx, modeId, w, h) {
    if (typeof CAR_TYPES === 'undefined' || CAR_TYPES.length === 0) return;
    var sedan = CAR_TYPES[0];
    var sport = CAR_TYPES.length > 1 ? CAR_TYPES[1] : sedan;
    pctx.save();
    if (modeId === 'single') {
        pctx.translate(w/2, h/2);
        drawCarPreview(pctx, sport, '#ff6eb4', 2);
    } else if (modeId === 'multi') {
        pctx.translate(w/3, h/2);
        drawCarPreview(pctx, sedan, '#ff6eb4', 1.8);
        pctx.translate(w/3, 0);
        drawCarPreview(pctx, sedan, '#6eb4ff', 1.8);
    } else {
        pctx.translate(w/5, h/2 - 8);
        drawCarPreview(pctx, sedan, '#888', 1.3);
        pctx.translate(w/5, 8);
        drawCarPreview(pctx, sedan, '#777', 1.3);
        pctx.translate(w/5, -4);
        drawCarPreview(pctx, sedan, '#999', 1.3);
        pctx.translate(w/5, 6);
        drawCarPreview(pctx, sedan, '#666', 1.3);
    }
    pctx.restore();
}

// ================================================================
//  STEP 3: GAME TYPE SELECTION
// ================================================================

function buildGameModeCards() {
    var container = document.getElementById('game-mode-cards');
    if (!container) return;
    container.innerHTML = '';

    var variants = ['normal', 'hardcore', 'timed', 'teams', 'infected', 'robbery', 'ctf', 'racing'];
    var suffix = gameMode === 'single' ? '-single' : '-multi';

    variants.forEach(function(v) {
        var mode = GAME_MODES[v + suffix];
        if (!mode) return;

        var card = document.createElement('div');
        card.className = 'menu-card' + (v === gameVariant ? ' selected' : '');

        // Canvas preview
        var cvs = document.createElement('canvas');
        cvs.width = 160; cvs.height = 70;
        cvs.className = 'card-preview';
        card.appendChild(cvs);

        var pctx = cvs.getContext('2d');
        drawModePreview(pctx, v, cvs.width, cvs.height);

        var title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = mode.label;
        card.appendChild(title);

        var desc = document.createElement('div');
        desc.className = 'card-desc';
        desc.textContent = mode.description;
        card.appendChild(desc);

        card.onclick = function() {
            gameVariant = v;
            resolveActiveMode();
            // Auto-select speedway for racing
            if (v === 'racing') selectedMap = 'speedway';
            navigateMenu(4);
        };
        container.appendChild(card);
    });
}

function drawModePreview(pctx, modeId, w, h) {
    if (typeof CAR_TYPES === 'undefined' || CAR_TYPES.length === 0) return;
    var sedan = CAR_TYPES[0];
    var sport = CAR_TYPES.length > 1 ? CAR_TYPES[1] : sedan;
    var truck = CAR_TYPES.length > 3 ? CAR_TYPES[3] : sedan;
    pctx.save();

    if (modeId === 'normal') {
        // 3 cars scattered with spark dots
        pctx.translate(w/4, h/2);
        drawCarPreview(pctx, sedan, '#e03030', 1.4);
        pctx.translate(w/4, -8);
        drawCarPreview(pctx, sport, '#30c030', 1.4);
        pctx.translate(w/4, 12);
        drawCarPreview(pctx, sedan, '#e0e030', 1.4);
        // Spark dots
        pctx.fillStyle = '#ff4';
        for (var i = 0; i < 6; i++) {
            pctx.beginPath();
            pctx.arc(-w/4 + Math.random()*w/2, -20 + Math.random()*30, 1.5, 0, Math.PI*2);
            pctx.fill();
        }
    } else if (modeId === 'hardcore') {
        pctx.translate(w/2, h/2);
        drawCarPreview(pctx, truck, '#cc2222', 1.8);
        // Skull icon
        pctx.fillStyle = '#fff'; pctx.font = 'bold 16px Arial'; pctx.textAlign = 'center';
        pctx.fillText('\u2620', 0, -20);
    } else if (modeId === 'timed') {
        pctx.translate(w/3, h/2);
        drawCarPreview(pctx, sedan, '#ff6eb4', 1.4);
        pctx.translate(w/3, 0);
        drawCarPreview(pctx, sedan, '#6eb4ff', 1.4);
        // Clock icon
        pctx.fillStyle = '#fff'; pctx.font = 'bold 16px Arial'; pctx.textAlign = 'center';
        pctx.fillText('\u23F0', -w/6, -18);
    } else if (modeId === 'teams') {
        pctx.translate(w/3, h/2);
        drawCarPreview(pctx, sedan, '#e04040', 1.6);
        pctx.translate(w/3, 0);
        drawCarPreview(pctx, sedan, '#4080e0', 1.6);
    } else if (modeId === 'infected') {
        pctx.translate(w/2, h/2);
        drawCarPreview(pctx, sedan, '#33ff33', 1.6);
        // Biohazard dots
        pctx.fillStyle = '#0f0';
        for (var i = 0; i < 8; i++) {
            pctx.globalAlpha = 0.3 + Math.random() * 0.4;
            pctx.beginPath();
            pctx.arc(-30 + Math.random()*60, -15 + Math.random()*30, 2 + Math.random()*3, 0, Math.PI*2);
            pctx.fill();
        }
        pctx.globalAlpha = 1;
    } else if (modeId === 'robbery') {
        // Cop chasing colored car
        var cop = null;
        for (var i = 0; i < CAR_TYPES.length; i++) {
            if (CAR_TYPES[i].bodyStyle === 'cop') { cop = CAR_TYPES[i]; break; }
        }
        if (!cop) cop = sedan;
        pctx.translate(w/4, h/2);
        drawCarPreview(pctx, cop, '#1a1a2e', 1.4);
        pctx.translate(w/2, 0);
        drawCarPreview(pctx, sport, '#ff6eb4', 1.4);
    } else if (modeId === 'ctf') {
        pctx.translate(w/2, h/2);
        drawCarPreview(pctx, sedan, '#ff6eb4', 1.6);
        // Gold flag
        pctx.fillStyle = '#ffd700';
        pctx.fillRect(-2, -22, 2, 14);
        pctx.beginPath();
        pctx.moveTo(0, -22);
        pctx.lineTo(10, -18);
        pctx.lineTo(0, -14);
        pctx.closePath();
        pctx.fill();
    } else if (modeId === 'racing') {
        // 2 cars on curved line
        pctx.strokeStyle = '#555'; pctx.lineWidth = 2;
        pctx.beginPath();
        pctx.moveTo(10, h-10);
        pctx.quadraticCurveTo(w/2, 0, w-10, h-10);
        pctx.stroke();
        pctx.translate(w/3, h/2 - 5);
        drawCarPreview(pctx, sport, '#ff6eb4', 1.3);
        pctx.translate(w/4, 5);
        drawCarPreview(pctx, sport, '#6eb4ff', 1.3);
    }

    pctx.restore();
}

// ================================================================
//  STEP 4: CAR SETUP (name + car picker + color)
// ================================================================

function buildCarSetupPanel() {
    var panel = document.getElementById('car-setup-panel');
    if (!panel) return;

    if (gameMode === 'single') {
        panel.innerHTML =
            '<div class="player-cols">' +
                '<div class="player-col pink" id="p1-col">' +
                    '<div class="ptitle" id="p1-title">Your Car</div>' +
                    '<input type="text" class="name-input" id="p1-name-input" placeholder="ENTER NAME" maxlength="16">' +
                    '<div class="car-type-picker">' +
                        '<span>Pick your ride:</span>' +
                        '<div class="car-types-row" id="p1-car-types"></div>' +
                    '</div>' +
                    '<div class="color-picker-row">' +
                        '<span>Pick your color:</span>' +
                        '<div class="color-swatches" id="p1-swatches"></div>' +
                    '</div>' +
                    '<div class="pkey-compact">' +
                        '<b>A/D</b> Steer &nbsp;<b>W</b> Nitro &nbsp;<b>S</b> Brake &nbsp;<b>Space</b> Drift &nbsp;<b>R</b> Reset' +
                    '</div>' +
                '</div>' +
            '</div>';
    } else {
        panel.innerHTML =
            '<div class="player-cols">' +
                '<div class="player-col pink" id="p1-col">' +
                    '<div class="ptitle" id="p1-title">Player 1 \u2014 Left</div>' +
                    '<input type="text" class="name-input" id="p1-name-input" placeholder="PLAYER 1 NAME" maxlength="16">' +
                    '<div class="car-type-picker">' +
                        '<span>Pick your ride:</span>' +
                        '<div class="car-types-row" id="p1-car-types"></div>' +
                    '</div>' +
                    '<div class="color-picker-row">' +
                        '<span>Pick your color:</span>' +
                        '<div class="color-swatches" id="p1-swatches"></div>' +
                    '</div>' +
                    '<div class="pkey-compact">' +
                        '<b>A/D</b> Steer &nbsp;<b>W</b> Nitro &nbsp;<b>S</b> Brake &nbsp;<b>Q</b> Drift' +
                    '</div>' +
                '</div>' +
                '<div class="player-col blue" id="p2-col">' +
                    '<div class="ptitle" id="p2-title">Player 2 \u2014 Right</div>' +
                    '<input type="text" class="name-input" id="p2-name-input" placeholder="PLAYER 2 NAME" maxlength="16">' +
                    '<div class="car-type-picker">' +
                        '<span>Pick your ride:</span>' +
                        '<div class="car-types-row" id="p2-car-types"></div>' +
                    '</div>' +
                    '<div class="color-picker-row">' +
                        '<span>Pick your color:</span>' +
                        '<div class="color-swatches" id="p2-swatches"></div>' +
                    '</div>' +
                    '<div class="pkey-compact">' +
                        '<b>\u2190/\u2192</b> Steer &nbsp;<b>\u2191</b> Nitro &nbsp;<b>\u2193</b> Brake &nbsp;<b>M</b> Drift' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    // Fill in saved names
    var p1Input = document.getElementById('p1-name-input');
    if (p1Input) p1Input.value = playerName || '';
    var p2Input = document.getElementById('p2-name-input');
    if (p2Input) p2Input.value = player2Name || '';

    buildSwatches();
    updateColorPickerForVariant();
    buildCarTypePickers();
}

// ================================================================
//  STEP 5: MAP SELECTION
// ================================================================

function buildMapSelectCards() {
    var container = document.getElementById('map-select-cards');
    if (!container) return;
    container.innerHTML = '';

    if (typeof MAPS === 'undefined' || MAPS.length === 0) return;

    MAPS.forEach(function(m) {
        var card = document.createElement('div');
        card.className = 'map-card' + (m.id === selectedMap ? ' selected' : '');

        // Canvas preview
        var cvs = document.createElement('canvas');
        cvs.width = 160; cvs.height = 100;
        cvs.className = 'card-preview';
        card.appendChild(cvs);

        var pctx = cvs.getContext('2d');
        drawMapPreview(pctx, m, cvs.width, cvs.height);

        var title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = m.name;
        card.appendChild(title);

        var desc = document.createElement('div');
        desc.className = 'card-desc';
        desc.textContent = m.description;
        card.appendChild(desc);

        // Recommended badge for racing + speedway
        if (gameVariant === 'racing' && m.id === 'speedway') {
            var badge = document.createElement('div');
            badge.className = 'recommended-badge';
            badge.textContent = 'RECOMMENDED';
            card.appendChild(badge);
        }

        card.onclick = function() {
            selectedMap = m.id;
            container.querySelectorAll('.map-card').forEach(function(c) { c.classList.remove('selected'); });
            card.classList.add('selected');
        };
        container.appendChild(card);
    });
}

function drawMapPreview(pctx, map, w, h) {
    // Background color
    pctx.fillStyle = map.backgroundColor || '#333';
    pctx.fillRect(0, 0, w, h);

    var scaleX = w / map.arenaWidth;
    var scaleY = h / map.arenaHeight;

    // Draw roads
    if (map.roadLayout === 'radial' && map.radialRoads) {
        var r = map.radialRoads;
        var cx = (map.spawnCenterX || map.arenaWidth/2) * scaleX;
        var cy = (map.spawnCenterY || map.arenaHeight/2) * scaleY;
        var cr = r.centerRadius * Math.min(scaleX, scaleY);
        pctx.fillStyle = 'rgba(100,100,100,.5)';
        pctx.beginPath(); pctx.arc(cx, cy, cr, 0, Math.PI*2); pctx.fill();
        pctx.strokeStyle = 'rgba(100,100,100,.5)'; pctx.lineWidth = r.roadWidth * scaleX;
        for (var i = 0; i < r.roadCount; i++) {
            var a = r.startAngle + (i / r.roadCount) * Math.PI * 2;
            pctx.beginPath();
            pctx.moveTo(cx, cy);
            pctx.lineTo(cx + Math.cos(a) * r.roadLength * scaleX, cy + Math.sin(a) * r.roadLength * scaleY);
            pctx.stroke();
        }
    } else if (map.roadLayout === 'curvy' && map.curvyRoads) {
        map.curvyRoads.forEach(function(road) {
            if (!road.points || road.points.length < 2) return;
            pctx.strokeStyle = road.color || 'rgba(100,100,100,.5)';
            pctx.lineWidth = (road.width || 60) * Math.min(scaleX, scaleY);
            pctx.lineCap = 'round'; pctx.lineJoin = 'round';
            pctx.beginPath();
            pctx.moveTo(road.points[0].x * scaleX, road.points[0].y * scaleY);
            for (var i = 1; i < road.points.length; i++) {
                pctx.lineTo(road.points[i].x * scaleX, road.points[i].y * scaleY);
            }
            pctx.stroke();
        });
    }

    // Draw spawn area dots
    var spawnX = (map.spawnCenterX || map.arenaWidth/2) * scaleX;
    var spawnY = (map.spawnCenterY || map.arenaHeight/2) * scaleY;
    pctx.fillStyle = 'rgba(255,110,180,.6)';
    pctx.beginPath(); pctx.arc(spawnX, spawnY, 3, 0, Math.PI*2); pctx.fill();
    // Car dots around spawn
    for (var i = 0; i < 6; i++) {
        var a = (i / 6) * Math.PI * 2;
        var r = 8;
        pctx.fillStyle = 'rgba(255,255,255,.4)';
        pctx.beginPath(); pctx.arc(spawnX + Math.cos(a)*r, spawnY + Math.sin(a)*r, 1.5, 0, Math.PI*2); pctx.fill();
    }

    // Border
    pctx.strokeStyle = 'rgba(255,255,255,.15)';
    pctx.lineWidth = 1;
    pctx.strokeRect(0, 0, w, h);
}

// ================================================================
//  HIGH SCORES MODAL
// ================================================================

function showHighScoresModal() {
    var modal = document.getElementById('highscores-modal');
    if (!modal) return;
    modal.style.display = 'flex';

    var variants = ['normal', 'hardcore', 'timed', 'teams', 'infected', 'robbery', 'ctf', 'racing'];
    var modes = ['single', 'multi'];
    var tabs = document.getElementById('hs-tabs');
    var body = document.getElementById('hs-body');
    tabs.innerHTML = '';

    var allKeys = [];
    variants.forEach(function(v) {
        modes.forEach(function(m) {
            allKeys.push({ key: v + '-' + m, label: v.toUpperCase() + ' (' + m.charAt(0).toUpperCase() + ')' });
        });
    });

    var activeKey = getModeKey();

    function showTab(key) {
        activeKey = key;
        body.innerHTML = buildHighScoreTable(key);
        tabs.querySelectorAll('.hs-tab').forEach(function(t) {
            t.classList.toggle('active', t.dataset.key === key);
        });
    }

    allKeys.forEach(function(item) {
        var tab = document.createElement('button');
        tab.className = 'hs-tab' + (item.key === activeKey ? ' active' : '');
        tab.textContent = item.label;
        tab.dataset.key = item.key;
        tab.onclick = function() { showTab(item.key); };
        tabs.appendChild(tab);
    });

    showTab(activeKey);
}

function hideHighScoresModal() {
    var modal = document.getElementById('highscores-modal');
    if (modal) modal.style.display = 'none';
}

// ================================================================
//  TEAM PICKER
// ================================================================

function buildTeamPicker(container, playerNum) {
    var sel = playerNum === 1 ? selectedTeamP1 : selectedTeamP2;
    container.innerHTML = '<span>Pick your team:</span><div class="team-picker" id="team-picker-p' + playerNum + '"></div>';
    var row = container.querySelector('.team-picker');
    ['red', 'blue'].forEach(function(team) {
        var btn = document.createElement('button');
        btn.className = 'team-btn' + (sel === team ? ' active' : '');
        btn.style.borderColor = TEAM_COLORS[team];
        btn.style.color = TEAM_COLORS[team];
        if (sel === team) btn.style.background = TEAM_COLORS[team] + '33';
        btn.textContent = team === 'red' ? 'RED' : 'BLUE';
        btn.onclick = function() {
            if (playerNum === 1) { selectedTeamP1 = team; P1_COLOR = TEAM_COLORS[team]; }
            else { selectedTeamP2 = team; P2_COLOR = TEAM_COLORS[team]; }
            row.querySelectorAll('.team-btn').forEach(function(b) {
                b.classList.remove('active');
                b.style.background = 'rgba(255,255,255,.04)';
            });
            btn.classList.add('active');
            btn.style.background = TEAM_COLORS[team] + '33';
            var col = document.getElementById('p' + playerNum + '-col');
            var title = document.getElementById('p' + playerNum + '-title');
            if (col) { col.style.borderColor = TEAM_COLORS[team]; col.style.background = TEAM_COLORS[team] + '22'; }
            if (title) title.style.color = TEAM_COLORS[team];
            var pickerId = playerNum === 1 ? 'p1-car-types' : 'p2-car-types';
            var picker = document.getElementById(pickerId);
            if (picker && picker._refreshPreview) picker._refreshPreview(TEAM_COLORS[team]);
        };
        row.appendChild(btn);
    });
}

function updateColorPickerForVariant() {
    var isTeams = gameVariant === 'teams';
    if (isTeams) {
        P1_COLOR = TEAM_COLORS[selectedTeamP1 || 'red'];
        P2_COLOR = TEAM_COLORS[selectedTeamP2 || 'blue'];
    }
    var p1Row = document.querySelector('#p1-col .color-picker-row');
    if (p1Row) {
        if (isTeams) {
            buildTeamPicker(p1Row, 1);
        } else {
            p1Row.innerHTML = '<span>Pick your color:</span><div class="color-swatches" id="p1-swatches"></div>';
        }
    }
    var p2Row = document.querySelector('#p2-col .color-picker-row');
    if (p2Row) {
        if (isTeams) {
            buildTeamPicker(p2Row, 2);
        } else {
            p2Row.innerHTML = '<span>Pick your color:</span><div class="color-swatches" id="p2-swatches"></div>';
        }
    }
    if (!isTeams) buildSwatches();
}

// ================================================================
//  COLOR SWATCHES
// ================================================================

function buildSwatches() {
    var p1Container = document.getElementById('p1-swatches');
    if (!p1Container) return;
    p1Container.innerHTML = '';
    PLAYER_COLOR_OPTIONS.forEach(function(c) {
        var s1 = document.createElement('div');
        s1.className = 'color-swatch' + (c === P1_COLOR ? ' selected' : '');
        s1.style.background = c;
        s1.onclick = function() {
            P1_COLOR = c;
            p1Container.querySelectorAll('.color-swatch').forEach(function(s) { s.classList.remove('selected'); });
            s1.classList.add('selected');
            document.getElementById('p1-col').style.borderColor = c;
            document.getElementById('p1-col').style.background = c + '22';
            document.getElementById('p1-title').style.color = c;
            var ct = document.getElementById('p1-car-types');
            if (ct && ct._refreshPreview) ct._refreshPreview(c);
        };
        p1Container.appendChild(s1);
    });

    if (gameMode === 'multi') {
        var p2Container = document.getElementById('p2-swatches');
        if (!p2Container) return;
        p2Container.innerHTML = '';
        PLAYER_COLOR_OPTIONS.forEach(function(c) {
            var s2 = document.createElement('div');
            s2.className = 'color-swatch' + (c === P2_COLOR ? ' selected' : '');
            s2.style.background = c;
            s2.onclick = function() {
                P2_COLOR = c;
                p2Container.querySelectorAll('.color-swatch').forEach(function(s) { s.classList.remove('selected'); });
                s2.classList.add('selected');
                document.getElementById('p2-col').style.borderColor = c;
                document.getElementById('p2-col').style.background = c + '22';
                document.getElementById('p2-title').style.color = c;
                var ct = document.getElementById('p2-car-types');
                if (ct && ct._refreshPreview) ct._refreshPreview(c);
            };
            p2Container.appendChild(s2);
        });
    }
}

// ================================================================
//  CAR PREVIEW DRAWING
// ================================================================

function drawCarPreview(pctx, ct, color, scale) {
    var cw = ct.width || 40;
    var ch = ct.height || 22;
    var bodyStyle = ct.bodyStyle || 'sedan';
    var s = scale || 3;

    pctx.save();
    pctx.scale(s, s);

    var shadowOff = (['suv','truck_heavy','warrig','pickup','schoolbus'].indexOf(bodyStyle) >= 0) ? 5 : 3;
    pctx.fillStyle = 'rgba(0,0,0,.3)';
    pctx.fillRect(-cw/2 + shadowOff, -ch/2 + shadowOff, cw, ch);

    var cornerRadius = (bodyStyle === 'compact' || bodyStyle === 'miata') ? 8 : bodyStyle === 'schoolbus' ? 3 : 4;
    pctx.fillStyle = color;
    pctx.beginPath(); pctx.roundRect(-cw/2, -ch/2, cw, ch, cornerRadius); pctx.fill();
    pctx.strokeStyle = 'rgba(255,255,255,.25)';
    pctx.lineWidth = 0.8;
    pctx.beginPath(); pctx.roundRect(-cw/2, -ch/2, cw, ch, cornerRadius); pctx.stroke();

    pctx.fillStyle = 'rgba(100,180,255,.55)';
    if (bodyStyle === 'sport') {
        pctx.fillRect(cw/2 - 14, -ch/2 + 5, 8, ch - 10);
    } else if (bodyStyle === 'schoolbus') {
        pctx.fillRect(cw/2 - 10, -ch/2 + 2, 6, ch - 4);
    } else {
        pctx.fillRect(cw/2 - 14, -ch/2 + 3, 8, ch - 6);
    }

    pctx.fillStyle = 'rgba(0,0,0,.3)';
    pctx.fillRect(-cw/2, -ch/2 + 2, 8, ch - 4);

    pctx.fillStyle = 'rgba(255,255,255,.22)';
    pctx.fillRect(-5, -2, 10, 4);

    pctx.fillStyle = '#ffa';
    pctx.fillRect(cw/2 - 3, -ch/2 + 2, 3, 4);
    pctx.fillRect(cw/2 - 3, ch/2 - 6, 3, 4);

    pctx.fillStyle = '#f00';
    pctx.fillRect(-cw/2, -ch/2 + 2, 3, 4);
    pctx.fillRect(-cw/2, ch/2 - 6, 3, 4);

    if (bodyStyle === 'sport') {
        pctx.save();
        pctx.beginPath(); pctx.roundRect(-cw/2, -ch/2, cw, ch, 4); pctx.clip();
        pctx.fillStyle = 'rgba(255,255,255,.2)';
        pctx.beginPath();
        pctx.moveTo(-5, -ch/2); pctx.lineTo(10, -ch/2);
        pctx.lineTo(-5, ch/2); pctx.lineTo(-20, ch/2);
        pctx.closePath(); pctx.fill();
        pctx.restore();
        pctx.fillStyle = '#fff';
        pctx.beginPath(); pctx.arc(0, 0, 5, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#111';
        pctx.font = 'bold 7px Arial'; pctx.textAlign = 'center';
        pctx.fillText('7', 0.5, 2.5);
        pctx.fillStyle = '#222';
        pctx.fillRect(-cw/2 - 3, -ch/2 - 1.5, 8, ch + 3);
        pctx.fillStyle = color;
        pctx.fillRect(-cw/2 - 4, -ch/2 - 3, 10, 3);
        pctx.fillRect(-cw/2 - 4, ch/2, 10, 3);
        pctx.fillStyle = '#555';
        pctx.fillRect(-cw/2 + 2, -ch/2 + 2, 2, 2);
        pctx.fillRect(-cw/2 + 2, ch/2 - 4, 2, 2);
        pctx.fillStyle = '#f80'; pctx.globalAlpha = 0.5;
        pctx.beginPath(); pctx.arc(-cw/2 - 2, -4, 3, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-cw/2 - 2, 4, 3, 0, Math.PI*2); pctx.fill();
        pctx.globalAlpha = 1;
        pctx.fillStyle = '#444';
        pctx.beginPath(); pctx.arc(-cw/2 - 1, -4, 1.8, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-cw/2 - 1, 4, 1.8, 0, Math.PI*2); pctx.fill();

    } else if (bodyStyle === 'suv') {
        pctx.fillStyle = '#888';
        pctx.fillRect(-cw/4 - 1, -ch/2 - 2, cw/2 + 2, 2.5);
        pctx.fillRect(-cw/4 - 1, ch/2 - 0.5, cw/2 + 2, 2.5);
        pctx.fillRect(-cw/6 - 0.5, -ch/2 - 2, 2, ch + 4);
        pctx.fillRect(cw/6 - 0.5, -ch/2 - 2, 2, ch + 4);
        pctx.fillStyle = 'rgba(0,0,0,.35)';
        pctx.fillRect(cw/2 - 5, -ch/2 - 1.5, 6, 2);
        pctx.fillRect(cw/2 - 5, ch/2 - 0.5, 6, 2);
        pctx.fillRect(-cw/2 - 1, -ch/2 - 1.5, 6, 2);
        pctx.fillRect(-cw/2 - 1, ch/2 - 0.5, 6, 2);

    } else if (bodyStyle === 'truck') {
        pctx.strokeStyle = 'rgba(200,200,200,.7)'; pctx.lineWidth = 2.5;
        pctx.beginPath();
        pctx.moveTo(cw/2 + 2, -ch/2 + 1);
        pctx.lineTo(cw/2 + 4, -ch/2 + 1);
        pctx.lineTo(cw/2 + 4, ch/2 - 1);
        pctx.lineTo(cw/2 + 2, ch/2 - 1);
        pctx.stroke();
        pctx.beginPath(); pctx.moveTo(cw/2, 0); pctx.lineTo(cw/2 + 4, 0); pctx.stroke();

    } else if (bodyStyle === 'truck_heavy') {
        pctx.fillStyle = '#999';
        pctx.fillRect(cw/2, -ch/2, 5, ch);
        pctx.fillStyle = '#bbb';
        pctx.fillRect(cw/2 + 1, -ch/2 + 1, 3, ch - 2);
        pctx.fillStyle = '#777';
        pctx.fillRect(cw/2, -2, 5, 4);
        pctx.fillStyle = '#555';
        pctx.fillRect(-2, -ch/2 - 4, 3, 5);
        pctx.fillRect(-2, ch/2 - 1, 3, 5);
        pctx.fillStyle = '#333';
        pctx.beginPath(); pctx.arc(-0.5, -ch/2 - 4, 1.5, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-0.5, ch/2 + 4, 1.5, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = 'rgba(100,100,100,.3)';
        pctx.beginPath(); pctx.arc(-0.5, -ch/2 - 7, 2.5, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-0.5, ch/2 + 7, 2.5, 0, Math.PI*2); pctx.fill();

    } else if (bodyStyle === 'warrig') {
        pctx.fillStyle = '#aaa';
        pctx.beginPath();
        pctx.moveTo(cw/2 + 7, 0);
        pctx.lineTo(cw/2, -ch/2 - 1);
        pctx.lineTo(cw/2, ch/2 + 1);
        pctx.closePath(); pctx.fill();
        pctx.fillStyle = '#888';
        pctx.beginPath();
        pctx.moveTo(cw/2 + 6, 0);
        pctx.lineTo(cw/2 + 1, -ch/2 + 1);
        pctx.lineTo(cw/2 + 1, ch/2 - 1);
        pctx.closePath(); pctx.fill();
        pctx.save();
        pctx.beginPath(); pctx.rect(-cw/2, -ch/2, cw/3, ch); pctx.clip();
        pctx.fillStyle = 'rgba(0,0,0,.25)';
        for (var i = -30; i < 30; i += 6) {
            pctx.save(); pctx.translate(i, 0); pctx.rotate(0.7);
            pctx.fillRect(-1.5, -20, 3, 40);
            pctx.restore();
        }
        pctx.restore();
        pctx.fillStyle = 'rgba(80,80,80,.5)';
        pctx.fillRect(-cw/4, -ch/2 - 2, cw/2, 2.5);
        pctx.fillRect(-cw/4, ch/2 - 0.5, cw/2, 2.5);
        pctx.fillStyle = '#555';
        pctx.fillRect(2, -ch/2 - 3, 2.5, 4);
        pctx.fillRect(2, ch/2 - 1, 2.5, 4);

    } else if (bodyStyle === 'compact') {
        pctx.fillStyle = color;
        pctx.fillRect(cw/2 - 15, -ch/2 + 2, 12, ch - 4);
        pctx.fillRect(-cw/2, -ch/2 + 1, 4, 5);
        pctx.fillRect(-cw/2, ch/2 - 6, 4, 5);
        pctx.fillStyle = 'rgba(120,200,255,.5)';
        pctx.beginPath(); pctx.arc(4, 0, 8, -1.3, 1.3); pctx.fill();
        pctx.strokeStyle = 'rgba(200,240,255,.3)'; pctx.lineWidth = 0.5;
        pctx.beginPath(); pctx.arc(4, 0, 8, -1.3, 1.3); pctx.stroke();
        pctx.fillStyle = '#ffa';
        pctx.beginPath(); pctx.arc(cw/2 - 1, -ch/2 + 4, 3, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(cw/2 - 1, ch/2 - 4, 3, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#fff';
        pctx.beginPath(); pctx.arc(cw/2, -ch/2 + 3.5, 1, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(cw/2, ch/2 - 3.5, 1, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#f44';
        pctx.beginPath(); pctx.arc(-cw/2 + 1, -ch/2 + 4, 2.5, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-cw/2 + 1, ch/2 - 4, 2.5, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#fff';
        pctx.beginPath(); pctx.arc(-2, 0, 4.5, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#111';
        pctx.font = 'bold 6px Arial'; pctx.textAlign = 'center';
        pctx.fillText('3', -1.5, 2.2);

    } else if (bodyStyle === 'miata') {
        pctx.fillStyle = color;
        pctx.fillRect(cw/2 - 15, -ch/2 + 2, 10, ch - 4);
        pctx.fillStyle = 'rgba(120,200,255,.45)';
        pctx.beginPath(); pctx.arc(3, 0, 7, -1.2, 1.2); pctx.fill();
        pctx.fillStyle = 'rgba(0,0,0,.15)';
        pctx.beginPath(); pctx.roundRect(-5, -ch/2 + 2, 10, ch - 4, 3); pctx.fill();
        pctx.strokeStyle = '#333'; pctx.lineWidth = 1;
        pctx.beginPath();
        pctx.moveTo(cw/2 - 1, -ch/4);
        pctx.quadraticCurveTo(cw/2 + 2, 0, cw/2 - 1, ch/4);
        pctx.stroke();
        pctx.fillStyle = '#f44';
        pctx.beginPath(); pctx.arc(-cw/2 + 1, -ch/2 + 4, 2, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-cw/2 + 1, ch/2 - 4, 2, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#888';
        pctx.beginPath(); pctx.arc(-cw/2 - 1, ch/3, 1.5, 0, Math.PI*2); pctx.fill();

    } else if (bodyStyle === 'pickup') {
        pctx.fillStyle = 'rgba(0,0,0,.2)';
        pctx.fillRect(-cw/2, -ch/2 + 2, cw * 0.4, ch - 4);
        pctx.fillStyle = '#777';
        pctx.fillRect(-cw/2 + 2, -ch/2 - 1, cw * 0.35, 1.5);
        pctx.fillRect(-cw/2 + 2, ch/2 - 0.5, cw * 0.35, 1.5);
        pctx.fillStyle = '#ccc';
        pctx.fillRect(cw/2, -ch/2 + 1, 3, ch - 2);
        pctx.fillStyle = '#999';
        for (var i = 0; i < 4; i++) {
            var gy = -ch/2 + 3 + i * ((ch - 6) / 4);
            pctx.fillRect(cw/2, gy, 3, 1.5);
        }
        pctx.fillStyle = '#bbb';
        pctx.fillRect(cw/2 + 2, -ch/2 + 2, 2, ch - 4);
        pctx.fillStyle = '#666';
        pctx.fillRect(-cw/2 - 4, -2, 5, 4);
        pctx.fillStyle = '#888';
        pctx.fillRect(-cw/2 - 3, -1, 3, 2);
        pctx.fillStyle = '#555';
        pctx.fillRect(-cw/6, -ch/2 - 1, cw/3, 1.5);
        pctx.fillRect(-cw/6, ch/2 - 0.5, cw/3, 1.5);
        pctx.fillStyle = '#888';
        pctx.beginPath(); pctx.arc(-cw/2 - 2, ch/4, 2, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#555';
        pctx.beginPath(); pctx.arc(-cw/2 - 2, ch/4, 1.2, 0, Math.PI*2); pctx.fill();

    } else if (bodyStyle === 'schoolbus') {
        pctx.fillStyle = 'rgba(100,180,255,.45)';
        for (var i = 0; i < 7; i++) {
            var wx = -cw/2 + 10 + i * (cw - 20) / 7;
            pctx.fillRect(wx, -ch/2 + 2, 4, 3);
            pctx.fillRect(wx, ch/2 - 5, 4, 3);
        }
        pctx.fillStyle = '#222';
        for (var i = 0; i <= 7; i++) {
            var wx = -cw/2 + 9 + i * (cw - 20) / 7;
            pctx.fillRect(wx, -ch/2 + 1.5, 1, 4);
            pctx.fillRect(wx, ch/2 - 5.5, 1, 4);
        }
        pctx.fillStyle = '#222';
        pctx.fillRect(cw/2, -ch/2 + 1, 3, ch - 2);
        pctx.fillRect(-cw/2 - 2, -ch/2 + 1, 3, ch - 2);
        pctx.fillStyle = '#d00';
        pctx.fillRect(cw/4, -ch/2 - 3, 8, 3);
        pctx.fillStyle = '#fff'; pctx.font = 'bold 2.5px Arial'; pctx.textAlign = 'center';
        pctx.fillText('STOP', cw/4 + 4, -ch/2 - 1);
        pctx.fillStyle = '#f22';
        pctx.beginPath(); pctx.arc(cw/2 - 4, -ch/2 - 0.5, 2, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(cw/2 - 4, ch/2 + 0.5, 2, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#fa0'; pctx.globalAlpha = 0.8;
        pctx.fillRect(0, -ch/2 - 0.5, 3, 1.5);
        pctx.fillRect(0, ch/2 - 1, 3, 1.5);
        pctx.fillRect(-cw/4, -ch/2 - 0.5, 3, 1.5);
        pctx.fillRect(-cw/4, ch/2 - 1, 3, 1.5);
        pctx.globalAlpha = 1;
        pctx.strokeStyle = '#222'; pctx.lineWidth = 0.8;
        pctx.strokeRect(-cw/2 + 1, -ch/4, 5, ch/2);
        pctx.fillStyle = 'rgba(0,0,0,.1)';
        pctx.fillRect(-cw/3, -ch/2 + 4, cw * 0.6, ch - 8);

    } else if (bodyStyle === 'cop') {
        pctx.fillStyle = '#eee';
        pctx.save();
        pctx.beginPath(); pctx.roundRect(-cw/2, -ch/2, cw, ch, 4); pctx.clip();
        pctx.fillRect(2, -ch/2, cw/2, ch);
        pctx.restore();
        pctx.fillStyle = '#1a1a2e';
        pctx.save();
        pctx.beginPath(); pctx.roundRect(-cw/2, -ch/2, cw, ch, 4); pctx.clip();
        pctx.fillRect(6, -4.5, cw/2 - 6, 9);
        pctx.restore();
        pctx.save();
        pctx.translate(cw/4 + 2, 0);
        pctx.fillStyle = '#cc9900'; pctx.globalAlpha = 0.7;
        var sr = 3.2, sp = 5;
        pctx.beginPath();
        for (var si = 0; si < sp * 2; si++) {
            var sa = -Math.PI/2 + si * Math.PI / sp;
            var sd = si % 2 === 0 ? sr : sr * 0.45;
            if (si === 0) pctx.moveTo(Math.cos(sa)*sd, Math.sin(sa)*sd);
            else pctx.lineTo(Math.cos(sa)*sd, Math.sin(sa)*sd);
        }
        pctx.closePath(); pctx.fill();
        pctx.globalAlpha = 1;
        pctx.restore();
        pctx.strokeStyle = 'rgba(0,0,0,.25)'; pctx.lineWidth = 0.8;
        pctx.beginPath(); pctx.moveTo(2, -ch/2 + 1); pctx.lineTo(2, ch/2 - 1); pctx.stroke();
        pctx.fillStyle = '#999';
        pctx.fillRect(cw/2, -ch/2 + 1, 3, ch - 2);
        pctx.fillStyle = '#bbb';
        pctx.fillRect(cw/2 + 2, -ch/2 + 2, 2, ch - 4);
        pctx.fillStyle = '#ff2222';
        pctx.beginPath(); pctx.arc(-2, -ch/2 - 2, 2.5, 0, Math.PI * 2); pctx.fill();
        pctx.fillStyle = '#2266ff';
        pctx.beginPath(); pctx.arc(-2, ch/2 + 2, 2.5, 0, Math.PI * 2); pctx.fill();
        pctx.fillStyle = '#444';
        pctx.fillRect(-5, -ch/2 - 0.5, 6, ch + 1);
        pctx.fillStyle = '#cc9900'; pctx.globalAlpha = 0.6;
        pctx.beginPath(); pctx.arc(-5, 0, 3, 0, Math.PI * 2); pctx.fill();
        pctx.globalAlpha = 1;
    }

    pctx.restore();
}

// ================================================================
//  STAT BAR HELPER
// ================================================================

function drawStatBar(parent, label, value, maxVal, barColor) {
    var row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML =
        '<span class="stat-label">' + label + '</span>' +
        '<span class="stat-bar-bg"><span class="stat-bar-fill" style="width:' +
        Math.round((value / maxVal) * 100) + '%;background:' + barColor + '"></span></span>' +
        '<span class="stat-val">' + value + '</span>';
    parent.appendChild(row);
}

// ================================================================
//  CAR TYPE PICKER (CAROUSEL)
// ================================================================

function buildCarTypePickers() {
    if (typeof CAR_TYPES === 'undefined' || CAR_TYPES.length === 0) return;

    if (!selectedCarTypeP1) selectedCarTypeP1 = CAR_TYPES[0];
    if (!selectedCarTypeP2) selectedCarTypeP2 = CAR_TYPES[0];

    var p1Idx = CAR_TYPES.indexOf(selectedCarTypeP1);
    if (p1Idx < 0) p1Idx = 0;
    buildOneCarTypePicker('p1-car-types', p1Idx, function(ct) { selectedCarTypeP1 = ct; }, 'p1');

    if (gameMode === 'multi') {
        var p2Idx = CAR_TYPES.indexOf(selectedCarTypeP2);
        if (p2Idx < 0) p2Idx = 0;
        buildOneCarTypePicker('p2-car-types', p2Idx, function(ct) { selectedCarTypeP2 = ct; }, 'p2');
    }
}

function buildOneCarTypePicker(containerId, startIdx, onSelect, playerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    var pickableCars = CAR_TYPES;

    var idx = Math.min(startIdx, pickableCars.length - 1);
    if (idx < 0) idx = 0;
    function getColor() { return playerId === 'p1' ? P1_COLOR : P2_COLOR; }

    var wrapper = document.createElement('div');
    wrapper.className = 'car-carousel';

    var cvs = document.createElement('canvas');
    cvs.width = 200; cvs.height = 90;
    cvs.className = 'car-preview-canvas';

    var arrowL = document.createElement('div');
    arrowL.className = 'car-arrow car-arrow-left';
    arrowL.textContent = '\u25C0';

    var arrowR = document.createElement('div');
    arrowR.className = 'car-arrow car-arrow-right';
    arrowR.textContent = '\u25B6';

    var info = document.createElement('div');
    info.className = 'car-info';

    var dots = document.createElement('div');
    dots.className = 'car-dots';

    var slideRow = document.createElement('div');
    slideRow.className = 'car-slide-row';
    slideRow.appendChild(arrowL);
    slideRow.appendChild(cvs);
    slideRow.appendChild(arrowR);
    wrapper.appendChild(slideRow);
    wrapper.appendChild(info);
    wrapper.appendChild(dots);
    container.appendChild(wrapper);

    pickableCars.forEach(function(ct, i) {
        var dot = document.createElement('div');
        dot.className = 'car-dot' + (i === idx ? ' active' : '');
        dot.onclick = function() { idx = i; update(); };
        dots.appendChild(dot);
    });

    function update() {
        var ct = pickableCars[idx];
        onSelect(ct);

        var pctx = cvs.getContext('2d');
        pctx.clearRect(0, 0, cvs.width, cvs.height);
        pctx.save();
        pctx.translate(cvs.width / 2, cvs.height / 2);
        drawCarPreview(pctx, ct, getColor(), 2.8);
        pctx.restore();

        info.innerHTML = '';
        var nameEl = document.createElement('div');
        nameEl.className = 'car-info-name';
        nameEl.textContent = ct.name;
        info.appendChild(nameEl);

        var descEl = document.createElement('div');
        descEl.className = 'car-info-desc';
        descEl.textContent = ct.description;
        info.appendChild(descEl);

        var stats = document.createElement('div');
        stats.className = 'car-stats';
        drawStatBar(stats, 'HP',    ct.hp,           260, '#4f4');
        drawStatBar(stats, 'SPEED', Math.round(ct.maxSpeedMult * 100), 130, '#4ff');
        drawStatBar(stats, 'ACCEL', Math.round(ct.accelMult * 100),    130, '#ff4');
        drawStatBar(stats, 'TURN',  Math.round(ct.turnMult * 100),     130, '#fa4');
        drawStatBar(stats, 'MASS',  Math.round(ct.mass * 100),         180, '#f66');
        drawStatBar(stats, 'GRIP',  Math.round((1 + ct.gripBonus) * 100), 110, '#a6f');
        info.appendChild(stats);

        dots.querySelectorAll('.car-dot').forEach(function(d, i) {
            d.className = 'car-dot' + (i === idx ? ' active' : '');
        });
    }

    arrowL.onclick = function() {
        idx = (idx - 1 + pickableCars.length) % pickableCars.length;
        update();
    };
    arrowR.onclick = function() {
        idx = (idx + 1) % pickableCars.length;
        update();
    };

    update();

    container._refreshPreview = function(newColor) {
        var ct = pickableCars[idx];
        var pctx = cvs.getContext('2d');
        pctx.clearRect(0, 0, cvs.width, cvs.height);
        pctx.save();
        pctx.translate(cvs.width / 2, cvs.height / 2);
        drawCarPreview(pctx, ct, newColor || getColor(), 2.8);
        pctx.restore();
    };
}

// ================================================================
//  START / END / MENU
// ================================================================

function showStartScreen() {
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('highscores-modal').style.display = 'none';
    introActive = false;
    paused = false;
    gameState = 'menu';
    navigateMenu(2);
}

function startGame() {
    // Hide all menu steps
    for (var i = 2; i <= 5; i++) {
        var el = document.getElementById('menu-step-' + i);
        if (el) el.style.display = 'none';
    }
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('highscores-modal').style.display = 'none';

    // Save player names from input fields
    var p1Input = document.getElementById('p1-name-input');
    if (p1Input && p1Input.value.trim()) {
        savePlayerName(p1Input.value.trim().toUpperCase());
    } else if (p1Input) {
        savePlayerName('');
    }
    var p2Input = document.getElementById('p2-name-input');
    if (p2Input && p2Input.value.trim()) {
        savePlayer2Name(p2Input.value.trim().toUpperCase());
    } else if (p2Input) {
        savePlayer2Name('');
    }

    // Resolve selected map
    currentMap = MAPS.find(function(m) { return m.id === selectedMap; }) || MAPS[0];

    resolveActiveMode();
    ensureAudio();
    lastSfx = {}; // reset sound throttle so first sounds always play
    gameState = 'countdown';
    countdownVal = 3;
    countdownTimer = 0;
    gameTime = 0;
    score = 0;
    particles = []; skidMarks = []; debris = []; floatingTexts = [];
    powerUps = []; powerUpSpawnTimer = 0; breakables = [];
    slomoActive = false; slomoTimer = 0; slomoFade = 0;
    fadeInAlpha = 1; // start fully black, fades in
    ctfFlag = null; ctfScores = {}; ctfHoldTimer = 0; ctfBonusTimer = 0;
    raceData = null;
    resetScoring();
    generateTerrain();
    spawnCars();
}

function endGame() {
    gameState = 'gameover';
    var title = document.getElementById('go-title');

    // Use mode registry for results when available
    if (activeMode && activeMode.results) {
        var res = activeMode.results();
        playSfx(res.sfx);
        title.textContent = res.title;
        title.style.color = res.titleColor;
    }

    // Stats display
    var mins = Math.floor(gameTime / 60);
    var secs = Math.floor(gameTime % 60);
    var timeStr = mins + ':' + secs.toString().padStart(2, '0');

    function readableColor(hex) {
        var c = hex.replace('#', '');
        if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
        var r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
        var lum = (r * 0.299 + g * 0.587 + b * 0.114);
        return lum < 60 ? '#ccc' : hex;
    }
    var p1StatsCol = readableColor(P1_COLOR);
    var p2StatsCol = readableColor(P2_COLOR);

    // Compute per-player score for multiplayer (kills*500 + damage*3 + hits*50)
    function playerScore(car) {
        return car.kills * 500 + Math.round(car.damageDealt * 3) + car.hits * 50;
    }

    var modeKey = getModeKey();
    var banner = document.getElementById('go-highscore-banner');
    var lb = document.getElementById('go-leaderboard');
    var gotNewHS = false;

    if (gameMode === 'single') {
        var p = cars[0];
        if (!activeMode) {
            var playerWon = p.alive || cars.filter(function(c) { return c.playerIdx === -1 && c.alive; }).length === 0;
            if (playerWon) { playSfx('win'); title.textContent = 'YOU WIN!'; title.style.color = '#4f4'; }
            else { playSfx('lose'); title.textContent = 'GAME OVER'; title.style.color = '#f44'; }
        }
        document.getElementById('game-over-stats').innerHTML =
            '<div style="color:' + p1StatsCol + '">' +
            '<b>Final Score: ' + score + '</b><br><br>' +
            'Kills: ' + p.kills + '<br>' +
            'Deaths: ' + p.deaths + '<br>' +
            'Hits: ' + p.hits + '<br>' +
            'Damage Dealt: ' + Math.round(p.damageDealt) + '<br>' +
            'Time Survived: ' + timeStr +
            '</div>';

        // Save high score
        var rank = getScoreRank(modeKey, score);
        var entry = {
            name: playerName || 'PLAYER',
            score: score,
            kills: p.kills,
            deaths: p.deaths,
            time: gameTime,
            date: new Date().toISOString().slice(0,10),
            car: selectedCarTypeP1 ? selectedCarTypeP1.name : 'Stock'
        };
        saveHighScore(modeKey, entry);

        if (rank > 0 && rank <= 10) {
            gotNewHS = true;
            banner.style.display = 'block';
            banner.innerHTML = '<div class="hs-new-record">NEW HIGH SCORE! #' + rank + '</div>';
        } else {
            banner.style.display = 'none';
        }

        lb.innerHTML = '<div style="font-size:13px;color:#888;margin-bottom:6px;letter-spacing:1px;">TOP SCORES \u2014 ' + gameVariant.toUpperCase() + '</div>' + buildHighScoreTable(modeKey);

    } else {
        var p1 = cars[0], p2 = cars[1];
        if (!activeMode) {
            var winner;
            if (p1.kills > p2.kills) winner = 'P1';
            else if (p2.kills > p1.kills) winner = 'P2';
            else if (p1.deaths < p2.deaths) winner = 'P1';
            else if (p2.deaths < p1.deaths) winner = 'P2';
            else if (p1.damageDealt > p2.damageDealt) winner = 'P1';
            else if (p2.damageDealt > p1.damageDealt) winner = 'P2';
            else winner = 'TIE';
            if (winner !== 'TIE') playSfx('win'); else playSfx('lose');
            if (winner === 'TIE') { title.textContent = "IT'S A TIE!"; title.style.color = '#aaa'; }
            else if (winner === 'P1') { title.textContent = p1.name + ' WINS!'; title.style.color = P1_COLOR; }
            else { title.textContent = p2.name + ' WINS!'; title.style.color = P2_COLOR; }
        }

        var p1Score = playerScore(p1);
        var p2Score = playerScore(p2);

        document.getElementById('game-over-stats').innerHTML =
            '<div style="display:flex;gap:60px;justify-content:center">' +
            '<div style="color:' + p1StatsCol + '">' +
            '<b>' + p1.name + '</b><br>' +
            'Score: ' + p1Score + '<br>' +
            'Kills: ' + p1.kills + '<br>' +
            'Deaths: ' + p1.deaths + '<br>' +
            'Hits: ' + p1.hits + '<br>' +
            'Damage: ' + Math.round(p1.damageDealt) +
            '</div>' +
            '<div style="color:' + p2StatsCol + '">' +
            '<b>' + p2.name + '</b><br>' +
            'Score: ' + p2Score + '<br>' +
            'Kills: ' + p2.kills + '<br>' +
            'Deaths: ' + p2.deaths + '<br>' +
            'Hits: ' + p2.hits + '<br>' +
            'Damage: ' + Math.round(p2.damageDealt) +
            '</div>' +
            '</div>' +
            '<br>Time: ' + timeStr;

        // Save high scores for both players
        var p1Entry = {
            name: playerName || 'PLAYER 1',
            score: p1Score, kills: p1.kills, deaths: p1.deaths,
            time: gameTime, date: new Date().toISOString().slice(0,10),
            car: selectedCarTypeP1 ? selectedCarTypeP1.name : 'Stock'
        };
        var p2Entry = {
            name: player2Name || 'PLAYER 2',
            score: p2Score, kills: p2.kills, deaths: p2.deaths,
            time: gameTime, date: new Date().toISOString().slice(0,10),
            car: selectedCarTypeP2 ? selectedCarTypeP2.name : 'Stock'
        };

        var rank1 = getScoreRank(modeKey, p1Score);
        var rank2 = getScoreRank(modeKey, p2Score);
        // Save higher score first so rank calculation is correct for second
        if (p1Score >= p2Score) {
            saveHighScore(modeKey, p1Entry);
            saveHighScore(modeKey, p2Entry);
        } else {
            saveHighScore(modeKey, p2Entry);
            saveHighScore(modeKey, p1Entry);
        }

        var bestRank = Math.min(rank1 || 99, rank2 || 99);
        if (bestRank > 0 && bestRank <= 10) {
            gotNewHS = true;
            var hsNames = [];
            if (rank1 > 0 && rank1 <= 10) hsNames.push((playerName || 'P1') + ' #' + rank1);
            if (rank2 > 0 && rank2 <= 10) hsNames.push((player2Name || 'P2') + ' #' + rank2);
            banner.style.display = 'block';
            banner.innerHTML = '<div class="hs-new-record">NEW HIGH SCORE! ' + hsNames.join(' & ') + '</div>';
        } else {
            banner.style.display = 'none';
        }

        lb.innerHTML = '<div style="font-size:13px;color:#888;margin-bottom:6px;letter-spacing:1px;">TOP SCORES \u2014 ' + gameVariant.toUpperCase() + ' (MULTI)</div>' + buildHighScoreTable(modeKey);
    }

    // High score celebration: tada SFX + sparkle effect
    if (gotNewHS) {
        setTimeout(function() { playSfx('tada'); }, 300);
        spawnHighScoreSparkles();
    }

    document.getElementById('game-over-screen').style.display = 'flex';
}

// Sparkle particles on the game-over screen for new high scores
function spawnHighScoreSparkles() {
    // Append to document body instead of game-over screen to avoid layout issues
    var sparkleContainer = document.createElement('div');
    sparkleContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:210;';
    document.body.appendChild(sparkleContainer);

    var colors = ['#ff6eb4', '#6eb4ff', '#ffd700', '#ff4444', '#44ff44', '#fff'];
    for (var i = 0; i < 40; i++) {
        var spark = document.createElement('div');
        var size = 4 + Math.random() * 6;
        var x = 10 + Math.random() * 80;
        var delay = Math.random() * 0.6;
        var dur = 1.2 + Math.random() * 1;
        var color = colors[Math.floor(Math.random() * colors.length)];
        spark.style.cssText =
            'position:absolute;left:' + x + '%;top:' + (15 + Math.random() * 35) + '%;' +
            'width:' + size + 'px;height:' + size + 'px;border-radius:50%;' +
            'background:' + color + ';opacity:0;' +
            'animation:hs-sparkle ' + dur + 's ' + delay + 's ease-out forwards;';
        sparkleContainer.appendChild(spark);
    }

    // Clean up after animation
    setTimeout(function() {
        if (sparkleContainer.parentNode) sparkleContainer.parentNode.removeChild(sparkleContainer);
    }, 3000);
}
