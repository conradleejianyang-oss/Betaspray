import { KaboomCtx, Vec2 } from "kaboom";

type CloudObj = ReturnType<KaboomCtx["add"]> & { speed?: number };
export type BackgroundHandles = {
  clouds: CloudObj[];
  mountains: ReturnType<KaboomCtx["add"]>[];
  trees: ReturnType<KaboomCtx["add"]>[];
  shrubs: ReturnType<KaboomCtx["add"]>[];
  ground: ReturnType<KaboomCtx["add"]>;
};

function rand(min: number, max: number): number { return Math.random() * (max - min) + min; }

export function spawnBackground(
  k: KaboomCtx,
  viewSize: Vec2,
  opts?: { treeClip?: { centerX: number; width: number } },
): BackgroundHandles {
  const mountains: ReturnType<KaboomCtx["add"]>[] = [];
  const clouds: CloudObj[] = [];
  const trees: ReturnType<KaboomCtx["add"]>[] = [];
  const shrubs: ReturnType<KaboomCtx["add"]>[] = [];

  // No sun for the flat reference style

  // Mountain ranges (triangular, broader, slightly rounder tops)
  const addTriangleRange = (
    count: number,
    baseY: number,
    color: [number, number, number],
    zBase: number,
    minHeight: number,
    maxHeight: number,
    minWidth: number,
    maxWidth: number,
  ) => {
    const [r, g, b] = color;
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const x = t * viewSize.x + rand(-viewSize.x * 0.06, viewSize.x * 0.06);
      const height = rand(minHeight, maxHeight);
      const width = rand(minWidth, maxWidth);
      const stripes = Math.max(8, Math.ceil(height / 6));
      const roundnessExp = 0.65; // <1 widens earlier -> softer/rounder top
      const stripeH = Math.ceil(height / stripes) + 1;
      for (let s = 0; s < stripes; s++) {
        const frac = (s + 1) / stripes; // 0..1 from top to base
        let w = width * Math.pow(frac, roundnessExp);
        // subtle shoulder bulge to hint at rounded top without losing peak
        w += Math.sin(frac * Math.PI) * width * 0.03;
        w = Math.max(4, w);
        const h = stripeH;
        const rect = k.add([
          k.rect(w, h),
          k.pos(x, baseY - height + s * h),
          k.anchor("bot"),
          k.color(r, g, b),
          { z: zBase - i * 0.01 },
        ]);
        mountains.push(rect);
      }

      // Snow cap near the top
      const snowStripes = Math.max(2, Math.round((height * 0.12) / stripeH));
      for (let s = 0; s < snowStripes; s++) {
        const frac = (s + 1) / stripes;
        let w = width * Math.pow(frac, roundnessExp) * 0.8;
        w += Math.sin(frac * Math.PI) * width * 0.015;
        w = Math.max(3, w);
        const y = baseY - height + s * stripeH;
        const cap = k.add([
          k.rect(w, stripeH, { radius: 2 }),
          k.pos(x, y + 1),
          k.anchor("bot"),
          k.color(245, 248, 255),
          k.opacity(0.9),
          { z: zBase + 0.005 - i * 0.01 },
        ]);
        mountains.push(cap);
      }
    }
  };

  // Far, mid, near triangular ranges (ensure behind trees) in green palette
  addTriangleRange(7, viewSize.y * 0.86, [140, 220, 190], -30, viewSize.y * 0.20, viewSize.y * 0.34, viewSize.x * 0.22, viewSize.x * 0.44);
  addTriangleRange(6, viewSize.y * 0.92, [120, 205, 175], -28, viewSize.y * 0.24, viewSize.y * 0.38, viewSize.x * 0.24, viewSize.x * 0.48);
  addTriangleRange(5, viewSize.y * 0.97, [100, 190, 160], -26, viewSize.y * 0.26, viewSize.y * 0.42, viewSize.x * 0.26, viewSize.x * 0.52);

  // Clouds drifting (flat rounded rectangles)
  for (let i = 0; i < 6; i++) {
    const width = rand(viewSize.x * 0.2, viewSize.x * 0.35);
    const c = k.add([
      k.rect(width, width * 0.3, { radius: width * 0.15 }),
      k.pos(rand(0, viewSize.x), rand(20, viewSize.y * 0.6)),
      k.color(255, 255, 255),
      k.opacity(0.25),
      { z: -20, speed: rand(5, 15) as number },
    ]) as CloudObj;
    clouds.push(c);
  }

  // Ground band at horizon where trees sit (behind trees, in front of mountains)
  const treeBaseY = viewSize.y * 0.88;
  const ground = k.add([
    k.rect(viewSize.x, Math.max(10, viewSize.y - treeBaseY + 8), { radius: 6 }),
    k.pos(0, viewSize.y),
    k.anchor("botleft"),
    k.color(74, 52, 43),
    { z: -2 },
  ]);
  for (let i = 0; i < 6; i++) {
    const w = rand(viewSize.x * 0.12, viewSize.x * 0.3);
    const h = rand(8, 16);
    k.add([
      k.rect(w, h, { radius: 8 }),
      k.pos(rand(10, viewSize.x - 10), viewSize.y - rand(6, 20)),
      k.anchor("bot"),
      k.color(56, 40, 34),
      k.opacity(0.7),
      { z: -1.9 },
    ]);
  }

  // Tree line silhouettes (pine-ish). We draw a light band within the wall area,
  // then denser clusters on the left and right sides of the wall to frame it.
  const treeCount = 8;
  const clip = opts?.treeClip;
  const minX = clip ? clip.centerX - clip.width / 2 : 0;
  const maxX = clip ? clip.centerX + clip.width / 2 : viewSize.x;

  const addTree = (x: number, scale: number) => {
    const trunk = k.add([
      k.rect(5 * scale, 18 * scale, { radius: 2 }),
      k.pos(x, treeBaseY),
      k.anchor("bot"),
      k.color(84, 60, 44),
      { z: -1.5 },
    ]);
    const stripes = 5;
    for (let s = 0; s < stripes; s++) {
      const frac = (s + 1) / stripes;
      const w = 26 * scale * frac;
      const h = 6 * scale;
      const y = treeBaseY - 18 * scale - s * h + 2 * scale;
      const leaf = k.add([
        k.rect(w, h, { radius: 3 }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(40 + s * 4, 120 + s * 3, 80),
        { z: -1.45 },
      ]);
      trees.push(leaf);
    }
    trees.push(trunk);
  };

  // Light coverage inside wall area (keeps sense of depth behind wall)
  for (let i = 0; i < treeCount; i++) {
    const x = rand(minX + 10, maxX - 10);
    const scale = rand(0.8, 1.2);
    addTree(x, scale);
  }

  // Denser clusters to the left and right of the wall
  const leftRange = { min: 10, max: Math.max(20, minX - 10) };
  const rightRange = { min: Math.min(viewSize.x - 20, maxX + 10), max: viewSize.x - 10 };
  const addCluster = (range: { min: number; max: number }, count: number) => {
    if (range.max - range.min < 10) return;
    for (let i = 0; i < count; i++) {
      const x = rand(range.min, range.max);
      const scale = rand(0.9, 1.5);
      addTree(x, scale);
      // Add shrubs around base of some trees
      if (Math.random() < 0.7) {
        const w = rand(12, 26) * (scale * 0.6);
        const h = rand(6, 10) * (scale * 0.5);
        const shrub = k.add([
          k.rect(w, h, { radius: 4 }),
          k.pos(x + rand(-8, 8), treeBaseY - 2),
          k.anchor("bot"),
          k.color(66, 120, 72),
          k.opacity(0.9),
          { z: -1.48 },
        ]);
        shrubs.push(shrub);
        if (Math.random() < 0.5) {
          const sprig = k.add([
            k.rect(w * 0.6, h * 0.7, { radius: 3 }),
            k.pos(x + rand(-10, 10), treeBaseY - h * 0.6),
            k.anchor("bot"),
            k.color(58, 100, 64),
            { z: -1.47 },
          ]);
          shrubs.push(sprig);
        }
      }
    }
  };

  addCluster(leftRange, 8);
  addCluster(rightRange, 8);

  // Animation step
  k.onUpdate(() => {
    for (const c of clouds) {
      const s = (c as CloudObj).speed ?? 10;
      (c as any).move(s, 0);
      const pos = (c as any).pos as { x: number; y: number };
      const width = (c as any).width as number;
      if (pos.x - width / 2 > viewSize.x + 10) {
        (c as any).pos.x = -10 - width / 2;
        (c as any).pos.y = rand(20, viewSize.y * 0.6);
      }
    }
  });

  return { mountains, clouds, trees, shrubs, ground };
}


