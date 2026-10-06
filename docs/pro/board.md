---
title: Board and zoom
description: Drag to rearrange a grid or the columns of a board, and pinch, wheel and double tap zoom for images and maps.
---

```ts
import { board, zoom } from "@weber-development/lagrangian-pro";
```

## Board

```ts
// A wrapping grid
const photos = board(grid, {
  onMove: ({ item, from, to }) => save(from.index, to.index),
});

// Columns: drag between lists
board([todo, doing, done], {
  canDrop: (item, list) => list !== done || isReady(item),
  onMove: ({ item, from, to }) => api.move(item.dataset.id, to.container.id, to.index),
});

photos.move(item, grid, 0); // from code
```

The children of each container are the items. The one you drag follows the pointer at the point
you grabbed it, the others spring to their new places while you hover, and on release it settles
into its slot. The slot is found in reading order, so it works for CSS grids and flex-wrap
layouts, for lists of different heights and for empty columns. `handle` limits dragging to part of
an item, `lift` sets how much the item grows while dragged, and the container under the pointer
gets `data-over="true"` when there are several.

`onMove` runs after the drop with the item and its old and new `{ container, index }`.

### With a framework

```ts
board(columns, {
  commit: async ({ item, from, to }) => {
    setState(moveCard(state, item.dataset.id, to.container.id, to.index)); // your state
    await nextRender(); // resolve once the DOM shows the new order
  },
});
```

With `commit` the board puts the DOM back as your framework expects it, calls `commit`, and plays
the transition after the returned promise resolves, so keys and state stay intact. In React use
`useBoard` and let the hook handle the timing.

### Keyboard and screen readers

Space or Enter picks an item up, the arrow keys move it (in a grid by the layout, between
columns with left and right), Space or Enter drops it, Escape puts it back. Every step is
announced. Give each column an `aria-label` to have its name read, and translate the texts with
`messages: { lifted, moved, dropped, cancelled }`.

## Zoom

```ts
const viewer = zoom(viewport, {
  min: 1, max: 6,
  doubleTap: 2.5,            // false to turn off
  onChange: ({ scale, x, y }) => {},
});

viewer.zoomTo(3, { x: 200, y: 150 }); // around a point in viewport pixels
viewer.panTo({ x: 800, y: 400 });     // a content point to the centre
viewer.reset();
```

The first child of the viewport is zoomed. Pinch with two fingers around the point between them,
zoom with the wheel or a trackpad pinch around the pointer, double tap or double click to zoom in
and out, drag to pan. Panning glides with friction and rubber-bands at the edges, zooming past
`min` and `max` stretches and springs back, and a content that is smaller than the view stays
centred. With the viewport focused `+`, `-` and `0` zoom and reset, the arrow keys pan. All of
it moves the same three values (`viewer.scale`, `viewer.x`, `viewer.y`), so a throw, a pinch and a
key press continue each other.

## React

```tsx
const kanban = useBoard({ commit });
<div ref={kanban.list("todo")} aria-label="To do">…</div>
<div ref={kanban.list("done")} aria-label="Done">…</div>

const [ref, viewer] = useZoom<HTMLDivElement>({ max: 8 });
<div ref={ref}><img src="map.png" alt="Map" /></div>
```
