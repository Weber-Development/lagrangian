import { describe, expect, it } from "vitest";
import { World } from "../src";

const run = (world: World, seconds: number) => {
  for (let i = 0; i < seconds * 240; i++) world.step(1 / 240);
};

describe("world", () => {
  it("falls with g and comes to rest on the floor", () => {
    const world = new World({ airDrag: 0, bounds: { left: 0, top: 0, right: 1000, bottom: 1000 } });
    const ball = world.add({ x: 500, y: 100, radius: 20 });
    run(world, 0.2);
    // y = y0 + ½·g·t² with g = 9.81 m/s² · 500 px/m (semi-implicit Euler is within a few px).
    expect(ball.y).toBeCloseTo(100 + 0.5 * 9.81 * 500 * 0.2 ** 2, -1);
    run(world, 5);
    expect(ball.y).toBeCloseTo(980, 0);
    expect(Math.abs(ball.vy)).toBeLessThan(1);
  });

  it("bounces with the given restitution", () => {
    const world = new World({
      gravity: { x: 0, y: 0 },
      airDrag: 0,
      bounds: { left: 0, top: 0, right: 1000, bottom: 1000 },
    });
    const ball = world.add({ x: 500, y: 900, radius: 20, vy: 2000, restitution: 0.6 });
    run(world, 0.1);
    expect(ball.vy).toBeCloseTo(-1200, 0);
  });

  it("conserves momentum and energy in an elastic collision", () => {
    const world = new World({ gravity: { x: 0, y: 0 }, airDrag: 0 });
    const a = world.add({
      x: 100,
      y: 0,
      radius: 20,
      mass: 1,
      vx: 600,
      restitution: 1,
      friction: 0,
    });
    const b = world.add({ x: 300, y: 0, radius: 20, mass: 3, restitution: 1, friction: 0 });
    run(world, 1);
    const momentum = a.mass * a.vx + b.mass * b.vx;
    const energy = 0.5 * a.mass * a.vx ** 2 + 0.5 * b.mass * b.vx ** 2;
    expect(momentum).toBeCloseTo(600, 6);
    expect(energy).toBeCloseTo(0.5 * 600 ** 2, 3);
    // 1D elastic: v_a = (m_a − m_b)/(m_a + m_b)·u = −300, v_b = 2·m_a/(m_a + m_b)·u = 300
    expect(a.vx).toBeCloseTo(-300, 3);
    expect(b.vx).toBeCloseTo(300, 3);
  });

  it("makes a sliding ball roll", () => {
    const world = new World({
      airDrag: 0,
      rollingResistance: 0,
      bounds: { left: -1e6, top: 0, right: 1e6, bottom: 1000 },
    });
    const ball = world.add({ x: 0, y: 980, radius: 20, vx: 1000, friction: 0.5 });
    run(world, 2);
    // Rolling without slipping: v = ω·r. A solid disc keeps 2/3 of its speed.
    expect(ball.spin * ball.radius).toBeCloseTo(ball.vx, -1);
    expect(ball.vx).toBeCloseTo((2 / 3) * 1000, -1);
  });

  it("lets rolling bodies come to a stop", () => {
    const world = new World({ bounds: { left: -1e6, top: 0, right: 1e6, bottom: 1000 } });
    const ball = world.add({ x: 0, y: 980, radius: 20, vx: 1000 });
    run(world, 8);
    expect(Math.abs(ball.vx)).toBeLessThan(5);
  });

  it("holds bodies together with a link", () => {
    const world = new World({ gravity: { x: 0, y: 0 }, airDrag: 0 });
    const a = world.add({ x: 0, y: 0, radius: 10, fixed: true });
    const b = world.add({ x: 200, y: 0, radius: 10 });
    world.link(a, b, { length: 100, damping: 1 });
    run(world, 3);
    expect(b.x).toBeCloseTo(100, 0);
  });

  it("drags a body with the pointer joint and keeps the throw", () => {
    const world = new World({ gravity: { x: 0, y: 0 }, airDrag: 0 });
    const ball = world.add({ x: 0, y: 0, radius: 10 });
    const grab = world.grab(ball, 0, 0);
    for (let i = 0; i < 120; i++) {
      grab.move(i * 5, 0);
      world.step(1 / 240);
    }
    expect(ball.x).toBeGreaterThan(500);
    grab.release();
    expect(ball.vx).toBeGreaterThan(800);
    const before = ball.x;
    run(world, 0.1);
    expect(ball.x).toBeGreaterThan(before + 80);
  });

  it("finds the body under a point", () => {
    const world = new World();
    const ball = world.add({ x: 50, y: 50, radius: 10 });
    expect(world.bodyAt(55, 55)).toBe(ball);
    expect(world.bodyAt(80, 80)).toBe(null);
  });
});
