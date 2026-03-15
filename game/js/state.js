// ================================================================
//  GAME STATE — all mutable state variables (var for global scope)
// ================================================================
var gameState = 'menu';        // menu | countdown | playing | paused | gameover
var gameMode = 'single';       // 'single' | 'multi'
var countdownVal = 3;
var countdownTimer = 0;
var gameTime = 0;
var cars = [];
var particles = [];
var skidMarks = [];
var debris = [];
var keys = {};
var powerUps = [];
var powerUpSpawnTimer = 0;
var obstacles = [];
var grassPatches = [];
var dirtPatches = [];
var mudPatches = [];
var waterPuddles = [];
var oilSlicks = [];
var bushes = [];
var bumps = [];
var floatingTexts = [];
var breakables = [];
var ramps = [];
var icePatches = [];
var sandTraps = [];
var palmTrees = [];
var score = 0;

var P1_COLOR = '#ff6eb4';
var P2_COLOR = '#6eb4ff';

var currentMap = null;          // active map from MAPS array
var selectedCarTypeP1 = null;   // selected car type for player 1
var selectedCarTypeP2 = null;   // selected car type for player 2

var canvas = null;              // assigned in game.js
var ctx = null;                 // assigned in game.js
