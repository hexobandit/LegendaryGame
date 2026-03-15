// ================================================================
//  HIGH SCORES — localStorage-backed leaderboard system
// ================================================================

var playerName = '';
var player2Name = '';

function loadPlayerName() {
    try { playerName = localStorage.getItem('ldd_playerName') || ''; } catch(e) { playerName = ''; }
    return playerName;
}

function savePlayerName(name) {
    playerName = name;
    try { localStorage.setItem('ldd_playerName', name); } catch(e) {}
}

function loadPlayer2Name() {
    try { player2Name = localStorage.getItem('ldd_player2Name') || ''; } catch(e) { player2Name = ''; }
    return player2Name;
}

function savePlayer2Name(name) {
    player2Name = name;
    try { localStorage.setItem('ldd_player2Name', name); } catch(e) {}
}

function getModeKey() {
    return gameVariant + '-' + gameMode;
}

function getHighScores(modeKey) {
    try {
        var raw = localStorage.getItem('ldd_scores_' + modeKey);
        if (!raw) return [];
        var arr = JSON.parse(raw);
        arr.sort(function(a, b) { return b.score - a.score; });
        return arr.slice(0, 10);
    } catch(e) { return []; }
}

function saveHighScore(modeKey, entry) {
    var scores = getHighScores(modeKey);
    scores.push(entry);
    scores.sort(function(a, b) { return b.score - a.score; });
    scores = scores.slice(0, 10);
    try { localStorage.setItem('ldd_scores_' + modeKey, JSON.stringify(scores)); } catch(e) {}
    return scores;
}

function getScoreRank(modeKey, newScore) {
    var scores = getHighScores(modeKey);
    if (scores.length < 10) return scores.length + 1;
    for (var i = 0; i < scores.length; i++) {
        if (newScore > scores[i].score) return i + 1;
    }
    return 0; // didn't make top 10
}

function buildHighScoreTable(modeKey) {
    var scores = getHighScores(modeKey);
    if (scores.length === 0) return '<div style="color:#666;padding:16px;">No scores yet. Play a game!</div>';
    var html = '<table class="hs-table"><tr><th>#</th><th>Name</th><th>Score</th><th>Kills</th><th>Car</th><th>Time</th></tr>';
    for (var i = 0; i < scores.length; i++) {
        var s = scores[i];
        var mins = Math.floor((s.time || 0) / 60);
        var secs = Math.floor((s.time || 0) % 60);
        var timeStr = mins + ':' + secs.toString().padStart(2, '0');
        html += '<tr' + (i < 3 ? ' class="hs-top"' : '') + '>' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + (s.name || 'PLAYER') + '</td>' +
            '<td>' + (s.score || 0) + '</td>' +
            '<td>' + (s.kills || 0) + '</td>' +
            '<td>' + (s.car || '—') + '</td>' +
            '<td>' + timeStr + '</td>' +
            '</tr>';
    }
    html += '</table>';
    return html;
}

// Initialize names on load
loadPlayerName();
loadPlayer2Name();
