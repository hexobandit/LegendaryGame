// ================================================================
//  INPUT — Keyboard handling, fullscreen, pause
//  Extracted from destruction-derby.html
//  Globals: keys, gameState, document
// ================================================================

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(()=>{});
    } else {
        document.exitFullscreen();
    }
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pause-overlay').style.display = 'flex';
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pause-overlay').style.display = 'none';
    }
}

window.addEventListener('keydown', e => {
    if (e.code === 'Escape') { togglePause(); e.preventDefault(); return; }
    if (e.code === 'F11') { e.preventDefault(); toggleFullscreen(); return; }
    keys[e.code] = true; e.preventDefault();
});

window.addEventListener('keyup', e => { keys[e.code] = false; });
