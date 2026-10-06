// One shared frame loop for every running value and world.
// Tasks get the frame time step in seconds. A long pause (hidden tab, debugger) is clamped so a
// simulation never takes one giant step and objects never fly through walls.

export type Task = (dt: number, now: number) => void;

const MAX_DT = 1 / 20;
const tasks = new Set<Task>();
let scheduled = false;
let manual = false;
let last = -1;
let clock = 0;

const hasRaf = () => typeof requestAnimationFrame === "function";

function schedule(): void {
  if (scheduled || manual || tasks.size === 0) return;
  scheduled = true;
  if (hasRaf()) requestAnimationFrame(frame);
  else setTimeout(() => frame(now()), 16);
}

function frame(time: number): void {
  scheduled = false;
  if (manual) return;
  const dt = last < 0 ? 1 / 60 : Math.min(Math.max((time - last) / 1000, 0), MAX_DT);
  last = time;
  run(dt, time);
  if (tasks.size > 0) schedule();
  else last = -1;
}

function run(dt: number, time: number): void {
  for (const task of [...tasks]) {
    if (tasks.has(task)) task(dt, time);
  }
}

/** Current time in milliseconds, from the manual clock while the loop is in manual mode. */
export function now(): number {
  if (manual) return clock;
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export const loop = {
  /** Runs `task` on every frame until the returned function is called. */
  add(task: Task): () => void {
    tasks.add(task);
    schedule();
    return () => {
      tasks.delete(task);
    };
  },
  /**
   * Switches to manual stepping (for tests, server rendering or video export) or back to
   * requestAnimationFrame.
   */
  manual(on = true): void {
    manual = on;
    last = -1;
    if (!on) schedule();
  },
  /** Advances the manual clock by `ms` and runs one frame. Only has an effect in manual mode. */
  step(ms = 1000 / 60): void {
    if (!manual) return;
    clock += ms;
    run(Math.min(ms / 1000, MAX_DT), clock);
  },
  /** Number of running tasks. */
  get size(): number {
    return tasks.size;
  },
};
