// Spring elements to new values. Every element keeps one physical value per property, so a new
// call while the old one is still moving continues with the current velocity instead of
// restarting.

import type { SpringOptions } from "./spring";
import { type Animation, PhysicsValue } from "./value";

export type TransformProp = "x" | "y" | "z" | "scale" | "scaleX" | "scaleY" | "rotate";
export type Prop = TransformProp | "opacity" | `--${string}`;
export type Props = Partial<Record<Prop, number>>;

export interface AnimateOptions extends SpringOptions {
  /** Starting velocity per property, e.g. from a gesture. */
  velocity?: Props;
  /** Seconds to wait before starting. */
  delay?: number;
  /** Extra delay per element when animating several, in seconds. */
  stagger?: number;
}

type Target = Element | Iterable<Element> | ArrayLike<Element> | string;

const TRANSFORMS: readonly TransformProp[] = ["x", "y", "z", "rotate", "scale", "scaleX", "scaleY"];
const registry = new WeakMap<Element, Map<Prop, PhysicsValue>>();

function initial(element: Element, prop: Prop): number {
  if (prop === "scale" || prop === "scaleX" || prop === "scaleY") return 1;
  if (prop === "opacity") {
    const style = (element as HTMLElement).style;
    const inline = style ? Number.parseFloat(style.opacity) : Number.NaN;
    if (!Number.isNaN(inline)) return inline;
    if (typeof getComputedStyle !== "function") return 1;
    const computed = Number.parseFloat(getComputedStyle(element).opacity);
    return Number.isNaN(computed) ? 1 : computed;
  }
  if (prop.startsWith("--") && typeof getComputedStyle === "function") {
    const computed = Number.parseFloat(getComputedStyle(element).getPropertyValue(prop));
    return Number.isNaN(computed) ? 0 : computed;
  }
  return 0;
}

function render(element: Element, values: Map<Prop, PhysicsValue>): void {
  const style = (element as HTMLElement | SVGElement).style;
  if (!style) return;
  const get = (prop: TransformProp) => values.get(prop)?.get();
  const parts: string[] = [];
  const x = get("x");
  const y = get("y");
  const z = get("z");
  if (x !== undefined || y !== undefined || z !== undefined) {
    parts.push(`translate3d(${x ?? 0}px, ${y ?? 0}px, ${z ?? 0}px)`);
  }
  const rotate = get("rotate");
  if (rotate !== undefined) parts.push(`rotate(${rotate}deg)`);
  const scale = get("scale");
  if (scale !== undefined) parts.push(`scale(${scale})`);
  const scaleX = get("scaleX");
  if (scaleX !== undefined) parts.push(`scaleX(${scaleX})`);
  const scaleY = get("scaleY");
  if (scaleY !== undefined) parts.push(`scaleY(${scaleY})`);
  if (TRANSFORMS.some((prop) => values.has(prop))) style.transform = parts.join(" ");
  const opacity = values.get("opacity");
  if (opacity) style.opacity = String(Math.min(Math.max(opacity.get(), 0), 1));
  for (const [prop, value] of values) {
    if (prop.startsWith("--")) style.setProperty(prop, String(value.get()));
  }
}

/**
 * The physical value behind one property of an element. Use it to read the live velocity,
 * to drive the element from a gesture with `set`, or to listen to changes.
 */
export function getValue(element: Element, prop: Prop): PhysicsValue {
  let values = registry.get(element);
  if (!values) {
    values = new Map();
    registry.set(element, values);
  }
  let v = values.get(prop);
  if (!v) {
    const map = values;
    v = new PhysicsValue(initial(element, prop));
    let queued = false;
    v.on(() => {
      // Several properties change in the same frame: write the style once.
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        render(element, map);
      });
    });
    values.set(prop, v);
  }
  return v;
}

function elements(target: Target): Element[] {
  if (typeof target === "string") {
    return typeof document === "undefined" ? [] : [...document.querySelectorAll(target)];
  }
  if (typeof Element !== "undefined" && target instanceof Element) return [target];
  return Array.from(target as ArrayLike<Element>);
}

function group(animations: Animation[]): Animation {
  const finished = Promise.all(animations.map((a) => a.finished)).then((all) => all.every(Boolean));
  return {
    finished,
    stop: () => {
      for (const a of animations) a.stop();
    },
  };
}

function delayed(seconds: number, start: () => Animation): Animation {
  if (seconds <= 0) return start();
  let inner: Animation | null = null;
  let stopped = false;
  let resolve!: (value: boolean) => void;
  const finished = new Promise<boolean>((r) => {
    resolve = r;
  });
  const timer = setTimeout(() => {
    if (stopped) return;
    inner = start();
    inner.finished.then(resolve);
  }, seconds * 1000);
  return {
    finished,
    stop: () => {
      stopped = true;
      clearTimeout(timer);
      if (inner) inner.stop();
      else resolve(false);
    },
  };
}

/**
 * Springs one or more elements to the given values.
 *
 * ```ts
 * animate(".card", { x: 120, rotate: 4, opacity: 1 }, { duration: 0.6, bounce: 0.3 })
 * ```
 */
export function animate(target: Target, props: Props, options: AnimateOptions = {}): Animation {
  const { velocity, delay = 0, stagger = 0, ...spring } = options;
  const animations = elements(target).map((element, index) =>
    delayed(delay + index * stagger, () =>
      group(
        (Object.keys(props) as Prop[]).map((prop) =>
          getValue(element, prop).to(props[prop] as number, {
            ...spring,
            ...(velocity?.[prop] !== undefined ? { velocity: velocity[prop] } : {}),
          }),
        ),
      ),
    ),
  );
  return group(animations);
}

/** Sets values immediately, without animation, and drops their momentum. */
export function set(target: Target, props: Props): void {
  for (const element of elements(target)) {
    for (const prop of Object.keys(props) as Prop[]) {
      getValue(element, prop).jump(props[prop] as number);
    }
  }
}
