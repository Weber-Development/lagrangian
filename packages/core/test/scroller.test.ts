import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getValue, loop, scroller } from "../src";

beforeEach(() => loop.manual(true));
afterEach(() => {
  loop.manual(false);
  vi.useRealTimers();
  document.body.replaceChildren();
});

const frames = (n: number, ms = 1000 / 60) => {
  for (let i = 0; i < n; i++) loop.step(ms);
};

function make(options: Parameters<typeof scroller>[1] = {}, size = 1000) {
  const viewport = document.createElement("div");
  const content = document.createElement("div");
  viewport.appendChild(content);
  document.body.appendChild(viewport);
  Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 400 });
  Object.defineProperty(viewport, "clientWidth", { configurable: true, value: 300 });
  Object.defineProperty(content, "scrollHeight", { configurable: true, value: size });
  Object.defineProperty(content, "scrollWidth", { configurable: true, value: 300 });
  return { viewport, content, s: scroller(viewport, options) };
}

function pointer(el: Element, type: string, y: number) {
  const event = Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
    pointerId: 1,
    pointerType: "touch",
    button: 0,
    clientX: 0,
    clientY: y,
  });
  el.dispatchEvent(event);
}

function swipe(el: Element, from: number, to: number, steps = 8) {
  pointer(el, "pointerdown", from);
  for (let i = 1; i <= steps; i++) {
    loop.step(10);
    pointer(el, "pointermove", from + ((to - from) * i) / steps);
  }
  pointer(el, "pointerup", to);
}

describe("scroller", () => {
  it("measures how far the content can scroll", () => {
    const { s } = make();
    expect(s.max).toEqual({ x: 0, y: 600 });
    expect(s.position).toEqual({ x: 0, y: 0 });
    s.destroy();
  });

  it("drags the content and glides after the release", () => {
    const { content, s } = make();
    swipe(content, 300, 200);
    const atRelease = s.position.y;
    expect(atRelease).toBeGreaterThan(90);
    frames(240);
    expect(s.position.y).toBeGreaterThan(atRelease + 50);
    expect(s.position.y).toBeLessThanOrEqual(600);
    s.destroy();
  });

  it("rubber-bands at the top and comes back", () => {
    const { content, s } = make();
    swipe(content, 100, 300);
    expect(s.position.y).toBeLessThan(0);
    expect(s.position.y).toBeGreaterThan(-200);
    frames(300);
    expect(s.position.y).toBeCloseTo(0, 0);
    s.destroy();
  });

  it("scrolls with the wheel without passing the ends", () => {
    const { viewport, s } = make();
    const wheel = (deltaY: number) => {
      const event = Object.assign(new Event("wheel", { bubbles: true, cancelable: true }), {
        deltaX: 0,
        deltaY,
        deltaMode: 0,
      });
      viewport.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(wheel(-50)).toBe(false); // already at the top: the page may scroll
    expect(wheel(100)).toBe(true);
    expect(s.position.y).toBe(100);
    wheel(2000);
    expect(s.position.y).toBe(600);
    expect(wheel(10)).toBe(false);
    s.destroy();
  });

  it("scrolls to a position with a spring and clamps it", () => {
    const { s } = make();
    s.scrollTo({ y: 250 });
    frames(120);
    expect(s.position.y).toBeCloseTo(250, 1);
    s.scrollBy({ y: 1000 });
    frames(120);
    expect(s.position.y).toBeCloseTo(600, 1);
    s.destroy();
  });

  it("answers the keyboard", () => {
    const { viewport, s } = make();
    expect(viewport.tabIndex).toBe(0);
    const press = (key: string) =>
      viewport.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
      );
    press("PageDown");
    frames(120);
    expect(s.position.y).toBeCloseTo(360, 0);
    press("End");
    frames(120);
    expect(s.position.y).toBe(600);
    press("Home");
    frames(120);
    expect(s.position.y).toBe(0);
    press("ArrowDown");
    frames(120);
    expect(s.position.y).toBe(48);
    s.destroy();
  });

  it("lands on snap points after a throw", () => {
    const { content, s } = make({ snap: { y: [0, 200, 400, 600] } });
    swipe(content, 300, 150);
    frames(400);
    expect([0, 200, 400, 600]).toContain(Math.round(s.position.y));
    s.destroy();
  });

  it("reports the position and stops listening when destroyed", () => {
    const onScroll = vi.fn();
    const { viewport, content, s } = make({ onScroll });
    s.scrollTo({ y: 100 });
    frames(120);
    expect(onScroll).toHaveBeenLastCalledWith({ x: 0, y: expect.closeTo(100, 1) });
    s.destroy();
    expect(viewport.style.overflow).toBe("");
    swipe(content, 300, 200);
    expect(getValue(content, "y").get()).toBeCloseTo(-100, 1);
  });
});
