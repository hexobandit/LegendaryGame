# Legendary Destruction Derby — Claude Instructions

## What This Is
A top-down destruction derby browser game. Zero dependencies, pure Canvas 2D, procedural audio, ~5400 lines of vanilla JS across 19 files. Open `game/index.html` in a browser and it runs.

## Architecture

### Script Loading Order (strict — each file depends on those above it)
```
config.js → modes.js → cars.js → maps.js → state.js → utils.js → audio.js →
particles.js → physics.js → terrain.js → car-factory.js → powerups.js →
player.js → ai.js → input.js → renderer.js → hud.js → ui.js → intro.js → game.js
```

### Global State Model
All game state lives in global variables (declared in `state.js`). There is no module system, no classes, no event bus. Files communicate through shared globals. This is intentional — keep it simple.

### Key Globals
- `gameState`: `'menu'` | `'countdown'` | `'playing'` | `'paused'` | `'gameover'`
- `gameMode`: `'single'` | `'multi'`
- `cars[]`, `particles[]`, `floatingTexts[]`, `debris[]`, `powerUps[]`, `breakables[]`
- `currentMap`: active map object from `MAPS[]`

## Critical Conventions

### Adding a New Car Type
1. Add entry to `CAR_TYPES[]` in `cars.js` with: `id, name, bodyStyle, width, height, hp, mass, maxSpeedMult, accelMult, turnMult, collisionDmgMult, gripBonus`
2. Add body style rendering in **both** `drawCar()` in `renderer.js` AND `drawCarPreview()` in `ui.js` — these are parallel implementations that must stay in sync
3. Update shadow offset check in `renderer.js` if the car is tall (SUV/truck/bus)
4. Update corner radius in `renderer.js` if needed

### Adding a New Map
1. Add entry to `MAPS[]` in `maps.js` following the documented field structure
2. Road types: `'radial'` (center circle + spokes), `'curvy'` (waypoint paths), `'none'`
3. Curvy roads use `curvyRoads[]` with waypoint arrays — rendering in `renderer.js`, physics detection in `physics.js`
4. Each curvy road can have custom `color`, `edgeColor`, `centerColor`, `surface`
5. Terrain generation reads from `terrain: {}` config — see existing maps for patterns

### Adding a New Game Mode
Use the **mode registry** in `modes.js`. Call `registerMode('my-mode', { ... })` with:
- `id`, `name` — identification
- `playerCount`, `aiCount` — spawn config
- `respawn`, `splitScreen` — behavior flags
- `update(dt)` — called each frame during 'playing' (mode-specific per-frame logic)
- `checkWin()` — return true when the game should end
- `results()` — return `{ won, title, titleColor, sfx }` for end screen

Then in `ui.js selectMode()`, map the UI selection to `setActiveMode('my-mode')`.

The game loop calls `activeMode.update(dt)` and the existing `gameMode` variable (`'single'`/`'multi'`) still controls split-screen vs full-screen rendering. Mode-specific rendering/HUD can check `activeMode.id`.

### Surface System
`getSurface(x, y)` in `physics.js` returns surface type. Priority: ice → sandtrap → oil → water → mud → curvy roads → radial roads → dirt → grass. Each surface has friction + grip values in `CONFIG` (overridable per-map via `surfaceFriction`).

### Floating Text System
Push to `floatingTexts[]`: `{ x, y, text, color, alpha, vy, life, bubble?, bubbleColor?, big? }`
- `bubble: true` renders speech bubble with tail
- `big: true` renders larger with stroke outline

### HUD Helpers
`hud.js` exports: `hudRoundRect()`, `hudPanel()`, `hudBar()` — use these for consistent styled panels.

## File Responsibilities (quick reference)
| File | What |
|------|------|
| `modes.js` | Game mode registry (derby-single, derby-multi, future CTF/racing/etc) |
| `config.js` | Tuning constants (physics, nitro, damage) |
| `cars.js` | CAR_TYPES definitions (10 types) |
| `maps.js` | MAPS array (4 maps) |
| `state.js` | Global variable declarations |
| `utils.js` | clamp, lerp, angleDiff |
| `audio.js` | Web Audio API procedural SFX |
| `particles.js` | Particle + skid mark + debris systems |
| `physics.js` | Surface detection, friction, collisions, damage |
| `terrain.js` | Procedural terrain generation from map config |
| `car-factory.js` | createCar(), spawnCars() |
| `powerups.js` | Power-up types, spawning, effects |
| `player.js` | Keyboard → car control |
| `ai.js` | Chase/roam/flee state machine |
| `input.js` | Keyboard listeners, pause, fullscreen |
| `renderer.js` | All canvas drawing (~1200 lines, largest file) |
| `hud.js` | In-game HUD panels, bars, minimap |
| `ui.js` | Menu screens, mode selector, game-over |
| `intro.js` | Intro animation |
| `game.js` | Main loop (requestAnimationFrame), state transitions |

## Testing
No test framework. Test by opening `game/index.html` in browser. Use `node -c game/js/FILE.js` for syntax checks on JS files.

## Mockups
HTML mockups go in project root as `mockup-*.html` — standalone visual references, not loaded by the game.

## Don'ts
- Don't add npm, webpack, or any build tooling — this is intentionally zero-dependency
- Don't use ES modules or import/export — plain `<script>` tag loading
- Don't add classes or TypeScript — keep it functions + plain objects
- Don't refactor the global state model into something "cleaner" unless explicitly asked
- Don't create new JS files without checking if logic belongs in an existing file
- When editing car rendering, always update BOTH renderer.js AND ui.js preview
