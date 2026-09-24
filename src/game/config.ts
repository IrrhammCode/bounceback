/**
 * BOUNCEBACK! — Game Configuration
 */

// Arena dimensions (metres) — spacious elongated Fall Guys stadium
export const ARENA_W = 28;
export const ARENA_L = 54;
export const WALL_H = 1.4;
export const WALL_THICK = 0.5;

// Team colors
export const TEAM_CYAN = 0x27e5ff;
export const TEAM_CORAL = 0xff5268;
export const GOLD = 0xffd166;
export const PURPLE = 0x8338ec;
export const GREEN = 0x06d6a0;
export const OBSIDIAN = 0x111625;
export const WHITE = 0xffffff;

// Player physics
export const PLAYER_RADIUS = 0.42;
export const PLAYER_SPEED = 8.0;
export const DASH_SPEED = 18.0;
export const DASH_DUR = 0.18;
export const DASH_CD = 0.8;
export const PUNCH_IMPULSE = 32.0;
export const CHARGE_IMPULSE = 46.0;
export const CHARGE_TIME = 0.55;
export const PUNCH_RANGE = 2.6;
export const PUNCH_CD = 0.28;

// Launch/bounce physics
export const LAUNCH_FRICTION = 0.988;
export const GROUND_FRICTION = 0.88;
export const BUMPER_MULT = 1.5;
export const WALL_RESTITUTION = 0.9;
export const LAUNCH_THRESHOLD = 3.0;
export const IMMUNITY_DUR = 1.2;

// Bumper
export const BUMPER_RADIUS = 0.9;

// Giant Battle Gong (Replaces standard gates)
export const GATE_WIDTH = 5.4;
export const GATE_DEPTH = 1.2;

// Match
export const MATCH_DURATION = 100;
export const PHASE2_TIME = 30;
export const PHASE3_TIME = 75;
export const GATE_SCORE_1X = 1;
export const GATE_SCORE_2X = 2;
export const GATE_SCORE_3X = 3;

// Bot AI
export const BOT_REACTION = 0.15;
export const MAX_PURSUERS = 2;
export const BOT_PUNCH_RANGE = 1.8;

// Combo
export const COMBO_WINDOW = 3.0;
export const COMBO_DECAY = 0.5;
