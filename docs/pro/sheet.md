---
title: Bottom sheet
description: A sheet with detents that lands where the throw would carry it.
---

```ts
import { sheet } from "@weber-development/lagrangian-pro";

const filters = sheet(element, {
  detents: [0.4, 1],        // fractions of the sheet height, or pixels above 1
  initial: -1,              // -1 closed (default when dismissible)
  dismissible: true,        // a throw down closes it
  handle: grip,             // drag only here; content keeps scrolling
  backdrop: shade,          // opacity 0 closed … 1 at the first detent, tap closes
  closeOnEscape: true,
  flick: 400,               // px/s from which a flick moves at least one detent
  spring: { duration: 0.45, bounce: 0.12 },
  onChange: (index) => {},  // -1 when closed
});

filters.open();      // first detent
filters.snapTo(1);
filters.close();
filters.y;           // the PhysicsValue behind the translation
filters.destroy();
```

Place the element at the bottom of the viewport with its full height, for example
`position: fixed; bottom: 0; height: 90vh`. The sheet translates it down.

On release the sheet projects where the throw would come to rest with friction and picks the
nearest detent, so a short flick moves it as far as a long drag. Past the highest detent it
rubber-bands. Without a `handle`, dragging starts anywhere on the sheet unless the pointer is in
scrolled content.

## React

```tsx
import { useSheet } from "@weber-development/lagrangian-pro-react";

const sheet = useSheet({ detents: [0.4, 1], backdrop: backdropRef });
<button onClick={() => sheet.open()}>Filters</button>
<div ref={sheet.ref} className="sheet" data-open={sheet.index >= 0} />
```
