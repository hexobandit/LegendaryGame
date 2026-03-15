# Legendary Destruction Derby — Game Engine & Tech Reference

How the Destruction Derby game was built: zero dependencies, pure Canvas 2D, procedural audio, surface-aware physics with lateral grip, and a drawing system for top-down cars with personality.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Rendering | **HTML5 Canvas 2D** (`<canvas>` + `getContext('2d')`) | No WebGL, no sprite sheets, no images at all |
| Audio | **Web Audio API** (`AudioContext`, `OscillatorNode`, `GainNode`) | Procedurally generated — zero audio files |
| Animation | **`requestAnimationFrame`** with frame counting | Smooth 60fps game loop |
| Input | **Keyboard Events** (`keydown` / `keyup`) | WASD + Arrows for split-screen |
| UI | HTML/CSS overlays + canvas-drawn HUD | Start screen, pause, game-over in DOM; in-game HUD on canvas |
| Libraries | **None** | Single self-contained HTML file |

No build tools. No bundler. No npm. Open the HTML file in a browser and it works.

---

## CONFIG — The Tuning Panel

All physics values live in a single `CONFIG` object at the top of the script. Open the browser console and type `CONFIG` to inspect or modify values at runtime.

```js
const CONFIG = {
    // ── Acceleration ──
    autoAccel:      0.22,   // Forward push per frame (auto-throttle)
    brakeForce:     0.25,   // Braking deceleration per frame
    maxSpeed:       7.5,    // Normal top speed (px/frame)

    // ── Steering ──
    turnSpeed:      0.048,  // Normal steering rate (rad/frame)
    handbrakeTurn:  0.07,   // Handbrake steering rate

    // ── Surface Forward Friction ──
    // Per-frame velocity multiplier: lower = more drag
    tarmacFriction: 0.978,  // Road — smooth, fast
    grassFriction:  0.965,  // Grass — noticeable drag
    dirtFriction:   0.955,  // Dirt — heavy drag
    mudFriction:    0.935,  // Mud — very draggy
    waterFriction:  0.92,   // Water — major slowdown
    oilFriction:    0.985,  // Oil — barely slows, but...

    // ── Lateral Grip (the big one for "ice" vs "grip") ──
    // Lower = more grip. 0.70 = super grippy kart, 0.95 = ice skating
    tarmacGrip:     0.82,   // Tires grip well on road
    grassGrip:      0.88,   // Less grip on grass
    dirtGrip:       0.85,   // Moderate grip on dirt
    mudGrip:        0.92,   // Mud: car slides around
    waterGrip:      0.90,   // Water: slippery
    oilGrip:        0.97,   // Oil: nearly zero lateral grip — black ice
    handbrakeGrip:  0.96,   // Very slidey during handbrake/drift

    // ── Nitro ──
    nitroAccel:     0.5,    // Nitro forward push
    nitroMaxSpeed:  12,     // Nitro speed cap
    nitroBurnFrames: 120,   // Duration of nitro burn (~2 sec)
    nitroCooldown:  480,    // Cooldown after burn (~8 sec)
    nitroMax:       100,    // Nitro tank capacity

    // ── Collision ──
    collisionDmg:   0.9,    // Damage multiplier on impacts

    // ── Damage Penalties ──
    dmgSpeedFull:   1.0,    // Speed mult above 60% health
    dmgSpeedMed:    0.82,   // Speed mult at 30-60% health
    dmgSpeedLow:    0.55,   // Speed mult below 30% health
    dmgWobble:      0.04,   // Steering wobble at low health

    // ── Hazards ──
    bushSlowdown:   0.92,   // Per-frame speed mult inside bush
    bumpBounce:     3.0,    // Kick strength from speed bumps
    bumpSpinChance: 0.3,    // Chance of brief spin on bump hit
};
```

---

## Why It Feels Good

### 1. Lateral Grip — The "Ice" Killer

The single most important physics feature. Velocity is decomposed into **forward** and **sideways** components relative to the car's facing angle:

