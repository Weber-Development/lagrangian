---
title: Popover
description: A popover anchored to its trigger that springs out of the facing side, flips when there is no room and follows the page while it scrolls.
---

```ts
import { popover } from "@weber-development/lagrangian-pro";

const menu = popover(button, panel, {
  side: "bottom",   // "top", "bottom", "left" or "right"
  align: "start",   // "start", "center" or "end" along that side
  offset: 8,        // distance to the trigger in pixels
  margin: 8,        // distance to keep from the edge of the window
  flip: true,       // open on the other side when there is no room
  onChange: (open) => {},
});

button.addEventListener("click", () => menu.toggle());
```

The panel stays hidden until `show()`. It is positioned with `position: fixed` next to the trigger,
grows out of the side that faces the trigger with a spring and fades in. When the preferred side
has too little room and the opposite side has more, it opens there (`menu.side` tells you which).
It stays inside the window, follows the trigger while the page scrolls or the window is resized,
and `menu.update()` positions it again after its content changed size.

## Keyboard and screen readers

The focus moves to the first focusable element in the panel when it opens (or to the panel
itself). Escape closes it and gives the focus back to the trigger. A click or tap outside of the
panel and the trigger closes it too (`closeOnOutside: false` turns that off). The trigger gets
`aria-haspopup="dialog"` and an `aria-expanded` that follows the state. Give the panel
`role="menu"` or `role="listbox"` yourself when it is one; the default is `role="dialog"`.

With reduced motion the panel appears and disappears without movement.

## React

```tsx
const pop = usePopover({ side: "bottom" });

<button ref={pop.trigger} onClick={pop.toggle}>Menu</button>
<div ref={pop.ref}>…</div>
```

Put `trigger` on the button and `ref` on the panel, the trigger first. `open` is state you can
render from.
