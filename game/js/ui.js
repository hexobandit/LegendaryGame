// ================================================================
//  UI — Start screen, mode selection, car/map pickers, endGame
// ================================================================

var selectedMap = 'arena';  // default map id

function resolveActiveMode() {
    var suffix = gameMode === 'single' ? '-single' : '-multi';
    setActiveMode(gameVariant + suffix);
}

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
            if (playerNum === 1) selectedTeamP1 = team;
            else selectedTeamP2 = team;
            // Update button states
            row.querySelectorAll('.team-btn').forEach(function(b) {
                b.classList.remove('active');
                b.style.background = 'rgba(255,255,255,.04)';
            });
            btn.classList.add('active');
            btn.style.background = TEAM_COLORS[team] + '33';
            // Update player column border/title to match team
            var col = document.getElementById('p' + playerNum + '-col');
            var title = document.getElementById('p' + playerNum + '-title');
            if (col) { col.style.borderColor = TEAM_COLORS[team]; col.style.background = TEAM_COLORS[team] + '22'; }
            if (title) title.style.color = TEAM_COLORS[team];
        };
        row.appendChild(btn);
    });
}

function updateColorPickerForVariant() {
    var isTeams = gameVariant === 'teams';
    // P1 color picker
    var p1Row = document.querySelector('#p1-col .color-picker-row');
    if (p1Row) {
        if (isTeams) {
            buildTeamPicker(p1Row, 1);
        } else {
            p1Row.innerHTML = '<span>Pick your color:</span><div class="color-swatches" id="p1-swatches"></div>';
        }
    }
    // P2 color picker (multi only)
    var p2Row = document.querySelector('#p2-col .color-picker-row');
    if (p2Row) {
        if (isTeams) {
            buildTeamPicker(p2Row, 2);
        } else {
            p2Row.innerHTML = '<span>Pick your color:</span><div class="color-swatches" id="p2-swatches"></div>';
        }
    }
    // Rebuild swatches if not teams
    if (!isTeams) buildSwatches();
}

