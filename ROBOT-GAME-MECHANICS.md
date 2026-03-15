# ThreatBots Game Engine — Character Art & Tech Reference

How the ThreatBots games were built: zero dependencies, pure Canvas 2D, procedural audio, and a drawing system you can reuse for any cute pixel-style characters.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Rendering | **HTML5 Canvas 2D** (`<canvas>` + `getContext('2d')`) | No WebGL, no sprite sheets, no images at all |
| Audio | **Web Audio API** (`AudioContext`, `OscillatorNode`, `GainNode`) | Procedurally generated — zero audio files |
| Animation | **`requestAnimationFrame`** with delta-time | Smooth 60fps, frame-rate independent |
| Input | **Pointer Events API** (`pointerdown`, `pointermove`, `pointerup`) | Touch + mouse unified |
| UI | HTML/CSS top bar + canvas game area | CSS custom properties for theming |
| Libraries | **None** | Entire game is a single self-contained HTML file |

No build tools. No bundler. No npm. Open the HTML file in a browser and it works.

---

## Why It Feels Smooth

1. **Delta-time physics** — All movement, damage, and animation is multiplied by `dt` (seconds since last frame). The game runs identically at 30fps and 144fps.

```js
const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // capped at 50ms
```

2. **Bob animation** — Every character has a `bobPhase` that creates a gentle floating motion. It's a sine wave, costs nothing, and makes static characters feel alive.

```js
bot.bobPhase += dt * 3;
const bob = Math.sin(bot.bobPhase) * 2; // 2px vertical float
```

3. **Click scale feedback** — When clicked, characters briefly scale up 12-15%, then decay back. Gives instant tactile feedback.

```js
const scale = 1 + bot.clickAnim * 0.15;
bot.clickAnim = Math.max(0, bot.clickAnim - dt * 4); // fast decay
```

4. **Particle system** — Lightweight array of `{x, y, vx, vy, life, color, size}` objects. Particles shrink and fade as `life` drains. Dead particles are filtered out each frame.

5. **Minimal overdraw** — Background cleared once, grid drawn once, characters drawn in order (defenders first, attackers on top). No off-screen buffers.

---

## Character Drawing System

All characters are drawn procedurally using a shared `roundRect` helper and raw Canvas 2D calls. No sprites, no images.

### The Core Helper: `roundRect`

Every body part is a rounded rectangle:

```js
function roundRect(x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
```

### Anatomy of a Character

All characters share the same proportional skeleton, scaled from a single `size` variable (`s`). This means you can change `BOT_SIZE` and everything scales.

```
        (antenna tip)
            o              <- arc, r=2.5, at (0, -s*0.95)
            |              <- line from (0, -s*0.7) to (0, -s*0.9)
       +---------+         <- HEAD: roundRect at (-s*0.38, -s*0.7), w=s*0.76, h=s*0.45
       |  o   o  |         <- EYES: arcs at (-s*0.13, -s*0.48) and (s*0.13, -s*0.48), r=2
       +---------+
       +-----------+       <- BODY: roundRect at (-s/2, -s/4), w=s, h=s*0.7
       |   [icon]  |       <- Icon/label centered on chest
       +-----------+
        +--+  +--+         <- LEGS: two roundRects at (-s*0.28, s*0.45) and (s*0.1, s*0.45)
```

### Drawing Coordinates

Everything is drawn relative to `(0, 0)` using `ctx.save()` / `ctx.translate()` / `ctx.restore()`. The bob offset is applied at the translate step:

```js
function drawCharacter(bot) {
  const bob = Math.sin(bot.bobPhase) * 1.5;
  const bx = bot.x, by = bot.y + bob, s = bot.size;
  const scale = 1 + bot.clickAnim * 0.12;

  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(scale, scale);

  // -- draw body parts at local coordinates --
  roundRect(-s/2, -s/4, s, s*0.7, 4, '#1c2333', color, 1.3);  // body
  roundRect(-s*0.38, -s*0.7, s*0.76, s*0.45, 3, '#1c2333', color, 1.3);  // head
  // ... eyes, antenna, legs, icon ...

  ctx.restore();
}
```

### Friendly vs Evil — Same Skeleton, Different Details

**Friendly (Defender)**
- Round dot eyes: `ctx.arc(x, y, 2, 0, Math.PI*2)`
- Straight antenna with green tip
- Outline color: `#58a6ff` (blue) or custom per type
- Optional: shield path on the chest, checkmark icon

**Evil (Attacker)**
- Triangle/chevron eyes (menacing):
```js
ctx.moveTo(-s*0.22, -s*0.58);
ctx.lineTo(-s*0.05, -s*0.48);
ctx.lineTo(-s*0.22, -s*0.38);
ctx.fill();
```
- Broken/bent antenna (line goes at an angle, tip is offset and semi-transparent)
- Outline color: `#f85149` (red) or custom per type
- Hit flash: when `hitFlash > 0`, outline becomes `#fff` and body fill becomes `#2a1015`

