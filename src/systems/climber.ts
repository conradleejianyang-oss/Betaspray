import { KaboomCtx } from "kaboom";
import { GAME_CONFIG, Side } from "../config";
// swing/rotation feature removed

type Obj = ReturnType<KaboomCtx["add"]> & Record<string, any>;

export type Climber = {
  root: Obj;
  body: Obj;
  head: Obj;
  hair: Obj;
  neck: Obj;
  belt: Obj;
  harness: Obj;
  legLeft: Obj;
  legRight: Obj;
  footLeft: Obj;
  footRight: Obj;
  armLeft: Obj;
  armRight: Obj;
  rope: Obj;
  side: Side;
  jitterTime: number;
  leftX: number;
  rightX: number;
  baseY: number;
  armReachLeft: number;
  armReachRight: number;
  headRadius: number;
  scale: number;
};

export function spawnClimber(k: KaboomCtx, wallCenterX: number, baseY: number, modelScale = 1): Climber {
  const s = modelScale;
  const laneOffset = GAME_CONFIG.wall.width * 0.25;
  const leftX = wallCenterX - laneOffset;
  const rightX = wallCenterX + laneOffset;

  const root = k.add([k.pos(leftX, baseY), k.anchor("center"), k.z(10)]) as Obj;

  const shirtColor = k.rgb(28, 120, 200);
  const shirtDark = k.rgb(20, 92, 160);
  const skin = k.rgb(250, 215, 170);
  const hairColor = k.rgb(60, 40, 30);
  const pants = k.rgb(170, 120, 40);
  const shoe = k.rgb(22, 26, 30);
  const harnessRed = k.rgb(180, 50, 40);
  const beltColor = k.rgb(200, 80, 40);
  const ropeColor = k.rgb(230, 110, 40);

  const bodyW = 24 * s;
  const bodyH = 30 * s;
  const body = k.add([k.rect(bodyW, bodyH, { radius: 2 * s }), k.pos(0, 0), k.color(shirtColor), k.anchor("center"), k.z(11), k.rotate(0)]) as Obj;
  const neck = k.add([k.rect(8 * s, 4 * s, { radius: 1 * s }), k.pos(0, -(bodyH / 2 + 6 * s)), k.anchor("center"), k.color(skin), k.z(12), k.rotate(0)]) as Obj;
  const headRadius = 8 * s;
  const head = k.add([k.rect(14 * s, 14 * s, { radius: 1 * s }), k.pos(0, -(bodyH / 2 + 14 * s)), k.anchor("center"), k.color(skin), k.z(13), k.rotate(0)]) as Obj;
  // hair back block and side lock
  const hair = k.add([k.rect(16 * s, 16 * s), k.pos(-2 * s, -(bodyH / 2 + 16 * s)), k.anchor("center"), k.color(hairColor), k.z(12), k.rotate(0)]) as Obj;

  const belt = k.add([k.rect(bodyW, 5 * s, { radius: 1 * s }), k.pos(0, bodyH / 2 - 7 * s), k.anchor("center"), k.color(beltColor), k.z(12), k.rotate(0)]) as Obj;
  // harness loops
  const harnessL = k.add([k.rect(10 * s, 8 * s, { radius: 2 * s }), k.pos(-6 * s, bodyH / 2 - 2 * s), k.anchor("center"), k.color(harnessRed), k.z(12), k.rotate(0)]) as Obj;
  const harnessR = k.add([k.rect(10 * s, 8 * s, { radius: 2 * s }), k.pos(6 * s, bodyH / 2 - 2 * s), k.anchor("center"), k.color(harnessRed), k.z(12), k.rotate(0)]) as Obj;

  const legLeft = k.add([k.rect(10 * s, 28 * s, { radius: 1 * s }), k.pos(-7 * s, bodyH / 2), k.anchor("top"), k.color(pants), k.z(10), k.rotate(0)]) as Obj;
  const legRight = k.add([k.rect(10 * s, 28 * s, { radius: 1 * s }), k.pos(7 * s, bodyH / 2), k.anchor("top"), k.color(pants), k.z(10), k.rotate(0)]) as Obj;
  const footLeft = k.add([k.rect(10 * s, 6 * s, { radius: 1 * s }), k.pos(-7 * s, bodyH / 2 + 28 * s), k.anchor("top"), k.color(shoe), k.z(10), k.rotate(0)]) as Obj;
  const footRight = k.add([k.rect(10 * s, 6 * s, { radius: 1 * s }), k.pos(7 * s, bodyH / 2 + 28 * s), k.anchor("top"), k.color(shoe), k.z(10), k.rotate(0)]) as Obj;

  // overhead arms
  const armLeft = k.add([k.rect(6 * s, 28 * s, { radius: 1 * s }), k.pos(-12 * s, -(bodyH / 2)), k.anchor("bot"), k.color(skin), k.z(12), k.rotate(0)]) as Obj;
  const armRight = k.add([k.rect(6 * s, 28 * s, { radius: 1 * s }), k.pos(12 * s, -(bodyH / 2)), k.anchor("bot"), k.color(skin), k.z(12), k.rotate(0)]) as Obj;
  // Extra-long rope so it dangles off screen
  const rope = k.add([k.rect(2 * s, Math.max(80 * s, k.height() * 2)), k.pos(0, -36 * s), k.anchor("top"), k.color(ropeColor), k.z(9), k.rotate(0)]) as Obj;

  // No torso container; parts are positioned relative to root each frame

  // Detail overlays (muscle contours & highlights)
  // Torso highlights
  const shirtLight = k.rgb(40, 150, 220);
  const skinShadow = k.rgb(235, 200, 158);
  const pantsDark = k.rgb(140, 100, 32);

  const pecL = body.add([k.rect(10 * s, 6 * s, { radius: 2 * s }), k.pos(-6 * s, -10 * s), k.anchor("center"), k.color(shirtLight), k.opacity(0.25), k.z(11.1), k.rotate(-8)]) as Obj;
  const pecR = body.add([k.rect(10 * s, 6 * s, { radius: 2 * s }), k.pos(6 * s, -10 * s), k.anchor("center"), k.color(shirtLight), k.opacity(0.25), k.z(11.1), k.rotate(8)]) as Obj;
  const abs1 = body.add([k.rect(8 * s, 4 * s, { radius: 1 * s }), k.pos(0, 0), k.anchor("center"), k.color(shirtDark), k.opacity(0.18), k.z(11.1)]) as Obj;
  const abs2 = body.add([k.rect(8 * s, 4 * s, { radius: 1 * s }), k.pos(0, 6 * s), k.anchor("center"), k.color(shirtDark), k.opacity(0.18), k.z(11.1)]) as Obj;
  const abs3 = body.add([k.rect(8 * s, 4 * s, { radius: 1 * s }), k.pos(0, 12 * s), k.anchor("center"), k.color(shirtDark), k.opacity(0.18), k.z(11.1)]) as Obj;
  const obliqueL = body.add([k.rect(6 * s, 10 * s, { radius: 2 * s }), k.pos(-10 * s, 4 * s), k.anchor("center"), k.color(shirtDark), k.opacity(0.12), k.z(11.05), k.rotate(18)]) as Obj;
  const obliqueR = body.add([k.rect(6 * s, 10 * s, { radius: 2 * s }), k.pos(10 * s, 4 * s), k.anchor("center"), k.color(shirtDark), k.opacity(0.12), k.z(11.05), k.rotate(-18)]) as Obj;

  // Neck shadow
  const neckShade = neck.add([k.rect(8 * s, 3 * s, { radius: 1 * s }), k.pos(0, 1 * s), k.anchor("top"), k.color(skinShadow), k.opacity(0.25), k.z(12.1)]) as Obj;

  // Arm contours
  const lBicep = armLeft.add([k.rect(7 * s, 10 * s, { radius: 3 * s }), k.pos(0, -16 * s), k.anchor("center"), k.color(skinShadow), k.opacity(0.22), k.z(12.1)]) as Obj;
  const lFore = armLeft.add([k.rect(6 * s, 9 * s, { radius: 2 * s }), k.pos(0, -6 * s), k.anchor("center"), k.color(skinShadow), k.opacity(0.18), k.z(12.1)]) as Obj;
  const rBicep = armRight.add([k.rect(7 * s, 10 * s, { radius: 3 * s }), k.pos(0, -16 * s), k.anchor("center"), k.color(skinShadow), k.opacity(0.22), k.z(12.1)]) as Obj;
  const rFore = armRight.add([k.rect(6 * s, 9 * s, { radius: 2 * s }), k.pos(0, -6 * s), k.anchor("center"), k.color(skinShadow), k.opacity(0.18), k.z(12.1)]) as Obj;

  // Leg contours
  const thighL = legLeft.add([k.rect(10 * s, 16 * s, { radius: 2 * s }), k.pos(0, 8 * s), k.anchor("top"), k.color(pantsDark), k.opacity(0.18), k.z(10.1)]) as Obj;
  const thighR = legRight.add([k.rect(10 * s, 16 * s, { radius: 2 * s }), k.pos(0, 8 * s), k.anchor("top"), k.color(pantsDark), k.opacity(0.18), k.z(10.1)]) as Obj;
  const shinL = legLeft.add([k.rect(8 * s, 10 * s, { radius: 2 * s }), k.pos(0, 18 * s), k.anchor("top"), k.color(pantsDark), k.opacity(0.12), k.z(10.1)]) as Obj;
  const shinR = legRight.add([k.rect(8 * s, 10 * s, { radius: 2 * s }), k.pos(0, 18 * s), k.anchor("top"), k.color(pantsDark), k.opacity(0.12), k.z(10.1)]) as Obj;
  const kneeL = legLeft.add([k.circle(2.5 * s), k.pos(0, 16 * s), k.anchor("center"), k.color(220, 220, 220), k.opacity(0.15), k.z(10.2)]) as Obj;
  const kneeR = legRight.add([k.circle(2.5 * s), k.pos(0, 16 * s), k.anchor("center"), k.color(220, 220, 220), k.opacity(0.15), k.z(10.2)]) as Obj;

  // Foot highlight
  const footHL = footLeft.add([k.rect(9 * s, 2 * s, { radius: 1 * s }), k.pos(0, 2 * s), k.anchor("top"), k.color(255, 255, 255), k.opacity(0.1), k.z(10.1)]) as Obj;
  const footHR = footRight.add([k.rect(9 * s, 2 * s, { radius: 1 * s }), k.pos(0, 2 * s), k.anchor("top"), k.color(255, 255, 255), k.opacity(0.1), k.z(10.1)]) as Obj;

  // swing debug visuals removed

  const c: Climber = {
    root,
    body,
    head,
    hair,
    neck,
    belt,
    harness: harnessL,
    legLeft,
    legRight,
    footLeft,
    footRight,
    armLeft,
    armRight,
    rope,
    side: "left",
    jitterTime: 0,
    leftX,
    rightX,
    baseY: baseY,
    armReachLeft: 0,
    armReachRight: 0,
    headRadius,
    scale: s,
  };

  k.onUpdate(() => {
    // Subtle sway (pre-swing behavior)
    const t = k.time();
    const sway = Math.sin(t * 2) * 1.3;
    body.angle = body.angle ?? 0;
    rope.angle = rope.angle ?? 0;
    body.angle = sway;
    rope.angle = sway * 0.6;
    // Idle breathing and head micro-movement
    const breathe = Math.sin(Math.PI * t);
    const breathOffset = breathe * 2; // px up/down every ~2s
    const headTilt = Math.sin(t * 2.6) * 3; // deg
    const headSwayX = Math.sin(t * 1.8) * 1.2; // px

    // Tiny hold jitter
    c.jitterTime += k.dt();
    const j = Math.sin(c.jitterTime * 18) * 0.8;
    // Position parts relative to root
    const rp = c.root.pos;
    body.pos = k.vec2(rp.x, rp.y + breathOffset);
    neck.pos = k.vec2(rp.x, rp.y + breathOffset - (bodyH / 2 + 6 * s));
    head.pos = k.vec2(rp.x + headSwayX, rp.y + breathOffset - (bodyH / 2 + 14 * s));
    head.angle = headTilt;
    hair.pos = k.vec2(rp.x - 2 * s + headSwayX * 0.6, rp.y + breathOffset - (bodyH / 2 + 16 * s));
    hair.angle = headTilt * 0.9;
    belt.pos = k.vec2(rp.x, rp.y + breathOffset + bodyH / 2 - 7 * s);
    harnessL.pos = k.vec2(rp.x - 6 * s, rp.y + breathOffset + bodyH / 2 - 2 * s);
    harnessR.pos = k.vec2(rp.x + 6 * s, rp.y + breathOffset + bodyH / 2 - 2 * s);
    legLeft.pos = k.vec2(rp.x - 7 * s, rp.y + bodyH / 2);
    legRight.pos = k.vec2(rp.x + 7 * s, rp.y + bodyH / 2);
    footLeft.pos = k.vec2(rp.x - 7 * s, rp.y + bodyH / 2 + 28 * s);
    footRight.pos = k.vec2(rp.x + 7 * s, rp.y + bodyH / 2 + 28 * s);
    rope.pos = k.vec2(rp.x, rp.y + breathOffset * 0.5 - 36 * s);
    // ensure rope stays long as screen size changes
    rope.height = Math.max((rope as any).height ?? 0, k.height() * 2);
    // Arms positions with reach offsets and subtle jitter on the active side
    const leftJit = c.side === "left" ? j : 0;
    const rightJit = c.side === "right" ? j : 0;
    const armsBaseY = rp.y + breathOffset - bodyH / 2;
    c.armLeft.pos = k.vec2(rp.x - 12 * s + leftJit, armsBaseY - c.armReachLeft);
    c.armRight.pos = k.vec2(rp.x + 12 * s + rightJit, armsBaseY - c.armReachRight);
  });

  return c;
}

