// ================================================================
//  UI — Start screen, mode selection, car/map pickers, endGame
// ================================================================

var selectedMap = 'arena';  // default map id

function selectMode(mode) {
    gameMode = mode;
    var btnSingle = document.getElementById('btn-single');
    var btnMulti = document.getElementById('btn-multi');
    var panel = document.getElementById('setup-panel');
    var subNote = document.getElementById('sub-note-text');

    btnSingle.className = 'mode-btn' + (mode === 'single' ? ' active-single' : '');
    btnMulti.className = 'mode-btn' + (mode === 'multi' ? ' active-multi' : '');

    if (mode === 'single') {
        panel.innerHTML = `
            <div class="player-cols">
                <div class="player-col pink" id="p1-col">
                    <div class="ptitle" id="p1-title">Your Car</div>
                    <div class="car-type-picker">
                        <span>Pick your ride:</span>
                        <div class="car-types-row" id="p1-car-types"></div>
                    </div>
                    <div class="color-picker-row">
                        <span>Pick your color:</span>
                        <div class="color-swatches" id="p1-swatches"></div>
                    </div>
                    <div class="pkey">
                        <table>
                            <tr><td>A / &#8592;</td><td>Steer Left</td></tr>
                            <tr><td>D / &#8594;</td><td>Steer Right</td></tr>
                            <tr><td>S / &#8595;</td><td>Brake</td></tr>
                            <tr><td>W / &#8593;</td><td>Nitro</td></tr>
                            <tr><td>Space</td><td>Handbrake</td></tr>
                            <tr><td>R</td><td>Reset Position</td></tr>
                        </table>
                    </div>
                </div>
            </div>`;
        subNote.textContent = 'Auto-throttle is ON \u2014 just steer & smash! Destroy all 11 AI opponents to win.';
    } else {
        panel.innerHTML = `
            <div class="player-cols">
                <div class="player-col pink" id="p1-col">
                    <div class="ptitle" id="p1-title">Player 1 \u2014 Left</div>
                    <div class="car-type-picker">
                        <span>Pick your ride:</span>
                        <div class="car-types-row" id="p1-car-types"></div>
                    </div>
                    <div class="color-picker-row">
                        <span>Pick your color:</span>
                        <div class="color-swatches" id="p1-swatches"></div>
                    </div>
                    <div class="pkey">
                        <table>
                            <tr><td>A</td><td>Steer Left</td></tr>
                            <tr><td>D</td><td>Steer Right</td></tr>
                            <tr><td>S</td><td>Brake</td></tr>
                            <tr><td>W</td><td>Nitro</td></tr>
                            <tr><td>Q</td><td>Handbrake</td></tr>
                        </table>
                    </div>
                </div>
                <div class="player-col blue" id="p2-col">
                    <div class="ptitle" id="p2-title">Player 2 \u2014 Right</div>
                    <div class="car-type-picker">
                        <span>Pick your ride:</span>
                        <div class="car-types-row" id="p2-car-types"></div>
                    </div>
                    <div class="color-picker-row">
                        <span>Pick your color:</span>
                        <div class="color-swatches" id="p2-swatches"></div>
                    </div>
                    <div class="pkey">
                        <table>
                            <tr><td>&#8592;</td><td>Steer Left</td></tr>
                            <tr><td>&#8594;</td><td>Steer Right</td></tr>
                            <tr><td>&#8595;</td><td>Brake</td></tr>
                            <tr><td>&#8593;</td><td>Nitro</td></tr>
                            <tr><td>M</td><td>Handbrake</td></tr>
                        </table>
                    </div>
                </div>
            </div>`;
        subNote.textContent = 'Auto-throttle is ON \u2014 just steer & smash!';
    }
    panel.style.display = 'block';
    buildSwatches();
    buildCarTypePickers();
    buildMapPicker();
}

// ── Color Swatches ──
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
            // Refresh car preview with new color
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
                // Refresh car preview with new color
                var ct = document.getElementById('p2-car-types');
                if (ct && ct._refreshPreview) ct._refreshPreview(c);
            };
            p2Container.appendChild(s2);
        });
    }
}