### Creating New Character Types

To create a new character type using this system:

```js
// 1. Define the type
const MY_TYPES = {
  wizard: { label: 'Wizard', color: '#a371f7', hp: 80, icon: 'WZ' },
  knight: { label: 'Knight', color: '#d29922', hp: 150, icon: 'KN' },
};

// 2. Draw function — reuse the skeleton, add unique details
function drawWizard(bot) {
  const bob = Math.sin(bot.bobPhase) * 1.5;
  const s = bot.size, c = bot.color;

  ctx.save();
  ctx.translate(bot.x, bot.y + bob);
  ctx.scale(1 + bot.clickAnim * 0.12, 1 + bot.clickAnim * 0.12);

  // Standard body
  roundRect(-s/2, -s/4, s, s*0.7, 4, '#1c2333', c, 1.3);

  // Pointy wizard hat instead of standard head
  ctx.beginPath();
  ctx.moveTo(-s*0.4, -s*0.3);          // left base
  ctx.lineTo(s*0.4, -s*0.3);           // right base
  ctx.lineTo(0, -s*1.2);               // tip
  ctx.closePath();
  ctx.fillStyle = '#1c2333'; ctx.fill();
  ctx.strokeStyle = c; ctx.lineWidth = 1.3; ctx.stroke();

  // Eyes (same pattern)
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.arc(-s*0.13, -s*0.48, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(s*0.13, -s*0.48, 2, 0, Math.PI*2); ctx.fill();

  // Star on chest instead of icon
  ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('\u2605', 0, s*0.15);

  // Legs (same pattern)
  roundRect(-s*0.28, s*0.45, s*0.18, s*0.2, 2, '#1c2333', c, 0.8);
  roundRect(s*0.1, s*0.45, s*0.18, s*0.2, 2, '#1c2333', c, 0.8);

  ctx.restore();
}
```

### Color Palette (GitHub-inspired dark theme)

| Variable | Hex | Use |
|----------|-----|-----|
| Background | `#0d1117` | Canvas clear color |
| Card/Body fill | `#1c2333` | Robot body fill |
| Border | `#30363d` | Grid lines, UI borders |
| Blue | `#58a6ff` | Defender outlines |
| Red | `#f85149` | Attacker outlines, damage |
| Green | `#7ee787` | Health, shields, antenna tips |
| Amber | `#d29922` | Warnings, firewall |
| Cyan | `#39d4e0` | IDS, special highlights |
| Purple | `#a371f7` | SIEM, special units |
| Muted | `#8b949e` | Disabled states, labels |
| Hit flash body | `#2a1015` | Dark red body on damage |

---

## HP Bar System

Simple overlay bar drawn above each character:

```js
function drawHPBar(x, y, width, hp, maxHp, color) {
  const pct = Math.max(0, hp / maxHp);
  // Color shifts: green > 60%, amber > 30%, red below
  const hpColor = pct > 0.6 ? '#7ee787' : pct > 0.3 ? '#d29922' : '#f85149';

  ctx.fillStyle = '#30363d';                          // background track
  ctx.fillRect(x - width/2, y, width, 3);
  ctx.fillStyle = hpColor;                            // fill
  ctx.fillRect(x - width/2, y, width * pct, 3);
}
```

HP bars only appear when `hp < maxHp` (no bar = full health = cleaner look).

---

## Audio Engine

Zero audio files. All sound is procedurally generated with Web Audio API oscillators:

```js
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
  ensureAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;             // 'sine', 'square', 'sawtooth', 'triangle'
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
```

**Sound design patterns:**
- **Positive actions** (deploy, pickup): ascending tones — `300 → 500 → 700 Hz`, sine wave
- **Negative events** (damage, game over): descending tones — `400 → 300 → 200 → 100 Hz`, sawtooth wave
- **Impacts** (shield hit): rapid ascending plinks — `400 → 600 → 800 Hz`, triangle wave
- **Kills**: sharp descending — `800 → 400 → 200 Hz`, square wave
- Layered by using `setTimeout` to stagger oscillators by 40-100ms

---

## Particle System

Lightweight. No pooling, no classes. Just an array of plain objects:

```js
let particles = [];

function spawnParticles(x, y, color, count = 5) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.4,
      maxLife: 0.4 + Math.random() * 0.4,
      color,
      size: 1.5 + Math.random() * 2.5
    });
  }
}

// In update loop:
for (const p of particles) {
  p.x += p.vx;
  p.y += p.vy;
  p.vx *= 0.97;  // friction
  p.vy *= 0.97;
  p.life -= dt;
}
particles = particles.filter(p => p.life > 0);

// In draw loop:
for (const p of particles) {
  ctx.globalAlpha = p.life / p.maxLife;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
  ctx.fill();
}
ctx.globalAlpha = 1;
```

