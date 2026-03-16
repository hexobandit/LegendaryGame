// ================================================================
//  MAP EDITOR — Constants & object/surface type definitions
// ================================================================

var EDITOR_VERSION = '1.0';

// Object type definitions — drives palette, placement, rendering, and export
var OBJECT_TYPES = {
    boulder:    { category: 'obstacle', label: 'Rock',        defaultR: 25, minR: 16, maxR: 60, color: '#8a7a6a', shape: 'circle' },
    pillar:     { category: 'obstacle', label: 'Pillar',      defaultR: 22, minR: 15, maxR: 30, color: '#777',    shape: 'circle' },
    palm_tree:  { category: 'palm',     label: 'Palm Tree',   defaultR: 7,  minR: 5,  maxR: 10, color: '#8a6a3a', shape: 'palm' },
    barrel:     { category: 'breakable',label: 'Barrel',      fixedR: 15,   color: '#c33',    shape: 'circle' },
    crate:      { category: 'breakable',label: 'Crate',       fixedR: 14,   color: '#8a6a3a', shape: 'square' },
    tire_stack: { category: 'breakable',label: 'Tire Stack',  fixedR: 16,   color: '#333',    shape: 'circle' },
    hay:        { category: 'breakable',label: 'Hay Bale',    fixedR: 17,   color: '#c8a040', shape: 'circle' },
    container:  { category: 'breakable',label: 'Container',   fixedR: 28,   color: '#2266aa', shape: 'rect', w: 56, h: 28 },
    trolley:    { category: 'breakable',label: 'Trolley',     fixedR: 12,   color: '#999',    shape: 'rect', w: 16, h: 10 },
    bin:        { category: 'breakable',label: 'Bin',         fixedR: 14,   color: '#454',    shape: 'circle' },
    pallet:     { category: 'breakable',label: 'Pallet',      fixedR: 16,   color: '#6a5030', shape: 'rect', w: 28, h: 20 },
    bench:      { category: 'breakable',label: 'Bench',       fixedR: 14,   color: '#8a6a3a', shape: 'rect', w: 32, h: 12 },
    bush:       { category: 'bush',     label: 'Bush',        defaultR: 25, minR: 15, maxR: 40, color: '#3a7a1a', shape: 'bush' },
    bump:       { category: 'bump',     label: 'Speed Bump',  defaultR: 15, minR: 10, maxR: 30, color: '#c8b432', shape: 'bump' },
    ramp:       { category: 'ramp',     label: 'Ramp',        color: '#a08860', shape: 'ramp', defaultW: 130, defaultH: 65 },
    wall:       { category: 'wall',     label: 'Wall',        color: '#666',    shape: 'line' },
};

// Grouped for the palette
var OBJECT_PALETTE = [
    { header: 'OBSTACLES' },
    'boulder', 'pillar', 'palm_tree',
    { header: 'BREAKABLES' },
    'barrel', 'crate', 'tire_stack', 'hay', 'container', 'trolley', 'bin', 'pallet', 'bench',
    { header: 'TERRAIN' },
    'bush', 'bump', 'ramp', 'wall',
];

var SURFACE_TYPES = {
    water:  { label: 'Water',     color: 'rgba(40,120,200,0.45)',   editorFill: '#2878c8' },
    mud:    { label: 'Mud',       color: 'rgba(61,43,26,0.55)',     editorFill: '#3d2b1a' },
    oil:    { label: 'Oil Slick', color: 'rgba(30,20,40,0.55)',     editorFill: '#2a1a2a' },
    ice:    { label: 'Ice',       color: 'rgba(180,220,255,0.45)',  editorFill: '#aadcff' },
    sand:   { label: 'Sand Trap', color: 'rgba(212,168,84,0.55)',   editorFill: '#d4a854' },
    dirt:   { label: 'Dirt',      color: 'rgba(120,100,60,0.45)',   editorFill: '#8a7a55' },
    grass:  { label: 'Grass',     color: 'rgba(60,100,30,0.35)',    editorFill: '#4a8a2a' },
};

var SURFACE_PALETTE = ['water', 'mud', 'oil', 'ice', 'sand', 'dirt', 'grass'];

var RAMP_STYLES = ['dirt_mound', 'sand_dune', 'ice_ridge', 'metal_ramp', 'wrecked_car'];

var DEFAULT_MAP = {
    id: 'new-map',
    name: 'New Map',
    description: '',
    arenaWidth: 3200,
    arenaHeight: 3200,
    backgroundColor: '#4a6e2a',
    surfaceDefault: null,
    wallStyle: 'tires',
    roadLayout: 'none',
    radialRoads: null,
    curvyRoads: [],
    spawnCenterX: 1600,
    spawnCenterY: 1600,
    spawnRadius: 550,
    spawnLayout: 'circle',
    surfaceFriction: {},
    ambientParticles: null,
};

// Grid
var GRID_SIZES = [25, 50, 100, 200];
var DEFAULT_GRID_SIZE = 50;

// Colors
var COLOR_SELECTION = '#ff6eb4';
var COLOR_HOVER = '#ffaa00';
var COLOR_SPAWN = 'rgba(255,110,180,0.6)';
var COLOR_GRID = 'rgba(255,255,255,0.08)';
var COLOR_ARENA_BORDER = 'rgba(255,255,255,0.3)';
