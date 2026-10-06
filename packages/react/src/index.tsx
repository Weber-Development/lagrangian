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
  type SpringOptions,
  value,
  World,
  type WorldOptions,
} from "@sweberdev/lagrangian";
import {
  type RefCallback,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Keeps the latest value in a ref so callbacks never go stale. */
function useLatest<T>(current: T) {
  const ref = useRef(current);
  useIsoLayoutEffect(() => {
    ref.current = current;
  });
  return ref;
}

/**
 * A ref callback with cleanup that works in React 18 (called with null) and 19 (cleanup return).
 */
function useAttach<T extends Element>(attach: (element: T) => () => void): RefCallback<T> {
  const cleanup = useRef<(() => void) | null>(null);
  const latest = useLatest(attach);
  return useCallback(
    (element: T | null) => {
      cleanup.current?.();
      cleanup.current = null;
      if (!element) return;
      const detach = latest.current(element);
      cleanup.current = detach;
      return () => {
        if (cleanup.current === detach) {
          detach();
          cleanup.current = null;
        }
      };
    },
    [latest],
  );
}

/** A physical value that lives as long as the component. */
export function usePhysicsValue(initial = 0): PhysicsValue {
  const [v] = useState(() => value(initial));
  useEffect(() => () => v.stop(), [v]);
  return v;
}

/**
 * A value that springs to `target` whenever it changes, keeping its momentum when the target
 * changes mid-flight. Read it with `useValue` or subscribe with `value.on`.
 */
export function useSpring(target: number, options: SpringOptions = {}): PhysicsValue {
  const v = usePhysicsValue(target);
  const latest = useLatest(options);
  useEffect(() => {
    v.to(target, latest.current);
  }, [v, target, latest]);
  return v;
}

/** Re-renders with the current number. Fine for readouts; style elements with `useSpringProps`. */
export function useValue(v: PhysicsValue): number {
  return useSyncExternalStore(
    (notify) => v.on(notify),
    () => v.get(),
    () => v.get(),
  );
}

/**
 * Springs an element to `props` whenever they change, without re-rendering on every frame.
 *
 * ```tsx
 * const ref = useSpringProps<HTMLDivElement>({ x: open ? 240 : 0 }, { bounce: 0.3 })
 * return <div ref={ref} />
 * ```
 */
export function useSpringProps<T extends Element>(props: Props, options: AnimateOptions = {}) {
  const ref = useRef<T>(null);
  const latest = useLatest(options);
  const key = JSON.stringify(props);
  useIsoLayoutEffect(() => {
    if (!ref.current) return;
    const animation = animate(ref.current, props, latest.current);
    return () => animation.stop();
  }, [key, latest]);
  return ref;
}

/** Makes the element draggable and throwable. Returns a ref callback and the drag handle. */
export function useDraggable<T extends HTMLElement>(
  options: DraggableOptions = {},
): [RefCallback<T>, Draggable | null] {
  const [handle, setHandle] = useState<Draggable | null>(null);
  const latest = useLatest(options);
  const ref = useAttach<T>((element) => {
    // Read options when events fire, so callbacks and snap points can change between renders.
    const current = latest.current;
    const drag = draggable(element, {
      ...current,
      bounds: () => {
        const b = latest.current.bounds;
        return (typeof b === "function" ? b() : b) ?? {};
      },
      onStart: (info) => latest.current.onStart?.(info),
      onMove: (info) => latest.current.onMove?.(info),
      onEnd: (info) => latest.current.onEnd?.(info),
    });
    setHandle(drag);
    return () => {
      drag.destroy();
      setHandle(null);
    };
  });
  return [ref, handle];
}

/**
 * A running physics world whose walls are the container element. Bodies inside can be
 * grabbed and thrown unless `interactive` is false.
 */
export function useWorld<T extends HTMLElement>(
  options: Omit<WorldOptions, "bounds"> & { interactive?: boolean } = {},
): [RefCallback<T>, World] {
  const latest = useLatest(options);
  const [world] = useState(
    () =>
      new World({
        ...options,
        onFrame: (w) => latest.current.onFrame?.(w),
        onCollide: (a, b, speed) => latest.current.onCollide?.(a, b, speed),
      }),
  );
  const ref = useAttach<T>((element) => {
    world.setBounds(element);
    world.start();
    const unbind = latest.current.interactive !== false ? world.bindPointer(element) : () => {};
    return () => {
      unbind();
      world.stop();
    };
  });
  return [ref, world];
}

/** Adds a body to the world that the element follows. Position the element absolutely at 0,0. */
export function useBody<T extends HTMLElement>(
  world: World,
  options: Omit<BodyOptions, "element">,
): [RefCallback<T>, Body | null] {
  const [body, setBody] = useState<Body | null>(null);
  const latest = useLatest(options);
  const ref = useAttach<T>((element) => {
    const added = world.add({ ...latest.current, element });
    setBody(added);
    return () => {
      world.remove(added);
      setBody(null);
    };
  });
  return [ref, body];
}

export type {
  AnimateOptions,
  Body,
  BodyOptions,
  Draggable,
  DraggableOptions,
  PhysicsValue,
  Props,
  SpringOptions,
  WorldOptions,
};
