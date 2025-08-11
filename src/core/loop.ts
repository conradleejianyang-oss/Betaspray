import kaboom, { KaboomCtx } from "kaboom";
import { GAME_CONFIG } from "../config";

export type AppContext = {
  k: KaboomCtx;
};

/**
 * Initialize kaboom with DPR scaling and full-viewport canvas.
 */
export function initKaboom(): AppContext {
  const k = kaboom({
    width: GAME_CONFIG.internalWidth,
    height: GAME_CONFIG.internalHeight,
    background: [196, 244, 248],
    global: false,
    touchToMouse: true,
    debug: (import.meta as any).env?.DEV ?? true,
    stretch: true,
    letterbox: true,
    crisp: true,
    pixelDensity: Math.max(1, Math.floor(window.devicePixelRatio || 1)),
    root: document.querySelector("#app") as HTMLElement,
  });
  return { k };
}


