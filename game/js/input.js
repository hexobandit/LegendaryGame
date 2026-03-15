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

function toggleSound() {
    sfxMuted = !sfxMuted;
    var btn = document.getElementById('sound-toggle-btn');
    if (btn) btn.textContent = sfxMuted ? 'SOUND: OFF' : 'SOUND: ON';
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pause-overlay').style.display = 'flex';
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pause-overlay').style.display = 'none';
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }
}

window.addEventListener('keydown', e => {
    // Let input fields handle their own keys
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.code === 'Escape') { e.target.blur(); e.preventDefault(); }
        return;
    }
    if (e.code === 'Escape') { togglePause(); e.preventDefault(); return; }
    if (e.code === 'F11') { e.preventDefault(); toggleFullscreen(); return; }
    keys[e.code] = true; e.preventDefault();
});

window.addEventListener('keyup', e => { keys[e.code] = false; });

// When browser exits fullscreen (Escape in fullscreen bypasses keydown),
// just pause the game and resume audio.
document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement && gameState === 'playing') {
        togglePause();
    }
    // Always ensure audio stays alive after fullscreen transitions
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
});

// Try to lock Escape key in fullscreen so it goes to pause instead of exiting
function lockEscapeKey() {
    if (navigator.keyboard && navigator.keyboard.lock) {
        navigator.keyboard.lock(['Escape']).catch(function(){});
    }
}
document.addEventListener('fullscreenchange', function() {
    if (document.fullscreenElement) lockEscapeKey();
});
