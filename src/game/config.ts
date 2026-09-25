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
export const PUNCH_IMPULSE = 35.0;
export const CHARGE_IMPULSE = 50.0;
export const CHARGE_TIME = 0.55;
export const PUNCH_RANGE = 3.4;
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

// Giant Battle Gong / Ring-Out Gate Configuration
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
export const BOT_PUNCH_RANGE = 2.8;

// Combo
export const COMBO_WINDOW = 3.0;
export const COMBO_DECAY = 0.5;

// ─── 3VS3 Roster Profiles for TV Broadcast Showcase ───
export interface FighterProfile {
  id: string;
  name: string;
  number: number;
  team: number;
  costume: string;
  title: string;
  avatarIcon: string;
  quote: string;
  statPunch: number; // 1 to 5
  statSpeed: number;
  statChaos: number;
}

export const ROSTER_CYAN: FighterProfile[] = [
  {
    id: "cyan_player",
    name: "YOU",
    number: 7,
    team: 0,
    costume: "crown",
    title: "THE PUNCH PRODIGY",
    avatarIcon: "07",
    quote: "Nonjok orang sampe tembus atmosfer adalah hobiku!",
    statPunch: 5,
    statSpeed: 4,
    statChaos: 5,
  },
  {
    id: "cyan_dj",
    name: "DJ BOUNCE",
    number: 1,
    team: 0,
    costume: "dj_headphones",
    title: "BEAT STRIKER",
    avatarIcon: "01",
    quote: "Drop the beat, drop the enemy!",
    statPunch: 3,
    statSpeed: 5,
    statChaos: 4,
  },
  {
    id: "cyan_ninja",
    name: "NINJA BEAN",
    number: 2,
    team: 0,
    costume: "ninja_headband",
    title: "SHADOW DASHER",
    avatarIcon: "02",
    quote: "Kedip sekali, langsung melayang ke gong!",
    statPunch: 4,
    statSpeed: 5,
    statChaos: 3,
  },
];

export const ROSTER_CORAL: FighterProfile[] = [
  {
    id: "coral_rex",
    name: "REX CRUSH",
    number: 1,
    team: 1,
    costume: "dino_crest",
    title: "DINO DESTROYER",
    avatarIcon: "01",
    quote: "Siap-siap terlempar ke langit!",
    statPunch: 5,
    statSpeed: 3,
    statChaos: 5,
  },
  {
    id: "coral_hopper",
    name: "HOPPER MAD",
    number: 2,
    team: 1,
    costume: "bunny_ears",
    title: "BOUNCING MENACE",
    avatarIcon: "02",
    quote: "Lompat sana-sini sampai lawan pusing!",
    statPunch: 3,
    statSpeed: 5,
    statChaos: 5,
  },
  {
    id: "coral_shady",
    name: "SHADY VIP",
    number: 3,
    team: 1,
    costume: "pro_shades",
    title: "THE IRON WALL",
    avatarIcon: "03",
    quote: "Gong ini tidak akan pernah kalian sentuh!",
    statPunch: 4,
    statSpeed: 3,
    statChaos: 3,
  },
];
