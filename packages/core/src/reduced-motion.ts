export type ReducedMotion = "user" | "always" | "never";

let mode: ReducedMotion = "user";

/**
 * "user" (default) follows the prefers-reduced-motion setting, "always" skips animated
 * transitions everywhere, "never" ignores the setting. Direct manipulation (dragging, the
 * world simulation) always follows the pointer; only automatic motion is skipped.
 */
export function setReducedMotion(value: ReducedMotion): void {
  mode = value;
}

export function reducedMotion(): boolean {
  if (mode !== "user") return mode === "always";
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