/**
 * Estimate the full pixel height of the climber model for a given scale.
 * Derived from constructed parts: hair top to foot bottom ~72 px at scale 1.
 */
export function estimateClimberHeightPx(scale: number): number {
  return 72 * scale;
}

export function reachToSide(k: KaboomCtx, climber: Climber, side: Side): void {
  const targetX = side === "left" ? climber.leftX : climber.rightX;
  climber.side = side;
  const duration = GAME_CONFIG.inputLockMs / 1000;
  // Slide to lane
  k.tween(climber.root.pos.x, targetX, duration, (v) => (climber.root.pos.x = v), k.easings.easeOutCubic);

  // swing impulse removed

  // Hand-specific reach then pull
  const reachDur = duration * 0.5;
  const pullDur = duration * 0.5;
  const pullHeight = 8; // px visual lift

  if (side === "left") {
    const fromA = climber.armLeft.angle ?? 0;
    const reachTw = k.tween(fromA, -60, reachDur * 0.8, (v) => (climber.armLeft.angle = v), k.easings.easeOutCubic);
    reachTw.then?.(() => {
      k.tween(climber.armLeft.angle, 0, pullDur * 0.8, (v) => (climber.armLeft.angle = v), k.easings.easeOutCubic);
    });
    const reachTarget = climber.headRadius * 2; // one headlength
    k.tween(climber.armReachLeft, reachTarget, reachDur, (v) => (climber.armReachLeft = v), k.easings.linear).then?.(() => {
      k.tween(climber.armReachLeft, 0, pullDur, (v) => (climber.armReachLeft = v), k.easings.easeInCubic);
      const y0 = climber.root.pos.y;
      k.tween(y0, y0 - pullHeight, pullDur * 0.6, (v) => (climber.root.pos.y = v), k.easings.easeOutCubic).then?.(() => {
        k.tween(climber.root.pos.y, y0, pullDur * 0.4, (v) => (climber.root.pos.y = v), k.easings.easeInCubic);
      });
    });
  } else {
    const fromA = climber.armRight.angle ?? 0;
    const reachTw = k.tween(fromA, 60, reachDur * 0.8, (v) => (climber.armRight.angle = v), k.easings.easeOutCubic);
    reachTw.then?.(() => {
      k.tween(climber.armRight.angle, 0, pullDur * 0.8, (v) => (climber.armRight.angle = v), k.easings.easeOutCubic);
    });
    const reachTarget = climber.headRadius * 2; // one headlength
    k.tween(climber.armReachRight, reachTarget, reachDur, (v) => (climber.armReachRight = v), k.easings.linear).then?.(() => {
      k.tween(climber.armReachRight, 0, pullDur, (v) => (climber.armReachRight = v), k.easings.easeInCubic);
      const y0 = climber.root.pos.y;
      k.tween(y0, y0 - pullHeight, pullDur * 0.6, (v) => (climber.root.pos.y = v), k.easings.easeOutCubic).then?.(() => {
        k.tween(climber.root.pos.y, y0, pullDur * 0.4, (v) => (climber.root.pos.y = v), k.easings.easeInCubic);
      });
    });
  }
}


