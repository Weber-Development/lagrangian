import { describe, expect, it } from "vitest";
import { dampingRatio, rk4, settleTime, spring, springParams } from "../src";

// Reference: integrate m·x'' = −k·(x − to) − c·x' numerically with RK4 at a tiny step.
function numeric(from: number, to: number, v: number, k: number, c: number, m: number, t: number) {
  let state = [from, v];
  const h = 1 / 4000;
  const f = (s: readonly number[]) => [
    s[1] as number,
    (-k * ((s[0] as number) - to) - c * (s[1] as number)) / m,
  ];
  for (let i = 0; i < Math.round(t / h); i++) state = rk4(state, 0, h, f);
  return state;
}

describe("spring", () => {
  const cases = [
    { name: "underdamped", k: 170, c: 10, m: 1 },
    { name: "critical", k: 100, c: 20, m: 1 },
    { name: "overdamped", k: 100, c: 60, m: 2 },
  ];
  for (const { name, k, c, m } of cases) {
    it(`matches numerical integration (${name})`, () => {
      const motion = spring(0, 100, 250, {
        stiffness: k,
        damping: c,
        mass: m,
        restDelta: 1e-9,
        restSpeed: 1e-9,
      });
      for (const t of [0, 0.05, 0.2, 0.5, 1]) {
        const [x, v] = numeric(0, 100, 250, k, c, m, t);
        const state = motion(t);
        expect(state.value).toBeCloseTo(x as number, 4);
        expect(state.velocity).toBeCloseTo(v as number, 3);
      }
    });
  }

  it("starts at the given position and velocity", () => {
    const state = spring(10, 50, -300)(0);
    expect(state.value).toBe(10);
    expect(state.velocity).toBeCloseTo(-300, 9);
  });

  it("settles exactly on the target", () => {
    const motion = spring(0, 1);
    const t = settleTime(motion);
    expect(t).toBeGreaterThan(0.2);
    expect(t).toBeLessThan(2);
    expect(motion(t)).toEqual({ value: 1, velocity: 0, done: true });
  });

  it("is done immediately when already at rest on the target", () => {
    expect(spring(5, 5)(0).done).toBe(true);
  });

  it("converts duration and bounce", () => {
    expect(dampingRatio({ duration: 0.5, bounce: 0 })).toBeCloseTo(1, 9);
    expect(dampingRatio({ duration: 0.5, bounce: 0.3 })).toBeCloseTo(0.7, 9);
    expect(dampingRatio({ duration: 0.5, bounce: -0.5 })).toBeCloseTo(2, 9);
    const { stiffness } = springParams({ duration: 1 });
    expect(stiffness).toBeCloseTo((2 * Math.PI) ** 2, 9);
  });

  it("overshoots only when bouncy", () => {
    const peak = (bounce: number) => {
      const motion = spring(0, 100, 0, { duration: 0.5, bounce });
      let max = 0;
      for (let t = 0; t < 2; t += 0.001) max = Math.max(max, motion(t).value);
      return max;
    };
    expect(peak(0)).toBeLessThanOrEqual(100);
    expect(peak(0.4)).toBeGreaterThan(105);
  });

  it("never settles without damping", () => {
    expect(settleTime(spring(0, 1, 0, { damping: 0 }), 3)).toBe(Number.POSITIVE_INFINITY);
  });
});
