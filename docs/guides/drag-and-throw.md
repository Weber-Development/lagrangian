---
title: Drag and throw
description: Draggable elements with velocity, friction, bounds, rubber-banding and snap points.
---

```ts
import { draggable } from "@sweberdev/lagrangian";

const drag = draggable(element, {
  axis: "x",                       // "x", "y" or "both"
  bounds: { left: -300, right: 0 },// pixels relative to the start, or an element
  rubberband: 0.55,                // resistance past the bounds, false for a hard stop
  inertia: true,                   // glide after release
  deceleration: 0.998,             // speed kept per millisecond (0.99 stops sooner)
  snap: { x: [-300, -150, 0] },    // or a function (restingPoint) => snapped
  spring: { stiffness: 400, damping: 40 }, // for edges and snapping
  onEnd: ({ velocityX }) => console.log(velocityX),
});

drag.x.get(); // the physical values behind the element
drag.destroy();
```

## How the throw works

1. While dragging, every pointer position is sampled. The velocity is the slope of a least-squares line through the last 100 ms, which ignores the jitter of single events. If the pointer rested for more than 60 ms before release, the throw has no velocity.
2. On release the element glides with friction: `v(t) = v₀·e^(−t/τ)`. It would come to rest at `x₀ + v₀·τ`; `projectRest()` gives you that point.
3. With snap points, Lagrangian picks the snap point nearest to that resting point and adjusts the friction so the glide ends exactly there. If the throw goes the wrong way, a spring carries it over.
4. With bounds, the glide continues until the edge and a spring catches it there with the speed it had. Released past the edge, it springs back.

`rubberband(distance, dimension)` and `rubberClamp()` are exported for your own scroll containers.

Touch scrolling keeps working along the other axis: `axis: "x"` sets `touch-action: pan-y`.
