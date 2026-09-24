/**
 * BOUNCEBACK! — Game Configuration
 */

// Arena dimensions (metres)
export const ARENA_W = 26;    // X width
export const ARENA_L = 40;    // Z length
export const WALL_H = 1.2;    // Perimeter cushion height
export const WALL_THICK = 0.5;

// Team colors
export const TEAM_CYAN  = 0x27e5ff;
export const TEAM_CORAL = 0xff5268;
export const GOLD       = 0xffd166;
export const PURPLE     = 0x8338ec;
export const GREEN      = 0x06d6a0;
export const OBSIDIAN   = 0x111625;
export const WHITE      = 0xffffff;

// Player physics
export const PLAYER_RADIUS   = 0.42;
export const PLAYER_SPEED    = 8.0;       // m/s normal run
export const DASH_SPEED      = 18.0;      // m/s dash burst
export const DASH_DUR        = 0.18;      // seconds
export const DASH_CD         = 0.8;       // cooldown seconds
export const PUNCH_IMPULSE   = 14.0;      // m/s applied to target on hit
export const CHARGE_IMPULSE  = 22.0;      // m/s charged hit
export const CHARGE_TIME     = 0.6;       // seconds to full charge
export const PUNCH_RANGE     = 1.6;       // metres reach
export const PUNCH_CD        = 0.3;       // seconds between punches

// Launch/bounce physics
export const LAUNCH_FRICTION = 0.985;     // per-frame damping (low = slides far)
export const GROUND_FRICTION = 0.88;      // normal movement damping
export const BUMPER_MULT     = 1.5;       // velocity multiplier on bumper bounce
export const WALL_RESTITUTION = 0.9;      // wall bounce elasticity
export const LAUNCH_THRESHOLD = 3.0;      // speed below which launched state ends
export const IMMUNITY_DUR    = 1.2;       // seconds of immunity after multiple bounces

// Bumper
export const BUMPER_RADIUS   = 0.9;       // collision radius

// Gate
export const GATE_WIDTH      = 3.5;       // detection width
export const GATE_DEPTH      = 0.6;       // detection depth

// Match
export const MATCH_DURATION  = 100;       // seconds
export const PHASE2_TIME     = 30;        // seconds into match
export const PHASE3_TIME     = 75;        // overdrive start
export const GATE_SCORE_1X   = 1;
export const GATE_SCORE_2X   = 2;
export const GATE_SCORE_3X   = 3;

// Bot AI
export const BOT_REACTION    = 0.15;      // seconds reaction delay
export const MAX_PURSUERS    = 2;         // max bots chasing same target
export const BOT_PUNCH_RANGE = 1.8;       // slightly generous for bots

// Combo
export const COMBO_WINDOW    = 3.0;       // seconds to chain combo
export const COMBO_DECAY     = 0.5;       // seconds after which combo resets
