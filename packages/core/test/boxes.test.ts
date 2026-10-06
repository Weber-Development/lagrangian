import { describe, expect, it } from "vitest";
import { loop, World } from "../src";

const run = (world: World, seconds: number) => {
  for (let i = 0; i < seconds * 240; i++) world.step(1 / 240);
};
const floor = { left: 0, top: 0, right: 1000, bottom: 1000 };
/** Distance of an angle from the nearest multiple of a quarter turn. */
const tilt = (angle: number) => Math.abs(angle - Math.round(angle / (Math.PI / 2)) * (Math.PI / 2));

describe("boxes", () => {
  it("falls and lands flat on the floor", () => {
    const world = new World({ bounds: floor });
    const box = world.add({ x: 500, y: 300, width: 80, height: 40, angle: 0.4 });
    run(world, 6);
    expect(tilt(box.angle)).toBeLessThan(0.02);
    // Resting on its long or its short side.
    const half = Math.abs(Math.cos(box.angle)) > 0.5 ? 20 : 40;
    expect(box.y).toBeCloseTo(1000 - half, 0);
  });

  it("has the right mass and inertia for its size", () => {
    const world = new World();
    const box = world.add({ x: 0, y: 0, width: 100, height: 50, density: 2 });
    // 0.2 m × 0.1 m × 2 kg/m²
    expect(box.mass).toBeCloseTo(0.04, 9);
    expect(box.radius).toBeCloseTo(Math.hypot(100, 50) / 2, 9);
    expect(1 / box.invInertia).toBeCloseTo((box.mass * (100 ** 2 + 50 ** 2)) / 12, 6);
  });

  it("stacks boxes without them sinking, and the stack comes to rest", () => {
    loop.manual(true);
    const world = new World({ bounds: floor }).start();
    const lower = world.add({ x: 500, y: 960, width: 100, height: 40 });
    const upper = world.add({ x: 503, y: 900, width: 80, height: 40 });
    for (let i = 0; i < 60 * 6; i++) loop.step(1000 / 60);
    expect(lower.y).toBeCloseTo(980, 0);
    expect(upper.y).toBeCloseTo(940, 0);
    expect(Math.abs(upper.x - 503)).toBeLessThan(8);
    expect(tilt(upper.angle)).toBeLessThan(0.01);
    expect(upper.sleeping && lower.sleeping).toBe(true);
    expect(world.awake).toBe(false);
    world.destroy();
    loop.manual(false);
  });

  it("lets a ball roll off a box and a box tip over an edge", () => {
    const world = new World({ bounds: floor });
    const ledge = world.add({ x: 300, y: 800, width: 300, height: 40, fixed: true });
    const ball = world.add({ x: 200, y: 700, radius: 20 });
    const box = world.add({ x: 470, y: 700, width: 60, height: 40 });
    run(world, 0.5);
    // The ball sits on the ledge, the box overhangs the right edge and tips.
    expect(ball.y).toBeLessThanOrEqual(760.5);
    run(world, 6);
    expect(ledge.y).toBe(800);
    expect(box.y).toBeGreaterThan(900);
  });

  it("transfers momentum in a box-circle collision", () => {
    const world = new World({ gravity: { x: 0, y: 0 }, airDrag: 0 });
    const box = world.add({
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      mass: 1,
      restitution: 1,
      friction: 0,
    });
    const ball = world.add({
      x: 100,
      y: 0,
      radius: 20,
      mass: 1,
      vx: -400,
      restitution: 1,
      friction: 0,
    });
    run(world, 1);
    expect(box.vx).toBeCloseTo(-400, 3);
    expect(Math.abs(ball.vx)).toBeLessThan(1e-6);
    expect(Math.abs(box.spin)).toBeLessThan(1e-6);
  });

  it("spins a box that is hit off centre", () => {
    const world = new World({ gravity: { x: 0, y: 0 }, airDrag: 0 });
    const box = world.add({ x: 0, y: 0, width: 100, height: 40, friction: 0 });
    world.add({ x: 100, y: 25, radius: 10, vx: -500, mass: 0.05, friction: 0 });
    run(world, 0.5);
    expect(box.vx).toBeLessThan(0);
    expect(Math.abs(box.spin)).toBeGreaterThan(0.1);
  });

  it("finds a rotated box under a point", () => {
    const world = new World();
    const box = world.add({ x: 100, y: 100, width: 100, height: 20, angle: Math.PI / 2 });
    expect(world.bodyAt(100, 140)).toBe(box);
    expect(world.bodyAt(140, 100)).toBe(null);
  });

  it("needs a size", () => {
    expect(() => new World().add({ x: 0, y: 0 })).toThrow();
  });
});

describe("sleeping per body", () => {
  it("lets resting bodies sleep while others keep moving", () => {
    loop.manual(true);
    const world = new World({ bounds: floor, airDrag: 0 }).start();
    const resting = world.add({ x: 200, y: 980, radius: 20 });
    const moving = world.add({
      x: 700,
      y: 980,
      radius: 20,
      vx: 40,
      friction: 0,
      rollingResistance: 0,
    } as never);
    moving.vx = 40;
    for (let i = 0; i < 90; i++) loop.step(1000 / 60);
    expect(resting.sleeping).toBe(true);
    expect(world.awake).toBe(true);
    for (let i = 0; i < 60 * 60; i++) loop.step(1000 / 60);
    expect(moving.sleeping).toBe(true);
    expect(world.awake).toBe(false);
    world.destroy();
    loop.manual(false);
  });

  it("wakes a sleeping body when something hits it", () => {
    loop.manual(true);
    const world = new World({ bounds: floor, gravity: { x: 0, y: 0 }, airDrag: 0 }).start();
    const target = world.add({ x: 500, y: 500, radius: 20 });
    for (let i = 0; i < 90; i++) loop.step(1000 / 60);
    expect(target.sleeping).toBe(true);
    world.add({ x: 300, y: 500, radius: 20, vx: 800 });
    for (let i = 0; i < 30; i++) loop.step(1000 / 60);
    expect(target.sleeping).toBe(false);
    expect(target.x).toBeGreaterThan(500);
    world.destroy();
    loop.manual(false);
  });

  it("wakes a body on request and when the one below it is removed", () => {
    loop.manual(true);
    const world = new World({ bounds: floor }).start();
    const lower = world.add({ x: 500, y: 980, radius: 20 });
    const upper = world.add({ x: 500, y: 940, radius: 20 });
    for (let i = 0; i < 180; i++) loop.step(1000 / 60);
    expect(upper.sleeping).toBe(true);
    world.remove(lower);
    expect(upper.sleeping).toBe(false);
    for (let i = 0; i < 120; i++) loop.step(1000 / 60);
    expect(upper.y).toBeCloseTo(980, 0);
    world.destroy();
    loop.manual(false);
  });
});
