---
title: Toasts, indicator, fall
description: A swipeable toast stack, a sliding tab indicator and a page effect that lets a section fall apart and come back.
---

```ts
import { fall, indicator, toasts } from "@weber-development/lagrangian-pro";
```

## Toasts

```ts
const stack = toasts(corner, {
  edge: "bottom",   // new toasts arrive from this edge: "top" or "bottom"
  max: 4,           // older ones are dismissed
  duration: 5000,   // ms, 0 keeps toasts until dismissed
  swipe: true,      // throw a toast away sideways
});

const saved = stack.show("Saved");
const failed = stack.show("Upload failed", { role: "alert", duration: 0 });
await failed.dismiss();
stack.clear();
```

The host element is laid out by you, usually `position: fixed` with `display: flex;
flex-direction: column`. A new toast springs in from the edge while the others move to make room;
when one leaves, the rest spring into the gap. A swipe sideways throws a toast away at the speed
of the throw, a slow one brings it back. Timers stop while the pointer or the keyboard focus is on
the stack and continue with the time that was left. Toasts are `role="status"` (polite) or
`role="alert"` (interrupts), and `content` can be a string or a DOM node, for example with an
action button. With reduced motion toasts appear and leave without movement.

## Indicator

```ts
const tabs = indicator(track, bar, {
  itemSelector: "button",
  onSelect: (index, item) => {},
});

tabs.select(2);
tabs.refresh(); // after a resize
```

`track` is positioned, `bar` is an absolutely positioned element at its left edge. The bar slides
with `x` and stretches with `scaleX` to the width of the selected item, so it also works for
tabs of different widths. A new selection while the bar is moving keeps its velocity. Clicking an
item selects it (turn off with `clickToSelect: false`), and the items get `aria-selected`. Give
the bar a plain background: stretching distorts rounded corners and borders.

## Fall

```ts
const effect = fall(section, { gravity: 9.81, restitution: 0.3 });

effect.start();                                // the children let go, lowest first
effect.explode({ x: 400, y: 600 }, 900);       // throw them away from a point
await effect.restore();                        // spring back into the layout
```

Every child gets an invisible placeholder of the same size, so the page does not jump, and then
becomes a box in a physics world with the viewport as floor and walls (`bounds` changes that).
`restore()` springs each piece from wherever it lies, including its rotation, to its place.
`effect.world` is the underlying [World](../guides/world.md) if you want to add bodies or
listen for collisions. Needs `@sweberdev/lagrangian` 0.2 or later.

## React

```tsx
const toast = useToasts({ edge: "top" });             // ref, show, clear
const tabs = useIndicator({ itemSelector: "button" }); // ref (track), bar (ref), index, select
const effect = useFall();                              // ref, active, start, explode, restore
```

```tsx
<div ref={tabs.ref} style={{ position: "relative" }}>
  <span ref={tabs.bar} className="bar" />
  <button>One</button>
  <button>Two</button>
</div>
```
