import { describe, expect, it } from "vitest";
import { World } from "../src";

const build = (seed = 7) => {
  const world = new World({ seed, bounds: { left: 0, top: 0, right: 600, bottom: 600 } });
  for (let i = 0; i < 12; i++) {
    world.add({
      x: 60 + world.random() * 480,
      y: 40 + world.random() * 200,
      radius: 14 + world.random() * 10,
      restitution: 0.4,
    });
  }
  world.add({ x: 300, y: 100, width: 60, height: 30, angle: 0.3 });
  return world;
};

describe("determinism", () => {
  it("gives the same state however the time is cut into frames", () => {
    const a = build();
    const b = build();
    a.advance(3);
    for (let i = 0; i < 180; i++) b.advance(1 / 60);
    for (let i = 0; i < 7; i++) b.advance(0);
    expect(b.hash()).toBe(a.hash());
    expect(a.time).toBeCloseTo(3, 2);
  });

  it("differs with another seed and repeats with the same one", () => {
    const a = build(1);
    const b = build(1);
    const c = build(2);
    a.advance(2);
    b.advance(2);
    c.advance(2);
    expect(a.hash()).toBe(b.hash());
    expect(a.hash()).not.toBe(c.hash());
  });

  it("random() is reproducible and stays in [0, 1)", () => {
    const a = new World({ seed: 42 });
    const b = new World({ seed: 42 });
    for (let i = 0; i < 100; i++) {
      const x = a.random();
      expect(x).toBe(b.random());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("restores a snapshot and continues identically", () => {
    const world = build();
    world.advance(1);
    const snap = JSON.parse(JSON.stringify(world.snapshot()));
    world.advance(2);
    const expected = world.hash();
    world.restore(snap);
    expect(world.time).toBeCloseTo(1, 2);
    world.advance(2);
    expect(world.hash()).toBe(expected);
  });

  it("refuses a snapshot of a different world", () => {
    const snap = build().snapshot();
    expect(() => new World().restore(snap)).toThrow(/number of bodies/);
  });

  it("puts bodies to sleep and reports sensors from step() alone", () => {
    const world = new World({ bounds: { left: 0, top: 0, right: 400, bottom: 400 } });
    const entered: number[] = [];
    world.add({
      x: 200,
      y: 380,
      width: 200,
      height: 40,
      sensor: true,
      fixed: true,
      onEnter: () => entered.push(world.time),
    });
    const ball = world.add({ x: 200, y: 50, radius: 15, restitution: 0 });
    world.advance(6);
    expect(entered.length).toBe(1);
    expect(ball.sleeping).toBe(true);
  });

  it("keeps the 1.x frame-based behaviour behind legacyStepping", () => {
    const world = new World({
      legacyStepping: true,
      bounds: { left: 0, top: 0, right: 400, bottom: 400 },
    });
    const ball = world.add({ x: 200, y: 50, radius: 15 });
    world.advance(6);
    expect(ball.sleeping).toBe(false);
  });
});