```js
function applyFriction(car, isHandbrake) {
    let surface = getSurface(car.x, car.y);

    // Decompose velocity
    let fx = Math.cos(car.angle), fy = Math.sin(car.angle);
    let forwardSpd = car.vx * fx + car.vy * fy;        // along the car
    let lateralSpd = car.vx * (-fy) + car.vy * fx;     // perpendicular

    // Different friction per axis per surface
    forwardSpd *= fwd;   // rolling resistance (low)
    lateralSpd *= lat;   // tire grip (high — this kills the slide)

    // Reconstruct
    car.vx = fx * forwardSpd + (-fy) * lateralSpd;
    car.vy = fy * forwardSpd + fx * lateralSpd;
}
```

Without lateral grip: car slides like on ice when turning.
With lateral grip: tires grip sideways, car turns where you point it.

### 2. Auto-Throttle

Cars always accelerate forward. Player only controls **steering**, **braking**, and **nitro**. This reduces controls, increases accessibility (great for kids), and keeps the action constant.

```js
// Always push forward unless braking to a stop
if (!brake || spd > 1) {
    car.vx += Math.cos(car.angle) * accel;
    car.vy += Math.sin(car.angle) * accel;
}
```

### 3. Damage Affects Driving

Damaged cars are slower and wobblier — you can feel the car falling apart:

```js
function getDamageMultiplier(car) {
    let hp = car.health / car.maxHealth;
    if (hp > 0.6) return 1.0;              // Fine
    if (hp > 0.3) return lerp(0.82, 1.0);  // Sluggish
    return lerp(0.55, 0.82);               // Crawling
}

// Wobble at low health — two overlapping sine waves
if (hp < 0.4) {
    car.angle += Math.sin(now * 0.008 + car.x) * wobble
               + Math.sin(now * 0.013) * wobble * 0.5;
}
```

### 4. Cooldown-Based Nitro

Not a drainable tank — a deliberate ability with three states:

```
READY (full tank) → press W → BURN (2 sec) → COOLDOWN (8 sec) → READY
```

This prevents spamming and creates tactical decisions about _when_ to boost.

---

## Surface Detection

The arena has 7 surface types. Each affects forward friction and lateral grip differently.

### Base Terrain Layout

```
┌──────────────────────────────────────────────┐
│                  GRASS                        │
│         ╲            ╱                       │
│          ╲  TARMAC  ╱                        │
│           ╲  roads ╱                         │
│     ───────╲──────╱───────                   │
│              ○○○○○○         ← center circle  │
│     ───────╱──────╲───────   (r=520)         │
│           ╱        ╲                         │
│          ╱          ╲                        │
│         ╱            ╲                       │
│    GRASS    + scattered hazards              │
└──────────────────────────────────────────────┘
```

- **Tarmac**: Central circle (r=520) + 4 diagonal roads (104px wide)
- **Grass**: Everything else (base terrain)
- **Dirt patches**: 90 random circles on grass
- **Mud**: 12 large dark-brown pools (grass only)
- **Water puddles**: 8 blue pools with animated ripples (anywhere)
- **Oil slicks**: 6 rotated ellipses with rainbow sheen
- **Bushes**: 18 clusters of green leaf circles (passable obstacle)
- **Speed bumps**: 10 yellow/black striped bars (tarmac only)

### Detection Priority

```js
function getSurface(x, y) {
    // Hazards override base terrain (checked first)
    for (oil slicks)   → return 'oil';    // ellipse collision
    for (water puddles) → return 'water';  // circle collision
    for (mud patches)   → return 'mud';    // circle collision

    // Base terrain
    if (dist from center < 520) return 'tarmac';
    if (on diagonal road strip) return 'tarmac';
    if (in dirt patch) return 'dirt';
    return 'grass';
}
```

### Surface Effects Summary

| Surface | Forward Friction | Lateral Grip | Particles | Notes |
|---------|-----------------|-------------|-----------|-------|
| Tarmac | 0.978 (fast) | 0.82 (grippy) | — | Best surface |
| Grass | 0.965 | 0.88 | Green bits | Slower top speed |
| Dirt | 0.955 | 0.85 | Brown bits | Heavy drag |
| Mud | 0.935 | 0.92 (slidey) | Dark splatter | Very slow + slippery |
| Water | 0.92 | 0.90 | Blue splashes | Major slowdown |
| Oil | 0.985 (slick) | 0.97 (no grip) | — | Black ice — car spins |
| Bush | N/A | N/A | Leaf clusters | Speed × 0.92, passable |
| Bump | N/A | N/A | — | Bounce + 30% spin |

