import { KaboomCtx } from "kaboom";
import { spawnBackground } from "../render/background";
import { spawnRockWall } from "../render/rock";
import { estimateClimberHeightPx, spawnClimber } from "../systems/climber";
import { GAME_CONFIG } from "../config";

export function defineMenuScene(k: KaboomCtx) {
  k.scene("menu", () => {
    const viewW = k.width();
    const viewH = k.height();

    const wallCenterX = viewW / 2;
    spawnBackground(k, k.vec2(viewW, viewH), { treeClip: { centerX: wallCenterX, width: GAME_CONFIG.wall.width } });
    const bandH = Math.floor(viewH / 7);
    spawnRockWall(k, wallCenterX, viewH, GAME_CONFIG.wall.width, bandH);

    // Bigger hero on start screen (+30%), positioned to stand on a rock ledge
    const baseScale = 1.8 * 1.10;
    const startScale = baseScale * 1.3;
    const s = startScale;
    const bodyH = 30 * s;
    const footStack = bodyH / 2 + 34 * s; // body half + legs/boots to the sole
    const platformTopY = viewH - 110; // keep clear of bottom panel
    const heroBaseY = platformTopY - footStack;
    const hero = spawnClimber(k, wallCenterX, heroBaseY, startScale);
    // Ensure hair renders behind the face so eyes/mouth are visible
    try { (hero as any).hair.z = 12; } catch {}

    // Idle action scheduler
    let isActing = false;
    let cooldown = 1.5 + Math.random() * 1.5;
    const scheduleNext = () => { cooldown = 2 + Math.random() * 3; };

    // Helpers
    const easings = k.easings;
    const neutralPose = () => {
      const rp = (hero as any).root.pos as { x: number; y: number };
      const armsBaseY = rp.y - bodyH / 2 + 4 * s;
      (hero as any).armLeft.pos = k.vec2(rp.x - 11 * s, armsBaseY);
      (hero as any).armRight.pos = k.vec2(rp.x + 11 * s, armsBaseY);
      (hero as any).armLeft.angle = 190;
      (hero as any).armRight.angle = 170;
      (hero as any).head.angle = 0;
      (hero as any).hair.angle = 0;
      (hero as any).body.angle = 0;
    };

    function waveOnce(side: "left" | "right"): void {
      isActing = true;
      const arm = side === "left" ? (hero as any).armLeft : (hero as any).armRight;
      const rp = (hero as any).root.pos as { x: number; y: number };
      const yBase = rp.y - bodyH / 2 + 4 * s;
      const xOff = side === "left" ? -11 * s : 11 * s;
      // Raise arm
      const raiseA = side === "left" ? -20 : 20; // toward camera
      const highA = side === "left" ? -50 : 50;
      (hero as any)[side === "left" ? "armLeft" : "armRight"].pos = k.vec2(rp.x + xOff, yBase - 6 * s);
      const fromA = arm.angle ?? (side === "left" ? 190 : 170);
      const tw1 = k.tween(fromA, raiseA, 0.18, (v) => (arm.angle = v), easings.easeOutCubic);
      tw1.then?.(() => {
        const tw2 = k.tween(arm.angle ?? raiseA, highA, 0.16, (v) => (arm.angle = v), easings.easeInOutSine);
        tw2.then?.(() => {
          const tw3 = k.tween(arm.angle ?? highA, raiseA, 0.16, (v) => (arm.angle = v), easings.easeInOutSine);
          tw3.then?.(() => {
            // Return to neutral
            const tw4 = k.tween(arm.angle ?? raiseA, side === "left" ? 190 : 170, 0.18, (v) => (arm.angle = v), easings.easeInCubic);
            tw4.then?.(() => { isActing = false; scheduleNext(); });
          });
        });
      });
    }

    function stepSide(dir: -1 | 1): void {
      isActing = true;
      const x0 = (hero as any).root.pos.x;
      const x1 = x0 + dir * 18 * s;
      const half = 0.34; // slower sideways movement
      const tw = k.tween(x0, x1, half, (v) => ((hero as any).root.pos.x = v), easings.easeInOutSine);
      tw.then?.(() => {
        k.tween(x1, x0, half, (v) => ((hero as any).root.pos.x = v), easings.easeInOutSine).then?.(() => {
          isActing = false; scheduleNext();
        });
      });
      // Walking-like leg articulation while stepping
      const angL0 = (hero as any).legLeft.angle ?? 0;
      const angR0 = (hero as any).legRight.angle ?? 0;
      const swing = 12 * (dir); // lead leg in movement direction
      const swingBack = -12 * (dir);
      k.tween(angL0, swing, half, (v) => ((hero as any).legLeft.angle = v), easings.easeInOutSine).then?.(() => {
        k.tween((hero as any).legLeft.angle ?? swing, 0, half, (v) => ((hero as any).legLeft.angle = v), easings.easeInOutSine);
      });
      k.tween(angR0, swingBack, half, (v) => ((hero as any).legRight.angle = v), easings.easeInOutSine).then?.(() => {
        k.tween((hero as any).legRight.angle ?? swingBack, 0, half, (v) => ((hero as any).legRight.angle = v), easings.easeInOutSine);
      });
    }

    function adjustLegs(): void {
      isActing = true;
      const l0 = (hero as any).legLeft.angle ?? 0;
      const r0 = (hero as any).legRight.angle ?? 0;
      const twA = k.tween(l0, l0 + 8, 0.18, (v) => ((hero as any).legLeft.angle = v), easings.easeOutSine);
      const twB = k.tween(r0, r0 - 8, 0.18, (v) => ((hero as any).legRight.angle = v), easings.easeOutSine);
      twA.then?.(() => {
        k.tween((hero as any).legLeft.angle ?? 0, 0, 0.22, (v) => ((hero as any).legLeft.angle = v), easings.easeInOutSine);
      });
      twB.then?.(() => {
        k.tween((hero as any).legRight.angle ?? 0, 0, 0.22, (v) => ((hero as any).legRight.angle = v), easings.easeInOutSine).then?.(() => {
          isActing = false; scheduleNext();
        });
      });
    }

    function maybeDoIdleAction(dt: number): void {
      if (isActing) return;
      cooldown -= dt;
      if (cooldown > 0) return;
      const r = Math.random();
      if (r < 0.44) waveOnce(Math.random() < 0.5 ? "right" : "left");
      else if (r < 0.76) stepSide(Math.random() < 0.5 ? -1 : 1);
      else adjustLegs();
    }

    // Per-frame: keep neutral when idle, run action scheduler
    k.onUpdate(() => {
      if (!isActing) neutralPose();
      maybeDoIdleAction(k.dt());
      // Attach shoes/feet to leg bottoms and match rotation
      const rp = (hero as any).root.pos as { x: number; y: number };
      const legTopL = { x: rp.x - 7 * s, y: rp.y + bodyH / 2 };
      const legTopR = { x: rp.x + 7 * s, y: rp.y + bodyH / 2 };
      const len = 28 * s;
      const deg2rad = (d: number) => (d * Math.PI) / 180;
      const aL = ((hero as any).legLeft.angle ?? 0);
      const aR = ((hero as any).legRight.angle ?? 0);
      const lx = legTopL.x + Math.sin(deg2rad(aL)) * len;
      const ly = legTopL.y + Math.cos(deg2rad(aL)) * len;
      const rx = legTopR.x + Math.sin(deg2rad(aR)) * len;
      const ry = legTopR.y + Math.cos(deg2rad(aR)) * len;
      (hero as any).footLeft.pos = k.vec2(lx, ly);
      (hero as any).footRight.pos = k.vec2(rx, ry);
      (hero as any).footLeft.angle = aL;
      (hero as any).footRight.angle = aR;
    });

    // Rock ledge/platform under hero
    const platformZ = 4.5;
    const ledgeWidth = Math.min(viewW * 0.72, 420);
    const ledgeHeight = Math.max(30, Math.floor(viewH * 0.08));
    const ledgeY = platformTopY + ledgeHeight / 2;
    const platform = k.add([
      k.rect(ledgeWidth, ledgeHeight, { radius: 10 }),
      k.pos(viewW / 2, ledgeY),
      k.anchor("center"),
      k.color(88, 72, 64),
      { z: platformZ },
    ]);
    // Ledge layers for stylized rock look
    const slab1 = k.add([
      k.rect(ledgeWidth * 0.75, ledgeHeight * 0.7, { radius: 10 }),
      k.pos(viewW / 2 - ledgeWidth * 0.12, ledgeY + ledgeHeight * 0.08),
      k.anchor("center"),
      k.color(74, 60, 54),
      { z: platformZ + 0.01 },
    ]);
    const slab2 = k.add([
      k.rect(ledgeWidth * 0.46, ledgeHeight * 0.5, { radius: 8 }),
      k.pos(viewW / 2 + ledgeWidth * 0.08, ledgeY + ledgeHeight * 0.25),
      k.anchor("center"),
      k.color(64, 50, 45),
      { z: platformZ + 0.02 },
    ]);

    // Add a simple face on the head, looking at camera
    const eyeCol = k.rgb(30, 30, 30);
    const eyeSize = 3 * s;
    const mouthW = 7 * s;
    const mouthH = 2 * s;
    (hero as any).head.add([k.rect(eyeSize, eyeSize, { radius: 1 * s }), k.pos(-3 * s, -2 * s), k.anchor("center"), k.color(eyeCol), k.z(13.5)]);
    (hero as any).head.add([k.rect(eyeSize, eyeSize, { radius: 1 * s }), k.pos(3 * s, -2 * s), k.anchor("center"), k.color(eyeCol), k.z(13.5)]);
    (hero as any).head.add([k.rect(mouthW, mouthH, { radius: 1 * s }), k.pos(0, 4 * s), k.anchor("center"), k.color(60, 40, 40), k.z(13.6)]);

    // Try to load and show the betaspray logo; fallback to text if not found
    (async () => {
      const candidates = [
        "/assets/betaspray.png",
        "/assets/betaspray.webp",
        "/assets/logo.png",
        "/assets/logo.webp",
      ];
      let loaded = false;
      for (const p of candidates) {
        try {
          await k.loadSprite("menu_logo", p as any);
          const logo = k.add([
            k.sprite("menu_logo"),
            k.pos(viewW / 2, viewH * 0.18),
            k.anchor("center"),
            k.z(2000),
          ]);
          // Fit within 80% of width
          const desired = viewW * 0.8;
          const w = (logo as any).width ?? desired;
          const s = Math.min(1.0, desired / w);
          (logo as any).scale = s;
          loaded = true;
          break;
        } catch (e) {
          // try next candidate
        }
      }
      if (!loaded) {
        k.add([
          k.text("betaspray.", { size: 72 }),
          k.pos(viewW / 2, viewH * 0.18),
          k.anchor("center"),
          k.color(38, 58, 66),
          k.z(2000),
        ]);
      }
    })();

    // Always add a wavy "betaspray" title text with blue fill and white outline
    const titleStr = "betaspray";
    const baseY = viewH * 0.18;
    const size = Math.round(64 * ((GAME_CONFIG as any).uiScale ?? 1));
    const letterSpacing = Math.round(size * 0.12);
    const blue = k.rgb(28, 120, 200);

    type LetterObj = { root: ReturnType<KaboomCtx["add"]>; main: ReturnType<KaboomCtx["add"]> };
    const letters: LetterObj[] = [];

    function addOutlinedLetter(ch: string): LetterObj {
      const root = k.add([k.pos(0, 0), k.anchor("center"), k.z(2001)]);
      const outlineOffsets = [
        [-2, 0], [2, 0], [0, -2], [0, 2],
        [-2, -2], [2, -2], [-2, 2], [2, 2],
      ];
      for (const [ox, oy] of outlineOffsets) {
        root.add([k.text(ch, { size }), k.pos(ox, oy), k.anchor("center"), k.color(255, 255, 255)]);
      }
      const main = root.add([k.text(ch, { size }), k.anchor("center"), k.color(blue)]);
      return { root, main };
    }

    let totalWidth = 0;
    const advances: number[] = [];
    for (const ch of titleStr.split("")) {
      const l = addOutlinedLetter(ch);
      letters.push(l);
      const w = ((l.main as any).width ?? size * 0.6) as number;
      const adv = w + letterSpacing;
      advances.push(adv);
      totalWidth += adv;
    }
    const startX = viewW / 2 - totalWidth / 2;
    let x = startX;
    for (let i = 0; i < letters.length; i++) {
      const l = letters[i];
      const adv = advances[i];
      (l.root as any).pos = k.vec2(x + adv / 2, baseY);
      x += adv;
    }

    // Wave animation
    k.onUpdate(() => {
      const t = k.time();
      for (let i = 0; i < letters.length; i++) {
        const l = letters[i];
        const dy = Math.sin(t * 3 + i * 0.5) * (size * 0.08);
        (l.root as any).pos.y = baseY + dy;
      }
    });

    // Bottom panel behind hint text
    const hintPanel = k.add([
      k.rect(viewW * 0.92, 66, { radius: 20 }),
      k.pos(viewW / 2, viewH - 36),
      k.anchor("center"),
      k.color(60, 50, 46),
      k.opacity(0.95),
      k.z(1999),
    ]);
    const hint = k.add([
      k.text("Tap Space/Enter to Start", { size: 28, width: viewW - 40, align: "center" }),
      k.pos(viewW / 2, viewH - 40),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.z(2000),
    ]);

    function playWithExitAnim() {
      if ((playWithExitAnim as any)._running) return;
      (playWithExitAnim as any)._running = true;
      // 1s transition: turn sideways and walk toward wall center
      isActing = true;
      const rp = (hero as any).root.pos as { x: number; y: number };
      const x0 = rp.x;
      const x1 = wallCenterX; // converge to center
      const duration = 1.0;
      // Slight body turn (tilt), head forward, arms swing lightly
      k.tween((hero as any).body.angle ?? 0, 8, duration * 0.5, (v) => ((hero as any).body.angle = v), easings.easeInOutSine);
      k.tween((hero as any).armLeft.angle ?? 190, 210, duration * 0.5, (v) => ((hero as any).armLeft.angle = v), easings.easeInOutSine);
      k.tween((hero as any).armRight.angle ?? 170, 150, duration * 0.5, (v) => ((hero as any).armRight.angle = v), easings.easeInOutSine);
      // Walk forward visually by bobbing root x toward center and leg swing
      const stepCycles = 2;
      const half = duration / (stepCycles * 2);
      const walkOne = (dir: 1 | -1, onDone?: () => void) => {
        k.tween((hero as any).root.pos.x, (hero as any).root.pos.x + dir * 6 * s, half, (v) => ((hero as any).root.pos.x = v), easings.easeInOutSine).then?.(() => {
          k.tween((hero as any).root.pos.x, (hero as any).root.pos.x - dir * 6 * s, half, (v) => ((hero as any).root.pos.x = v), easings.easeInOutSine).then?.(() => onDone?.());
        });
        k.tween((hero as any).legLeft.angle ?? 0, 10 * dir, half, (v) => ((hero as any).legLeft.angle = v), easings.easeOutSine).then?.(() => {
          k.tween((hero as any).legLeft.angle ?? 0, 0, half, (v) => ((hero as any).legLeft.angle = v), easings.easeInSine);
        });
        k.tween((hero as any).legRight.angle ?? 0, -10 * dir, half, (v) => ((hero as any).legRight.angle = v), easings.easeOutSine).then?.(() => {
          k.tween((hero as any).legRight.angle ?? 0, 0, half, (v) => ((hero as any).legRight.angle = v), easings.easeInSine);
        });
      };
      // Move toward center over full duration
      k.tween(x0, x1, duration, (v) => ((hero as any).root.pos.x = v), easings.easeInOutSine);
      // Chain a couple walk cycles, then go to game
      walkOne(1, () => walkOne(-1, () => {
        isActing = false;
        k.go("game", { autoStart: true });
      }));
    }

    const start = () => playWithExitAnim();
    ["space", "enter", "left", "right", "a", "d"].forEach((key) => k.onKeyPress(key as any, start));
    k.onClick(start);
  });
}


