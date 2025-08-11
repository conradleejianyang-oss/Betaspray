export const GAME_CONFIG = {
  // Increase internal resolution for crisper rendering
  internalWidth: 540,
  internalHeight: 960,
  physicsTimestepMs: 16.6667,
  maxDtSeconds: 0.05,
  inputLockMs: 120,
  // UI scale multiplier for text and circular buttons
  uiScale: 1.25,
  timeBar: {
    maxSeconds: 6,
    refillOnStepSeconds: 0.4,
    dangerThreshold: 0.15,
  },
  wall: {
    width: 160,
    segmentHeight: 40,
  },
  obstacles: {
    startChance: 0.55,
    endChance: 0.92,
    endScore: 80,
    maxSameSideInRow: 2,
  },
} as const;

export type Side = "left" | "right";

/**
 * Linearly map a value from one range to another and clamp to output range.
 */
export function remapClamped(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  const t = Math.min(1, Math.max(0, (value - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}


