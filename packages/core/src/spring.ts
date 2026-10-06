// Damped harmonic oscillator, solved in closed form: m·x'' + c·x' + k·(x − target) = 0.
// The exact solution means there is no integration error, no frame-rate dependence, and the
// position and velocity at any moment are known, which is what makes interruptions seamless.

/** Position and velocity of a motion at one moment. */
export interface MotionState {
  value: number;
  velocity: number;
  done: boolean;
}

/** A motion maps elapsed seconds to a state. Springs, decay and your own functions fit this. */
export type Motion = (t: number) => MotionState;

export interface SpringOptions {
  /** Spring constant k. Higher is snappier. Default 170. */
  stiffness?: number;
  /** Damping coefficient c. Lower bounces more. Default 26. */
  damping?: number;
  /** Mass m. Heavier is slower and carries more momentum. Default 1. */
  mass?: number;
  /**
   * Perceptual duration in seconds, used together with `bounce` instead of
   * stiffness and damping (as in SwiftUI). It is the period of the undamped spring.
   */
  duration?: number;
  /** -1 to 1. 0 is critically damped, 0.3 is a gentle bounce, negative values are overdamped. */
  bounce?: number;
  /** The motion counts as finished once it is this close to the target... */
  restDelta?: number;
  /** ...and slower than this (units per second). */
  restSpeed?: number;
}

export interface SpringParams {
  stiffness: number;
  damping: number;
  mass: number;
}

/** Resolves stiffness, damping and mass, also from `duration` and `bounce`. */
export function springParams(options: SpringOptions = {}): SpringParams {
  const mass = options.mass ?? 1;
  if (options.duration !== undefined || options.bounce !== undefined) {
    const duration = Math.max(options.duration ?? 0.5, 0.01);
    const bounce = Math.min(Math.max(options.bounce ?? 0, -0.99), 1);
    const omega = (2 * Math.PI) / duration;
    const zeta = bounce >= 0 ? 1 - bounce : 1 / (1 + bounce);
    return { stiffness: mass * omega * omega, damping: 2 * mass * zeta * omega, mass };
  }
  return { stiffness: options.stiffness ?? 170, damping: options.damping ?? 26, mass };
}

/** Damping ratio: below 1 the spring overshoots, 1 is critical, above 1 it creeps. */
export function dampingRatio(options: SpringOptions = {}): number {
  const { stiffness, damping, mass } = springParams(options);
  return damping / (2 * Math.sqrt(stiffness * mass));
}

export function restThresholds(from: number, to: number, options: SpringOptions = {}) {
  const span = Math.max(Math.abs(to - from), Math.abs(to) * 0.01, 1e-3);
  const restDelta = options.restDelta ?? Math.min(Math.max(span * 1e-3, 1e-4), 0.5);
  return { restDelta, restSpeed: options.restSpeed ?? restDelta * 10 };
}

/**
 * A spring from `from` to `to`, starting with `velocity` (units per second).
 * Returns the exact state for any elapsed time.
 */
export function spring(
  from: number,
  to: number,
  velocity = 0,
  options: SpringOptions = {},
): Motion {
  const { stiffness: k, damping: c, mass: m } = springParams(options);
  const { restDelta, restSpeed } = restThresholds(from, to, options);
  const d0 = from - to;
  const v0 = velocity;
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));

  let displacement: (t: number) => [number, number];
  if (zeta < 1 - 1e-6) {
    const a = zeta * w0;
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const B = (v0 + a * d0) / wd;
    displacement = (t) => {
      const e = Math.exp(-a * t);
      const cos = Math.cos(wd * t);
      const sin = Math.sin(wd * t);
      return [e * (d0 * cos + B * sin), e * ((B * wd - a * d0) * cos - (a * B + d0 * wd) * sin)];
    };
  } else if (zeta <= 1 + 1e-6) {
    const B = v0 + w0 * d0;
    displacement = (t) => {
      const e = Math.exp(-w0 * t);
      return [e * (d0 + B * t), e * (v0 - w0 * B * t)];
    };
  } else {
    const s = Math.sqrt(zeta * zeta - 1);
    const r1 = -w0 * (zeta - s);
    const r2 = -w0 * (zeta + s);
    const c1 = (v0 - r2 * d0) / (r1 - r2);
    const c2 = d0 - c1;
    displacement = (t) => {
      const e1 = Math.exp(r1 * t);
      const e2 = Math.exp(r2 * t);
      return [c1 * e1 + c2 * e2, c1 * r1 * e1 + c2 * r2 * e2];
    };
  }

  return (t) => {
    const [x, v] = displacement(Math.max(t, 0));
    if (Math.abs(x) <= restDelta && Math.abs(v) <= restSpeed) {
      return { value: to, velocity: 0, done: true };
    }
    return { value: to + x, velocity: v, done: false };
  };
}

/**
 * Seconds until a motion settles, sampled at 1 ms. Returns Infinity when it does not settle
 * within `limit` seconds (an undamped spring never does).
 */
export function settleTime(motion: Motion, limit = 30): number {
  for (let t = 0; t <= limit; t += 1 / 1000) {
    if (motion(t).done) return t;
  }
  return Number.POSITIVE_INFINITY;
}

/** The value a motion comes to rest at, or its value after `limit` seconds. */
export function restValue(motion: Motion, limit = 30): number {
  for (let t = 0; t <= limit; t += 1 / 60) {
    const state = motion(t);
    if (state.done) return state.value;
  }
  return motion(limit).value;
}
