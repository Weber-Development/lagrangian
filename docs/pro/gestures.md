---
title: Gestures
description: How a carousel in a drawer, a sheet around a carousel and a swipe back decide who gets the finger.
---

Several parts can listen for the same finger: a carousel inside a drawer, a sheet around a horizontal carousel, the swipe back at the edge of a page. Since Lagrangian Pro 2.0 they do not all move at once. The sheet, drawer, carousel and stack navigation use a small referee, and you can use it for your own parts.

## The rules

1. Every part that could use the gesture registers on `pointerdown`.
2. Nothing moves until the finger has moved a few pixels (6 by default). A tap starts nothing.
3. The direction decides: more horizontal movement asks the parts that react to the x axis, more vertical movement the others.
4. Among those, the part with the highest `priority` wins, and with equal priority the innermost one. A part that **cannot move in this direction right now** declines.
5. The winner starts its gesture. The others stay put for this finger.

Declining is what makes nesting work: a carousel on its last slide declines a swipe to the left, so the drawer around it takes the swipe and closes. In the middle of the carousel the carousel takes it. The swipe back from the left edge has a higher priority than anything inside the page, so it beats a carousel there.

## Your own parts

```ts
import { contend } from "@weber-development/lagrangian-pro";

element.addEventListener("pointerdown", (event) => {
  contend(event, {
    axis: "x",                       // "x", "y" or "both"
    priority: 0,                     // higher wins, default 0
    accepts: (delta) => delta > 0 || position > min, // can I move that way now?
    onWin: (move) => startDragging(move), // the pointer event that decided
  });
});
```

`onWin` receives the move event that decided. Start the gesture from there (capture the pointer, remember the position) so there is no jump. `contested(pointerId)` tells you whether parts are still waiting.

## Notes

- Sortable lists and boards start their drag on their own (a hold or a handle) and do not take part.
- Scrolled content inside a sheet still scrolls first: the sheet only starts when the content is at its top.