---

## Car Drawing System

All cars are drawn procedurally using Canvas 2D. No sprites.

### Car Object

```js
createCar(x, y, angle, color, name, playerIdx) → {
    x, y, angle, vx, vy, speed,
    color, name,
    playerIdx,        // 0=P1, 1=P2, -1=AI
    health, maxHealth, alive,
    nitro, nitroCooldown, nitroActive, nitroBurnTimer,
    handbrake, drifting,
    kills, hits, damageDealt, deaths,
    aiTarget, aiState, aiTimer, aiSteerDir,
    damageCooldown, lastHitBy, spinTimer, invincible,
    turnTimer, prevAngle,
    respawnTimer,
    activePowerUp, powerUpTimer
}
```

### Anatomy of a Car (top-down)

```
          ┌─── headlights (yellow dots)
          │  ┌─ windshield (blue rect)
         ╔╤══╤══════════╗
         ║│▓▓│          ║← body (car.color with rounded rect)
         ║│▓▓│  [P1/◆]  ║← badge: "P1"/"P2" for humans, diamond for AI
         ║│▓▓│          ║
         ╚╧══╧══════════╝
          │   └── roof stripe (white line)
          └── tail lights (red dots)

  + Optional: spoiler (rear fin) on even-index AI
  + Optional: bumper (front bar) on odd-index AI
```

### Drawing Order (back to front)

1. Power-up glow ring (pulsing colored circle)
2. Shadow (offset dark ellipse)
3. Car body (rounded rect in car.color)
4. Windshield (blue transparent rect)
5. Rear section (dark rect)
6. Roof stripe (white line)
7. Headlights (2 yellow arcs)
8. Tail lights (2 red arcs)
9. Player badge or AI diamond
10. AI variations (spoiler or bumper)
11. Damage cracks (random lines when health < 60)
12. Smoke particles (when health < 40)

### Visual Effects on Cars

| State | Effect |
|-------|--------|
| Invincible | Flashes white every other frame |
| Nitro active | Fire particles behind car |
| Drifting/handbrake | Skid marks + smoke from rear tires |
| Damaged (< 60 HP) | Random crack lines on body |
| Critical (< 40 HP) | Black/gray smoke particles |
| Dead | Faded dark hull + fire particles |
| Multiplayer | Pulsing colored triangle marker above car |

---

## Particle & FX System

Lightweight system using plain objects. No classes, no pooling.

### Particle Structure

```js
function mkParticle(x, y, vx, vy, color, size, decay) {
    return { x, y, vx, vy, color, size, alpha: 1, decay };
}
```

### Particle Types

