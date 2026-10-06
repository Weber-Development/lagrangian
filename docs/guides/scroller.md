---
title: Scrolling with physics
description: Inertia, rubber-banding and snap points for a scroll area, with wheel, keyboard and scrollTo on the same values.
---

```ts
import { scroller } from "@sweberdev/lagrangian";

const list = scroller(viewport, {
  axis: "y",                     // "x", "y" or "both"
  snap: { y: [0, 320, 640] },    // optional: positions to land on
  onScroll: ({ x, y }) => {},
});

list.scrollTo({ y: 320 });       // springs there
list.scrollBy({ y: 100 });
list.position;                   // { x, y } in pixels from the top left
list.max;                        // largest position per axis
list.refresh();                  // after the content changed size
```

The first child of the viewport is the content. It moves with a transform, the viewport gets
`overflow: hidden`, and the content should be at least as tall as the viewport so it can be
grabbed anywhere.

## How it feels

Drag and let go: the content glides with friction like iOS scrolling and rubber-bands at the ends
(`rubberband`, `deceleration`). With `snap` the glide is adjusted so it ends exactly on a snap
point. The mouse wheel and trackpad scroll the same values, stop a glide in progress and land on
a snap point when the wheel rests. At an end the wheel lets the page scroll on. Arrow keys,
Page Up and Down, Space, Home and End work while the viewport has focus (it gets `tabindex="0"`
unless it has one); turn them off with `keys: false`.

Because a drag, a glide, the wheel, the keys and `scrollTo` all move the same two physical values
(`list.x` and `list.y`, the negative of the translation), they hand over to each other without a
jump, and you can drive other animations from them with `value.on(listener)`.

With reduced motion `scrollTo` and snapping jump to the end; dragging still follows the pointer.

## React

```tsx
const [ref, list] = useScroller<HTMLDivElement>({ axis: "y" });
return <div ref={ref}><ul>…</ul></div>;
```
