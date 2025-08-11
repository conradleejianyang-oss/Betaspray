import { KaboomCtx, EventController } from "kaboom";
import { Side } from "../config";

export type InputCallbacks = {
  onMove: (side: Side) => void;
  onStart: () => void;
};

/**
 * Wires keyboard and mobile button inputs.
 */
export function setupInput(k: KaboomCtx, cbs: InputCallbacks): () => void {
  const onLeft = () => cbs.onMove("left");
  const onRight = () => cbs.onMove("right");
  const onStart = () => cbs.onStart();

  // Keyboard
  const ctrls: EventController[] = [];
  ctrls.push(k.onKeyPress("a", () => { onLeft(); }));
  ctrls.push(k.onKeyPress("left", () => { onLeft(); }));
  ctrls.push(k.onKeyPress("d", () => { onRight(); }));
  ctrls.push(k.onKeyPress("right", () => { onRight(); }));
  ctrls.push(k.onKeyPress("space", onStart));
  ctrls.push(k.onKeyPress("enter", onStart));

  // Pointer buttons
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const add = (el: HTMLElement | null, fn: () => void) => {
    if (!el) return () => {};
    const handler = (e: Event) => { e.preventDefault(); fn(); };
    el.addEventListener("pointerdown", handler);
    return () => el.removeEventListener("pointerdown", handler);
  };
  const domUnsubLeft = add(btnLeft as HTMLElement, onLeft);
  const domUnsubRight = add(btnRight as HTMLElement, onRight);

  return () => {
    ctrls.forEach((c) => c.cancel());
    domUnsubLeft();
    domUnsubRight();
  };
}