// ── Car Preview Drawing ──
// Renders a car body style onto a given 2D context at (cx, cy) with scale.
function drawCarPreview(pctx, ct, color, scale) {
    var cw = ct.width || 40;
    var ch = ct.height || 22;
    var bodyStyle = ct.bodyStyle || 'sedan';
    var s = scale || 3;

    pctx.save();
    pctx.scale(s, s);

    // Shadow
    var shadowOff = bodyStyle === 'suv' ? 5 : 3;
    pctx.fillStyle = 'rgba(0,0,0,.3)';
    pctx.fillRect(-cw/2 + shadowOff, -ch/2 + shadowOff, cw, ch);

    // Body
    var cornerRadius = bodyStyle === 'compact' ? 8 : 4;
    pctx.fillStyle = color;
    pctx.beginPath(); pctx.roundRect(-cw/2, -ch/2, cw, ch, cornerRadius); pctx.fill();

    // Windshield
    pctx.fillStyle = 'rgba(100,180,255,.55)';
    if (bodyStyle === 'sport') {
        pctx.fillRect(cw/2 - 14, -ch/2 + 5, 8, ch - 10);
    } else {
        pctx.fillRect(cw/2 - 14, -ch/2 + 3, 8, ch - 6);
    }

    // Rear
    pctx.fillStyle = 'rgba(0,0,0,.3)';
    pctx.fillRect(-cw/2, -ch/2 + 2, 8, ch - 4);

    // Roof stripe
    pctx.fillStyle = 'rgba(255,255,255,.22)';
    pctx.fillRect(-5, -2, 10, 4);

    // Headlights
    pctx.fillStyle = '#ffa';
    pctx.fillRect(cw/2 - 3, -ch/2 + 2, 3, 4);
    pctx.fillRect(cw/2 - 3, ch/2 - 6, 3, 4);

    // Tail lights
    pctx.fillStyle = '#f00';
    pctx.fillRect(-cw/2, -ch/2 + 2, 3, 4);
    pctx.fillRect(-cw/2, ch/2 - 6, 3, 4);

    // Body style extras
    if (bodyStyle === 'sport') {
        pctx.fillStyle = 'rgba(0,0,0,.6)';
        pctx.fillRect(-cw/2 - 5, -ch/2 + 1, 5, ch - 2);
        pctx.fillStyle = color;
        pctx.fillRect(-cw/2 - 4, -ch/2 + 2, 3, ch - 4);
    } else if (bodyStyle === 'suv') {
        pctx.strokeStyle = 'rgba(180,180,180,.5)'; pctx.lineWidth = 1.5;
        pctx.beginPath(); pctx.moveTo(-cw/4, -ch/2); pctx.lineTo(cw/4, -ch/2); pctx.stroke();
        pctx.beginPath(); pctx.moveTo(-cw/4, ch/2); pctx.lineTo(cw/4, ch/2); pctx.stroke();
        pctx.beginPath(); pctx.moveTo(-cw/6, -ch/2); pctx.lineTo(-cw/6, ch/2); pctx.stroke();
        pctx.beginPath(); pctx.moveTo(cw/6, -ch/2); pctx.lineTo(cw/6, ch/2); pctx.stroke();
    } else if (bodyStyle === 'truck') {
        pctx.strokeStyle = 'rgba(200,200,200,.7)'; pctx.lineWidth = 2.5;
        pctx.beginPath();
        pctx.moveTo(cw/2 + 2, -ch/2 + 1);
        pctx.lineTo(cw/2 + 4, -ch/2 + 1);
        pctx.lineTo(cw/2 + 4, ch/2 - 1);
        pctx.lineTo(cw/2 + 2, ch/2 - 1);
        pctx.stroke();
        pctx.beginPath(); pctx.moveTo(cw/2, 0); pctx.lineTo(cw/2 + 4, 0); pctx.stroke();
    }

    pctx.restore();
}

