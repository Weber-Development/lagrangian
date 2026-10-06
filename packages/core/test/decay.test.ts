import { describe, expect, it } from "vitest";
import { decay, projectRest, restValue, rubberband, rubberClamp, timeConstant } from "../src";

describe("decay", () => {
  it("comes to rest at x0 + v0·τ", () => {
    const motion = decay(0, { velocity: 1000 });
    const tau = timeConstant(0.998);
    expect(tau).toBeCloseTo(0.4995, 3);
    expect(restValue(motion)).toBeCloseTo(1000 * tau, 9);
    expect(projectRest(0, 1000)).toBeCloseTo(1000 * tau, 9);
  });

  it("keeps the velocity continuous", () => {
    const motion = decay(0, { velocity: 800 });
    expect(motion(0).velocity).toBe(800);
    const a = motion(0.1);
    const b = motion(0.1001);
    expect((b.value - a.value) / 0.0001).toBeCloseTo(a.velocity, 0);
  });

  it("lands exactly on the nearest snap point", () => {
    expect(restValue(decay(0, { velocity: 1100, snap: [0, 300, 600] }))).toBe(600);
    expect(restValue(decay(0, { velocity: 500, snap: [0, 300, 600] }))).toBe(300);
    expect(restValue(decay(0, { velocity: 500, snap: (x) => Math.round(x / 100) * 100 }))).toBe(
      200,
    );
  });

  it("snaps back against the throw direction with a spring", () => {
    expect(restValue(decay(250, { velocity: 10, snap: [0, 300] }))).toBe(300);
    expect(restValue(decay(100, { velocity: -50, snap: [0, 300] }))).toBe(0);
  });

  it("glides into a bound and settles on it", () => {
    const motion = decay(0, { velocity: 3000, max: 400 });
    let crossed = false;
    let overshoot = 0;
    for (let t = 0; t < 3; t += 1 / 120) {
      const { value } = motion(t);
      if (value > 400) crossed = true;
      overshoot = Math.max(overshoot, value - 400);
    }
    expect(crossed).toBe(true);
    expect(overshoot).toBeLessThan(200);
    expect(restValue(motion)).toBe(400);
  });

  it("springs back when released outside the bounds", () => {
    expect(restValue(decay(-80, { velocity: 0, min: 0, max: 100 }))).toBe(0);
  });
});

describe("rubberband", () => {
  it("resists more the further it goes", () => {
    expect(rubberband(0, 500)).toBe(0);
    const a = rubberband(100, 500);
    const b = rubberband(200, 500);
    expect(a).toBeLessThan(100);
    expect(b - a).toBeLessThan(a);
    expect(rubberband(1e9, 500)).toBeLessThan(500);
    expect(rubberband(-100, 500)).toBeCloseTo(-a, 9);
  });

  it("leaves values inside the bounds alone", () => {
    expect(rubberClamp(50, 0, 100, 500)).toBe(50);
    expect(rubberClamp(150, 0, 100, 500)).toBeLessThan(150);
    expect(rubberClamp(-50, 0, 100, 500)).toBeGreaterThan(-50);
  });
});