Particles fade **and** shrink simultaneously. The friction (`*= 0.97`) makes them decelerate naturally.

---

## Game Loop Pattern

```js
let lastTime = 0;

function gameLoop(timestamp) {
  if (!running) return;

  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
  lastTime = timestamp;

  // 1. Clear
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  // 2. Draw background (grid, zones)
  drawGrid();

  // 3. Draw game objects (back to front)
  drawParticles();
  for (const bot of bots) {
    if (bot.type === 'defender') drawDefender(bot);
  }
  for (const bot of bots) {
    if (bot.type === 'attacker') drawAttacker(bot);
  }

  // 4. Update physics & game logic
  update(dt);

  // 5. Next frame
  requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame(gameLoop);
```

The `0.05` cap on `dt` prevents physics explosions when the tab is backgrounded and returns with a huge delta.

---

## Responsive Canvas

```js
function resize() {
  W = canvas.width = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}
resize();
window.addEventListener('resize', resize);
```

The canvas fills its CSS container (`flex: 1; display: block;`). On resize, internal resolution matches display size — no scaling blur.

---

## Drag & Drop (Pointer Events)

Unified mouse + touch with a single API:

```js
let dragBot = null;
let dragOffX = 0, dragOffY = 0;

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const bot = getBot(mx, my);  // hit test against character positions

  if (bot && bot.type === 'defender') {
    dragBot = bot;
    dragOffX = mx - bot.x;
    dragOffY = my - bot.y;
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragBot) return;
  const rect = canvas.getBoundingClientRect();
  dragBot.x = e.clientX - rect.left - dragOffX;
  dragBot.y = e.clientY - rect.top - dragOffY;
});

canvas.addEventListener('pointerup', () => { dragBot = null; });
```

Disable touch scrolling on the canvas:
```js
canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
```

---

## File Structure

Each game is a **single self-contained HTML file**:

```
robots/
  play.html     — Script Kiddie Mode (~770 lines)
  game2.html    — Defense in Depth (~1500 lines)
```

Everything lives in one file: styles, markup, game engine, audio, drawing. This makes it trivially portable — copy the file anywhere and it works.

---

## Quick-Start Template

Minimal boilerplate to start a new game with this art style:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>My Game</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0d1117; overflow: hidden; height: 100vh; display: flex; }
    canvas { flex: 1; display: block; }
  </style>
</head>
<body>
<canvas id="c"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H, lastTime = 0;

function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
resize();
window.addEventListener('resize', resize);

function roundRect(x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}

// Your character
const bot = { x: 0, y: 0, size: 22, bobPhase: Math.random() * Math.PI * 2, clickAnim: 0 };

function drawBot(bot, color) {
  const bob = Math.sin(bot.bobPhase) * 1.5;
  const s = bot.size;
  ctx.save();
  ctx.translate(bot.x, bot.y + bob);
  ctx.scale(1 + bot.clickAnim * 0.12, 1 + bot.clickAnim * 0.12);

  roundRect(-s/2, -s/4, s, s*0.7, 4, '#1c2333', color, 1.3);           // body
  roundRect(-s*0.38, -s*0.7, s*0.76, s*0.45, 3, '#1c2333', color, 1.3); // head
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(-s*0.13, -s*0.48, 2, 0, Math.PI*2); ctx.fill(); // left eye
  ctx.beginPath(); ctx.arc(s*0.13, -s*0.48, 2, 0, Math.PI*2); ctx.fill();  // right eye
  ctx.beginPath(); ctx.moveTo(0, -s*0.7); ctx.lineTo(0, -s*0.9);
  ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke();              // antenna
  ctx.beginPath(); ctx.arc(0, -s*0.95, 2.5, 0, Math.PI*2);
  ctx.fillStyle = '#7ee787'; ctx.fill();                                    // antenna tip
  roundRect(-s*0.28, s*0.45, s*0.18, s*0.2, 2, '#1c2333', color, 0.8);   // left leg
  roundRect(s*0.1, s*0.45, s*0.18, s*0.2, 2, '#1c2333', color, 0.8);     // right leg

  ctx.restore();
}

function loop(ts) {
  const dt = lastTime ? Math.min((ts - lastTime) / 1000, 0.05) : 0.016;
  lastTime = ts;

  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  bot.bobPhase += dt * 3;
  bot.clickAnim = Math.max(0, bot.clickAnim - dt * 4);
  bot.x = W / 2;
  bot.y = H / 2;
  drawBot(bot, '#58a6ff');

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script>
</body>
</html>
```

Save as an HTML file, open in browser — you get a cute floating robot on a dark background, ready to extend.
