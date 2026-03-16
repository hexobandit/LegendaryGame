// ================================================================
//  MAP EDITOR — Mutable state
// ================================================================

// Core map data
var editorMap = null;       // cloned from DEFAULT_MAP on init
var editorObjects = [];     // placed objects [{_id, type, x, y, r, ...}]
var editorSurfaces = [];    // surface zones [{_id, type, x, y, r, ...}]

var nextId = 1;
function newId() { return nextId++; }

// View / camera
var view = {
    panX: 0,
    panY: 0,
    zoom: 0.25,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    panStartPanX: 0,
    panStartPanY: 0,
};

// Canvas
var editorCanvas = null;
var editorCtx = null;

// Tools
var activeTool = 'select';
var activeObjectType = 'boulder';
var activeSurfaceType = 'water';
var brushRadius = 40;
var roadDefaultWidth = 120;

// Selection
var selection = [];         // array of _id values
var hoverTarget = null;     // { type:'object'|'surface'|'road'|'waypoint', id, index? }
var dragState = null;       // { type, startWX, startWY, objects?, offsetsX?, offsetsY? }
var selectBoxStart = null;  // { wx, wy } for drag-select box
var selectBoxEnd = null;

// Road drawing
var roadDrawState = null;   // { points:[], isDrawing:true, width, color, edgeColor, centerColor, surface }

// Wall drawing
var wallDrawState = null;   // { x1, y1, isDrawing:true }

// Grid / Snap
var showGrid = false;
var snapToGridEnabled = false;
var gridSize = DEFAULT_GRID_SIZE;

// Dirty flag
var isDirty = false;

// Render request
var renderRequested = false;

// Space key held for pan
var spaceHeld = false;

// Mouse state
var mouseWX = 0, mouseWY = 0; // world coords
var mouseSX = 0, mouseSY = 0; // screen coords
