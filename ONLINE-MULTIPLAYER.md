# Online Multiplayer — Architecture & Implementation Plan

## Overview

All-in-one **Colyseus** (Node.js) server handling game rooms, matchmaking, REST API, accounts, and leaderboards. Single server, single language, single deploy.

```
┌─────────────┐     WebSocket      ┌───────────────────────────────┐
│   Browser    │◄──────────────────►│       Colyseus Server         │
│   Client     │                    │                               │
│              │◄───── REST ───────►│  Game Rooms    (WebSocket)    │
└─────────────┘                    │  Matchmaking   (built-in)     │
                                   │  REST API      (Express)      │
                                   │  Chat          (room msgs)    │
                                   │  Leaderboards  (Express+DB)   │
                                   │  Auth          (Express+DB)   │
                                   └───────────────┬───────────────┘
                                                   │
                                              PostgreSQL
                                          (accounts, stats,
                                           leaderboards)
```

---

## Tech Stack

- **Colyseus** v0.15+ — multiplayer game framework (includes Express.js)
- **Node.js** 20+ — runtime
- **TypeScript** — server code
- **PostgreSQL** — accounts, stats, leaderboards (via Prisma ORM)
- **@colyseus/monitor** — admin dashboard for rooms (dev/ops)
- Shared physics code — reuse existing JS physics engine on server

Dependencies are minimal: `colyseus`, `prisma`, `@colyseus/monitor`, `jsonwebtoken`. That's it.

---

## Architecture Model: Server-Authoritative

The Colyseus server runs the physics simulation. Clients send **inputs only** (throttle, steer, brake, nitro, handbrake). Server computes positions, collisions, damage, and broadcasts state.

