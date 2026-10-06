---
title: Sortable lists and layout transitions
description: Drag to reorder with springs, keyboard support, and spring transitions for any DOM change.
---

```ts
import { sortable } from "@weber-development/lagrangian-pro";

const list = sortable(ul, {
  axis: "y",              // or "x"
  handle: ".grip",        // optional
  lift: 1.03,             // scale of the lifted item
  onReorder: (from, to, items) => save(items.map((el) => el.dataset.id)),
  messages: {             // screen reader announcements, English by default
    lifted: (p, t) => `Element ${p} von ${t} aufgenommen.`,
  },
});

list.move(3, 0);
list.destroy();
```

The dragged item follows the pointer, its neighbours make room with springs, and on release the
list settles into the new order without a jump, also when the items have different heights.

**Keyboard:** items are focusable. Space picks one up, the arrow keys move it, Space or Enter
drops it, Escape puts it back. Each step is announced in a live region.

**Frameworks:** when a framework owns the DOM, pass `reorder(from, to)` and update your state
there. The transition plays once the returned promise resolves.

## Layout transitions

```ts
import { flip, measure } from "@weber-development/lagrangian-pro";

flip(grid, () => grid.prepend(card));            // children of grid spring into place

const snapshot = measure(grid);                   // before a framework update
// … DOM changes …
snapshot.play({ duration: 0.5, bounce: 0.2 });    // before the next paint
```

Elements that are already moving keep their velocity when a second change arrives.

## React

```tsx
import { arrayMove, useLayoutTransition, useSortable } from "@weber-development/lagrangian-pro-react";

const list = useSortable({ onReorder: (from, to) => setItems((x) => arrayMove(x, from, to)) });
<ul ref={list.ref}>{items.map((i) => <li key={i.id}>{i.title}</li>)}</ul>

const grid = useLayoutTransition<HTMLDivElement>([filter]);
<div ref={grid}>{visible.map((p) => <Card key={p.id} />)}</div>
```
