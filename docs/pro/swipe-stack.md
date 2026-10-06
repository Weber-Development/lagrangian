---
title: Swipe stack
description: Cards to swipe away that tilt around the grip point and fly off at the thrown speed.
---

```ts
import { swipeStack } from "@weber-development/lagrangian-pro";

const stack = swipeStack(container, {
  directions: ["left", "right"], // also "up" and "down"
  threshold: 0.35,               // fraction of the card size
  velocity: 650,                 // a faster throw swipes even when short
  rotate: 12,                    // tilt in degrees at the threshold
  visible: 2,                    // cards shown behind the top one
  depth: { scale: 0.05, y: 14 },
  onMove: (direction, progress, card) => {},
  onSwipe: (card, direction, index) => {},
  onEmpty: () => {},
});

stack.swipe("right"); // as if thrown
stack.undo();         // brings the last card back
stack.refresh();      // after appending new cards
```

The children of `container` are the cards, the first one on top. Stack them in one place, for
example with `display: grid` and `grid-area: 1 / 1` on every card.

A card grabbed in its upper half turns one way, grabbed in its lower half the other way, like a
real card pivoting around your finger. While dragging, the top card carries
`data-swipe="left"` (or another direction) and `--swipe-progress` from 0 to 1, so CSS can show
stamps:

```css
.card[data-swipe="right"] .like { opacity: var(--swipe-progress); }
```

## React

```tsx
const stack = useSwipeStack({ onSwipe: (card, direction) => save(card.dataset.id, direction) });
<div ref={stack.ref} className="cards">{cards.map((c) => <Card key={c.id} data-id={c.id} />)}</div>
<p>{stack.remaining} left</p>
```
