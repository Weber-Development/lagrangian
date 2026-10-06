# @sweberdev/lagrangian-react

React hooks for [Lagrangian](https://packages.sweber.dev/lagrangian): physical springs, draggable elements with inertia and a 2D physics world with gravity and collisions. Elements are styled directly, so nothing re-renders on every frame.

```sh
pnpm add @sweberdev/lagrangian @sweberdev/lagrangian-react
```

| Hook | What it does |
|---|---|
| `useSpringProps(props, options)` | ref that springs the element to `{ x, y, scale, rotate, opacity, --custom }` whenever they change |
| `useSpring(target, options)` | a physical value following `target` with momentum |
| `useValue(value)` | the current number, re-rendering on change (for readouts) |
| `usePhysicsValue(initial)` | a physical value that lives as long as the component |
| `useDraggable(options)` | ref and handle for a draggable, throwable element |
| `useWorld(options)` | ref for the container and the running `World` |
| `useBody(world, options)` | ref for an element that follows a body in the world |

```tsx
import { useBody, useWorld } from "@sweberdev/lagrangian-react";

function Ball({ world }) {
  const [ref] = useBody<HTMLDivElement>(world, { x: 100, y: 40, radius: 24, restitution: 0.7 });
  return <div ref={ref} className="absolute left-0 top-0 size-12 rounded-full bg-black" />;
}

export function Playground() {
  const [ref, world] = useWorld<HTMLDivElement>();
  return (
    <div ref={ref} className="relative h-96 overflow-hidden">
      <Ball world={world} />
    </div>
  );
}
```

Docs: [packages.sweber.dev/lagrangian/docs](https://packages.sweber.dev/lagrangian/docs). MIT © Seya Weber
