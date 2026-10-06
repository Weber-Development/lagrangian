// Svelte actions and stores. Nothing here imports from "svelte": an action is a function that
// takes a node and returns { update, destroy }, and a store is an object with `subscribe`, so
// these work with Svelte 3, 4 and 5 and in plain TypeScript.

import {
  type AnimateOptions,
  type Animation,
  animate,
  type Body,
  type BodyOptions,
  type Draggable,
  type DraggableOptions,
  draggable,
  type PhysicsValue,
  type Props,
  type Scroller,
  type ScrollerOptions,
  type SpringOptions,
  scroller,
  value,
  World,
  type WorldOptions,
} from "@sweberdev/lagrangian";

export interface ActionReturn<P> {
  update?: (parameter: P) => void;
  destroy?: () => void;
}

/** The shape of a Svelte action. */
export type Action<N extends Element, P> = (node: N, parameter: P) => ActionReturn<P>;

export interface SpringActionParameter {
  props: Props;
  options?: AnimateOptions;
}

/**
 * Springs the node to `props` whenever they change, keeping its momentum.
 *
 * ```svelte
 * <div use:spring={{ props: { x: open ? 240 : 0 }, options: { bounce: 0.3 } }}></div>
 * ```
 */
export const spring: Action<HTMLElement | SVGElement, SpringActionParameter> = (
  node,
  parameter,
) => {
  let animation: Animation | null = null;
  let key = "";
  const run = (next: SpringActionParameter) => {
    const nextKey = JSON.stringify(next.props);
    if (nextKey === key) return;
    key = nextKey;
    animation?.stop();
    animation = animate(node, next.props, next.options ?? {});
  };
  run(parameter);
  return {
    update: run,
    destroy: () => animation?.stop(),
  };
};

/** Makes the node draggable and throwable. */
export const drag: Action<HTMLElement, DraggableOptions | undefined> = (node, options = {}) => {
  let current = options;
  const handle: Draggable = draggable(node, {
    ...current,
    // Read when events fire, so callbacks and snap points can change after mount.
    bounds: () => {
      const b = current.bounds;
      return (typeof b === "function" ? b() : b) ?? {};
    },
    onStart: (info) => current.onStart?.(info),
    onMove: (info) => current.onMove?.(info),
    onEnd: (info) => current.onEnd?.(info),
  });
  return {
    update: (next = {}) => {
      current = next;
    },
    destroy: () => handle.destroy(),
  };
};

/** Makes the node a scroll area with inertia, rubber-banding and snap points. */
export const scroll: Action<HTMLElement, ScrollerOptions | undefined> = (node, options = {}) => {
  let current = options;
  const handle: Scroller = scroller(node, {
    ...current,
    onScroll: (position) => current.onScroll?.(position),
  });
  return {
    update: (next = {}) => {
      current = next;
    },
    destroy: () => handle.destroy(),
  };
};

export interface Readable<T> {
  subscribe(run: (value: T) => void): () => void;
}

export interface SpringStore extends Readable<number> {
  /** Springs to a new target; resolves when it has settled. */
  set(target: number): Promise<boolean>;
  /** Moves without animation. */
  jump(target: number): void;
  /** The underlying physical value, e.g. for velocity or `throw()`. */
  readonly value: PhysicsValue;
}

/**
 * A store that springs to whatever you set, keeping its momentum when the target changes
 * mid-flight. Use it with `$store` in templates.
 */
export function springStore(initial = 0, options: SpringOptions = {}): SpringStore {
  const v = value(initial);
  return {
    subscribe(run) {
      run(v.get());
      return v.on(() => run(v.get()));
    },
    set: (target) => v.to(target, options).finished,
    jump: (target) => v.jump(target),
    value: v,
  };
}

/**
 * Turns the node into the walls of a running physics world. Create the world yourself to add
 * bodies to it:
 *
 * ```svelte
 * const w = new World()
 * <div use:physics={{ world: w }}>
 * ```
 */
export const physics: Action<
  HTMLElement,
  { world: World; interactive?: boolean } & Omit<WorldOptions, "bounds">
> = (node, parameter) => {
  const apply = (p: typeof parameter) => {
    p.world.setBounds(node);
    p.world.start();
    const unbind = p.interactive !== false ? p.world.bindPointer(node) : () => {};
    return () => {
      unbind();
      p.world.stop();
    };
  };
  let cleanup = apply(parameter);
  return {
    update: (next) => {
      cleanup();
      cleanup = apply(next);
    },
    destroy: () => cleanup(),
  };
};

/** Adds a body to the world that the node follows. Position the node absolutely at 0,0. */
export const body: Action<HTMLElement, { world: World } & Omit<BodyOptions, "element">> = (
  node,
  { world, ...options },
) => {
  let added: Body = world.add({ ...options, element: node });
  return {
    update: (next) => {
      world.remove(added);
      const { world: w, ...rest } = next;
      added = w.add({ ...rest, element: node });
    },
    destroy: () => world.remove(added),
  };
};

export type {
  AnimateOptions,
  Body,
  BodyOptions,
  Draggable,
  DraggableOptions,
  PhysicsValue,
  Props,
  Scroller,
  ScrollerOptions,
  SpringOptions,
  WorldOptions,
};
export { World };
