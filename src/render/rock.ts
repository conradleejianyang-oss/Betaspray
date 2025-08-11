import { KaboomCtx } from "kaboom";
import { Side } from "../config";

export type RockWall = {
  root: ReturnType<KaboomCtx["add"]>;
  laneXAt: (y: number, side: Side) => number;
  edgesAt: (y: number) => { left: number; right: number };
  scrollOnce: (duration: number) => Promise<void>;
};

/**
 * Stylized rock face: opaque base, striations, cracks, and jagged side lumps.
 */
export function spawnRockWall(
  k: KaboomCtx,
  centerX: number,
  viewH: number,
  width: number,
  bandH: number,
): RockWall {
  const baseColor = k.rgb(110, 104, 96);
  // bandH provided by scene to sync with segment height
  // Draw extra bands above and below the viewport to prevent gaps during tween
  const bandCount = Math.ceil(viewH / bandH) + 4;
  const leftOffsets: number[] = [];
  const rightOffsets: number[] = [];
  let curL = 0;
  let curR = 0;
  const maxJitter = width * 0.12;
  for (let i = 0; i < bandCount; i++) {
    curL += (Math.random() - 0.5) * (width * 0.06);
    curR += (Math.random() - 0.5) * (width * 0.06);
    curL = Math.max(-maxJitter, Math.min(maxJitter, curL));
    curR = Math.max(-maxJitter, Math.min(maxJitter, curR));
    leftOffsets.push(curL);
    rightOffsets.push(curR);
  }

  const edgesAt = (y: number) => {
    const idx = Math.max(0, Math.min(bandCount - 1, Math.floor(y / bandH)));
    const lOff = leftOffsets[idx] ?? 0;
    const rOff = rightOffsets[idx] ?? 0;
    const left = centerX - width / 2 + lOff;
    const right = centerX + width / 2 + rOff;
    return { left, right };
  };

  const laneXAt = (y: number, side: Side) => {
    const { left, right } = edgesAt(y);
    const w = right - left;
    const margin = w * 0.25;
    return side === "left" ? left + margin : right - margin;
  };

  type Obj = ReturnType<KaboomCtx["add"]> & Record<string, any>;
  const bands: Obj[] = [];
  const root = k.add([k.pos(0, 0)]);
  for (let i = 0; i < bandCount; i++) {
    // start half a band above the viewport
    const yMid = -bandH / 2 + i * bandH;
    const { left, right } = edgesAt(yMid);
    const w = right - left;
    const o = root.add([
      // overlap a few pixels to ensure no gaps between bands
      k.rect(w, bandH + 4),
      k.pos((left + right) / 2, yMid),
      k.anchor("center"),
      k.color(baseColor),
      k.z(0),
    ]) as Obj;
    bands.push(o);
  }

  // Wall decorations: small vegetation tufts and shrubs anchored to random bands
  const decoCount = 10;
  for (let i = 0; i < decoCount; i++) {
    const bi = Math.floor(Math.random() * bandCount);
    const band = bands[bi] ?? bands[0];
    const y = (band?.pos.y ?? 0) + (Math.random() * bandH - bandH / 2);
    const { left, right } = edgesAt(y);
    const x = left + (right - left) * Math.random();
    const scale = 0.6 + Math.random() * 0.8;
    // little moss/grass patch
    root.add([
      k.rect(12 * scale, 4 * scale, { radius: 2 }),
      k.pos(x, y),
      k.anchor("center"),
      k.color(78, 122, 76),
      k.z(0.05),
    ]);
    if (Math.random() < 0.4) {
      root.add([
        k.rect(6 * scale, 10 * scale, { radius: 3 }),
        k.pos(x + (Math.random() * 10 - 5), y - 6 * scale),
        k.anchor("bot"),
        k.color(64, 100, 64),
        k.z(0.06),
      ]);
    }
  }

  function spawnTopBand(): void {
    // derive next offsets from current top for continuity
    const topL = leftOffsets[0] ?? 0;
    const topR = rightOffsets[0] ?? 0;
    let nextL = topL + (Math.random() - 0.5) * (width * 0.06);
    let nextR = topR + (Math.random() - 0.5) * (width * 0.06);
    nextL = Math.max(-maxJitter, Math.min(maxJitter, nextL));
    nextR = Math.max(-maxJitter, Math.min(maxJitter, nextR));
    leftOffsets.unshift(nextL);
    rightOffsets.unshift(nextR);
    leftOffsets.pop();
    rightOffsets.pop();

    const yMid = (bands[0]?.pos.y ?? -bandH / 2) - bandH;
    const { left, right } = edgesAt(0);
    const w = right - left;
    const o = root.add([
      k.rect(w, bandH + 4),
      k.pos((left + right) / 2, yMid),
      k.anchor("center"),
      k.color(baseColor),
      k.z(0),
    ]) as Obj;
    bands.unshift(o);
    const last = bands.pop();
    last?.destroy();
  }

  function scrollOnce(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startY = root.pos.y;
      k.tween(startY, startY + bandH, duration, (v) => (root.pos.y = v), k.easings.linear).then?.(() => {
        root.pos.y = 0;
        // move each band down and recycle bottom -> top
        for (const b of bands) {
          b.pos.y += bandH;
        }
        // remove the one that exits bottom and add new at top
        spawnTopBand();
        resolve();
      });
    });
  }

  return { root, laneXAt, edgesAt, scrollOnce };
}


