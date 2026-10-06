import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { animate, draggable, getValue, loop, setReducedMotion, value, World } from "../src";

const frames = (n: number) => {
  for (let i = 0; i < n; i++) loop.step(1000 / 60);
};
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => loop.manual(true));
afterEach(() => {
  setReducedMotion("user");
  loop.manual(false);
});

describe("PhysicsValue", () => {
  it("springs to a target and resolves true", async () => {
    const v = value(0);
    const done = v.to(100, { duration: 0.4 });
    frames(120);
    expect(v.get()).toBe(100);
    expect(v.velocity).toBe(0);
    await expect(done.finished).resolves.toBe(true);
    expect(loop.size).toBe(0);
  });

  it("keeps its velocity when a new target interrupts", async () => {
    const v = value(0);
    const first = v.to(100);
    frames(6);
    const speed = v.velocity;
    expect(speed).toBeGreaterThan(100);
    const second = v.to(-100);
    await expect(first.finished).resolves.toBe(false);
    // The new spring starts with the old momentum instead of from standstill.
    expect(v.velocity).toBe(speed);
    const at = v.get();
    frames(1);
    expect(v.get()).toBeGreaterThan(at);
    frames(200);
    expect(v.get()).toBe(-100);
    await expect(second.finished).resolves.toBe(true);
  });

  it("measures velocity from set calls", () => {
    const v = value(0);
    for (let i = 1; i <= 6; i++) {
      loop.step(10);
      v.set(i * 5);
    }
    expect(v.velocity).toBeCloseTo(500, 0);
    loop.step(200);
    expect(v.velocity).toBe(0);
  });

  it("throws with friction", () => {
    const v = value(0);
    v.throw({ velocity: 1000, deceleration: 0.99 });
    frames(300);
    expect(v.get()).toBeCloseTo(1000 * (-1 / (1000 * Math.log(0.99))), 0);
  });

  it("jumps to the end with reduced motion", async () => {
    setReducedMotion("always");
    const v = value(0);
    await v.to(50).finished;
    expect(v.get()).toBe(50);
    expect(loop.size).toBe(0);
  });

  it("notifies listeners", () => {
    const v = value(0);
    const seen: number[] = [];
    const off = v.on((x) => seen.push(x));
    v.set(3);
    off();
    v.set(4);
    expect(seen).toEqual([3]);
  });
});

describe("animate", () => {
  it("writes transforms and opacity", async () => {
    const el = document.createElement("div");
    const done = animate(el, { x: 100, rotate: 10, opacity: 0.5 });
    frames(200);
    await flush();
    expect(el.style.transform).toBe("translate3d(100px, 0px, 0px) rotate(10deg)");
    expect(el.style.opacity).toBe("0.5");
    await expect(done.finished).resolves.toBe(true);
  });

  it("shares values between calls on the same element", () => {
    const el = document.createElement("div");
    animate(el, { y: 100 });
    frames(5);
    const y = getValue(el, "y");
    expect(y.animating).toBe(true);
    expect(y.velocity).toBeGreaterThan(0);
  });

  it("sets custom properties", async () => {
    const el = document.createElement("div");
    animate(el, { "--progress": 1 });
    frames(200);
    await flush();
    expect(el.style.getPropertyValue("--progress")).toBe("1");
  });
});

describe("draggable", () => {
  const pointer = (el: Element, type: string, x: number, y = 0) =>
    el.dispatchEvent(
      Object.assign(new Event(type, { bubbles: true }), {
        pointerId: 1,
        pointerType: "touch",
        button: 0,
        clientX: x,
        clientY: y,
      }),
    );

  it("follows the pointer and keeps moving after release", () => {
    const el = document.createElement("div");
    const drag = draggable(el, { axis: "x" });
    pointer(el, "pointerdown", 0);
    for (let i = 1; i <= 8; i++) {
      loop.step(10);
      pointer(el, "pointermove", i * 10);
    }
    expect(drag.x.get()).toBe(80);
    expect(drag.dragging).toBe(true);
    pointer(el, "pointerup", 80);
    expect(drag.dragging).toBe(false);
    frames(10);
    expect(drag.x.get()).toBeGreaterThan(120);
    expect(drag.y.get()).toBe(0);
    drag.destroy();
  });

  it("rubber-bands past the bounds and settles on the edge", () => {
    const el = document.createElement("div");
    const drag = draggable(el, { bounds: { left: 0, right: 100, top: 0, bottom: 0 } });
    pointer(el, "pointerdown", 0);
    loop.step(10);
    pointer(el, "pointermove", 300);
    expect(drag.x.get()).toBeGreaterThan(100);
    expect(drag.x.get()).toBeLessThan(300);
    loop.step(200);
    pointer(el, "pointerup", 300);
    frames(200);
    expect(drag.x.get()).toBe(100);
  });

  it("lands on snap points", () => {
    const el = document.createElement("div");
    const drag = draggable(el, { axis: "x", snap: { x: [0, 200, 400] } });
    pointer(el, "pointerdown", 0);
    for (let i = 1; i <= 5; i++) {
      loop.step(10);
      pointer(el, "pointermove", i * 12);
    }
    pointer(el, "pointerup", 60);
    frames(300);
    expect([0, 200, 400]).toContain(drag.x.get());
    expect(drag.x.get()).toBe(400);
  });
});

describe("world on the loop", () => {
  it("renders bodies and goes to sleep when everything rests", () => {
    const el = document.createElement("div");
    const world = new World({ bounds: { left: 0, top: 0, right: 400, bottom: 400 } }).start();
    world.add({ x: 200, y: 100, radius: 20, element: el, restitution: 0.2 });
    expect(world.awake).toBe(true);
    frames(60 * 6);
    expect(el.style.transform).toMatch(/^translate3d\(180px, 360(\.\d+)?px, 0\) rotate\(/);
    expect(world.awake).toBe(false);
    expect(loop.size).toBe(0);
    world.destroy();
  });
});
