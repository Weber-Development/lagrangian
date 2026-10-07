---
title: Recipes
description: Three complete patterns built from Lagrangian Pro parts: a form in a bottom sheet, an image gallery and a kanban board.
---

All examples use the framework-free API. In React, use the hook with the same name and put `ref`
directly on the element.

## A form in a bottom sheet

```ts
import { sheet } from "@weber-development/lagrangian-pro";

const form = sheet(panel, {
  detents: [0.5, 1],     // half open, fully open
  backdrop,
  handle: grip,
  dismissible: true,
});

openButton.addEventListener("click", () => form.open());
panel.querySelector("form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await save(new FormData(event.currentTarget));
  await form.close();
});
panel.querySelector("input").addEventListener("focus", () => form.snapTo(1));
```

The sheet opens at the first detent. Focusing a field moves it to the full height, so the keyboard
does not cover the form, and a throw down closes it again from any height. Escape and a tap on the
backdrop close it as well. Close it with `await form.close()` after saving so the transition is
finished before you reset the form.

## An image gallery

```ts
import { carousel, dialog, zoom } from "@weber-development/lagrangian-pro";

const lightbox = dialog(viewer, { backdrop });
const slides = carousel(strip, { align: "center", label: "Photos" });
const panZoom = zoom(imageViewport, { max: 6 });

for (const thumb of thumbnails) {
  thumb.addEventListener("click", () => {
    imageViewport.querySelector("img").src = thumb.dataset.large;
    panZoom.reset();
    void lightbox.show();
  });
}
```

The carousel gives you a swipeable strip of thumbnails with arrow keys, the dialog opens the large
picture with a focus trap and Escape, and `zoom` lets people pinch, scroll and double tap into
it. Call `panZoom.reset()` when the picture changes and `panZoom.refresh()` after it has loaded.

## A kanban board

```ts
import { board } from "@weber-development/lagrangian-pro";

board([todo, doing, done], {
  canDrop: (item, column) => column !== done || item.dataset.ready === "true",
  onMove: ({ item, from, to }) =>
    api.move(item.dataset.id, to.container.id, to.index),
});
```

Every column is a container and its children are the cards. Cards can be moved with the pointer,
with Space and the arrow keys, or from code with `board.move`. A column that is taller than the
window scrolls while you hold a card near its edge. With a framework, use `commit` to change your
state and let the board play the transition after it has rendered (see [Board and zoom](board)).