| Type | Colors | Size | Decay | Triggered By |
|------|--------|------|-------|--------------|
| Sparks | Yellow, orange, white | 2-5px | 0.05 | Collisions |
| Smoke | Gray (#666) | 8-20px | 0.015 | Collisions, damage |
| Explosion | Red, orange, yellow, white + dark smoke | 5-10px | 0.02 | Car death |
| Nitro flame | Orange, yellow (#ff4400, #ff8800) | 4-9px | 0.06 | Active nitro |
| Drift smoke | Gray (#999) | 8-14px | 0.03 | Handbrake |
| Grass bits | Greens (#5a8a2a) | 2-5px | 0.04 | Driving on grass |
| Dirt bits | Browns (#8a7a55) | 2-5px | 0.04 | Driving on dirt |
| Mud splatter | Dark brown (#3d2b1a) | 3-7px | 0.03 | Driving in mud |
| Water splash | Light blue (#6ac8ff, #88ddff) | 2-6px | 0.04 | Driving in water |
| Bush leaves | Greens (#3a7a1a, #4a9a2a) | 3-8px | 0.03 | Driving through bush |

### Skid Marks

Dual-tire-track line segments, not dots:

```js
function addSkid(car) {
    // Left and right tire positions (offset 14px from center at ±0.45 rad)
    let lx = car.x - Math.cos(car.angle + 0.45) * 14;
    let rx = car.x - Math.cos(car.angle - 0.45) * 14;
    // Short line segments along car's direction
    skidMarks.push(
        { x1: lx, y1: ly, x2: lx - bx, y2: ly - by, ... life: 1800 },
        { x1: rx, y1: ry, x2: rx - bx, y2: ry - by, ... life: 1800 }
    );
}
```

- Persist for 1800 frames (~30 seconds)
- Fade in last 30% of life
- Max 5000 marks; oldest 1000 culled when exceeded
- Width: 3.5px (drifting) or 2px (sharp turn)

### Floating Texts & Speech Bubbles

```js
floatingTexts.push({
    x, y, text, color, alpha: 1, vy: -0.8, life: 80,
    bubble: false            // plain text
});

floatingTexts.push({
    x, y, text: '#@$%!', color: '#fff', alpha: 1, vy: -0.4, life: 100,
    bubble: true,            // speech bubble with background
    bubbleColor: car.color   // bubble fill color
});
```

| Type | Text | Chance | Life | Style |
|------|------|--------|------|-------|
| Damage number | `-15` | Always | 80 | Yellow plain text |
| Kill notification | `+500 DESTROYED` | Always | 120 | Car color text |
| Swear bubble | `#@$%!`, `OUCH!`, `WTF!` etc. | 30% on hard impact | 100 | Speech bubble |
| Celebration bubble | `WOOHOO!`, `GET REKT!`, `EZ!` etc. | 50% on kill | 110 | Speech bubble |

Speech bubbles draw a rounded rectangle background with a triangular tail pointer.

### Debris

Spawned on heavy collisions and explosions. Colored squares that spin and fade:

```js
debris.push({
    x, y, vx, vy,
    angle, spin,         // rotation
    size: 4-8px,
    color: carColor or '#444',
    life: 60-120 frames
});
```

---

## Audio Engine

Zero audio files. All sound is procedurally generated with Web Audio API oscillators.

```js
let audioCtx;
function ensureAudio() {
    if (!audioCtx) audioCtx = new (AudioContext || webkitAudioContext)();
}
```

### Sound Effects

| SFX | Wave | Frequency | Duration | Trigger |
|-----|------|-----------|----------|---------|
| `bump` | sine | 280→80 Hz | 0.16s | Soft collision |
| `hit` | square + noise | 400→60 Hz | 0.14s | Hard collision |
| `explode` | sine + noise | 600→30 Hz | 0.42s | Car death |
| `nitro` | sine | 500→1200 Hz ↑ | 0.16s | Nitro activation |
| `drift` | sawtooth | 900-1200→300 Hz | 0.08s | Skidding |
| `countdown` | sine | 660 Hz | 0.16s | 3, 2, 1 |
| `go` | sine | 990 Hz | 0.32s | GO! |
| `kill` | triangle × 2 | 660, 880 Hz | 0.2s | Destroying a car |
| `win` | sine × 4 | C5→E5→G5→C6 | 0.54s | Victory |
| `lose` | sine × 4 | G4→F#4→D#4→G3 | 0.88s | Defeat |

**Design patterns:**
- **Positive events** (kill, win): ascending tones
- **Negative events** (explode, lose): descending tones
- **Impacts**: frequency sweep down + white noise burst
- **Throttling**: `playSfxThrottled(type, minGapMs)` prevents sound spam

---

## Power-Up System

6 types, canvas-drawn with glowing halos.

| Type | Icon | Color | Effect | Duration |
|------|------|-------|--------|----------|
| Health | `+` | Green | +40 HP instantly | Instant |
| Shield | `O` | Cyan | 70% damage reduction | 8 sec |
| Damage | `!` | Red | 2× collision damage dealt | 7 sec |
| Speed | `>` | Yellow | 1.35× accel & max speed | 6 sec |
| Nitro | `N` | Orange | Full nitro tank + reset cooldown | Instant |
| Magnet | `M` | Pink | Pulls nearby power-ups (250px, 3px/frame) | 7 sec |

**Spawn rules:**
- Max 5 active at once
- Spawn every 4-6 seconds
- Despawn after 15 seconds (flash in last 2 seconds)
- Min 40px from obstacles, 80px from other power-ups

**Rendering:**
- Bob up/down (sine wave, 4px amplitude)
- Glowing halo (larger semi-transparent circle)
- Dark inner circle + colored border + text icon

---

## AI System

3-state machine with wall avoidance and nitro tactics.

### States

```
┌───────┐  health<25   ┌───────┐
│ CHASE │─────────────►│ FLEE  │
│       │◄─────────────│       │
└───┬───┘  health>25   └───────┘
    │ 30%
    ▼
┌───────┐
│ ROAM  │  random wandering
└───────┘
```

- **Chase** (70%): Target nearest car, prioritize humans (0.55× distance weight)
- **Roam** (30%): Wander randomly, 2% chance to change direction per frame
- **Flee**: Run from nearest threat when health < 25
- State re-evaluated every 1-3 seconds

### AI Behaviors

| Behavior | Trigger | Action |
|----------|---------|--------|
| Nitro | Chasing target < 400px, tank full | Burn nitro for 2 seconds |
| Brake near wall | Within 120px of boundary | Velocity × 0.88 |
| Brake near obstacle | Within obstacle.r + 50 | Velocity × 0.92 |
| Reverse correction | Moving away from target | Velocity × 0.95 |
| Sharp turn skids | turnTimer > 8, speed > 2.5 | Spawn skid marks |
| Damage wobble | Health < 40% | Same wobble as player |

AI cars are 82% as fast as players (`autoAccel * 0.82`, `maxSpeed * 0.82`).

---

## HUD System

All HUD is drawn on-canvas per viewport using `ctx.fillText` and `ctx.fillRect`.

### Single Player HUD

```
┌─────────────────────────────────────────────────┐
│ ┌──Controls──┐                    ┌──Stats────┐ │
│ │ A/D Steer  │                    │ Score: 0  │ │
│ │ S   Brake  │                    │ Kills: 0  │ │
│ │ W   Nitro  │                    │ Deaths: 0 │ │
│ │ SPC Drift  │                    │ AI: 0/11  │ │
│ │ ESC Pause  │                    │ Time: 0:00│ │
│ └────────────┘                    └───────────┘ │
│                                                 │
│                   [GAME AREA]                   │
│                                                 │
│ ┌──Speed/Nitro──┐                 ┌──Minimap──┐ │
│ │ 120 KMH       │  ┌──Health──┐   │  ○  •  •  │ │
│ │ ████████ READY │  │██████ HP│   │  □  •     │ │
│ └────────────────┘  └─────────┘   └───────────┘ │
└─────────────────────────────────────────────────┘
```

### Multiplayer HUD

```
┌────────────────────────┬────────────────────────┐
│ Player 1 (WASD)        │ Player 2 (Arrows)      │
│ ┌Stats┐     ┌Ctrl┐    │ ┌Stats┐     ┌Ctrl┐    │
│                        │                        │
│     [P1 VIEW]          │     [P2 VIEW]          │
│                        │                        │
│ ┌Spd┐ ┌HP┐  ┌Map┐    │ ┌Spd┐ ┌HP┐  ┌Map┐    │
└────────────────────────┴────────────────────────┘
```

### Minimap

- 140×140px (single) or 110×110px (multi)
- Shows: tarmac circle, player car (white □), AI cars (red □), power-ups (colored □)
- Camera viewport outline (white rect)
- Scale: arena size / minimap size

---

## Game State Machine

```
     ┌──────────────────────────────────────┐
     │                                      │
     ▼                                      │
   MENU ──[START]──► COUNTDOWN ──► PLAYING ─┤
                                    │   ▲   │
                                ESC │   │   │
                                    ▼   │   │
                                  PAUSED ─┘ │
                                    │       │
                                 [MENU]     │
                                    │       │
                                    └───────┘
                                            │
                              all AI dead   │
                              or time up    │
                                            ▼
                                        GAMEOVER ──[PLAY AGAIN]──► MENU
```

---

## Input Layout

### Single Player
Both WASD and Arrow keys work simultaneously.

| Key | Action |
|-----|--------|
| A / ← | Steer left |
| D / → | Steer right |
| S / ↓ | Brake |
| W / ↑ | Activate nitro |
| Space | Handbrake (drift) |
| R | Reset car velocity |
| ESC | Pause / Resume |
| F11 | Toggle fullscreen |

### Multiplayer Split-Screen

| Action | Player 1 | Player 2 |
|--------|----------|----------|
| Steer left | A | ← |
| Steer right | D | → |
| Brake | S | ↓ |
| Nitro | W | ↑ |
| Handbrake | Q | M |

---

## Rendering Pipeline

### Drawing Order (renderWorld)

```
1. Terrain (grass base + grass/dirt/mud patches + tarmac roads + water + oil + bumps)
2. Skid marks (persist 30 sec)
3. Walls (tire barriers)
4. Obstacles (if any)
5. Bushes (passable, drawn before cars)
6. Debris (spinning squares)
7. Dead cars (faded husks + fire)
8. Power-ups (glowing orbs)
9. Live cars (full detail)
10. Particles (sparks, smoke, splashes)
11. Floating texts & speech bubbles
```

### Split-Screen Rendering

```js
// Each viewport:
ctx.save();
ctx.beginPath();
ctx.rect(viewX, viewY, viewW, viewH);  // clip to half-screen
ctx.clip();
ctx.translate(-camX + viewOffsetX, -camY);
renderWorld();                          // draw everything
ctx.restore();
drawHUD(player, viewX, viewY, viewW, viewH);  // HUD on top
```

Multiplayer uses a 4px black divider line between viewports.

---

## Collision System

### Car-to-Car

```js
// For each pair (i, j):
if (distance < 35px) {
    // 1. Separate overlapping cars
    // 2. Exchange velocity (dot product reflection)
    // 3. Calculate impact force
    // 4. Distribute damage by speed ratio
    // 5. Apply power-up modifiers (shield: 0.3×, damage boost: 2×)
    // 6. Spawn FX (sparks, smoke, debris)
    // 7. High impact (>5): spin the loser
}
```

### Car-to-Wall
Boundary at 60px from arena edge. Velocity reflected at 50%.

### Respawn
- 5-second countdown timer after death
- Best-of-20 random positions (maximizes distance from all cars)
- 2 seconds of invincibility (white flash)
- Full health + full nitro on respawn

---

## Color Picker

20 color options on the start screen. Both players pick their car color.

```js
const PLAYER_COLOR_OPTIONS = [
    '#ff6eb4', '#ff3388', '#ff4466', '#e03030', '#ff6030',
    '#ff9030', '#ffcc00', '#88dd22', '#30c030', '#20ccaa',
    '#30c0c0', '#6eb4ff', '#3060e0', '#6060ff', '#a060ff',
    '#c040c0', '#e0e0e0', '#ffaacc', '#aaffdd', '#ffe066'
];
```

Clicking a swatch updates the player column's border, background, and title color to match.

---

## File Structure

Currently a single self-contained HTML file:

```
LegendaryGame/
  destruction-derby.html   ← Everything (~2500 lines, 100KB)
```

### Planned Multi-File Structure

```
game/
  index.html       ← Shell (canvas, overlays, CSS)
  config.js        ← CONFIG object
  maps.js          ← Map definitions (JSON data)
  engine.js        ← Physics, collisions, surfaces
  renderer.js      ← All drawing functions
  audio.js         ← SFX system
  game.js          ← Game loop, state machine, input
  manifest.json    ← PWA manifest
  sw.js            ← Service worker (offline support)
```

---

## Architecture Notes for Future Development

### Mobile (PWA + Capacitor)
- Auto-throttle already reduces controls (no gas pedal needed)
- Needs: virtual joystick (left thumb) + buttons (right thumb)
- Lock to landscape orientation
- Touch events via Pointer Events API
- Fullscreen API already integrated

### Networked Multiplayer
- Node.js WebSocket server running authoritative physics
- Client-side prediction with server reconciliation
- `applyFriction`, `checkCollisions`, `moveCar` can run on server as-is (pure JS)
- 20-30 tick/sec state sync for 12 cars

### Map System
- Maps as JSON data (positions, radii, types for all terrain features)
- `generateTerrain()` reads from map definition instead of randomizing
- Map selector on start screen
- Future: visual map editor (separate HTML page)
