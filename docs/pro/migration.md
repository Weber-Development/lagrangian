---
title: Migrating to 1.0
description: What changes between Lagrangian Pro 0.x and 1.0, and the versioning promise from 1.0 on.
---

Lagrangian Pro 1.0 has the same API as 0.9. There is nothing to rename and nothing was removed
while the parts were added in 0.2 to 0.6, so most projects only need to update the version.

```sh
pnpm update @weber-development/lagrangian-pro @weber-development/lagrangian-pro-react
```

## Check these

- **Lagrangian 1.0 is supported.** The peer range of `@sweberdev/lagrangian` is
  `>=0.1.0 <2.0.0`. Parts added later need a newer Lagrangian: `fall` needs 0.2 or newer.
- **Scrolling while dragging is on by default** for `sortable` and `board` (since 0.5 and 0.6).
  If a page of yours should not scroll while an item is dragged, pass `autoScroll: false`.
- **Hooks put the ref on the element.** In React, pass the `ref` of a hook directly to the element.
  A wrapper function that creates a new ref callback on every render creates the part again on
  every render.
- **Hidden until opened.** `dialog` and `popover` hide their element with the `hidden` attribute
  until `show()`. If your CSS sets `display` on that element, add `[hidden] { display: none }`
  for it.

## Naming

Overlays that open and close (`dialog`, `drawer`, `popover`) have `show()`, `hide()`, `toggle()`
(not on dialog) and a boolean `open`. A sheet has detents, so it has `open(index?)`, `snapTo(index)`,
`close()` and an `index` (-1 when closed) instead. Parts that you drag expose `dragging`,
and every part has `destroy()`. These names are part of the 1.0 API.

## Versioning from 1.0

Lagrangian Pro follows semantic versioning. A minor version adds parts and options, a patch
version fixes bugs, and an option or method is only removed in a major version after it has been
marked deprecated in the changelog of a minor version. The [API reference](../reference/pro-api)
lists everything that is covered.
