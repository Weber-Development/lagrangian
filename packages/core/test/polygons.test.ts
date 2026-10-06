import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loop, regularPolygon, World } from "../src";

beforeEach(() => loop.manual(true));
afterEach(() => loop.manual(false));

/** Runs a world on the frame loop, which is also where bodies fall asleep. */
const run = (world: World, seconds: number) => {
  world.start();
  for (let i = 0; i < seconds * 60; i++) loop.step(1000 / 60);
};
const floor = { left: 0, top: 0, right: 1000, bottom: 1000 };

describe("polygons", () => {
  it("measures mass, centre and inertia of the shape", () => {
    const world = new World();
    // A 100 x 50 rectangle given as vertices behaves like the box.
    const poly = world.add({
      x: 10,
      y: 20,
      vertices: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 50 },
        { x: 0, y: 50 },
      ],
      density: 2,
    });
    const box = world.add({ x: 0, y: 0, width: 100, height: 50, density: 2 });
    expect(poly.mass).toBeCloseTo(box.mass, 9);
    expect(poly.invInertia).toBeCloseTo(box.invInertia, 9);
    // The body is at the centre of mass: the vertices were relative to (10, 20).
    expect(poly.x).toBeCloseTo(60, 9);
    expect(poly.y).toBeCloseTo(45, 9);
    expect(poly.shape).toBe("polygon");
    expect(poly.width).toBeCloseTo(100, 9);
    expect(poly.height).toBeCloseTo(50, 9);
  });

  it("takes either winding and the hull of a concave outline", () => {
    const world = new World();
    const clockwise = world.add({
      x: 0,
      y: 0,
      vertices: [
        { x: 0, y: 0 },
        { x: 0, y: 40 },
        { x: 40, y: 40 },
        { x: 40, y: 0 },
      ],
    });
    const arrow = world.add({
      x: 0,
      y: 0,
      vertices: [
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 20, y: 10 }, // dent
        { x: 40, y: 40 },
        { x: 0, y: 40 },
      ],
    });
    expect(clockwise.mass).toBeCloseTo(arrow.mass, 9);
  });

  it("rejects shapes without area", () => {
    const world = new World();
    expect(() =>
      world.add({
        x: 0,
        y: 0,
        vertices: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 },
        ],
      }),
    ).toThrow();
  });

  it("lands a triangle flat on the floor and keeps it there", () => {
    const world = new World({ bounds: floor });
    const tri = world.add({
      x: 500,
      y: 300,
      vertices: regularPolygon(3, 40, -Math.PI / 2),
      angle: 0.6,
    });
    run(world, 8);
    // The centre of mass of an equilateral triangle sits at a third of its height.
    const resting = [0, (2 * Math.PI) / 3, -(2 * Math.PI) / 3].some((a) => {
      const turn = ((((tri.angle - a) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
      return Math.abs(turn) < 0.05;
    });
    expect(resting).toBe(true);
    expect(tri.sleeping).toBe(true);
    // Resting on a side, the lowest corners touch the floor.
    const lowest = Math.max(
      ...[0, 1, 2].map((k) => {
        const a = tri.angle + (k / 3) * Math.PI * 2 - Math.PI / 2;
        return tri.y + Math.sin(a) * 40;
      }),
    );
    expect(lowest).toBeCloseTo(1000, 0);
  });

  it("rolls a hexagon along the floor and stops on a side", () => {
    const world = new World({ bounds: floor });
    const hex = world.add({ x: 200, y: 940, vertices: regularPolygon(6, 40), vx: 600 });
    run(world, 6);
    expect(hex.x).toBeGreaterThan(230);
    expect(hex.x).toBeLessThan(950);
    expect(hex.sleeping).toBe(true);
    // Resting on a side, the centre is the apothem above the floor: r·cos(30°).
    expect(hex.y).toBeCloseTo(1000 - 40 * Math.cos(Math.PI / 6), 0);
  });

  it("collides with circles, boxes and other polygons without sinking in", () => {
    const world = new World({ bounds: floor });
    const base = world.add({ x: 500, y: 960, width: 300, height: 40, fixed: true });
    const hex = world.add({ x: 500, y: 700, vertices: regularPolygon(6, 40) });
    const ball = world.add({ x: 520, y: 400, radius: 20 });
    const tri = world.add({ x: 480, y: 100, vertices: regularPolygon(3, 30) });
    run(world, 10);
    // Everything piled up on the base and nothing passed through anything else.
    expect(hex.y).toBeLessThan(base.y - 20);
    for (const body of world.bodies) {
      if (body === base) continue;
      expect(body.y).toBeLessThan(1000);
    }
    expect(Math.hypot(ball.x - hex.x, ball.y - hex.y)).toBeGreaterThan(20);
    expect(Math.hypot(tri.x - hex.x, tri.y - hex.y)).toBeGreaterThan(25);
  });

  it("finds a polygon under a point and reports sensors", () => {
    const world = new World();
    const tri = world.add({ x: 100, y: 100, vertices: regularPolygon(3, 50) });
    expect(world.bodyAt(tri.x, tri.y)).toBe(tri);
    expect(world.bodyAt(tri.x + 200, tri.y)).toBeNull();
    // Just outside the left corner of the triangle's hull but inside its bounding circle.
    expect(world.bodyAt(tri.x - 30, tri.y - 40)).toBeNull();
  });

  it("works as a pendulum bob", () => {
    const world = new World({ airDrag: 0 });
    const bob = world.add({ x: 700, y: 100, vertices: regularPolygon(5, 20) });
    world.rod(bob, { x: 500, y: 100 }, { length: 200 });
    run(world, 3);
    expect(Math.hypot(bob.x - 500, bob.y - 100)).toBeCloseTo(200, 0);
  });
});
