---
title: Pull to refresh, carousel, drawer, dialog
description: Four more ready-made blocks with throw physics, focus handling and keyboard support.
---

```ts
import { carousel, dialog, drawer, pullToRefresh } from "@weber-development/lagrangian-pro";
```

## Pull to refresh

```ts
const pull = pullToRefresh(scroller, {
  onRefresh: () => reload(),   // the content waits until the promise settles
  threshold: 72,               // px of pull that triggers a refresh
  onProgress: (progress, state) => {}, // progress 0..1+, state idle | pulling | ready | refreshing
});

pull.refresh();  // from code, e.g. a button for keyboard users
```

The first child of the scroll container follows the finger with growing resistance. A release
past the threshold holds the content there while `onRefresh` runs, then it springs back with
the momentum it has. It only starts when the container is scrolled to the top. The container
gets `data-state` and `aria-busy` while refreshing, so you can style a spinner with CSS.

## Carousel

```ts
const slides = carousel(viewport, {
  align: "center",     // or "start"
  initial: 0,
  flick: 350,          // px/s from which a flick moves at least one slide
  label: "Photos",
  onChange: (index) => {},
});

slides.next(); slides.prev(); slides.goTo(2);
slides.refresh(); // after a resize or after adding slides
```

The first child of the viewport is the track, its children are the slides. A throw carries as
far as its speed says, the ends rubber-band, and a clear flick always moves at least one slide.
Arrow keys, Home and End work when the viewport has focus; slides get `aria-current`.

## Drawer

```ts
const menu = drawer(nav, { side: "left", backdrop: shade, onChange: (open) => {} });
menu.show(); menu.hide(); menu.toggle();
```

The counterpart of the [bottom sheet](sheet.md) for a screen edge. Release decides by where the
throw would land; a flick always decides the direction. A closed drawer is `inert` and
`aria-hidden`, opening moves the focus in, closing gives it back to the element that had it.

## Dialog

```ts
const confirm = dialog(box, { backdrop: shade, initialFocus: "button.primary" });
confirm.show();
confirm.hide();
```

Starts hidden. Opening scales and fades it in with a spring, traps Tab inside, locks the page
scroll, and closes with Escape or a click on the backdrop (both configurable). The focus returns
to the element that opened it.

## React

```tsx
const pull = usePullToRefresh({ onRefresh });   // ref, state, refresh()
const slides = useCarousel({ align: "center" }); // ref, index, goTo, next, prev, refresh
const menu = useDrawer({ side: "right" });       // ref, open, show, hide, toggle
const confirm = useDialog();                     // ref, open, show, hide
```

Put `ref` directly on the element. Wrapping it in an inline callback creates the block again on
every render.