// ── Stat Bar Helper ──
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

// ── Car Type Picker (Carousel) ──
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

    var idx = startIdx;
    var color = playerId === 'p1' ? P1_COLOR : P2_COLOR;

    // Wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'car-carousel';

    // Preview canvas — sized to fill the card nicely
    var cvs = document.createElement('canvas');
    cvs.width = 220; cvs.height = 110;
    cvs.className = 'car-preview-canvas';

    // Arrow left
    var arrowL = document.createElement('div');
    arrowL.className = 'car-arrow car-arrow-left';
    arrowL.textContent = '\u25C0';

    // Arrow right
    var arrowR = document.createElement('div');
    arrowR.className = 'car-arrow car-arrow-right';
    arrowR.textContent = '\u25B6';

    // Info area
    var info = document.createElement('div');
    info.className = 'car-info';

    // Dot indicators
    var dots = document.createElement('div');
    dots.className = 'car-dots';

    // Build carousel row
    var slideRow = document.createElement('div');
    slideRow.className = 'car-slide-row';
    slideRow.appendChild(arrowL);
    slideRow.appendChild(cvs);
    slideRow.appendChild(arrowR);
    wrapper.appendChild(slideRow);
    wrapper.appendChild(info);
    wrapper.appendChild(dots);
    container.appendChild(wrapper);

    // Build dots
    CAR_TYPES.forEach(function(ct, i) {
        var dot = document.createElement('div');
        dot.className = 'car-dot' + (i === idx ? ' active' : '');
        dot.onclick = function() { idx = i; update(); };
        dots.appendChild(dot);
    });

    function update() {
        var ct = CAR_TYPES[idx];
        onSelect(ct);

        // Redraw preview
        var pctx = cvs.getContext('2d');
        pctx.clearRect(0, 0, cvs.width, cvs.height);
        pctx.save();
        pctx.translate(cvs.width / 2, cvs.height / 2);
        drawCarPreview(pctx, ct, color, 3.2);
        pctx.restore();

        // Update info
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
        drawStatBar(stats, 'HP',    ct.hp,           180, '#4f4');
        drawStatBar(stats, 'SPEED', Math.round(ct.maxSpeedMult * 100), 130, '#4ff');
        drawStatBar(stats, 'ACCEL', Math.round(ct.accelMult * 100),    130, '#ff4');
        drawStatBar(stats, 'TURN',  Math.round(ct.turnMult * 100),     130, '#fa4');
        drawStatBar(stats, 'MASS',  Math.round(ct.mass * 100),         180, '#f66');
        drawStatBar(stats, 'GRIP',  Math.round((1 + ct.gripBonus) * 100), 110, '#a6f');
        info.appendChild(stats);

        // Update dots
        dots.querySelectorAll('.car-dot').forEach(function(d, i) {
            d.className = 'car-dot' + (i === idx ? ' active' : '');
        });
    }

    arrowL.onclick = function() {
        idx = (idx - 1 + CAR_TYPES.length) % CAR_TYPES.length;
        update();
    };
    arrowR.onclick = function() {
        idx = (idx + 1) % CAR_TYPES.length;
        update();
    };

    // Initial render
    update();

    // Store updater so color changes can refresh the preview
    container._refreshPreview = function(newColor) {
        color = newColor;
        var ct = CAR_TYPES[idx];
        var pctx = cvs.getContext('2d');
        pctx.clearRect(0, 0, cvs.width, cvs.height);
        pctx.save();
        pctx.translate(cvs.width / 2, cvs.height / 2);
        drawCarPreview(pctx, ct, color, 3.2);
        pctx.restore();
    };
}

