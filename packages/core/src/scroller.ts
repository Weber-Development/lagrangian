// Scrolling with physics: drag the content and let go, it glides with friction and rubber-bands
// at the ends. The mouse wheel, the keys and `scrollTo` move the same values, so every way of
// scrolling hands over to the others without a jump, and snap points work for all of them.

import { getValue } from "./animate";
import type { Snap } from "./decay";
import { draggable } from "./drag";
import type { SpringOptions } from "./spring";
import type { PhysicsValue } from "./value";

export interface ScrollerOptions {
  /** Direction of scrolling. Default "y". */
  axis?: "x" | "y" | "both";
  /** The element that moves. Default the first child of the viewport. */
  content?: HTMLElement;
  /** Resistance past the ends, 0 to 1 (0.55 like iOS), or false to stop hard. */
  rubberband?: number | false;
  /** Fraction of speed kept per millisecond during the glide. Default 0.998. */
  deceleration?: number;
  /** Scroll positions to land on, per axis, as positions from the top/left or a function. */
  snap?: { x?: Snap; y?: Snap };
  /** Scroll with the mouse wheel and trackpad. Default true. */
  wheel?: boolean;
  /** Scroll with arrow keys, Page Up/Down, Home, End and Space while the viewport has focus. */
  keys?: boolean;
  /** Spring for `scrollTo`, keys and snapping. */
  spring?: SpringOptions;
  /** Called with the scroll position (positive numbers) whenever it changes. */
  onScroll?: (position: { x: number; y: number }) => void;
}

export interface Scroller {
  /** Scroll position in pixels from the top left. */
  readonly position: { x: number; y: number };
  /** Largest scroll position per axis. */
  readonly max: { x: number; y: number };
  /** The scroll offset as physical values; they are the negative of the content translation. */
  readonly x: PhysicsValue;
  readonly y: PhysicsValue;
  scrollTo(position: { x?: number; y?: number }, spring?: SpringOptions): void;
  scrollBy(delta: { x?: number; y?: number }, spring?: SpringOptions): void;
  /** Measures again after the content or the viewport changed size. */
  refresh(): void;
  destroy(): void;
}

const LINE = 16;
const WHEEL_IDLE = 120;
const DEFAULT_SPRING: SpringOptions = { duration: 0.5, bounce: 0 };

