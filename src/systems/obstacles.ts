import { GAME_CONFIG, Side, remapClamped } from "../config";
import { HoldSpec, ObstacleSegment } from "../core/state";

export type ObstacleState = {
  rng: () => number;
};

export function createObstacleState(seed = Math.random() * 1e9): ObstacleState {
  // xorshift32
  let x = (seed | 0) || 123456789;
  const rng = () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000;
  };
  return { rng };
}

/**
 * Generate next obstacle side based on score ramp and run constraints.
 */
export function nextObstacle(
  score: number,
  lastSide: Side | null,
  sameSideRun: number,
  rng: () => number,
): { side: Side | null; newRun: number; newLast: Side | null } {
  // New rule: every segment has a required side to press
  let side: Side = rng() < 0.5 ? "left" : "right";
  // Avoid 3 on same side in a row
  if (lastSide && sameSideRun >= GAME_CONFIG.obstacles.maxSameSideInRow) {
    side = lastSide === "left" ? "right" : "left";
  }
  const newRun = lastSide === side ? sameSideRun + 1 : 1;
  return { side, newRun, newLast: side };
}

export function seedInitialSegments(count: number, rng: () => number): ObstacleSegment[] {
  const segs: ObstacleSegment[] = [];
  let last: Side | null = null;
  let run = 0;
  for (let i = 0; i < count; i++) {
    const n = nextObstacle(0, last, run, rng);
    const seg: ObstacleSegment = { side: n.side };
    populateHoldsForSegment(seg, rng);
    segs.push(seg);
    last = n.newLast;
    run = n.newRun;
  }
  return segs;
}

export function generateHoldSpec(rng: () => number): HoldSpec {
  const rect = rng() < 0.5;
  const color: [number, number, number] = rng() < 0.33 ? [176, 170, 162] : rng() < 0.66 ? [160, 154, 148] : [188, 180, 172];
  return rect
    ? { kind: "rect", w: 14 + Math.floor(rng() * 6), h: 6 + Math.floor(rng() * 3), rotDeg: (rng() - 0.5) * 15, offsetX: (rng() - 0.5) * 10, offsetYRatio: (rng() - 0.5) * 0.2, color }
    : { kind: "circle", r: 5 + Math.floor(rng() * 3), rotDeg: 0, offsetX: (rng() - 0.5) * 10, offsetYRatio: (rng() - 0.5) * 0.2, color };
}

export function populateHoldsForSegment(seg: ObstacleSegment, rng: () => number): void {
  const allowed: Side[] = seg.side ? [seg.side] : ["left", "right"];
  seg.holds = seg.holds ?? {};
  for (const s of allowed) {
    const spec = generateHoldSpec(rng);
    // Bias vertical offset toward upper part of the band so it looks like a reachable hold
    spec.offsetYRatio = -0.25 + (rng() - 0.5) * 0.1; // around -0.25 ±0.05
    // Keep horizontal offset small so it aligns with lane center
    spec.offsetX = (rng() - 0.5) * 8;
    seg.holds[s] = spec;
  }
}


