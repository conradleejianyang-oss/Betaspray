import { KaboomCtx } from "kaboom";
import { GAME_CONFIG } from "../config";

type TextObj = ReturnType<KaboomCtx["add"]> & { text?: string };

export type Hud = {
  setScore: (score: number, best: number) => void;
  setTime: (seconds: number) => void;
};

export function createHud(k: KaboomCtx): Hud {
  const padding = 10;
  const scoreText = k.add([
    k.text("0", { size: Math.round(24 * (GAME_CONFIG as any).uiScale ?? 1), font: "sink" }),
    k.pos(padding, padding),
    k.z(4000),
    k.color(255, 255, 255),
  ]) as TextObj;

  // Make the time bar 15% narrower but keep it centered
  const fullWidth = k.width() - padding * 2;
  const barWidth = Math.floor(fullWidth * 0.85);
  const barHeight = 10;
  const bgX = Math.floor((k.width() - barWidth) / 2);
  const bg = k.add([
    k.rect(barWidth, barHeight),
    k.pos(bgX, padding + 30),
    k.color(255, 255, 255),
    k.opacity(0.12),
    k.z(4000),
  ]);
  const timeBar = k.add([
    k.rect(barWidth, barHeight),
    k.pos(bgX, padding + 30),
    k.color(80, 200, 120),
    k.z(4001),
    { fullWidth: barWidth },
  ]);

  function setTime(t: number) {
    const frac = Math.max(0, Math.min(1, t / GAME_CONFIG.timeBar.maxSeconds));
    timeBar.width = (timeBar as any).fullWidth * frac;
    const danger = frac < (GAME_CONFIG.timeBar.dangerThreshold);
    timeBar.color = danger ? k.rgb(230, 70, 70) : k.rgb(80, 200, 120);
  }

  function setScore(score: number, best: number) {
    if (scoreText) scoreText.text = `${score} (best ${best})`;
  }

  return { setScore, setTime };
}