/** Makes a viewport scroll with inertia and rubber-banding. The content should fill it. */
export function scroller(viewport: HTMLElement, options: ScrollerOptions = {}): Scroller {
  const axis = options.axis ?? "y";
  const content = options.content ?? (viewport.firstElementChild as HTMLElement | null);
  if (!content) throw new Error("A scroller needs a content element inside the viewport.");
  const spring = options.spring ?? DEFAULT_SPRING;
  const tx = getValue(content, "x");
  const ty = getValue(content, "y");
  const moveX = axis !== "y";
  const moveY = axis !== "x";
  const max = { x: 0, y: 0 };
  let wheelTimer: number | null = null;

  const measure = () => {
    max.x = Math.max(0, Math.max(content.scrollWidth, content.offsetWidth) - viewport.clientWidth);
    max.y = Math.max(
      0,
      Math.max(content.scrollHeight, content.offsetHeight) - viewport.clientHeight,
    );
  };
  measure();

  const clamp = (value: number, limit: number) => Math.min(Math.max(value, 0), limit);
  const flip = (snap: Snap | undefined): Snap | undefined => {
    if (snap === undefined) return undefined;
    if (typeof snap === "function") return (p: number) => -snap(-p);
    return snap.map((p) => -p);
  };

  const previousOverflow = viewport.style.overflow;
  viewport.style.overflow = "hidden";
  const drag = draggable(content, {
    axis,
    rubberband: options.rubberband ?? 0.55,
    ...(options.deceleration !== undefined ? { deceleration: options.deceleration } : {}),
    spring: options.spring ?? { stiffness: 400, damping: 40 },
    bounds: () => {
      measure();
      return { left: -max.x, right: 0, top: -max.y, bottom: 0 };
    },
    snap: {
      ...(moveX && options.snap?.x ? { x: flip(options.snap.x) as Snap } : {}),
      ...(moveY && options.snap?.y ? { y: flip(options.snap.y) as Snap } : {}),
    },
  });

  const read = () => ({ x: 0 - tx.get(), y: 0 - ty.get() });
  const report = () => options.onScroll?.(read());
  const stopX = tx.on(report);
  const stopY = ty.on(report);

  const settle = (value: PhysicsValue, limit: number, snap: Snap | undefined) => {
    value.throw({
      velocity: 0,
      min: -limit,
      max: 0,
      bounce: spring,
      ...(snap !== undefined ? { snap: flip(snap) as Snap } : {}),
    });
  };

  const wheel = (event: WheelEvent) => {
    measure();
    const unit = event.deltaMode === 1 ? LINE : event.deltaMode === 2 ? viewport.clientHeight : 1;
    const dx = moveX ? event.deltaX * unit : 0;
    const dy = moveY ? event.deltaY * unit : 0;
    const nx = clamp(-tx.get() + dx, max.x);
    const ny = clamp(-ty.get() + dy, max.y);
    // At an end the page keeps scrolling, like a native scroller.
    if (nx === -tx.get() && ny === -ty.get()) return;
    event.preventDefault();
    if (dx) {
      tx.stop();
      tx.set(-nx);
    }
    if (dy) {
      ty.stop();
      ty.set(-ny);
    }
    if (wheelTimer !== null) window.clearTimeout(wheelTimer);
    // When the wheel rests, land on a snap point.
    if (options.snap) {
      wheelTimer = window.setTimeout(() => {
        wheelTimer = null;
        if (moveX) settle(tx, max.x, options.snap?.x);
        if (moveY) settle(ty, max.y, options.snap?.y);
      }, WHEEL_IDLE);
    }
  };
  if (options.wheel ?? true) viewport.addEventListener("wheel", wheel, { passive: false });

  const scrollTo = (position: { x?: number; y?: number }, to: SpringOptions = spring) => {
    measure();
    if (position.x !== undefined && moveX) tx.to(-clamp(position.x, max.x), to);
    if (position.y !== undefined && moveY) ty.to(-clamp(position.y, max.y), to);
  };
  const scrollBy = (delta: { x?: number; y?: number }, to?: SpringOptions) =>
    scrollTo({ x: -tx.get() + (delta.x ?? 0), y: -ty.get() + (delta.y ?? 0) }, to);

  const key = (event: KeyboardEvent) => {
    if (event.target !== viewport || event.altKey || event.ctrlKey || event.metaKey) return;
    const page = moveY ? viewport.clientHeight : viewport.clientWidth;
    const step = LINE * 3;
    const along = (n: number) => (moveY ? { y: n } : { x: n });
    let to: { x?: number; y?: number } | null = null;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        to = { x: -tx.get() + (moveY ? 0 : step), y: -ty.get() + (moveY ? step : 0) };
        break;
      case "ArrowUp":
      case "ArrowLeft":
        to = { x: -tx.get() - (moveY ? 0 : step), y: -ty.get() - (moveY ? step : 0) };
        break;
      case "PageDown":
        to = along((moveY ? -ty.get() : -tx.get()) + page * 0.9);
        break;
      case "PageUp":
        to = along((moveY ? -ty.get() : -tx.get()) - page * 0.9);
        break;
      case " ":
        to = along((moveY ? -ty.get() : -tx.get()) + (event.shiftKey ? -page : page) * 0.9);
        break;
      case "Home":
        to = { x: moveX ? 0 : undefined, y: moveY ? 0 : undefined } as { x?: number; y?: number };
        break;
      case "End":
        to = { x: moveX ? max.x : undefined, y: moveY ? max.y : undefined } as {
          x?: number;
          y?: number;
        };
        break;
    }
    if (!to) return;
    event.preventDefault();
    scrollTo(to);
  };
  if (options.keys ?? true) {
    if (!viewport.hasAttribute("tabindex")) viewport.tabIndex = 0;
    viewport.addEventListener("keydown", key);
  }

  let observer: ResizeObserver | null = null;
  const refresh = () => {
    measure();
    // Content that got shorter would leave the viewport empty.
    if (moveY && -ty.get() > max.y) ty.to(-max.y, spring);
    if (moveX && -tx.get() > max.x) tx.to(-max.x, spring);
  };
  if (typeof ResizeObserver === "function") {
    observer = new ResizeObserver(refresh);
    observer.observe(viewport);
    observer.observe(content);
  }

  return {
    get position() {
      return read();
    },
    max,
    x: tx,
    y: ty,
    scrollTo,
    scrollBy,
    refresh,
    destroy() {
      drag.destroy();
      stopX();
      stopY();
      observer?.disconnect();
      if (wheelTimer !== null) window.clearTimeout(wheelTimer);
      viewport.removeEventListener("wheel", wheel);
      viewport.removeEventListener("keydown", key);
      viewport.style.overflow = previousOverflow;
    },
  };
}
