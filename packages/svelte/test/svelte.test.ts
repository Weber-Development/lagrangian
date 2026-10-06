import { getValue, loop, World } from "@sweberdev/lagrangian";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { body, drag, physics, scroll, spring, springStore } from "../src";

/** Steps the loop; style writes are flushed in a task after it. */
const frames = async (n: number) => {
  for (let i = 0; i < n; i++) loop.step(1000 / 60);
  await new Promise((r) => setTimeout(r, 0));
};

beforeEach(() => loop.manual(true));
afterEach(() => {
  loop.manual(false);
  document.body.replaceChildren();
});

function node() {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("svelte", () => {
  it("spring action animates and follows new props", async () => {
    const el = node();
    const action = spring(el, { props: { x: 100 } });
    await frames(200);
    expect(el.style.transform).toBe("translate3d(100px, 0px, 0px)");
    action.update?.({ props: { x: 0 } });
    await frames(200);
    expect(el.style.transform).toBe("translate3d(0px, 0px, 0px)");
    action.destroy?.();
  });

  it("spring action keeps going when the same props are passed again", async () => {
    const el = node();
    const action = spring(el, { props: { x: 100 } });
    await frames(5);
    const mid = getValue(el, "x").get();
    action.update?.({ props: { x: 100 } });
    await frames(1);
    expect(getValue(el, "x").get()).toBeGreaterThan(mid);
    action.destroy?.();
  });

  it("springStore is a readable store that springs to what you set", async () => {
    const store = springStore(0, { duration: 0.3 });
    const seen: number[] = [];
    const stop = store.subscribe((n) => seen.push(Math.round(n)));
    expect(seen).toEqual([0]);
    const done = store.set(50);
    await frames(120);
    await done;
    expect(seen.at(-1)).toBe(50);
    store.jump(0);
    expect(seen.at(-1)).toBe(0);
    stop();
  });

  it("drag action makes the node draggable and detaches on destroy", async () => {
    const el = node();
    const action = drag(el, { axis: "y" });
    const pointer = (type: string, y: number) =>
      el.dispatchEvent(
        Object.assign(new Event(type), {
          pointerId: 1,
          pointerType: "touch",
          clientX: 0,
          clientY: y,
        }),
      );
    pointer("pointerdown", 0);
    pointer("pointermove", 40);
    pointer("pointerup", 40);
    await frames(1);
    expect(el.style.transform).toBe("translate3d(0px, 40px, 0px)");
    action.destroy?.();
  });

  it("scroll action scrolls and restores the viewport", () => {
    const viewport = node();
    viewport.appendChild(document.createElement("div"));
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 100 });
    Object.defineProperty(viewport.firstElementChild, "scrollHeight", {
      configurable: true,
      value: 400,
    });
    const action = scroll(viewport, { snap: { y: [0, 150, 300] } });
    expect(viewport.style.overflow).toBe("hidden");
    action.destroy?.();
    expect(viewport.style.overflow).toBe("");
  });

  it("physics and body let an element fall", async () => {
    const stage = node();
    Object.defineProperty(stage, "clientWidth", { configurable: true, value: 300 });
    Object.defineProperty(stage, "clientHeight", { configurable: true, value: 300 });
    const ball = document.createElement("div");
    stage.appendChild(ball);
    const world = new World();
    const w = physics(stage, { world, interactive: false });
    const b = body(ball, { world, x: 40, y: 40, radius: 10 });
    await frames(30);
    const y = Number.parseFloat(ball.style.transform.split(",")[1] ?? "0");
    expect(y).toBeGreaterThan(30);
    b.destroy?.();
    expect(world.bodies.length).toBe(0);
    w.destroy?.();
  });
});
