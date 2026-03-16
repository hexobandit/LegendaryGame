// ================================================================
//  MAPS — Registry array. Individual maps live in js/maps/*.js
//
//  To add a new map: create a file in js/maps/ and call MAPS.push({...})
//  Then add a <script> tag in index.html after this file.
//
//  FIELD REFERENCE:
//    id              — Unique short name (used in code, no spaces)
//    name            — Display name shown to the player
//    description     — One-line summary
//    arenaWidth/Height — Total arena size in pixels
//    backgroundColor — Hex color for the ground fill
//    surfaceDefault  — If 'tarmac', entire map is tarmac. Otherwise null.
//    radialRoads     — Radial road layout config (null = no roads)
//    terrain         — Terrain feature counts and configs
//    surfaceFriction — Override default grip/friction values (null = CONFIG)
//    ambientParticles — Floating particles for atmosphere (null = none)
// ================================================================
const MAPS = [];
