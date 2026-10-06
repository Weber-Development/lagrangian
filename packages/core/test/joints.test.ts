import { describe, expect, it } from "vitest";
import { World } from "../src";

const run = (world: World, seconds: number) => {
  for (let i = 0; i < seconds * 240; i++) world.step(1 / 240);
};

describe("joints", () => {
  it("swings a pin pendulum at the period physics gives", () => {
    const world = new World({ airDrag: 0 });
    // 250 px on 500 px/m is a 0.5 m pendulum: T = 2π√(L/g) ≈ 1.42 s for small angles.
    const bob = world.add({ x: 500 + 250 * Math.sin(0.1), y: 250 * Math.cos(0.1), radius: 10 });
    world.rod(bob, { x: 500, y: 0 }, { length: 250 });
    let crossings = 0;
    let last = bob.x - 500;
    const times: number[] = [];
    for (let i = 0; i < 240 * 5; i++) {
      world.step(1 / 240);
      const dx = bob.x - 500;
      if (last > 0 && dx <= 0) {
        crossings++;
        times.push(i / 240);
      }
      last = dx;
    }
    expect(crossings).toBeGreaterThanOrEqual(3);
    const period = ((times[2] as number) - (times[0] as number)) / 2;
    expect(period).toBeGreaterThan(1.35);
    expect(period).toBeLessThan(1.5);
    // The rod stays rigid.
    expect(Math.hypot(bob.x - 500, bob.y)).toBeCloseTo(250, 0);
  });

  it("holds a hinged chain together while it swings", () => {
    const world = new World({ airDrag: 0 });
    const links = Array.from({ length: 5 }, (_, i) =>
      world.add({ x: 500 + (i + 0.5) * 40, y: 100, width: 40, height: 10 }),
    );
    world.pin(links[0] as never, { x: 500, y: 100 });
    for (let i = 1; i < links.length; i++) {
      world.hinge(links[i - 1] as never, links[i] as never, { x: 500 + i * 40, y: 100 });
    }
    run(world, 3);
    for (let i = 1; i < links.length; i++) {
      const a = links[i - 1] as { x: number; y: number; angle: number };
      const b = links[i] as { x: number; y: number; angle: number };
      // The right end of one link and the left end of the next are the same point.
      const ax = a.x + Math.cos(a.angle) * 20;
      const ay = a.y + Math.sin(a.angle) * 20;
      const bx = b.x - Math.cos(b.angle) * 20;
      const by = b.y - Math.sin(b.angle) * 20;
      expect(Math.hypot(ax - bx, ay - by)).toBeLessThan(3);
    }
    // It has swung down and hangs below the pin.
    expect((links[4] as { y: number }).y).toBeGreaterThan(100);
  });

  it("turns a wheel with a motor", () => {
    const world = new World({ gravity: { x: 0, y: 0 } });
    const wheel = world.add({ x: 300, y: 300, radius: 40, mass: 0.1 });
    world.pin(wheel, { x: 300, y: 300 }, { speed: 3, torque: 50 });
    run(world, 1);
    expect(wheel.spin).toBeCloseTo(3, 1);
    expect(wheel.x).toBeCloseTo(300, 1);
    expect(wheel.y).toBeCloseTo(300, 1);
  });

  it("limits what a weak motor can do", () => {
    const world = new World({ gravity: { x: 0, y: 0 } });
    const wheel = world.add({ x: 0, y: 0, radius: 40, mass: 1 });
    world.pin(wheel, { x: 0, y: 0 }, { speed: 50, torque: 0.0001 });
    run(world, 0.2);
    expect(wheel.spin).toBeLessThan(5);
  });

  it("forgets joints of a removed body", () => {
    const world = new World();
    const a = world.add({ x: 0, y: 0, radius: 5 });
    const b = world.add({ x: 50, y: 0, radius: 5 });
    world.hinge(a, b, { x: 25, y: 0 });
    world.remove(a);
    expect(world.joints.length).toBe(0);
  });
});

describe("sensors", () => {
  it("reports through the frame loop", async () => {
    const { loop } = await import("../src");
    loop.manual(true);
    const world = new World({ bounds: { left: 0, top: 0, right: 600, bottom: 1000 } });
    const events: string[] = [];
    const zone = world.add({
      x: 300,
      y: 400,
      width: 200,
      height: 100,
      fixed: true,
      sensor: true,
      onEnter: () => events.push("enter"),
      onLeave: () => events.push("leave"),
    });
    const ball = world.add({ x: 300, y: 100, radius: 15, restitution: 0 });
    world.start();
    for (let i = 0; i < 60 * 3; i++) loop.step(1000 / 60);
    expect(events).toEqual(["enter", "leave"]);
    // It fell straight through the zone and rests on the floor.
    expect(ball.y).toBeCloseTo(985, 0);
    expect(world.touching(zone)).toEqual([]);
    world.destroy();
    loop.manual(false);
  });

  it("keeps a body in the zone listed while it rests there", async () => {
    const { loop } = await import("../src");
    loop.manual(true);
    const world = new World({ bounds: { left: 0, top: 0, right: 600, bottom: 500 } });
    const zone = world.add({ x: 300, y: 450, width: 400, height: 100, fixed: true, sensor: true });
    const box = world.add({ x: 300, y: 100, width: 40, height: 40 });
    world.start();
    for (let i = 0; i < 60 * 4; i++) loop.step(1000 / 60);
    expect(world.touching(zone)).toEqual([box]);
    world.destroy();
    loop.manual(false);
  });
});
