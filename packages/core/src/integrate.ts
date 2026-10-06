// Runge-Kutta 4 for your own equations of motion, e.g. derived from a Lagrangian.
// Write the system as first-order derivatives of a state vector and step it.

/** Returns d(state)/dt for a state at time t. */
export type Derivatives = (state: readonly number[], t: number) => number[];

/** One classic fourth-order Runge-Kutta step of size `dt`. */
export function rk4(state: readonly number[], t: number, dt: number, f: Derivatives): number[] {
  const n = state.length;
  const add = (k: readonly number[], h: number) => state.map((s, i) => s + (k[i] ?? 0) * h);
  const k1 = f(state, t);
  const k2 = f(add(k1, dt / 2), t + dt / 2);
  const k3 = f(add(k2, dt / 2), t + dt / 2);
  const k4 = f(add(k3, dt), t + dt);
  const next = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    next[i] =
      (state[i] ?? 0) +
      (dt / 6) * ((k1[i] ?? 0) + 2 * (k2[i] ?? 0) + 2 * (k3[i] ?? 0) + (k4[i] ?? 0));
  }
  return next;
}

export interface System {
  /** Current state vector. */
  readonly state: readonly number[];
  /** Simulated time in seconds. */
  readonly time: number;
  /** Advances by `seconds` in fixed steps, so results do not depend on the frame rate. */
  advance(seconds: number): readonly number[];
  /** Replaces the state, e.g. after the user grabbed something. */
  reset(state: readonly number[]): void;
}

/** A system of ODEs stepped with RK4 at a fixed step (default 1/240 s). */
export function system(f: Derivatives, initial: readonly number[], step = 1 / 240): System {
  let state = [...initial];
  let time = 0;
  let pending = 0;
  return {
    get state() {
      return state;
    },
    get time() {
      return time;
    },
    advance(seconds) {
      pending += seconds;
      while (pending >= step) {
        state = rk4(state, time, step, f);
        time += step;
        pending -= step;
      }
      return state;
    },
    reset(next) {
      state = [...next];
      pending = 0;
    },
  };
}
