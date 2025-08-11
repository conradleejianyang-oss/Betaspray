import { KaboomCtx } from "kaboom";
import { GAME_CONFIG, Side } from "../config";
import { GameState, loadBest, saveBest } from "../core/state";
import { setupInput } from "../core/input";
import { createObstacleState, nextObstacle, seedInitialSegments, generateHoldSpec } from "../systems/obstacles";
import { createHud } from "../systems/hud";
import { spawnBackground } from "../render/background";
import { spawnRockWall } from "../render/rock";
import { reachToSide, spawnClimber, estimateClimberHeightPx } from "../systems/climber";

export function defineGameScene(k: KaboomCtx) {
  k.scene("game", (opts?: { autoStart?: boolean }) => {
    // World setup
    const viewW = k.width();
    const viewH = k.height();
    const wallCenterX = viewW / 2;
    // Clip trees to stay behind the rock wall width
    spawnBackground(k, k.vec2(viewW, viewH), { treeClip: { centerX: wallCenterX, width: GAME_CONFIG.wall.width } });
    const wallTop = 50;
    const wallBottom = viewH - 40;
    // Derive segment height from climber height ratio request (0.35 of climber)
    const climberScale = 1.15 * 1.10;
    const climberHeight = estimateClimberHeightPx(climberScale);
    // Target 7 segments visible: H / 7, but ensure minimum 50px separation between circles
    const segmentH = Math.max(50, Math.floor(viewH / 7));
    const numSegmentsOnScreen = Math.ceil((wallBottom - wallTop) / segmentH) + 2;
    const INDICATOR_RADIUS = 10;
    const INDICATOR_Y_RATIO = -0.25; // relative to segment center

    // Opaque rock face with irregular silhouette and lane helpers
    const rock = spawnRockWall(k, wallCenterX, viewH, GAME_CONFIG.wall.width, segmentH);

    // Obstacles visuals container
    const obstaclesLayer = k.add([k.pos(0, 0), k.z(1)]);

    // Game state
    const rngState = createObstacleState();
    const initialSegments = seedInitialSegments(numSegmentsOnScreen + 5, rngState.rng);
    let state: GameState = {
      phase: "READY",
      score: 0,
      best: loadBest(),
      timeRemaining: GAME_CONFIG.timeBar.maxSeconds,
      playerSide: "left",
      segments: initialSegments,
      sameSideRun: 0,
      lastObstacleSide: null,
      inputLockedUntilMs: 0,
    };

    const hud = createHud(k);
    hud.setTime(state.timeRemaining);
    hud.setScore(0, state.best);

    // Button helper: circular gray background with hover highlight
    function createCircleButton(label: string, x: number, y: number, radius: number, z: number, onClick: () => void) {
      const root = k.add([k.pos(x, y), k.anchor("center"), k.z(z)]);
      const baseCol = k.rgb(180, 180, 180);
      const hoverCol = k.rgb(220, 220, 220);
      const textCol = k.rgb(40, 40, 40);
      const bg = root.add([k.circle(radius), k.color(baseCol), k.opacity(0.9), k.area()]);
      const size = Math.round(radius * 0.9 * ((GAME_CONFIG as any).uiScale ?? 1));
      const tx = root.add([k.text(label, { size, width: radius * 1.6, align: "center" }), k.anchor("center"), k.color(textCol)]);
      (bg as any).onClick?.(onClick);
      (bg as any).onHover?.(() => { (bg as any).color = hoverCol; });
      (bg as any).onHoverEnd?.(() => { (bg as any).color = baseCol; });
      return { root, bg, tx } as const;
    }

    // Pause button (top-right)
    const pauseBtn = createCircleButton("II", viewW - 28, 28, 18, 1500, () => {
      if (state.phase === "PLAY") setPhase("PAUSED");
    });

    // Pause menu state (declared early to avoid TDZ)
    let resumeBtn: ReturnType<typeof createCircleButton> | null = null;
    let menuBtn: ReturnType<typeof createCircleButton> | null = null;
    let pauseTitle: Obj | null = null;
    function destroyPauseMenu() {
      resumeBtn?.root?.destroy();
      menuBtn?.root?.destroy();
      pauseTitle?.destroy();
      resumeBtn = null;
      menuBtn = null;
      pauseTitle = null;
    }

    // Make the climber 15% taller and move up 10%, then shift up by an extra 50px
    const climberBaseY = wallBottom - segmentH * 1.2 + (viewH * 0.10) - 50;
    const climber = spawnClimber(k, wallCenterX, climberBaseY, climberScale);

    type Obj = ReturnType<KaboomCtx["add"]> & Record<string, any>;
    const segmentNodes: Obj[] = [];
    let currentIndicator: Obj | null = null;
    function drawSegments() {
      for (const n of segmentNodes) n.destroy();
      segmentNodes.length = 0;
      const nextIdx = getNextSegmentIndex();
      for (let i = 0; i < numSegmentsOnScreen + 2; i++) {
        const seg = state.segments[i];
        if (!seg || !seg.side) continue;
        const baseY = wallBottom - i * segmentH - segmentH / 2;
        let yPos = baseY + INDICATOR_Y_RATIO * segmentH - viewH * 0.10;
        const xPos = rock.laneXAt(yPos, seg.side);
        const c = obstaclesLayer.add([k.circle(INDICATOR_RADIUS), k.pos(xPos, yPos), k.anchor("center"), k.color(230, 60, 60), k.opacity(0.95), k.z(1.2)]) as Obj;
        segmentNodes.push(c);
        if (i === nextIdx) currentIndicator = c;
      }
    }
    drawSegments();
    // Compute the vertical target at the climber's reachable height
    function getTargetY(): number {
      const s = (climber as any).scale ?? 1;
      const reachTarget = (climber as any).headRadius * 2;
      const armBase = 18 * s;
      const holdOffset = armBase + reachTarget * 0.9;
      return climber.root.pos.y - holdOffset;
    }

    function getNextSegmentIndex(): number {
      const targetY = getTargetY();
      let bestIdx = 0;
      let bestDelta = Number.POSITIVE_INFINITY;
      for (let i = 0; i < state.segments.length; i++) {
        const seg = state.segments[i];
        if (!seg || !seg.side) continue;
        const baseY = wallBottom - i * segmentH - segmentH / 2;
        const yPos = baseY + INDICATOR_Y_RATIO * segmentH - viewH * 0.10;
        const delta = targetY - yPos; // positive if indicator is above the climber target
        if (delta > 0 && delta < bestDelta) {
          bestDelta = delta;
          bestIdx = i;
        }
      }
      return bestIdx;
    }


    // Overlays
    const overlay = k.add([
      k.rect(viewW, viewH),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0.25),
      k.z(3000),
    ]) as Obj;
    const overlayText = k.add([
      k.text("Tap Space/Enter to Start", { size: 24, width: viewW - 40, align: "center" }),
      k.pos(viewW / 2, viewH / 2),
      k.anchor("center"),
      k.z(3001),
      k.color(255, 255, 255),
    ]) as Obj;

    function setPhase(phase: "READY" | "PLAY" | "PAUSED" | "OVER", reason?: string) {
      state.phase = phase;
      if (phase === "READY") {
        overlay.hidden = false;
        overlayText.hidden = false;
        overlayText.text = `Tap Space/Enter to Start`;
      } else if (phase === "PLAY") {
        overlay.hidden = true;
        overlayText.hidden = true;
        // hide pause menu entries if any
        destroyPauseMenu();
      } else if (phase === "OVER") {
        overlay.hidden = false;
        overlayText.hidden = false;
        const best = Math.max(state.best, state.score);
        if (best !== state.best) {
          state.best = best; saveBest(best);
        }
        overlayText.text = `${reason ?? "Pumped out!"}\nScore ${state.score}  •  Best ${state.best}\nPress Space/Enter to Restart`;
      } else if (phase === "PAUSED") {
        overlay.hidden = false;
        // Hide the big center text to avoid overlap with pause menu entries
        overlayText.hidden = true;
        showPauseMenu();
      }
    }

    function refillTime() {
      state.timeRemaining = Math.min(
        GAME_CONFIG.timeBar.maxSeconds,
        state.timeRemaining + GAME_CONFIG.timeBar.refillOnStepSeconds,
      );
      hud.setTime(state.timeRemaining);
    }

    let isScrolling = false;
    function scrollUp() {
      if (isScrolling) return;
      isScrolling = true;
      const duration = 0.15;
      const startY = obstaclesLayer.pos.y;
      const tw = k.tween(startY, startY + segmentH, duration, (v) => ((obstaclesLayer as any).pos.y = v), k.easings.linear);
      const rockTw = rock.scrollOnce(duration);
      tw.then?.(() => {
        obstaclesLayer.pos.y = 0;
        // shift segments down and spawn new top
        state.segments.shift();
        const n = nextObstacle(state.score, state.lastObstacleSide, state.sameSideRun, rngState.rng);
        state.segments.push({ side: n.side } as any);
        state.lastObstacleSide = n.newLast;
        state.sameSideRun = n.newRun;
        drawSegments();
        isScrolling = false;
      });
    }

    function handleMove(side: Side) {
      if (state.phase !== "PLAY") return;
      if (isScrolling) return; // prevent overlapping moves during scroll
      const now = performance.now();
      if (now < state.inputLockedUntilMs) return;
      state.inputLockedUntilMs = now + GAME_CONFIG.inputLockMs;
      const nextSeg = state.segments[getNextSegmentIndex()];
      if (nextSeg && nextSeg.side !== side) {
        setPhase("OVER", `Wrong hold — use ${nextSeg.side}!`);
        return;
      }
      // success
      state.playerSide = side;
      reachToSide(k, climber, side);
      state.score += 1;
      hud.setScore(state.score, state.best);
      refillTime();
      // haptics
      if (navigator.vibrate) navigator.vibrate(15);
      scrollUp();
    }

    function handleStart() {
      if (state.phase === "READY" || state.phase === "OVER") {
        // reset
        state.score = 0;
        state.timeRemaining = GAME_CONFIG.timeBar.maxSeconds;
        state.playerSide = "left";
        state.segments = seedInitialSegments(numSegmentsOnScreen + 5, rngState.rng);
        state.sameSideRun = 0;
        state.lastObstacleSide = null;
        hud.setScore(0, state.best);
        hud.setTime(state.timeRemaining);
        drawSegments();
        setPhase("PLAY");
      }
    }

    const detachInput = setupInput(k, { onMove: handleMove, onStart: handleStart });
    if (opts?.autoStart) setPhase("PLAY");

    // Timer with difficulty ramp: time depletes faster as score increases,
    // tapering at a cap where full bar drains in ~0.5s at extreme.
    k.onUpdate(() => {
      if (state.phase !== "PLAY") return;
      const dt = Math.min(GAME_CONFIG.maxDtSeconds, k.dt());
      // Base drain
      let drain = dt;
      // Ramp factor grows with score then tapers (asymptotic to target rate)
      const ramp = Math.min(1.8, 0.015 * state.score); // up to +180% drain
      drain *= 1 + ramp;
      // Hard cap so entire bar can drain in ~0.5s at extreme
      const current = state.timeRemaining;
      const full = GAME_CONFIG.timeBar.maxSeconds;
      const maxPerSecond = full / 0.5; // seconds-of-bar per real second
      const maxDrain = (maxPerSecond * dt) / full; // normalized seconds
      drain = Math.min(drain, maxDrain);
      state.timeRemaining -= drain;
      hud.setTime(state.timeRemaining);
      if (state.timeRemaining <= 0) {
        setPhase("OVER", "Pumped out!");
      }
      // No dynamic repositioning; indicators stay at their segment positions
    });

    // Pause menu UI
    function showPauseMenu() {
      if (resumeBtn) return;
      pauseTitle = k.add([k.text("Paused", { size: 30 }), k.pos(viewW / 2, viewH / 2 - 120), k.anchor("center"), k.color(255, 255, 255), k.z(2100)]) as Obj;
      resumeBtn = createCircleButton("▶", viewW / 2, viewH / 2 - 30, 24, 2100, () => setPhase("PLAY"));
      menuBtn = createCircleButton("⌂", viewW / 2, viewH / 2 + 30, 22, 2100, () => k.go("menu"));
    }

    k.onSceneLeave(() => detachInput());
  });
}