**Why server-authoritative:**
- Anti-cheat built in (clients can't fake positions/health)
- Single source of truth for collisions (no disagreement between clients)
- Existing JS physics code runs on server with minimal changes
- Colyseus state sync handles the broadcasting automatically

**Tick rate:** 20 Hz server-side (every 50ms). Clients render at 60fps with interpolation between server snapshots.

---

## Colyseus Room Design

### Room Types

```
GameRoom   — handles both lobby phase and active gameplay (single room, phase transitions)
```

No separate LobbyRoom needed — the GameRoom starts in `"lobby"` phase, transitions to `"countdown"` then `"playing"` then `"gameover"`, then disposes. Simpler than managing two room types.

### GameRoom State Schema

Colyseus uses `@colyseus/schema` for automatic binary delta sync (only sends what changed).

```typescript
class CarState extends Schema {
  @type("float32") x: number;
  @type("float32") y: number;
  @type("float32") angle: number;
  @type("float32") vx: number;
  @type("float32") vy: number;
  @type("float32") health: number;
  @type("float32") maxHealth: number;
  @type("float32") nitro: number;
  @type("uint8")   alive: number;       // 0 or 1
  @type("uint8")   invincible: number;
  @type("uint16")  kills: number;
  @type("uint16")  deaths: number;
  @type("uint8")   activePowerUp: number;
  @type("uint8")   isBot: number;       // 0 or 1
  @type("string")  name: string;
  @type("string")  color: string;
  @type("string")  carTypeId: string;
  @type("string")  sessionId: string;   // empty for bots
}

class PowerUpState extends Schema {
  @type("float32") x: number;
  @type("float32") y: number;
  @type("string")  type: string;
  @type("uint16")  id: number;
}

class ChatMessage extends Schema {
  @type("string") name: string;
  @type("string") text: string;
  @type("string") color: string;
  @type("float64") timestamp: number;
}

class GameState extends Schema {
  @type([CarState])      cars = new ArraySchema<CarState>();
  @type([PowerUpState])  powerUps = new ArraySchema<PowerUpState>();
  @type([ChatMessage])   chat = new ArraySchema<ChatMessage>(); // last 50 messages
  @type("string")        phase: string;    // "lobby" | "countdown" | "playing" | "gameover"
  @type("uint8")         countdown: number;
  @type("float32")       gameTime: number;
  @type("string")        mapId: string;
  @type("string")        modeId: string;
  @type("uint8")         playerCount: number;
  @type("uint8")         maxPlayers: number;
}
```

### Input Messages (Client → Server)

Small, frequent — just the input state:

```typescript
interface PlayerInput {
  up: boolean;       // throttle
  down: boolean;     // reverse
  left: boolean;     // steer left
  right: boolean;    // steer right
  space: boolean;    // handbrake
  shift: boolean;    // nitro
}
// Sent at 20Hz, ~6 bytes per message
```

### Event Messages (Server → Client)

Ephemeral events that don't need to be in state (fire-and-forget):

```typescript
// Collision effects (particles, sounds, floating text)
{ type: "collision", x, y, impact, carA, carB }

// Kill notification
{ type: "kill", killer, victim, callout }

// Power-up collected
{ type: "powerup", carIndex, powerUpType }

// Explosion
{ type: "explosion", x, y, color }

// Floating text (callouts, damage numbers)
{ type: "floatText", x, y, text, color, bubble, bubbleColor }
```

These are broadcast via `room.broadcast()` — not part of state sync.

### Bandwidth Estimate

Per player per second (at 20 tick/sec):
- **Incoming** (input): ~120 bytes/sec
- **Outgoing** (state deltas): ~2-4 KB/sec (Colyseus delta encoding is very efficient)
- **Events**: ~0.5-1 KB/sec (collisions, effects)
- **Total:** ~5 KB/sec per player, ~40 KB/sec per room with 8 players

---

## Room Lifecycle

```
1. Player clicks "ONLINE" → client connects to Colyseus
2. Colyseus matchmaker finds room with space or creates new one
3. Player joins GameRoom in "lobby" phase:
   ├── See other players' cars, names, colors
   ├── Chat with other players
   ├── Pick car type and color
   ├── Vote on map/mode (optional)
   ├── Auto-countdown starts when MIN_PLAYERS reached (30s)
   ├── All players "READY" → countdown shortens to 5s
   └── Remaining slots filled with AI bots
4. Phase → "countdown" (3-2-1-GO)
5. Phase → "playing":
   ├── Server receives inputs from connected players
   ├── Server runs bot AI for empty slots
   ├── Server computes physics, collisions, damage
   ├── Colyseus auto-syncs state to all clients
   └── Server broadcasts collision/effect events
6. Win condition met → phase → "gameover"
7. Results displayed (10s), stats saved to DB
8. Room disposes, players auto-matched into next room
```

### Room Settings

```
MIN_PLAYERS = 3          // to start lobby countdown
MAX_PLAYERS = 8          // per room
BOT_FILL = true          // fill empty slots with AI
LOBBY_COUNTDOWN = 30     // seconds after min players reached
RECONNECT_WINDOW = 30    // seconds to reconnect after disconnect
```

---

## Server-Side Physics

### What moves to the server

The server runs the core simulation loop. These files port to TypeScript:

| Client File | Server Equivalent | Notes |
|---|---|---|
| `config.js` | `config.ts` | Direct port — constants only |
| `physics.js` | `physics.ts` | `moveCar()`, `checkCollisions()`, `getSurface()`, `applyFriction()` |
| `ai.js` | `ai.ts` | Bot behavior for empty slots |
| `car-factory.js` | `car-factory.ts` | `createCar()` — server-side car creation |
| `powerups.js` | `powerups.ts` | Spawn logic, collision detection |
| `modes.js` | `modes.ts` | Win conditions, mode-specific update |
| `maps.js` | `maps.ts` | Map data (arena size, obstacles, roads) |
| `scoring.js` | `scoring.ts` | Kill tracking, score calc |
| `utils.js` | `utils.ts` | `clamp()`, `lerp()`, `angleDiff()` |

### What stays client-only

- `renderer.js` — all Canvas drawing
- `hud.js` — HUD rendering
- `ui.js` — menus, UI
- `particles.js` — visual effects
- `audio.js` — sound effects
- `terrain.js` — visual terrain (server only needs surface data from map config)
- `intro.js` — intro animation

### Server Game Loop

```typescript
// Inside GameRoom
onUpdate(deltaTime: number) {
  if (this.state.phase !== "playing") return;

  this.state.gameTime += deltaTime / 1000;

  // Apply buffered inputs to player cars
  for (const [sessionId, input] of this.playerInputs) {
    const car = this.getCarBySession(sessionId);
    if (car) applyInput(car, input);
  }

  // Update AI bots
  for (const car of this.state.cars) {
    if (car.isBot) updateAI(car, deltaTime / 1000);
  }

  // Physics step
  for (const car of this.state.cars) {
    moveCar(car);  // reused from physics.js
  }
  checkCollisions();  // reused — broadcasts collision events
  updatePowerUps();

  // Check win
  if (this.activeMode.checkWin()) {
    this.state.phase = "gameover";
    this.saveMatchResults(); // write to DB
    this.broadcastResults();
    this.autoDispose = true;
    this.autoDisposeTimeout = 10000; // 10s to view results
  }
}
```

---

## Client-Side Changes

### Network Layer (new file: `network.js`)

```javascript
var room = null;
var colyseusClient = null;

function connectToServer(serverUrl) {
  colyseusClient = new Colyseus.Client(serverUrl);
}

function joinMatchmaking(playerName, carType, color) {
  colyseusClient.joinOrCreate("game", {
    name: playerName,
    carType: carType,
    color: color
  }).then(function(r) {
    room = r;
    setupRoomListeners(room);
  });
}

function setupRoomListeners(room) {
  // State changes auto-sync via Colyseus
  room.state.cars.onAdd((car, index) => { /* add car to local array */ });
  room.state.cars.onChange((car, index) => { /* update local car */ });
  room.state.cars.onRemove((car, index) => { /* remove car */ });

  // Phase changes
  room.state.listen("phase", (phase) => {
    if (phase === "countdown") startCountdown();
    if (phase === "playing") startPlaying();
    if (phase === "gameover") showResults();
  });

  // One-shot events
  room.onMessage("collision", (data) => {
    spawnSparks(data.x, data.y, data.impact);
    playSfxThrottled(data.impact > 4 ? 'hit' : 'bump', 100);
  });
  room.onMessage("explosion", (data) => {
    spawnExplosion(data.x, data.y, data.color);
    playSfx('explode');
  });
  room.onMessage("floatText", (data) => {
    floatingTexts.push(data);
  });

  // Lobby chat
  room.state.chat.onAdd((msg) => { appendChatMessage(msg); });
}

// Send inputs at 20Hz (not every frame)
var inputSendInterval = null;
function startSendingInputs() {
  inputSendInterval = setInterval(function() {
    if (!room) return;
    room.send("input", {
      up: !!keys['ArrowUp'] || !!keys['KeyW'],
      down: !!keys['ArrowDown'] || !!keys['KeyS'],
      left: !!keys['ArrowLeft'] || !!keys['KeyA'],
      right: !!keys['ArrowRight'] || !!keys['KeyD'],
      space: !!keys['Space'],
      shift: !!keys['ShiftLeft'] || !!keys['ShiftRight']
    });
  }, 50); // 20Hz
}

function sendChat(text) {
  if (room) room.send("chat", { text: text });
}
```

### Client-Side Interpolation

The client receives car positions at 20Hz but renders at 60fps. Need smooth interpolation:

```javascript
// Store two most recent server snapshots per car
// Each frame, lerp between previous and current based on elapsed time
var SERVER_TICK_MS = 50; // 20Hz

function interpolateCar(car) {
  var t = (performance.now() - car.lastUpdateTime) / SERVER_TICK_MS;
  t = Math.min(t, 1);
  car.renderX = lerp(car.prevX, car.x, t);
  car.renderY = lerp(car.prevY, car.y, t);
  car.renderAngle = lerpAngle(car.prevAngle, car.angle, t);
}
```

### Rendering Changes

Minimal — the renderer reads from interpolated positions instead of direct car state:
- In online mode, `drawCar()` uses `car.renderX`/`car.renderY` instead of `car.x`/`car.y`
- All visual effects (particles, sparks, floating text) triggered by server events instead of local physics
- HUD shows ping indicator
- Full-screen view (no split-screen) — camera follows your own car

### Mode Switch

```javascript
// gameMode gains a third value
var gameMode = 'single' | 'multi' | 'online';

// In game loop, skip local physics when online
if (gameMode !== 'online') {
  // existing local physics
} else {
  // just interpolate from server state
  for (var i = 0; i < cars.length; i++) interpolateCar(cars[i]);
  // visual-only updates still run locally
  updateFX();
}
```

---

## Lobby & Matchmaking

### Flow

```
┌─────────────────┐
│   Main Menu     │
│  "ONLINE" card  │──── click ────►  Connect to Colyseus server
└─────────────────┘                          │
                                             ▼
                                  ┌─────────────────────┐
                                  │   Matchmaker Queue   │
                                  │   "Finding game..."  │
                                  │   (1-3 seconds)      │
                                  └──────────┬──────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              ▼                             ▼
                     Room has space?                  Create new room
                     Join existing room               Wait for players
                              │                             │
                              └──────────────┬──────────────┘
                                             ▼
                                  ┌─────────────────────┐
                                  │      LOBBY PHASE     │
                                  │                      │
                                  │  Players: 4/8        │
                                  │  ┌────┐ ┌────┐       │
                                  │  │car1│ │car2│ ...    │
                                  │  └────┘ └────┘       │
                                  │                      │
                                  │  [Chat box]          │
                                  │  "yo ready?"         │
                                  │  "lets gooo"         │
                                  │                      │
                                  │  Mode: NORMAL ▼      │
                                  │  Map: vote/random    │
                                  │                      │
                                  │  Starting in: 24s    │
                                  │  [READY] ← button    │
                                  └──────────┬──────────┘
                                             │
                                    countdown hits 0
                                   (or all players ready)
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │   GAME (playing)     │
                                  └──────────┬──────────┘
                                             │
                                          gameover
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │   RESULTS (10s)      │
                                  │   [PLAY AGAIN]       │
                                  └──────────┬──────────┘
                                             │
                                    auto-join next room
```

### Chat System

Simple text chat via Colyseus room messages:

```typescript
// Server — inside GameRoom
onMessage(client, "chat", (message) => {
  if (this.state.phase !== "lobby") return; // chat only in lobby (or always?)
  const text = sanitize(message.text).substring(0, 100);
  const player = this.getPlayer(client.sessionId);

  // Rate limit: 1 message per second
  if (Date.now() - player.lastChatTime < 1000) return;
  player.lastChatTime = Date.now();

  const msg = new ChatMessage();
  msg.name = player.name;
  msg.text = text;
  msg.color = player.color;
  msg.timestamp = Date.now();
  this.state.chat.push(msg);

  // Keep last 50 messages
  while (this.state.chat.length > 50) this.state.chat.shift();
});
```

Client renders chat as overlay in lobby screen and as a small collapsible overlay during gameplay.

---

## Disconnection Handling

| Scenario | Action |
|---|---|
| Player disconnects in lobby | Remove from room, update player count |
| Player disconnects in-game | Replace with AI bot, reserve slot for 30s reconnect |
| Player reconnects within 30s | Restore control of their car (same position/health) |
| Player reconnects after 30s | Join as new player in next room |
| Room crashes | Colyseus auto-disposes, players see error → back to matchmaker |

Colyseus has built-in `allowReconnection(client, seconds)` for this.

---

## REST API (Express, same server)

Colyseus runs on Express.js. Add REST routes directly:

```typescript
// In server index.ts
const app = express();
const gameServer = new Server({ transport: new WebSocketTransport({ server: createServer(app) }) });

// REST endpoints on the same Express app
app.post("/api/auth/guest", guestAuthHandler);       // → { token, guestId }
app.post("/api/auth/register", registerHandler);      // Phase 2
app.post("/api/auth/login", loginHandler);            // Phase 2
app.get("/api/leaderboard/:mode", leaderboardHandler);// top 100
app.get("/api/profile/:id", profileHandler);          // Phase 2
app.get("/api/stats/online", () => ({                 // live player count
  rooms: gameServer.matchMaker.stats.local,
  players: totalConnected
}));

// Static file serving for the game client
app.use(express.static("../game"));
```

### Database Schema (PostgreSQL via Prisma)

```prisma
model MatchResult {
  id         Int      @id @default(autoincrement())
  matchId    String   @db.Uuid
  playerName String   @db.VarChar(20)
  guestId    String?  @db.Uuid
  userId     Int?
  mode       String   @db.VarChar(20)
  map        String   @db.VarChar(20)
  score      Int
  kills      Int
  deaths     Int
  damage     Int
  carType    String   @db.VarChar(20)
  duration   Float
  placement  Int
  createdAt  DateTime @default(now())

  user       User?    @relation(fields: [userId], references: [id])
}

model User {
  id            Int      @id @default(autoincrement())
  username      String   @unique @db.VarChar(20)
  email         String?  @unique @db.VarChar(100)
  oauthProvider String?  @db.VarChar(20)
  oauthId       String?  @db.VarChar(100)
  elo           Int      @default(1000)
  totalKills    Int      @default(0)
  totalWins     Int      @default(0)
  createdAt     DateTime @default(now())
  matches       MatchResult[]
}
```

---

## Deployment

### Development (local)

```yaml
# docker-compose.yml
services:
  server:
    build: ./server
    ports:
      - "2567:2567"    # Colyseus WebSocket + Express API + static files
    depends_on: [postgres]
    environment:
      DATABASE_URL: postgresql://user:pass@postgres/legenderby
    volumes:
      - ./game:/app/public  # serve game client

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: legenderby
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes: ["pgdata:/var/lib/postgresql/data"]
    ports: ["5432:5432"]

volumes:
  pgdata:
```

Or even simpler for dev: just `npm run dev` with SQLite instead of Postgres.

### Production

**Single VPS — handles everything:**
- 1 VPS ($10-20/mo, Hetzner/DigitalOcean)
- Colyseus server (game rooms + REST API + static files)
- PostgreSQL (on same VPS, or managed DB for $5-15/mo)
- Nginx reverse proxy + SSL (Let's Encrypt)
- Process manager: PM2 or systemd
- Handles ~50 concurrent rooms (~400 players)

**Scaling path (when needed):**
1. Single VPS (0-500 concurrent players)
2. Managed Postgres + bigger VPS (500-2000)
3. Multiple Colyseus instances + load balancer (2000-5000)
4. Multi-region with closest-server routing (5000+)

---

## Implementation Phases

### Phase 1 — MVP (target: playable online)
- [ ] Colyseus server project setup (TypeScript, Prisma, Express)
- [ ] Port physics/collision/AI to server-side TypeScript
- [ ] GameRoom with state schema and input handling
- [ ] Room phases: lobby → countdown → playing → gameover
- [ ] Basic matchmaking (joinOrCreate)
- [ ] Client network layer (`network.js`)
- [ ] Client-side interpolation
- [ ] Lobby screen with player list and countdown
- [ ] Bot backfill for empty slots
- [ ] Disconnection → bot replacement
- [ ] Static file serving (game client)
- [ ] Deploy to single VPS

### Phase 2 — Polish
- [ ] Lobby chat
- [ ] Map/mode voting in lobby
- [ ] Reconnection support (30s window)
- [ ] Ping display in HUD
- [ ] Kill feed overlay during game
- [ ] Guest stats tracking (match results saved to DB)
- [ ] Basic leaderboard page (top 100 per mode)
- [ ] "Players online" counter on menu

### Phase 3 — Accounts & Progression
- [ ] User registration (Google/Discord OAuth)
- [ ] Persistent profiles with stats
- [ ] Global leaderboard with ELO
- [ ] Match history
- [ ] Player levels / XP
- [ ] Unlockable car colors/cosmetics

### Phase 4 — Scale & Compete
- [ ] Ranked matchmaking (ELO-based)
- [ ] Anti-cheat validation layer
- [ ] Multi-region servers
- [ ] Seasons / resets
- [ ] Spectator mode
- [ ] Replay system

---

## Key Technical Challenges

### 1. Latency & Feel
Players will have 30-150ms latency. The game must feel responsive despite this.
- **Client-side prediction:** Apply own inputs immediately, reconcile with server
- **Entity interpolation:** Smooth other cars between server snapshots
- **Input delay hiding:** Local car responds instantly, server corrects if wrong

### 2. Physics Determinism
JavaScript floating point is deterministic on the same engine, but not across engines. Since server runs authoritative physics, small client-side prediction drift is acceptable — server state always wins.

### 3. Bandwidth Optimization
- Colyseus schema delta encoding handles this well
- Only sync what changes (health doesn't change every tick)
- Visual-only data (particles, skid marks) stays client-side
- Compression: Colyseus uses binary encoding, not JSON

### 4. Collision Events vs State
- Car positions/health = **state** (synced automatically by Colyseus)
- Sparks/explosions/floating text/sounds = **events** (broadcast separately)
- This split keeps state small and events fire-and-forget

---

## File Structure

```
LegendaryGame/
├── game/                    # existing client (mostly unchanged)
│   ├── js/
│   │   ├── network.js       # NEW — Colyseus client, matchmaking, chat
│   │   ├── interpolation.js # NEW — client-side position interpolation
│   │   └── ... existing files
│   └── index.html           # add colyseus.js client SDK script
│
├── server/                  # NEW — Colyseus server (everything)
│   ├── src/
│   │   ├── index.ts         # entry: Colyseus + Express + static serving
│   │   ├── rooms/
│   │   │   └── GameRoom.ts  # room lifecycle, lobby/game phases
│   │   ├── schema/
│   │   │   └── GameState.ts # Colyseus state schemas
│   │   ├── game/            # ported from client JS
│   │   │   ├── physics.ts
│   │   │   ├── ai.ts
│   │   │   ├── config.ts
│   │   │   ├── modes.ts
│   │   │   ├── maps.ts
│   │   │   ├── cars.ts
│   │   │   ├── scoring.ts
│   │   │   └── powerups.ts
│   │   ├── api/             # REST routes
│   │   │   ├── auth.ts
│   │   │   ├── leaderboard.ts
│   │   │   └── stats.ts
│   │   └── utils/
│   │       └── math.ts      # clamp, lerp, angleDiff
│   ├── prisma/
│   │   └── schema.prisma    # database schema
│   ├── package.json         # ~4 dependencies
│   ├── tsconfig.json
│   └── Dockerfile
│
├── docker-compose.yml       # server + postgres (that's it)
└── ONLINE-MULTIPLAYER.md    # this file
```
