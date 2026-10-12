---
title: Stack navigation
description: Pages that slide over each other, swipe back from the left edge and share elements, with focus and screen reader handling.
---

```ts
import { stackNav } from "@weber-development/lagrangian-pro";
```

`stackNav` turns the children of an element into a navigation stack. The first child is the base page. A new page slides in from the right while the page below drifts back a little, and the top page can be swiped away from the left edge of the screen. It follows the finger and lands where the throw would carry it, like a sheet.

```ts
const nav = stackNav(document.querySelector("#app"), {
  onChange: (depth, direction) => {},
});

await nav.push(detailPage); // an element; it is added to the root if needed
await nav.pop();            // or swipe back from the edge, or Alt+ArrowLeft
await nav.popTo(1);         // back to the first page
```

## Shared elements

Give an element on both pages the same `data-shared` value. On `push` the element of the new page starts where the old one is, with its size, and springs to its own place. On `pop` it flies back to where the page below shows it.

```html
<section id="list"><img data-shared="photo-7" src="thumb.jpg"></section>
<section id="detail"><img data-shared="photo-7" src="large.jpg"></section>
```

Shared elements fly on `push` and on `pop()`. A swipe back follows the finger and does not fly them. Use another attribute with the `shared` option.

## Options

| Option | Default | |
| --- | --- | --- |
| `edge` | 24 | Width in pixels of the strip where a swipe back starts. 0 turns the swipe off. |
| `parallax` | 0.3 | How far the page below moves, as a fraction of the width. |
| `shared` | `data-shared` | Attribute that pairs elements. |
| `flick` | 500 | Speed in px/s from which a swipe back always completes. |
| `remove` | true | Remove a page from the DOM after it left. Set false when a framework owns the element. |
| `backKey` | true | Go back with Alt+ArrowLeft. |
| `announce` | | Text for screen readers. Default the page's `aria-label`, `data-title` or first heading. |
| `onChange` | | Called when a transition starts, with the new depth and `"push"` or `"pop"`. |
| `onPop` | | Called after a popped page left, with its element. |

The page below gets the CSS variable `--nav-shade` from 0 to 1 while a page covers it, for a dimming overlay.

## Accessibility

- Only the top page can be reached: the others are `inert` and `aria-hidden`.
- On `push` the focus moves to the new page; on `pop` it returns to the element that opened it.
- A polite live region announces the title of the page after each transition.
- With reduced motion the pages jump instead of sliding.
- Alt+ArrowLeft goes back when the focus is inside the stack.

## Frameworks

React: `useStackNav`. Vue: `useStackNav`. Svelte: `use:stackNav`. With `remove: false` the framework keeps the page elements, and you drop the page from your state in `onPop`.

```tsx
const nav = useStackNav({ remove: false, onPop: () => setPages((p) => p.slice(0, -1)) });
```

## Gestures

Swipe back, carousels, drawers and sheets can all want the same finger. See [Gestures](gestures.md) for how they decide.
