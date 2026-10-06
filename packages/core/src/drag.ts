// Drag an element with the pointer and throw it: rubber-band past the bounds, glide with
// friction on release, settle on snap points. The element moves via its x/y physical values,
// so `animate()` and a drag can hand over to each other at any moment.

import { getValue } from "./animate";
import { rubberClamp, type Snap } from "./decay";
import type { SpringOptions } from "./spring";
import type { PhysicsValue } from "./value";

export interface Bounds {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export interface DragInfo {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export interface DraggableOptions {
  /** Restrict movement to one axis. Default "both". */
  axis?: "x" | "y" | "both";
  /**
   * Movement limits in pixels relative to the start position, or an element the dragged
   * element has to stay inside.
   */
  bounds?: Bounds | Element | (() => Bounds | Element);
  /** Resistance past the bounds, 0 to 1 (0.55 like iOS), or false to stop hard at the edge. */
  rubberband?: number | false;
  /** Keep moving with friction after release. Default true. */
  inertia?: boolean;
  /** Fraction of speed kept per millisecond during the throw. Default 0.998. */
  deceleration?: number;
  /** Snap points per axis, in pixels relative to the start position. */
  snap?: { x?: Snap; y?: Snap };
  /** Spring for snapping and for bouncing off the bounds. */
  spring?: SpringOptions;
  onStart?: (info: DragInfo) => void;
  onMove?: (info: DragInfo) => void;
  /** Called on release with the throw velocity. */
  onEnd?: (info: DragInfo) => void;
}

export interface Draggable {
  readonly x: PhysicsValue;
  readonly y: PhysicsValue;
  readonly dragging: boolean;
  destroy(): void;
}

type Range = [number, number];
const FREE: Range = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];

function ranges(element: Element, x: number, y: number, bounds: DraggableOptions["bounds"]) {
  const b = typeof bounds === "function" ? bounds() : bounds;
  if (!b) return { x: FREE, y: FREE };
  if (typeof Element !== "undefined" && b instanceof Element) {
    const outer = b.getBoundingClientRect();
    const inner = element.getBoundingClientRect();
    // Origin of the element without its current translation.
    const left = inner.left - x;
    const top = inner.top - y;
    return {
      x: [outer.left - left, outer.right - left - inner.width] as Range,
      y: [outer.top - top, outer.bottom - top - inner.height] as Range,
    };
  }
  const box = b as Bounds;
  return {
    x: [box.left ?? FREE[0], box.right ?? FREE[1]] as Range,
    y: [box.top ?? FREE[0], box.bottom ?? FREE[1]] as Range,
  };
}

/** Makes an element draggable and throwable. */
export function draggable(element: HTMLElement, options: DraggableOptions = {}): Draggable {
  const axis = options.axis ?? "both";
  const x = getValue(element, "x");
  const y = getValue(element, "y");
  const moveX = axis !== "y";
  const moveY = axis !== "x";
  let pointer: number | null = null;
  let start = { px: 0, py: 0, x: 0, y: 0 };
  let range = { x: FREE, y: FREE };

  const info = (): DragInfo => ({
    x: x.get(),
    y: y.get(),
    velocityX: x.velocity,
    velocityY: y.velocity,
  });

  const previousTouchAction = element.style.touchAction;
  element.style.touchAction = axis === "x" ? "pan-y" : axis === "y" ? "pan-x" : "none";

  const place = (value: number, [min, max]: Range, dimension: number) => {
    if (options.rubberband === false) return Math.min(Math.max(value, min), max);
    return rubberClamp(value, min, max, dimension, options.rubberband ?? 0.55);
  };

  const down = (event: PointerEvent) => {
    if (pointer !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
    pointer = event.pointerId;
    element.setPointerCapture?.(event.pointerId);
    x.stop();
    y.stop();
    start = { px: event.clientX, py: event.clientY, x: x.get(), y: y.get() };
    range = ranges(element, start.x, start.y, options.bounds);
    // Grabbing stops the momentum; the samples from here on give the throw velocity.
    x.jump(start.x);
    y.jump(start.y);
    if (moveX) x.set(start.x);
    if (moveY) y.set(start.y);
    options.onStart?.(info());
  };

  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    const viewport =
      typeof window !== "undefined" ? window : { innerWidth: 1000, innerHeight: 1000 };
    if (moveX) x.set(place(start.x + event.clientX - start.px, range.x, viewport.innerWidth));
    if (moveY) y.set(place(start.y + event.clientY - start.py, range.y, viewport.innerHeight));
    options.onMove?.(info());
  };

  const release = (value: PhysicsValue, [min, max]: Range, snap: Snap | undefined) => {
    const throwOptions = {
      min,
      max,
      bounce: options.spring,
      ...(options.deceleration !== undefined ? { deceleration: options.deceleration } : {}),
      ...(snap !== undefined ? { snap } : {}),
    };
    if (options.inertia !== false) {
      value.throw(throwOptions);
      return;
    }
    // Without inertia only snap points and bounds move the element after release.
    value.throw({ ...throwOptions, velocity: 0 });
  };

  const up = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    element.releasePointerCapture?.(event.pointerId);
    options.onEnd?.(info());
    if (moveX) release(x, range.x, options.snap?.x);
    if (moveY) release(y, range.y, options.snap?.y);
  };

  element.addEventListener("pointerdown", down);
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", up);
  element.addEventListener("pointercancel", up);

  return {
    x,
    y,
    get dragging() {
      return pointer !== null;
    },
    destroy() {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      element.style.touchAction = previousTouchAction;
    },
  };
}
