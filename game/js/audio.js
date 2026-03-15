// ================================================================
//  AUDIO — cute SFX via Web Audio API (no motor drone!)
// ================================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
var audioCtx;
function ensureAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSfx(type) {
    if (sfxMuted) return;
    ensureAudio();
    const ac = audioCtx;
    const now = ac.currentTime;
    const g = ac.createGain();
    g.connect(ac.destination);

    if (type === 'bump') {
        const o = ac.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(280, now);
        o.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        g.gain.setValueAtTime(0.35, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        o.connect(g); o.start(now); o.stop(now + 0.16);
    }
    else if (type === 'hit') {
        const o = ac.createOscillator();
        o.type = 'square';
        o.frequency.setValueAtTime(400, now);
        o.frequency.exponentialRampToValueAtTime(60, now + 0.10);
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        o.connect(g); o.start(now); o.stop(now + 0.14);
        const buf = ac.createBuffer(1, ac.sampleRate * 0.07, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
        const n = ac.createBufferSource(); n.buffer = buf;
        const ng = ac.createGain(); ng.gain.setValueAtTime(0.22, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        n.connect(ng); ng.connect(ac.destination); n.start(now); n.stop(now + 0.09);
    }
    else if (type === 'explode') {
        const o = ac.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(600, now);
        o.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        g.gain.setValueAtTime(0.4, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        o.connect(g); o.start(now); o.stop(now + 0.42);
        const buf = ac.createBuffer(1, ac.sampleRate * 0.25, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const n = ac.createBufferSource(); n.buffer = buf;
        const ng = ac.createGain(); ng.gain.setValueAtTime(0.3, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        n.connect(ng); ng.connect(ac.destination); n.start(now); n.stop(now + 0.3);
    }
    else if (type === 'nitro') {
        const o = ac.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(500, now);
        o.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        o.connect(g); o.start(now); o.stop(now + 0.16);
    }
    else if (type === 'drift') {
        const o = ac.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(900 + Math.random() * 300, now);
        o.frequency.exponentialRampToValueAtTime(300, now + 0.06);
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        o.connect(g); o.start(now); o.stop(now + 0.08);
    }
    else if (type === 'win') {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => {
            const o = ac.createOscillator();
            o.type = 'sine';
            const gg = ac.createGain();
            o.frequency.value = f;
            gg.gain.setValueAtTime(0.25, now + i * 0.12);
            gg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
            o.connect(gg); gg.connect(ac.destination);
            o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.3);
        });
    }
    else if (type === 'lose') {
        const notes = [400, 350, 280, 200];
        notes.forEach((f, i) => {
            const o = ac.createOscillator();
            o.type = 'sine';
            const gg = ac.createGain();
            o.frequency.value = f;
            gg.gain.setValueAtTime(0.2, now + i * 0.18);
            gg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.3);
            o.connect(gg); gg.connect(ac.destination);
            o.start(now + i * 0.18); o.stop(now + i * 0.18 + 0.35);
        });
    }
    else if (type === 'countdown') {
        const o = ac.createOscillator();
        o.type = 'sine';
        o.frequency.value = 660;
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        o.connect(g); o.start(now); o.stop(now + 0.16);
    }
    else if (type === 'go') {
        const o = ac.createOscillator();
        o.type = 'sine';
        o.frequency.value = 990;
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        o.connect(g); o.start(now); o.stop(now + 0.32);
    }
    else if (type === 'kill') {
        [660, 880].forEach((f, i) => {
            const o = ac.createOscillator();
            o.type = 'triangle';
            const gg = ac.createGain();
            o.frequency.value = f;
            gg.gain.setValueAtTime(0.22, now + i * 0.08);
            gg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);
            o.connect(gg); gg.connect(ac.destination);
            o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.2);
        });
    }
}

// Throttle SFX so we don't spam
var lastSfx = {};
function playSfxThrottled(type, minGap) {
    const now = performance.now();
    if (lastSfx[type] && now - lastSfx[type] < minGap) return;
    lastSfx[type] = now;
    playSfx(type);
}
