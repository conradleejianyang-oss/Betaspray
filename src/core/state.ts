import { Side } from "../config";

export type GamePhase = "READY" | "PLAY" | "PAUSED" | "OVER";

export type HoldSpec = {
  kind: "rect" | "circle";
  // dimensions (px). For circle use r; for rect use w/h.
  w?: number;
  h?: number;
  r?: number;
  rotDeg: number;
  // horizontal pixel offset from lane center
  offsetX: number;
  // vertical offset as a ratio of segment height (-0.5..0.5)
  offsetYRatio: number;
  color: [number, number, number];
};

export type ObstacleSegment = {
  side: Side | null; // null means no overhang
  holds?: {
    left?: HoldSpec | null;
    right?: HoldSpec | null;
  };
};

export type GameState = {
  phase: GamePhase;
  score: number;
  best: number;
  timeRemaining: number; // seconds
  playerSide: Side; // where the climber is currently holding
  // obstacle segments from bottom (index 0) to top (latest)
  segments: ObstacleSegment[];
  sameSideRun: number;
  lastObstacleSide: Side | null;
  inputLockedUntilMs: number;
};

export function loadBest(): number {
  const v = localStorage.getItem("climbtap_best");
  const n = v ? Number(v) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function saveBest(best: number): void {
  localStorage.setItem("climbtap_best", String(best));
}


