---
title: Ready-made recipes
description: Three finished patterns as one function each, a form in a bottom sheet, a photo gallery and swipeable list rows, with the pitfalls already handled.
---

From Lagrangian Pro 2.1. The [recipes](recipes.md) page shows how to put the parts together
yourself; these three functions are the same patterns, finished and tested. They are built from
the sheet, the carousel, the dialog and the [gesture referee](gestures.md), so they behave like
them. In React, Vue and Svelte use `useFormSheet`, `useLightbox` and `useSwipeRows` (Svelte:
`formSheetAction`, `gallery`, `swipeRows`).

## A form in a bottom sheet: `formSheet`

```ts
import { formSheet } from "@weber-development/lagrangian-pro";

const add = formSheet(panel, {
  detents: [0.6, 1],
  backdrop,
  onSubmit: async (data) => {
    await save(data);          // closes when this resolves, stays open and shows an error when it throws
  },
  confirmDiscard: () => window.confirm("Discard your changes?"),
});
openButton.addEventListener("click", () => add.open());
```

The element contains a `<form>`. What it takes care of:

- The focus moves to the first field (or the one with `autofocus`), the Tab key stays inside the
  sheet, and the focus goes back to the button that opened it.
- A drag down, Escape or a tap on the backdrop with unsaved changes asks `confirmDiscard` first.
  If the answer is no, the sheet springs back to where it was. Without changes it closes without
  asking.
- While `onSubmit` runs, the sheet has `data-state="submitting"` and `aria-busy`; when it fails,
  `data-state="error"` and `onError` is called. Style these in CSS.
- On the phone keyboard the CSS variable `--keyboard-inset` carries the height the keyboard takes
  (for example `padding-bottom: var(--keyboard-inset, 0)`), and the focused field is scrolled
  into view.
- After closing, the form is cleared (`resetOnClose: false` keeps it) and the sheet is `inert`
  and `aria-hidden`.

`add.dirty`, `add.submitting` and `add.sheet` (the underlying [sheet](sheet.md)) are available too.

## A photo gallery: `lightbox`

```html
<div id="grid">
  <img data-lightbox-item src="thumb-1.jpg" alt="…" />
  <img data-lightbox-item src="thumb-2.jpg" alt="…" />
</div>
<div id="backdrop"></div>
<div id="viewer" style="position: fixed; inset: 0">
  <div id="track" style="display: flex">
    <div class="slide"><img src="large-1.jpg" alt="…" /></div>
    <div class="slide"><img src="large-2.jpg" alt="…" /></div>
  </div>
</div>
```

```ts
import { lightbox } from "@weber-development/lagrangian-pro";

const gallery = lightbox(grid, { viewer, backdrop, onChange: (i) => (caption.textContent = names[i]) });
```

A click on a thumbnail opens the viewer on the matching slide. The large picture grows out of
the thumbnail and shrinks back into it when closing, the slides swipe like a [carousel](blocks.md),
and a drag down or up closes the viewer. The arrow keys move, Escape closes, the focus is trapped
in the viewer and goes back to the thumbnail. A sideways swipe and a vertical swipe never fight:
the referee decides by direction.

Slide `i` belongs to thumbnail `i`. Each slide should hold an `img`, `picture`, `canvas` or `video`,
which is the element that flies. The viewer must be a full-screen, fixed element; the library
hides and shows it. Use `gallery.show(2)` and `gallery.hide()` from code. Zooming into a slide is
not part of it, use [`zoom`](board.md) inside a slide if you need it.

## Swipeable list rows: `swipeRows`

```html
<ul id="list">
  <li>
    <div class="row-content">Invoice 1042</div>
    <div data-actions><button type="button">Delete</button></div>
  </li>
</ul>
```

```ts
import { swipeRows } from "@weber-development/lagrangian-pro";

const rows = swipeRows(list, { onChange: (row, open) => {} });
```

The first child of a row slides to the left and reveals the `[data-actions]` behind it. Place the
actions at the right edge of the row, under the content. A flick opens or closes the row, the
content rubber-bands at the ends, a vertical drag still scrolls the page, and only one row is
open at a time (`single: false` changes that). The buttons are not reachable with Tab while the
row is closed. With the keyboard, Alt+ArrowLeft opens the focused row, Escape or
Alt+ArrowRight closes it. `rows.open(row)`, `rows.close()` and `rows.isOpen(row)` are there for
code.

## Notes

- Texts and visuals are yours: the functions set no colours, sizes or labels beyond what the
  behaviour needs.
- `lightbox` and `formSheet` mark their state with attributes (`aria-expanded` on the thumbnail,
  `data-state` on the sheet) that you can style.
