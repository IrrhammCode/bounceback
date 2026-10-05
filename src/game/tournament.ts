/**
 * BOUNCEBACK! — 5-Round Grand Championship Tournament System
 *
 * Each round lasts 3 minutes (180s) and introduces:
 * 1. A completely distinct arena map & atmosphere
 * 2. Unique gameplay mutators (multi-ball, slippery turf, titan cannonball, cosmic blackhole)
 * 3. Escalating stadium stakes leading to the Grand Championship Final
 */
import * as C from "./config";

export type RoundTheme = "colosseum" | "speedway" | "stormland" | "pinball" | "cosmic";

export interface RoundDef {
  roundNumber: number;
  theme: RoundTheme;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  themeColor: string;
  ballCount: number;
  ballType: "standard" | "dual" | "heavy" | "fireball";
  groundFriction: number;
  bumperMultiplier: number;
  goalMultiplier: number;
  disasterInterval: number; // seconds between audience voting
  specialGimmick: string;
}

export const TOURNAMENT_ROUNDS: Record<number, RoundDef> = {
  1: {
    roundNumber: 1,
    theme: "colosseum",
    title: "KADO #1: KAMAR MASA KECIL",
    subtitle: "ROUND 1: TOYBOX MORNING",
    badge: "HADIAH PERTAMA",
    description: "Suasana pagi cerah di kamar masa kecil. Baling-baling helikopter mainan berputar di tengah arena!",
    themeColor: "#8ec5ff",
    ballCount: 1,
    ballType: "standard",
    groundFriction: C.GROUND_FRICTION,
    bumperMultiplier: 1.0,
    goalMultiplier: 1.0,
    disasterInterval: 50,
    specialGimmick: "Baling-baling helikopter mainan berputar di tengah arena.",
  },
  2: {
    roundNumber: 2,
    theme: "speedway",
    title: "KADO #2: KOTA MAINAN",
    subtitle: "ROUND 2: DUAL-BALL MADNESS",
    badge: "REL KERETA CEPAT",
    description: "Kota balok kardus penuh warna dengan rel kereta pendorong bola di kedua sisi arena!",
    themeColor: "#e63946",
    ballCount: 2,
    ballType: "dual",
    groundFriction: C.GROUND_FRICTION,
    bumperMultiplier: 1.4,
    goalMultiplier: 1.5,
    disasterInterval: 45,
    specialGimmick: "Rel kereta mainan di kedua sisi arena meluncurkan bola ganda!",
  },
  3: {
    roundNumber: 3,
    theme: "stormland",
    title: "KADO #3: LAYANGAN SORE",
    subtitle: "ROUND 3: SLIPPERY SLIDERS",
    badge: "ANGIN SORE & DRIFT",
    description: "Angin sore menerbangkan layangan! Lantai licin dengan kilatan senja emas.",
    themeColor: "#ff9f43",
    ballCount: 1,
    ballType: "standard",
    groundFriction: 0.95, // Lower friction = slippery sliding drift!
    bumperMultiplier: 1.2,
    goalMultiplier: 1.5,
    disasterInterval: 32, // Fast audience voting!
    specialGimmick: "Lantai licin embun sore dengan fisika drifting + kilatan cahaya senja.",
  },
  4: {
    roundNumber: 4,
    theme: "pinball",
    title: "KADO #4: PASAR MALAM",
    subtitle: "ROUND 4: TRAMPOLINE BASH",
    badge: "TRAMPOLIN RIA",
    description: "Gemerlap bianglala dan lampu pasar malam dengan 4 bantalan trampolin dan 8 bumper supersonic!",
    themeColor: "#e0218a",
    ballCount: 1,
    ballType: "heavy",
    groundFriction: C.GROUND_FRICTION,
    bumperMultiplier: 2.0, // Supersonic bumper launch!
    goalMultiplier: 2.0,
    disasterInterval: 40,
    specialGimmick: "Trampolin sirkus memantulkan pemain tinggi ke udara + 8 bumper supersonic!",
  },
  5: {
    roundNumber: 5,
    theme: "cosmic",
    title: "KADO #5: ATAP PENUH BINTANG",
    subtitle: "ROUND 5: GRAND CHAMPIONSHIP",
    badge: "PUSARAN KADO AKHIR",
    description: "Malam berbintang di atas atap kenangan masa kecil. Singularity kado di 30 detik terakhir!",
    themeColor: "#ffd166",
    ballCount: 1,
    ballType: "fireball",
    groundFriction: C.GROUND_FRICTION,
    bumperMultiplier: 1.8,
    goalMultiplier: 3.0, // 3x Goal Points!
    disasterInterval: 28,
    specialGimmick: "Permanent 3X Overdrive + pusaran kado kosmik menyedot semua ke tengah di 30 detik terakhir!",
  },
};

export interface RoundResult {
  roundNumber: number;
  winner: number; // 0: Cyan, 1: Coral, -1: Draw
  scores: [number, number];
  theme: RoundTheme;
  title: string;
  kos?: [number, number];
  outs?: [number, number];
  playerKo?: number;
  playerOut?: number;
}

export class TournamentManager {
  currentRound = 1;
  maxRounds = C.TOTAL_ROUNDS;
  roundWins: [number, number] = [0, 0];
  roundHistory: RoundResult[] = [];
  isTournamentOver = false;
  tournamentWinner = -1;

  onRoundEnd: ((result: RoundResult) => void) | null = null;
  onTournamentEnd: ((winner: number, history: RoundResult[], wins: [number, number]) => void) | null = null;

  startNewTournament() {
    this.currentRound = 1;
    this.roundWins = [0, 0];
    this.roundHistory = [];
    this.isTournamentOver = false;
    this.tournamentWinner = -1;
  }

  getCurrentRoundDef(): RoundDef {
    return TOURNAMENT_ROUNDS[this.currentRound] || TOURNAMENT_ROUNDS[1];
  }

  recordRoundResult(
    winner: number,
    scores: [number, number],
    kos: [number, number] = [0, 0],
    outs: [number, number] = [0, 0],
    playerKo: number = 0,
    playerOut: number = 0
  ): RoundResult {
    const roundDef = this.getCurrentRoundDef();
    if (winner === 0) {
      this.roundWins[0]++;
    } else if (winner === 1) {
      this.roundWins[1]++;
    }

    const result: RoundResult = {
      roundNumber: this.currentRound,
      winner,
      scores: [...scores] as [number, number],
      theme: roundDef.theme,
      title: roundDef.title,
      kos: [...kos] as [number, number],
      outs: [...outs] as [number, number],
      playerKo,
      playerOut,
    };

    this.roundHistory.push(result);

    // Check if tournament is concluded
    // A team clinches if they reach WINS_TO_CLINCH (3) or if all 5 rounds have been played
    if (
      this.roundWins[0] >= C.WINS_TO_CLINCH ||
      this.roundWins[1] >= C.WINS_TO_CLINCH ||
      this.currentRound >= this.maxRounds
    ) {
      this.isTournamentOver = true;
      this.tournamentWinner =
        this.roundWins[0] > this.roundWins[1]
          ? 0
          : this.roundWins[1] > this.roundWins[0]
            ? 1
            : -1;

      if (this.onTournamentEnd) {
        this.onTournamentEnd(this.tournamentWinner, this.roundHistory, this.roundWins);
      }
    }

    if (this.onRoundEnd) {
      this.onRoundEnd(result);
    }

    return result;
  }

  advanceToNextRound(): boolean {
    if (this.isTournamentOver) return false;
    if (this.currentRound < this.maxRounds) {
      this.currentRound++;
      return true;
    }
    return false;
  }
}