function buildVariantSelector() {
    var row = document.getElementById('variant-selector');
    if (!row) return;
    var variants = ['normal', 'hardcore', 'timed', 'teams', 'infected', 'robbery', 'ctf'];
    var suffix = gameMode === 'single' ? '-single' : '-multi';
    row.innerHTML = '';
    variants.forEach(function(v) {
        var mode = GAME_MODES[v + suffix];
        if (!mode) return;
        var btn = document.createElement('button');
        btn.className = 'variant-btn' + (v === gameVariant ? ' active' : '');
        btn.innerHTML = mode.label + '<span class="vdesc">' + mode.description + '</span>';
        btn.onclick = function() {
            gameVariant = v;
            resolveActiveMode();
            row.querySelectorAll('.variant-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            updateColorPickerForVariant();
            // Update sub-note
            var subNote = document.getElementById('sub-note-text');
            if (subNote) subNote.textContent = mode.description;
        };
        row.appendChild(btn);
    });
}

function selectMode(mode) {
    gameMode = mode;
    resolveActiveMode();
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
                    <div class="pkey-compact">
                        <b>A/D</b> Steer &nbsp;<b>W</b> Nitro &nbsp;<b>S</b> Brake &nbsp;<b>Space</b> Drift &nbsp;<b>R</b> Reset
                    </div>
                </div>
            </div>`;
        subNote.textContent = (activeMode && activeMode.description) || 'Auto-throttle is ON \u2014 just steer & smash!';
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
                    <div class="pkey-compact">
                        <b>A/D</b> Steer &nbsp;<b>W</b> Nitro &nbsp;<b>S</b> Brake &nbsp;<b>Q</b> Drift
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
                    <div class="pkey-compact">
                        <b>\u2190/\u2192</b> Steer &nbsp;<b>\u2191</b> Nitro &nbsp;<b>\u2193</b> Brake &nbsp;<b>M</b> Drift
                    </div>
                </div>
            </div>`;
        subNote.textContent = (activeMode && activeMode.description) || 'Auto-throttle is ON \u2014 just steer & smash!';
    }
    panel.style.display = 'block';
    buildVariantSelector();
    buildSwatches();
    updateColorPickerForVariant();
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

    // Shadow — heavier vehicles get extra offset
    var shadowOff = (['suv','truck_heavy','warrig','pickup','schoolbus'].indexOf(bodyStyle) >= 0) ? 5 : 3;
    pctx.fillStyle = 'rgba(0,0,0,.3)';
    pctx.fillRect(-cw/2 + shadowOff, -ch/2 + shadowOff, cw, ch);

    // Body
    var cornerRadius = (bodyStyle === 'compact' || bodyStyle === 'miata') ? 8 : bodyStyle === 'schoolbus' ? 3 : 4;
    pctx.fillStyle = color;
    pctx.beginPath(); pctx.roundRect(-cw/2, -ch/2, cw, ch, cornerRadius); pctx.fill();

    // Windshield
    pctx.fillStyle = 'rgba(100,180,255,.55)';
    if (bodyStyle === 'sport') {
        pctx.fillRect(cw/2 - 14, -ch/2 + 5, 8, ch - 10);
    } else if (bodyStyle === 'schoolbus') {
        pctx.fillRect(cw/2 - 10, -ch/2 + 2, 6, ch - 4);
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
        // Diagonal racing stripe
        pctx.save();
        pctx.beginPath(); pctx.roundRect(-cw/2, -ch/2, cw, ch, 4); pctx.clip();
        pctx.fillStyle = 'rgba(255,255,255,.2)';
        pctx.beginPath();
        pctx.moveTo(-5, -ch/2); pctx.lineTo(10, -ch/2);
        pctx.lineTo(-5, ch/2); pctx.lineTo(-20, ch/2);
        pctx.closePath(); pctx.fill();
        pctx.restore();
        // Number circle on roof
        pctx.fillStyle = '#fff';
        pctx.beginPath(); pctx.arc(0, 0, 5, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#111';
        pctx.font = 'bold 7px Arial'; pctx.textAlign = 'center';
        pctx.fillText('7', 0.5, 2.5);
        // Wing spoiler — overlaps tail
        pctx.fillStyle = '#222';
        pctx.fillRect(-cw/2 - 3, -ch/2 - 1.5, 8, ch + 3);
        pctx.fillStyle = color;
        pctx.fillRect(-cw/2 - 4, -ch/2 - 3, 10, 3);
        pctx.fillRect(-cw/2 - 4, ch/2, 10, 3);
        pctx.fillStyle = '#555';
        pctx.fillRect(-cw/2 + 2, -ch/2 + 2, 2, 2);
        pctx.fillRect(-cw/2 + 2, ch/2 - 4, 2, 2);
        // Twin exhaust glow
        pctx.fillStyle = '#f80'; pctx.globalAlpha = 0.5;
        pctx.beginPath(); pctx.arc(-cw/2 - 2, -4, 3, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-cw/2 - 2, 4, 3, 0, Math.PI*2); pctx.fill();
        pctx.globalAlpha = 1;
        pctx.fillStyle = '#444';
        pctx.beginPath(); pctx.arc(-cw/2 - 1, -4, 1.8, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-cw/2 - 1, 4, 1.8, 0, Math.PI*2); pctx.fill();

    } else if (bodyStyle === 'suv') {
        // Thick roof rack bars
        pctx.fillStyle = '#888';
        pctx.fillRect(-cw/4 - 1, -ch/2 - 2, cw/2 + 2, 2.5);
        pctx.fillRect(-cw/4 - 1, ch/2 - 0.5, cw/2 + 2, 2.5);
        pctx.fillRect(-cw/6 - 0.5, -ch/2 - 2, 2, ch + 4);
        pctx.fillRect(cw/6 - 0.5, -ch/2 - 2, 2, ch + 4);
        // Wider fenders
        pctx.fillStyle = 'rgba(0,0,0,.35)';
        pctx.fillRect(cw/2 - 5, -ch/2 - 1.5, 6, 2);
        pctx.fillRect(cw/2 - 5, ch/2 - 0.5, 6, 2);
        pctx.fillRect(-cw/2 - 1, -ch/2 - 1.5, 6, 2);
        pctx.fillRect(-cw/2 - 1, ch/2 - 0.5, 6, 2);

    } else if (bodyStyle === 'truck') {
        // Bull bar on front
        pctx.strokeStyle = 'rgba(200,200,200,.7)'; pctx.lineWidth = 2.5;
        pctx.beginPath();
        pctx.moveTo(cw/2 + 2, -ch/2 + 1);
        pctx.lineTo(cw/2 + 4, -ch/2 + 1);
        pctx.lineTo(cw/2 + 4, ch/2 - 1);
        pctx.lineTo(cw/2 + 2, ch/2 - 1);
        pctx.stroke();
        pctx.beginPath(); pctx.moveTo(cw/2, 0); pctx.lineTo(cw/2 + 4, 0); pctx.stroke();

    } else if (bodyStyle === 'truck_heavy') {
        // Heavy filled ram bar
        pctx.fillStyle = '#999';
        pctx.fillRect(cw/2, -ch/2, 5, ch);
        pctx.fillStyle = '#bbb';
        pctx.fillRect(cw/2 + 1, -ch/2 + 1, 3, ch - 2);
        pctx.fillStyle = '#777';
        pctx.fillRect(cw/2, -2, 5, 4);
        // Exhaust stacks
        pctx.fillStyle = '#555';
        pctx.fillRect(-2, -ch/2 - 4, 3, 5);
        pctx.fillRect(-2, ch/2 - 1, 3, 5);
        pctx.fillStyle = '#333';
        pctx.beginPath(); pctx.arc(-0.5, -ch/2 - 4, 1.5, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-0.5, ch/2 + 4, 1.5, 0, Math.PI*2); pctx.fill();
        // Smoke hint
        pctx.fillStyle = 'rgba(100,100,100,.3)';
        pctx.beginPath(); pctx.arc(-0.5, -ch/2 - 7, 2.5, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-0.5, ch/2 + 7, 2.5, 0, Math.PI*2); pctx.fill();

    } else if (bodyStyle === 'warrig') {
        // Front plow (V-shaped)
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
        // Warning stripes on rear bed
        pctx.save();
        pctx.beginPath(); pctx.rect(-cw/2, -ch/2, cw/3, ch); pctx.clip();
        pctx.fillStyle = 'rgba(0,0,0,.25)';
        for (var i = -30; i < 30; i += 6) {
            pctx.save(); pctx.translate(i, 0); pctx.rotate(0.7);
            pctx.fillRect(-1.5, -20, 3, 40);
            pctx.restore();
        }
        pctx.restore();
        // Armor side plates
        pctx.fillStyle = 'rgba(80,80,80,.5)';
        pctx.fillRect(-cw/4, -ch/2 - 2, cw/2, 2.5);
        pctx.fillRect(-cw/4, ch/2 - 0.5, cw/2, 2.5);
        // Exhaust stacks
        pctx.fillStyle = '#555';
        pctx.fillRect(2, -ch/2 - 3, 2.5, 4);
        pctx.fillRect(2, ch/2 - 1, 2.5, 4);

    } else if (bodyStyle === 'compact') {
        // Cover default windshield & lights
        pctx.fillStyle = color;
        pctx.fillRect(cw/2 - 15, -ch/2 + 2, 12, ch - 4);
        pctx.fillRect(-cw/2, -ch/2 + 1, 4, 5);
        pctx.fillRect(-cw/2, ch/2 - 6, 4, 5);
        // Dome windshield
        pctx.fillStyle = 'rgba(120,200,255,.5)';
        pctx.beginPath(); pctx.arc(4, 0, 8, -1.3, 1.3); pctx.fill();
        pctx.strokeStyle = 'rgba(200,240,255,.3)'; pctx.lineWidth = 0.5;
        pctx.beginPath(); pctx.arc(4, 0, 8, -1.3, 1.3); pctx.stroke();
        // Round headlights
        pctx.fillStyle = '#ffa';
        pctx.beginPath(); pctx.arc(cw/2 - 1, -ch/2 + 4, 3, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(cw/2 - 1, ch/2 - 4, 3, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#fff';
        pctx.beginPath(); pctx.arc(cw/2, -ch/2 + 3.5, 1, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(cw/2, ch/2 - 3.5, 1, 0, Math.PI*2); pctx.fill();
        // Round tail lights
        pctx.fillStyle = '#f44';
        pctx.beginPath(); pctx.arc(-cw/2 + 1, -ch/2 + 4, 2.5, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-cw/2 + 1, ch/2 - 4, 2.5, 0, Math.PI*2); pctx.fill();
        // Racing number circle
        pctx.fillStyle = '#fff';
        pctx.beginPath(); pctx.arc(-2, 0, 4.5, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#111';
        pctx.font = 'bold 6px Arial'; pctx.textAlign = 'center';
        pctx.fillText('3', -1.5, 2.2);

    } else if (bodyStyle === 'miata') {
        // Cover default windshield
        pctx.fillStyle = color;
        pctx.fillRect(cw/2 - 15, -ch/2 + 2, 10, ch - 4);
        // Small curved windshield
        pctx.fillStyle = 'rgba(120,200,255,.45)';
        pctx.beginPath(); pctx.arc(3, 0, 7, -1.2, 1.2); pctx.fill();
        // Soft-top hint
        pctx.fillStyle = 'rgba(0,0,0,.15)';
        pctx.beginPath(); pctx.roundRect(-5, -ch/2 + 2, 10, ch - 4, 3); pctx.fill();
        // Smile grille
        pctx.strokeStyle = '#333'; pctx.lineWidth = 1;
        pctx.beginPath();
        pctx.moveTo(cw/2 - 1, -ch/4);
        pctx.quadraticCurveTo(cw/2 + 2, 0, cw/2 - 1, ch/4);
        pctx.stroke();
        // Small round tail lights
        pctx.fillStyle = '#f44';
        pctx.beginPath(); pctx.arc(-cw/2 + 1, -ch/2 + 4, 2, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(-cw/2 + 1, ch/2 - 4, 2, 0, Math.PI*2); pctx.fill();
        // Exhaust
        pctx.fillStyle = '#888';
        pctx.beginPath(); pctx.arc(-cw/2 - 1, ch/3, 1.5, 0, Math.PI*2); pctx.fill();

    } else if (bodyStyle === 'pickup') {
        // Open truck bed
        pctx.fillStyle = 'rgba(0,0,0,.2)';
        pctx.fillRect(-cw/2, -ch/2 + 2, cw * 0.4, ch - 4);
        // Bed rails
        pctx.fillStyle = '#777';
        pctx.fillRect(-cw/2 + 2, -ch/2 - 1, cw * 0.35, 1.5);
        pctx.fillRect(-cw/2 + 2, ch/2 - 0.5, cw * 0.35, 1.5);
        // Chrome grille
        pctx.fillStyle = '#ccc';
        pctx.fillRect(cw/2, -ch/2 + 1, 3, ch - 2);
        pctx.fillStyle = '#999';
        for (var i = 0; i < 4; i++) {
            var gy = -ch/2 + 3 + i * ((ch - 6) / 4);
            pctx.fillRect(cw/2, gy, 3, 1.5);
        }
        // Chrome bumper
        pctx.fillStyle = '#bbb';
        pctx.fillRect(cw/2 + 2, -ch/2 + 2, 2, ch - 4);
        // Tow hitch
        pctx.fillStyle = '#666';
        pctx.fillRect(-cw/2 - 4, -2, 5, 4);
        pctx.fillStyle = '#888';
        pctx.fillRect(-cw/2 - 3, -1, 3, 2);
        // Running boards
        pctx.fillStyle = '#555';
        pctx.fillRect(-cw/6, -ch/2 - 1, cw/3, 1.5);
        pctx.fillRect(-cw/6, ch/2 - 0.5, cw/3, 1.5);
        // Exhaust tip
        pctx.fillStyle = '#888';
        pctx.beginPath(); pctx.arc(-cw/2 - 2, ch/4, 2, 0, Math.PI*2); pctx.fill();
        pctx.fillStyle = '#555';
        pctx.beginPath(); pctx.arc(-cw/2 - 2, ch/4, 1.2, 0, Math.PI*2); pctx.fill();

    } else if (bodyStyle === 'schoolbus') {
        // Window row
        pctx.fillStyle = 'rgba(100,180,255,.45)';
        for (var i = 0; i < 7; i++) {
            var wx = -cw/2 + 10 + i * (cw - 20) / 7;
            pctx.fillRect(wx, -ch/2 + 2, 4, 3);
            pctx.fillRect(wx, ch/2 - 5, 4, 3);
        }
        // Window dividers
        pctx.fillStyle = '#222';
        for (var i = 0; i <= 7; i++) {
            var wx = -cw/2 + 9 + i * (cw - 20) / 7;
            pctx.fillRect(wx, -ch/2 + 1.5, 1, 4);
            pctx.fillRect(wx, ch/2 - 5.5, 1, 4);
        }
        // Black bumpers
        pctx.fillStyle = '#222';
        pctx.fillRect(cw/2, -ch/2 + 1, 3, ch - 2);
        pctx.fillRect(-cw/2 - 2, -ch/2 + 1, 3, ch - 2);
        // STOP sign arm
        pctx.fillStyle = '#d00';
        pctx.fillRect(cw/4, -ch/2 - 3, 8, 3);
        pctx.fillStyle = '#fff'; pctx.font = 'bold 2.5px Arial'; pctx.textAlign = 'center';
        pctx.fillText('STOP', cw/4 + 4, -ch/2 - 1);
        // Red flashing lights
        pctx.fillStyle = '#f22';
        pctx.beginPath(); pctx.arc(cw/2 - 4, -ch/2 - 0.5, 2, 0, Math.PI*2); pctx.fill();
        pctx.beginPath(); pctx.arc(cw/2 - 4, ch/2 + 0.5, 2, 0, Math.PI*2); pctx.fill();
        // Amber side markers
        pctx.fillStyle = '#fa0'; pctx.globalAlpha = 0.8;
        pctx.fillRect(0, -ch/2 - 0.5, 3, 1.5);
        pctx.fillRect(0, ch/2 - 1, 3, 1.5);
        pctx.fillRect(-cw/4, -ch/2 - 0.5, 3, 1.5);
        pctx.fillRect(-cw/4, ch/2 - 1, 3, 1.5);
        pctx.globalAlpha = 1;
        // Rear emergency door
        pctx.strokeStyle = '#222'; pctx.lineWidth = 0.8;
        pctx.strokeRect(-cw/2 + 1, -ch/4, 5, ch/2);
        // Roof tint
        pctx.fillStyle = 'rgba(0,0,0,.1)';
        pctx.fillRect(-cw/3, -ch/2 + 4, cw * 0.6, ch - 8);

    } else if (bodyStyle === 'cop') {
        // White hood (front half)
        pctx.fillStyle = '#eee';
        pctx.save();
        pctx.beginPath(); pctx.roundRect(-cw/2, -ch/2, cw, ch, 4); pctx.clip();
        pctx.fillRect(2, -ch/2, cw/2, ch);
        pctx.restore();
        // Black stripe down center of hood
        pctx.fillStyle = '#1a1a2e';
        pctx.save();
        pctx.beginPath(); pctx.roundRect(-cw/2, -ch/2, cw, ch, 4); pctx.clip();
        pctx.fillRect(6, -2.5, cw/2 - 6, 5);
        pctx.restore();
        // Police star on hood
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
        // Door line
        pctx.strokeStyle = 'rgba(0,0,0,.25)'; pctx.lineWidth = 0.8;
        pctx.beginPath(); pctx.moveTo(2, -ch/2 + 1); pctx.lineTo(2, ch/2 - 1); pctx.stroke();
        // Front bumper bar
        pctx.fillStyle = '#999';
        pctx.fillRect(cw/2, -ch/2 + 1, 3, ch - 2);
        pctx.fillStyle = '#bbb';
        pctx.fillRect(cw/2 + 2, -ch/2 + 2, 2, ch - 4);
        // Light bar
        pctx.fillStyle = '#ff2222';
        pctx.beginPath(); pctx.arc(-2, -ch/2 - 2, 2.5, 0, Math.PI * 2); pctx.fill();
        pctx.fillStyle = '#2266ff';
        pctx.beginPath(); pctx.arc(-2, ch/2 + 2, 2.5, 0, Math.PI * 2); pctx.fill();
        // Light bar base
        pctx.fillStyle = '#444';
        pctx.fillRect(-5, -ch/2 - 0.5, 6, ch + 1);
        // Badge
        pctx.fillStyle = '#cc9900'; pctx.globalAlpha = 0.6;
        pctx.beginPath(); pctx.arc(-5, 0, 3, 0, Math.PI * 2); pctx.fill();
        pctx.globalAlpha = 1;
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

    var pickableCars = CAR_TYPES;

    var idx = Math.min(startIdx, pickableCars.length - 1);
    if (idx < 0) idx = 0;
    var color = playerId === 'p1' ? P1_COLOR : P2_COLOR;

    // Wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'car-carousel';

    // Preview canvas — sized to fill the card nicely
    var cvs = document.createElement('canvas');
    cvs.width = 200; cvs.height = 90;
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
    pickableCars.forEach(function(ct, i) {
        var dot = document.createElement('div');
        dot.className = 'car-dot' + (i === idx ? ' active' : '');
        dot.onclick = function() { idx = i; update(); };
        dots.appendChild(dot);
    });

    function update() {
        var ct = pickableCars[idx];
        onSelect(ct);

        // Redraw preview
        var pctx = cvs.getContext('2d');
        pctx.clearRect(0, 0, cvs.width, cvs.height);
        pctx.save();
        pctx.translate(cvs.width / 2, cvs.height / 2);
        drawCarPreview(pctx, ct, color, 2.8);
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
        drawStatBar(stats, 'HP',    ct.hp,           260, '#4f4');
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
        idx = (idx - 1 + pickableCars.length) % pickableCars.length;
        update();
    };
    arrowR.onclick = function() {
        idx = (idx + 1) % pickableCars.length;
        update();
    };

    // Initial render
    update();

    // Store updater so color changes can refresh the preview
    container._refreshPreview = function(newColor) {
        color = newColor;
        var ct = pickableCars[idx];
        var pctx = cvs.getContext('2d');
        pctx.clearRect(0, 0, cvs.width, cvs.height);
        pctx.save();
        pctx.translate(cvs.width / 2, cvs.height / 2);
        drawCarPreview(pctx, ct, color, 2.8);
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
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    introActive = false;
    paused = false;
    selectMode(gameMode);
    gameState = 'menu';
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';
    // Resolve selected map
    currentMap = MAPS.find(function(m) { return m.id === selectedMap; }) || MAPS[0];

    resolveActiveMode();
    ensureAudio();
    gameState = 'countdown';
    countdownVal = 3;
    countdownTimer = 0;
    gameTime = 0;
    score = 0;
    particles = []; skidMarks = []; debris = []; floatingTexts = [];
    powerUps = []; powerUpSpawnTimer = 0; breakables = [];
    slomoActive = false; slomoTimer = 0; slomoFade = 0;
    ctfFlag = null; ctfScores = {}; ctfHoldTimer = 0; ctfBonusTimer = 0;
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

    // Stats display — still per-layout since HTML structure differs
    var mins = Math.floor(gameTime / 60);
    var secs = Math.floor(gameTime % 60);
    var timeStr = mins + ':' + secs.toString().padStart(2, '0');

    if (gameMode === 'single') {
        var p = cars[0];
        // Fallback title if no activeMode
        if (!activeMode) {
            var playerWon = p.alive || cars.filter(function(c) { return c.playerIdx === -1 && c.alive; }).length === 0;
            if (playerWon) { playSfx('win'); title.textContent = 'YOU WIN!'; title.style.color = '#4f4'; }
            else { playSfx('lose'); title.textContent = 'GAME OVER'; title.style.color = '#f44'; }
        }
        document.getElementById('game-over-stats').innerHTML =
            '<div style="color:' + P1_COLOR + '">' +
            '<b>Final Score: ' + score + '</b><br><br>' +
            'Kills: ' + p.kills + '<br>' +
            'Deaths: ' + p.deaths + '<br>' +
            'Hits: ' + p.hits + '<br>' +
            'Damage Dealt: ' + Math.round(p.damageDealt) + '<br>' +
            'Time Survived: ' + timeStr +
            '</div>';
    } else {
        var p1 = cars[0], p2 = cars[1];
        // Fallback title if no activeMode
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
            '<br>Time: ' + timeStr;
    }
    document.getElementById('game-over-screen').style.display = 'flex';
}
