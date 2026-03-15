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
var sfxMuted = false;            // toggled from pause menu

// Slow-mo death sequence
var slomoActive = false;
var slomoTimer = 0;
var slomoFade = 0;
var slomoDuration = 3;           // seconds of slow-mo before game over

// Racing
var raceData = null;           // { laps[], checkpoints[], positions[], totalLaps, lapTimes[], currentLapStart[] }

// Capture the Flag
var ctfFlag = null;            // { x, y, carrier: car|null, bobPhase }
var ctfScores = {};            // carIndex -> score
var ctfHoldTimer = 0;          // seconds current carrier has held flag
var ctfBonusTimer = 0;         // counts up to 10s for bonus

var P1_COLOR = '#ff6eb4';
var P2_COLOR = '#6eb4ff';

var currentMap = null;          // active map from MAPS array
var selectedCarTypeP1 = null;   // selected car type for player 1
var selectedCarTypeP2 = null;   // selected car type for player 2
var selectedTeamP1 = 'red';     // team choice for player 1
var selectedTeamP2 = 'blue';    // team choice for player 2

var canvas = null;              // assigned in game.js
var ctx = null;                 // assigned in game.js

// Fade-in on game start
var fadeInAlpha = 0;            // 1 = fully black, fades to 0

// FPS tracking
var fpsFrames = 0;
var fpsLastTime = 0;
var fpsDisplay = 0;
