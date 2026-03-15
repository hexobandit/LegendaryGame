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
    }
}

window.addEventListener('keydown', e => {
    if (e.code === 'Escape') { togglePause(); e.preventDefault(); return; }
    if (e.code === 'F11') { e.preventDefault(); toggleFullscreen(); return; }
    keys[e.code] = true; e.preventDefault();
});

window.addEventListener('keyup', e => { keys[e.code] = false; });

// When browser exits fullscreen (Escape in fullscreen bypasses keydown),
// pause the game and try to lock Escape key if supported.
document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement && gameState === 'playing') {
        // Browser exited fullscreen via Escape — pause and re-enter fullscreen
        togglePause();
        document.documentElement.requestFullscreen().catch(function(){});
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
