// Inertia: a moving object slowed by friction proportional to its speed (like iOS scrolling).
// v(t) = v0·e^(−t/τ), x(t) = x0 + v0·τ·(1 − e^(−t/τ)), so it comes to rest at x0 + v0·τ.
// With bounds it bounces off the edge on a spring; with snap points it lands exactly on one.

import { type Motion, type SpringOptions, spring } from "./spring";

export type Snap = readonly number[] | ((restingPoint: number) => number);

export interface DecayOptions {
  /** Starting velocity in units per second. Defaults to the value's current velocity. */
  velocity?: number;
  /**
   * Fraction of speed kept per millisecond. 0.998 is the iOS "normal" scroll feel (default),
   * 0.99 is "fast" and stops much sooner.
   */
  deceleration?: number;
  /** Lower bound. Crossing it hands over to a spring that settles on the edge. */
  min?: number;
  /** Upper bound. */
  max?: number;
  /** Snap points, or a function that maps the natural resting point to a snapped one. */
  snap?: Snap;
  /** Spring used at the edges and when a snap point needs a spring. */
  bounce?: SpringOptions;
  /** The motion ends once it is this close to its resting point. Default 0.5. */
  restDelta?: number;
}

const EDGE_SPRING: SpringOptions = { stiffness: 400, damping: 40 };

export function timeConstant(deceleration = 0.998): number {
  const rate = Math.min(Math.max(deceleration, 0.5), 0.99999);
  return -1 / (1000 * Math.log(rate));
}

/** Where a throw with this velocity comes to rest without bounds or snap points. */
export function projectRest(from: number, velocity: number, deceleration = 0.998): number {
  return from + velocity * timeConstant(deceleration);
}

/** Nearest snap point to `value`. */
export function nearest(points: readonly number[], value: number): number {
  let best = value;
  let distance = Number.POSITIVE_INFINITY;
  for (const point of points) {
    const d = Math.abs(point - value);
    if (d < distance) {
      distance = d;
      best = point;
    }
  }
  return best;
}

function resolveSnap(snap: Snap, value: number): number {
  return typeof snap === "function" ? snap(value) : nearest(snap, value);
}

function friction(from: number, v0: number, tau: number, end: number, restDelta: number): Motion {
  return (t) => {
    const e = Math.exp(-Math.max(t, 0) / tau);
    const value = from + v0 * tau * (1 - e);
    const velocity = v0 * e;
    if (Math.abs(end - value) <= restDelta) return { value: end, velocity: 0, done: true };
    return { value, velocity, done: false };
  };
}

/** A throw with friction from `from`, optionally with bounds and snap points. */
export function decay(from: number, options: DecayOptions = {}): Motion {
  const v0 = options.velocity ?? 0;
  const tau = timeConstant(options.deceleration);
  const restDelta = options.restDelta ?? 0.5;
  const min = options.min ?? Number.NEGATIVE_INFINITY;
  const max = options.max ?? Number.POSITIVE_INFINITY;
  const edge = { ...EDGE_SPRING, restDelta, ...options.bounce };
  const clamp = (x: number) => Math.min(Math.max(x, min), max);

  // Already outside the bounds (e.g. let go while rubber-banding): spring back to the edge.
  if (from < min || from > max) return spring(from, clamp(from), v0, edge);

  const natural = from + v0 * tau;

  if (options.snap !== undefined) {
    const target = clamp(resolveSnap(options.snap, natural));
    const distance = target - from;
    // Stretch or shorten the friction so the throw ends exactly on the snap point, as long as
    // that still feels like the same throw. Otherwise a spring carries the velocity there.
    const fitted = v0 !== 0 ? distance / v0 : -1;
    if (fitted > tau / 4 && fitted < tau * 4) return friction(from, v0, fitted, target, restDelta);
    return spring(from, target, v0, { ...edge, ...options.bounce });
  }

  if (natural >= min && natural <= max) return friction(from, v0, tau, natural, restDelta);

  // The throw leaves the bounds: glide until the edge, then let a spring catch it there.
  const bound = natural < min ? min : max;
  const crossing = -tau * Math.log(1 - (bound - from) / (v0 * tau));
  const glide = friction(from, v0, tau, natural, 0);
  const vAtEdge = v0 * Math.exp(-crossing / tau);
  const catcher = spring(bound, bound, vAtEdge, edge);
  return (t) => (t < crossing ? glide(t) : catcher(t - crossing));
}

/**
 * Elastic overscroll, as on iOS: the further past the edge, the harder it pulls back.
 * `distance` is how far past the edge, `dimension` the size of the visible area.
 */
export function rubberband(distance: number, dimension: number, constant = 0.55): number {
  if (dimension <= 0 || constant <= 0) return 0;
  const sign = Math.sign(distance);
  const d = Math.abs(distance);
  return sign * (1 - 1 / ((d * constant) / dimension + 1)) * dimension;
}

/** Applies `rubberband` to a value outside [min, max]. Values inside stay unchanged. */
export function rubberClamp(
  value: number,
  min: number,
  max: number,
  dimension: number,
  constant = 0.55,
): number {
  if (value < min) return min + rubberband(value - min, dimension, constant);
  if (value > max) return max + rubberband(value - max, dimension, constant);
  return value;
}