// ── Map Picker ──
function buildMapPicker() {
    if (typeof MAPS === 'undefined' || MAPS.length === 0) return;

    // Remove existing map picker if re-building
    var existing = document.getElementById('map-picker-section');
    if (existing) existing.remove();

    var setupPanel = document.getElementById('setup-panel');
    if (!setupPanel) return;

    var section = document.createElement('div');
    section.className = 'map-picker';
    section.id = 'map-picker-section';
    section.innerHTML = '<span>Choose Arena:</span><div class="maps-row" id="maps-row"></div>';
    setupPanel.appendChild(section);

    var row = section.querySelector('#maps-row');
    MAPS.forEach(function(m) {
        var btn = document.createElement('div');
        btn.className = 'map-btn' + (m.id === selectedMap ? ' selected' : '');
        btn.innerHTML =
            '<span class="map-swatch" style="background:' + m.backgroundColor + '"></span>' +
            '<span class="map-name">' + m.name + '</span>' +
            '<span class="map-desc">' + m.description + '</span>';
        btn.onclick = function() {
            selectedMap = m.id;
            row.querySelectorAll('.map-btn').forEach(function(b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
        };
        row.appendChild(btn);
    });
}

// ── Start / End / Menu ──
function showStartScreen() {
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    document.getElementById('ingame-fullscreen-btn').style.display = 'none';
    paused = false;
    selectMode(gameMode);
    gameState = 'menu';
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('ingame-fullscreen-btn').style.display = 'block';

    // Resolve selected map
    currentMap = MAPS.find(function(m) { return m.id === selectedMap; }) || MAPS[0];

    ensureAudio();
    gameState = 'countdown';
    countdownVal = 3;
    countdownTimer = 0;
    gameTime = 0;
    score = 0;
    particles = []; skidMarks = []; debris = []; floatingTexts = [];
    powerUps = []; powerUpSpawnTimer = 0;
    generateTerrain();
    spawnCars();
}

function endGame() {
    gameState = 'gameover';
    var title = document.getElementById('go-title');

    if (gameMode === 'single') {
        var p = cars[0];
        var playerWon = p.alive || cars.filter(function(c) { return c.playerIdx === -1 && c.alive; }).length === 0;
        if (playerWon) { playSfx('win'); title.textContent = 'YOU WIN!'; title.style.color = '#4f4'; }
        else { playSfx('lose'); title.textContent = 'GAME OVER'; title.style.color = '#f44'; }

        var mins = Math.floor(gameTime / 60);
        var secs = Math.floor(gameTime % 60);
        document.getElementById('game-over-stats').innerHTML =
            '<div style="color:' + P1_COLOR + '">' +
            '<b>Final Score: ' + score + '</b><br><br>' +
            'Kills: ' + p.kills + '<br>' +
            'Deaths: ' + p.deaths + '<br>' +
            'Hits: ' + p.hits + '<br>' +
            'Damage Dealt: ' + Math.round(p.damageDealt) + '<br>' +
            'Time Survived: ' + mins + ':' + secs.toString().padStart(2, '0') +
            '</div>';
    } else {
        var p1 = cars[0], p2 = cars[1];
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

        var mins = Math.floor(gameTime / 60);
        var secs = Math.floor(gameTime % 60);
        document.getElementById('game-over-stats').innerHTML =
            '<div style="display:flex;gap:60px;justify-content:center">' +
            '<div style="color:' + P1_COLOR + '">' +
            '<b>' + p1.name + '</b><br>' +
            'Kills: ' + p1.kills + '<br>' +
            'Deaths: ' + p1.deaths + '<br>' +
            'Hits: ' + p1.hits + '<br>' +
            'Damage: ' + Math.round(p1.damageDealt) +
            '</div>' +
            '<div style="color:' + P2_COLOR + '">' +
            '<b>' + p2.name + '</b><br>' +
            'Kills: ' + p2.kills + '<br>' +
            'Deaths: ' + p2.deaths + '<br>' +
            'Hits: ' + p2.hits + '<br>' +
            'Damage: ' + Math.round(p2.damageDealt) +
            '</div>' +
            '</div>' +
            '<br>Time: ' + mins + ':' + secs.toString().padStart(2, '0');
    }
    document.getElementById('game-over-screen').style.display = 'flex';
}
