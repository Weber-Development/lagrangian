import {
  type AnimateOptions,
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
import {
  type MaybeRefOrGetter,
  onScopeDispose,
  type Ref,
  readonly,
  shallowRef,
  toValue,
  watch,
} from "vue";

type ElementRef<T extends Element> = Ref<T | null | undefined>;

/**
 * Runs `attach` whenever the element appears and its cleanup when it goes away or the scope ends.
 * Works with template refs and with refs you set yourself.
 */
function attach<T extends Element>(
  element: ElementRef<T>,
  setup: (el: T) => () => void,
): () => void {
  let cleanup: (() => void) | null = null;
  const stop = watch(
    element,
    (el) => {
      cleanup?.();
      cleanup = el ? setup(el) : null;
    },
    { immediate: true, flush: "post" },
  );
  const dispose = () => {
    stop();
    cleanup?.();
    cleanup = null;
  };
  onScopeDispose(dispose);
  return dispose;
}

/** A physical value that lives as long as the component or effect scope. */
export function usePhysicsValue(initial = 0): PhysicsValue {
  const v = value(initial);
  onScopeDispose(() => v.stop());
  return v;
}

/**
 * A number that springs to `target` whenever it changes, keeping its momentum when the target
 * changes mid-flight. Read `.value` in templates and computed properties.
 */
export function useSpring(
  target: MaybeRefOrGetter<number>,
  options: SpringOptions = {},
): Readonly<Ref<number>> {
  const v = usePhysicsValue(toValue(target));
  const shown = shallowRef(v.get());
  const stop = v.on(() => {
    shown.value = v.get();
  });
  onScopeDispose(stop);
  watch(
    () => toValue(target),
    (next) => {
      v.to(next, options);
    },
  );
  return readonly(shown) as Readonly<Ref<number>>;
}

/**
 * Springs an element to `props` whenever they change, without re-rendering on every frame.
 *
 * ```vue
 * const el = ref<HTMLElement>()
 * useSpringProps(el, () => ({ x: open.value ? 240 : 0 }), { bounce: 0.3 })
 * ```
 */
export function useSpringProps<T extends Element>(
  element: ElementRef<T>,
  props: MaybeRefOrGetter<Props>,
  options: AnimateOptions = {},
): void {
  watch(
    [element, () => JSON.stringify(toValue(props))],
    ([el], _, onCleanup) => {
      if (!el) return;
      const animation = animate(el, toValue(props), options);
      onCleanup(() => animation.stop());
    },
    { immediate: true, flush: "post" },
  );
}

/** Makes the element draggable and throwable. */
export function useDraggable<T extends HTMLElement>(
  element: ElementRef<T>,
  options: MaybeRefOrGetter<DraggableOptions> = {},
): Readonly<Ref<Draggable | null>> {
  const handle = shallowRef<Draggable | null>(null);
  attach(element, (el) => {
    // Options are read when events fire, so callbacks and snap points can change.
    const current = () => toValue(options);
    const drag = draggable(el, {
      ...current(),
      bounds: () => {
        const b = current().bounds;
        return (typeof b === "function" ? b() : b) ?? {};
      },
      onStart: (info) => current().onStart?.(info),
      onMove: (info) => current().onMove?.(info),
      onEnd: (info) => current().onEnd?.(info),
    });
    handle.value = drag;
    return () => {
      drag.destroy();
      handle.value = null;
    };
  });
  return handle;
}

/** Makes the element a scroll area with inertia, rubber-banding and snap points. */
export function useScroller<T extends HTMLElement>(
  element: ElementRef<T>,
  options: MaybeRefOrGetter<ScrollerOptions> = {},
): Readonly<Ref<Scroller | null>> {
  const handle = shallowRef<Scroller | null>(null);
  attach(element, (el) => {
    const s = scroller(el, {
      ...toValue(options),
      onScroll: (position) => toValue(options).onScroll?.(position),
    });
    handle.value = s;
    return () => {
      s.destroy();
      handle.value = null;
    };
  });
  return handle;
}

/**
 * A running physics world whose walls are the container element. Bodies inside can be grabbed
 * and thrown unless `interactive` is false.
 */
export function useWorld<T extends HTMLElement>(
  element: ElementRef<T>,
  options: Omit<WorldOptions, "bounds"> & { interactive?: boolean } = {},
): World {
  const world = new World({ ...options });
  attach(element, (el) => {
    world.setBounds(el);
    world.start();
    const unbind = options.interactive !== false ? world.bindPointer(el) : () => {};
    return () => {
      unbind();
      world.stop();
    };
  });
  onScopeDispose(() => world.destroy());
  return world;
}

/** Adds a body to the world that the element follows. Position the element absolutely at 0,0. */
export function useBody<T extends HTMLElement>(
  world: World,
  element: ElementRef<T>,
  options: Omit<BodyOptions, "element">,
): Readonly<Ref<Body | null>> {
  const body = shallowRef<Body | null>(null);
  attach(element, (el) => {
    const added = world.add({ ...options, element: el });
    body.value = added;
    return () => {
      world.remove(added);
      body.value = null;
    };
  });
  return body;
}

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
