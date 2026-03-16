# Map Editor — Implementation Plan

## Overview

Standalone in-browser map editor for creating game maps visually. Developer-only tool, not shipped with the game. Draw roads, place objects, paint surfaces, configure settings — then export a `MAPS[]` entry to paste into `maps.js`.

**Location:** `tools/map-editor/` (separate from `game/`)

**Stack:** Single HTML file + JS + CSS. Zero dependencies. Same philosophy as the game itself.

---

## Core Workflow

```
Open editor → Set arena size & colors → Draw roads → Place objects →
Paint surfaces → Configure spawns → Test preview → Export → Paste into maps.js
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                            │
│  [Select] [Move] [Road] [Object ▼] [Surface ▼] [Eraser] [Spawn]   │
│  ──────────────────────────────────────────────────────────────────  │
│  Zoom: [−][+][Fit]  Grid: [ON/OFF]  Snap: [ON/OFF]  Undo/Redo     │
├────────────┬────────────────────────────────────────┬───────────────┤
│            │                                        │               │
│  OBJECTS   │                                        │  PROPERTIES   │
│  PANEL     │          CANVAS                        │  PANEL        │
│            │       (pan & zoom)                     │               │
│  ┌──────┐  │                                        │  Selected:    │
│  │Rocks │  │     ┌─────────────────────┐            │  Rock #3      │
│  │Trees │  │     │                     │            │               │
│  │Barrels│  │     │    Map Preview      │            │  x: 1200     │
│  │Crates│  │     │    (arena view)      │            │  y: 800      │
│  │Tires │  │     │                     │            │  radius: 35  │
│  │Hay   │  │     │                     │            │               │
│  │Ramps │  │     │                     │            │  [Delete]     │
│  │Bushes│  │     │                     │            │               │
│  │Walls │  │     └─────────────────────┘            │               │
│  │Palms │  │                                        │               │
│  └──────┘  │                                        │               │
│            │                                        │               │
│  SURFACES  │                                        │  MAP SETTINGS │
│  ┌──────┐  │                                        │  ┌───────────┐│
│  │Water │  │                                        │  │Name       ││
│  │Mud   │  │                                        │  │ID         ││
│  │Oil   │  │                                        │  │Arena W/H  ││
│  │Ice   │  │                                        │  │BG Color   ││
│  │Sand  │  │                                        │  │Road Color ││
│  │Dirt  │  │                                        │  │Spawn X/Y  ││
│  │Grass │  │                                        │  │Surface Def││
│  └──────┘  │                                        │  └───────────┘│
│            │                                        │               │
├────────────┴────────────────────────────────────────┴───────────────┤
│  STATUS BAR                                                         │
│  Mouse: (1234, 567)  Objects: 47  Surface zones: 12  │ [EXPORT]    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tools

### 1. Select / Move Tool
- Click to select object — shows properties in right panel
- Drag to move selected object
- Multi-select with Shift+click or drag box
- Delete key removes selected
- Arrow keys nudge selected (1px, or 10px with Shift)

### 2. Road Tool

**Curvy Roads (primary):**
- Click to place waypoints — line segments drawn between them
- Double-click or Enter to finish road
- Select finished road to:
  - Drag individual waypoints
  - Set road width (slider, default 60)
  - Set road color, edge color, center line color
  - Set surface type (tarmac, dirt, etc.)
  - Add/remove waypoints (click on segment to split)
  - Toggle closed loop (for race tracks)

**Radial Roads (secondary):**
- Button to add radial road config
- Properties panel: center, radius, road count, road width, road length, start angle
- Visual preview of spokes radiating from center
- Only one radial config per map

### 3. Object Tool (dropdown for type)

Click on canvas to place. Each type has specific properties:

| Object | Visual in Editor | Properties |
|--------|-----------------|------------|
| **Rock** | Gray circle | x, y, radius (20-60) |
| **Tree** | Green circle + brown dot | x, y, radius (15-40) |
| **Pillar** | Dark circle | x, y, radius (15-30) |
| **Barrel** | Red-orange circle | x, y (fixed r=12) |
| **Crate** | Brown square | x, y (fixed r=15) |
| **Tire Stack** | Dark gray circle | x, y (fixed r=14) |
| **Hay Bale** | Yellow rectangle | x, y (fixed r=16) |
| **Container** | Blue rectangle | x, y (fixed r=25) |
| **Bush** | Light green circle | x, y, radius (15-40) |
| **Bump** | Dotted circle | x, y, radius (10-30) |
| **Ramp** | Arrow rectangle | x, y, width, height, angle |
| **Palm Tree** | Green star + brown line | x, y, height (for frond rendering) |
| **Wall** | Thick line segment | x1, y1, x2, y2 |

**Placement modes:**
- Single click: place one
- Hold Shift + drag: scatter multiple (random offsets within brush radius)
- Right-click drag: quick-delete objects under cursor

### 4. Surface Paint Tool (dropdown for type)

Paint circular zones onto the map:

| Surface | Editor Color | Game Effect |
|---------|-------------|-------------|
| **Water** | Blue (#6ac8ff) | Low grip, splash particles |
| **Mud** | Brown (#3d2b1a) | Very low grip, mud particles |
| **Oil** | Purple-black (#2a1a2a) | Near-zero grip, spin out |
| **Ice** | Cyan (#aaeeff) | Minimal friction, sliding |
| **Sand** | Tan (#d4a854) | High friction slowdown |
| **Dirt** | Brown (#8a7a55) | Medium grip, dust |
| **Grass** | Green (#4a8a2a) | Default terrain, lower grip |

- Click to place a circle (adjustable radius via scroll wheel or slider)
- Drag to paint (stamp circles along path)
- Oil slicks are ellipses — drag to set orientation and size

### 5. Eraser Tool
- Click or drag over objects/surfaces to delete them
- Adjustable radius

### 6. Spawn Point Tool
- Click to set player spawn center (shown as pink crosshair)
- Drag radius for spawn spread area
- Small dots show where cars would approximately spawn

---

## Canvas Behavior

### Pan & Zoom
- **Pan:** Middle-click drag, or Space + left-click drag
- **Zoom:** Scroll wheel (centered on cursor), or +/- keys
- **Fit:** Double-click empty space or press Home to fit arena in view

### Grid
- Toggle grid overlay (50px, 100px, or custom)
- Snap to grid when enabled (hold Alt to temporarily disable snap)

### Visual Rendering
The editor canvas should look close to the actual game:
- Arena background color from map settings
- Roads rendered with proper width, color, edge lines
- Objects rendered as simplified versions of game objects (circles, rectangles)
- Surface zones shown as semi-transparent colored overlays
- Spawn area shown with crosshair + radius circle
- Objects outside arena bounds shown with red tint warning

### Coordinate Display
- Mouse position in world coordinates always shown in status bar
- Selected object coordinates shown in properties panel
- Arena bounds shown as thick border

---

## Map Settings Panel

```
┌─────────────────────────────┐
│ MAP SETTINGS                │
├─────────────────────────────┤
│ Name:    [Junkyard        ] │
│ ID:      [junkyard        ] │ ← auto-generated from name, editable
│                             │
│ Arena Width:  [4000      ]  │
│ Arena Height: [4000      ]  │
│                             │
│ BG Color:     [#3a4a2a] 🎨  │ ← color picker
│ Road Color:   [#555555] 🎨  │
│ Edge Color:   [#333333] 🎨  │
│ Center Color: [#666666] 🎨  │
│                             │
│ Surface Default: [grass ▼]  │ ← dropdown
│ Road Layout:     [curvy ▼]  │ ← none / radial / curvy
│                             │
│ Spawn Center X: [2000    ]  │
│ Spawn Center Y: [2000    ]  │
│ Spawn Radius:   [300     ]  │
│                             │
│ Description:                │
│ [Wrecked cars and debris  ] │
│                             │
│ ┌─────────────────────────┐ │
│ │ SURFACE FRICTION        │ │
│ │ (override defaults)     │ │
│ │ grassFriction: [    ]   │ │
│ │ grassGrip:     [    ]   │ │
│ │ tarmacFriction:[    ]   │ │
│ │ ...                     │ │
│ └─────────────────────────┘ │
│                             │
│ Race Track Settings:        │
│ ☐ Has track waypoints       │ │ ← checkbox, shows waypoint tool
│ Total laps: [3]             │
└─────────────────────────────┘
```

---

## Import / Export

### Export Format

The Export button generates a complete `MAPS[]` entry — ready to copy-paste into `maps.js`:

```javascript
{
    id: 'junkyard',
    name: 'Junkyard',
    description: 'Wrecked cars and debris everywhere',
    arenaWidth: 4000,
    arenaHeight: 4000,
    bgColor: '#3a4a2a',
    surfaceDefault: 'grass',
    roadLayout: 'curvy',

    curvyRoads: [
        {
            points: [{x:500,y:2000},{x:1200,y:1800},{x:2000,y:2000},{x:2800,y:2200},{x:3500,y:2000}],
            width: 70,
            color: '#555',
            edgeColor: '#333',
            centerColor: '#666',
            surface: 'tarmac'
        },
        // ... more roads
    ],

    // OR radial roads:
    // radialRoads: {
    //     centerRadius: 520,
    //     roadCount: 4,
    //     roadWidth: 52,
    //     roadLength: 1820,
    //     startAngle: 0.785
    // },

    spawnCenterX: 2000,
    spawnCenterY: 2000,
    spawnRadius: 300,

    terrain: {
        obstacles: [
            {x:800, y:600, r:35},
            {x:1500, y:900, r:28},
            // ...
        ],
        breakables: [
            {x:1200, y:700, type:'barrel'},
            {x:1800, y:1100, type:'crate'},
            {x:2200, y:800, type:'tire_stack'},
            {x:900, y:1500, type:'hay'},
            {x:2600, y:1300, type:'container'},
            // ...
        ],
        bushes: [
            {x:400, y:400, r:25},
            // ...
        ],
        bumps: [
            {x:1600, y:1200, r:15},
            // ...
        ],
        ramps: [
            {x:2000, y:1000, w:60, h:30, angle:0.5},
            // ...
        ],
        walls: [
            {x1:100, y1:100, x2:100, y2:3900},
            // ...
        ],
        palmTrees: [
            {x:300, y:300, height:80},
            // ...
        ],
        waterPuddles: [
            {x:1000, y:2500, r:60},
            // ...
        ],
        mudPatches: [
            {x:2500, y:1500, r:80},
            // ...
        ],
        oilSlicks: [
            {x:1800, y:2200, rx:40, ry:20, angle:0.3},
            // ...
        ],
        icePatches: [
            {x:3000, y:3000, r:50},
            // ...
        ],
        sandTraps: [
            {x:500, y:3500, r:70},
            // ...
        ],
        dirtPatches: [
            {x:2000, y:3000, r:100},
            // ...
        ],
        grassPatches: [
            {x:1500, y:500, r:120},
            // ...
        ]
    },

    surfaceFriction: {
        // only included if overrides were set
        grassGrip: 0.85
    }
}
```

### Export UI

```
┌─────────────────────────────────────────┐
│  EXPORT MAP                             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ // Paste into MAPS[] in maps.js │    │
│  │ {                               │    │
│  │     id: 'junkyard',             │    │
│  │     name: 'Junkyard',           │    │
│  │     ...                         │    │
│  │ }                               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [COPY TO CLIPBOARD]  [DOWNLOAD .json]  │
└─────────────────────────────────────────┘
```

Two export options:
- **Copy to Clipboard** — paste directly into `maps.js` inside the `MAPS[]` array
- **Download .json** — save as file for backup / version control

### Import

Load an existing map for editing:

- **From maps.js** — dropdown of existing map IDs, reads from game's MAPS array
- **From JSON file** — drag & drop or file picker
- **From clipboard** — paste button

The editor parses the MAPS entry and populates the canvas with all objects, roads, and surfaces.

---

## Save / Load (Work in Progress)

Maps in progress saved to **localStorage**:

```
Key: mapeditor_autosave
Key: mapeditor_saves_{mapId}
```

- **Autosave** every 30 seconds
- **Manual save** slots (name + timestamp)
- **Load** from dropdown of saved maps
- Warning before closing tab with unsaved changes (`beforeunload`)

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `R` | Road tool |
| `O` | Object tool |
| `S` | Surface paint tool |
| `E` | Eraser |
| `P` | Spawn point |
| `G` | Toggle grid |
| `N` | Toggle snap |
| `Delete` / `Backspace` | Delete selected |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+S` | Save to localStorage |
| `Ctrl+E` | Export |
| `Ctrl+D` | Duplicate selected |
| `Ctrl+A` | Select all |
| `Space + drag` | Pan canvas |
| `Scroll` | Zoom |
| `Home` | Fit to arena |
| `[` / `]` | Decrease / increase brush/object size |
| `Arrow keys` | Nudge selected (1px) |
| `Shift + arrows` | Nudge selected (10px) |
| `R` (with object selected) | Rotate 15° |
| `Escape` | Deselect / cancel current operation |

---

## Undo / Redo

Every action that modifies the map state pushes to an undo stack:
- Place object
- Move object
- Delete object
- Change property
- Add/move road waypoint
- Paint/erase surface
- Change map settings

Stack limit: 100 actions. Each entry stores the minimal diff (not full state snapshots).

---

## Testing Preview

**Quick test** button in the editor:
- Opens the game in a new tab/iframe with the current map loaded
- Passes map data via `localStorage` or URL hash
- Game reads `testMap` from localStorage and uses it instead of `MAPS[]`
- Spawns player + a few AI bots for quick testing
- Close/return to editor to keep editing

```javascript
// In map editor — on "Test" button click:
localStorage.setItem('mapeditor_testmap', JSON.stringify(exportedMap));
window.open('../game/index.html?testmap=1', '_blank');

// In game (game.js or ui.js) — check for test mode:
if (new URLSearchParams(location.search).get('testmap')) {
    var testMap = JSON.parse(localStorage.getItem('mapeditor_testmap'));
    if (testMap) MAPS.push(testMap);
    selectedMap = testMap.id;
}
```

---

## Implementation Plan

### Phase 1 — Core Editor
- [ ] HTML/CSS layout (toolbar, canvas, side panels)
- [ ] Canvas with pan/zoom (mouse wheel, middle-click drag)
- [ ] Arena rectangle rendering with background color
- [ ] Select tool (click to select, drag to move, properties panel)
- [ ] Object placement (click to place circles/rects on canvas)
- [ ] All object types: rocks, trees, barrels, crates, tires, hay, containers, bushes, bumps, ramps, palms
- [ ] Delete selected (Delete key)
- [ ] Properties panel (edit x, y, radius, angle, type)
- [ ] Map settings panel (name, id, arena size, colors)
- [ ] Export to MAPS[] format (copy to clipboard)
- [ ] Undo / redo

### Phase 2 — Roads & Surfaces
- [ ] Curvy road tool (click waypoints, double-click to finish)
- [ ] Road editing (drag waypoints, set width/colors)
- [ ] Radial road config (center, spokes, width, length)
- [ ] Surface paint tool (click/drag to place circles)
- [ ] Oil slick tool (drag for ellipse orientation)
- [ ] Semi-transparent surface overlays on canvas
- [ ] Surface friction override inputs

### Phase 3 — Polish
- [ ] Grid overlay + snap to grid
- [ ] Multi-select (Shift+click, drag box)
- [ ] Duplicate objects (Ctrl+D)
- [ ] Scatter placement (Shift+drag for random cluster)
- [ ] Keyboard shortcuts
- [ ] Autosave to localStorage
- [ ] Manual save/load slots
- [ ] Import from JSON / clipboard
- [ ] Import existing maps from MAPS[] array
- [ ] Wall tool (click two points for line segment)
- [ ] Spawn point tool with radius visualization

### Phase 4 — Testing & Advanced
- [ ] Quick test button (opens game with current map)
- [ ] Race track waypoint editing (for racing mode)
- [ ] Minimap in corner of editor
- [ ] Object count / stats in status bar
- [ ] Copy/paste groups of objects
- [ ] Mirror/flip selection
- [ ] Rotation of selection group
- [ ] Zoom to selection

---

## File Structure

```
tools/
└── map-editor/
    ├── index.html          # single-page editor (HTML + inline CSS + JS)
    ├── editor.js           # main editor logic (canvas, tools, state)
    ├── tools.js            # individual tool implementations
    ├── export.js           # MAPS[] format serializer
    ├── import.js           # parser for existing maps
    ├── ui.js               # panels, dialogs, property editors
    ├── render.js           # canvas rendering (objects, roads, surfaces, grid)
    ├── history.js          # undo/redo stack
    └── style.css           # editor styles (dark theme matching game)
```

Or if keeping it simpler — just `index.html` with everything inline, same as the game's zero-dependency approach. Can always split later.

---

## Visual Style

Dark theme matching the game's UI aesthetic:
- Background: `#1a1a1a`
- Panels: `#222` with `#333` borders
- Text: `#ccc`
- Active tool highlight: `#ffaa00` (gold, matching game accent)
- Selected object: `#ff6eb4` outline (pink, matching player color)
- Hover: `#444` background on buttons

---

## How It Connects to the Game

The editor is completely decoupled from the game. The only connection:

1. Editor exports a JavaScript object literal
2. Developer copies it into `MAPS[]` in `game/js/maps.js`
3. Game reads `MAPS[]` as it always has — no changes to game code needed

For the test-preview feature, the editor temporarily writes to `localStorage` and the game checks for a `?testmap=1` URL parameter. This test path can be removed for production builds or just left in (it's harmless — only activates with the URL param).
