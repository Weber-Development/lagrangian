---
title: Getting started
description: Install Lagrangian and spring, drag and drop your first element.
---

```sh
pnpm add @sweberdev/lagrangian
```

With npm: `npm i @sweberdev/lagrangian`. For React also add `@sweberdev/lagrangian-react`.

## Spring an element

```ts
import { animate } from "@sweberdev/lagrangian";

const card = document.querySelector(".card");
card.addEventListener("click", () => {
  const open = card.classList.toggle("open");
  animate(card, { x: open ? 240 : 0, scale: open ? 1.05 : 1 }, { duration: 0.6, bounce: 0.3 });
});
```

Click quickly several times: the card always turns around with its current speed.

Animatable properties are `x`, `y`, `z` (pixels), `rotate` (degrees), `scale`, `scaleX`, `scaleY`, `opacity` and any CSS custom property such as `--progress`. They start at their neutral value (0 or 1); opacity and custom properties are read from the element.

## Make it draggable

```ts
import { draggable } from "@sweberdev/lagrangian";

draggable(card, { bounds: card.parentElement });
```

Throw it: it glides with friction and bounces softly off the edges of its parent.

## Drop things

```ts
import { World } from "@sweberdev/lagrangian";

const world = new World({ bounds: document.querySelector(".box") }).start();
for (const ball of document.querySelectorAll(".ball")) {
  world.add({ x: Math.random() * 300, y: 40, radius: 24, element: ball });
}
world.bindPointer();
```

Each `.ball` should be `position: absolute; left: 0; top: 0` inside a `position: relative` container. The world moves it with `transform`.
