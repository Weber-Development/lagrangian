---
title: React
description: Hooks for springs, dragging and the world, without re-rendering on every frame.
---

```sh
pnpm add @sweberdev/lagrangian @sweberdev/lagrangian-react
```

All hooks write styles directly to the element, so a running animation does not re-render your component.

## Spring on state change

```tsx
import { useSpringProps } from "@sweberdev/lagrangian-react";

function Drawer({ open }: { open: boolean }) {
  const ref = useSpringProps<HTMLElement>({ x: open ? 0 : -320 }, { duration: 0.5, bounce: 0.15 });
  return <aside ref={ref}>…</aside>;
}
```

## Drag

```tsx
const [ref, drag] = useDraggable<HTMLDivElement>({ axis: "y", snap: { y: [0, 400] } });
return <div ref={ref} />;
```

Options can change between renders; callbacks always see the latest ones.

## World

```tsx
const [container, world] = useWorld<HTMLDivElement>({ gravity: { x: 0, y: 9.81 } });
const [ball] = useBody<HTMLDivElement>(world, { x: 100, y: 40, radius: 24 });
return (
  <div ref={container} style={{ position: "relative", height: 400 }}>
    <div ref={ball} style={{ position: "absolute", left: 0, top: 0, width: 48, height: 48 }} />
  </div>
);
```

## Numbers

`useSpring(target)` returns a physical value that follows `target`. `useValue(value)` turns it into a number that re-renders, which is fine for a counter or a label.

The hooks are client components (`"use client"` is included) and work with React 18 and 19.
