---
title: Spring editor (beta)
description: Tune a spring by eye: sliders, the curve it draws, a ball that plays it and the code to paste, in one function.
---

From Lagrangian Pro 2.1, **beta**: the functions are stable, but the markup the editor builds
and its class names may still change in a minor release. In React, Vue and Svelte use
`useSpringEditor` (Svelte: the `springLab` action).

```ts
import { springEditor } from "@weber-development/lagrangian-pro";

const editor = springEditor(document.getElementById("lab"), {
  value: { duration: 0.45, bounce: 0.12 },
  onChange: (spring) => console.log(spring),
});
```

The editor fills the element with sliders for duration and bounce (or for stiffness, damping and
mass, switch with the buttons at the top), the curve of the motion, a ball that plays the spring
from left to right, a line that says how long it takes, how far it overshoots and its damping
ratio, and the code you paste: `{ duration: 0.45, bounce: 0.12 }`. Switching between the two
descriptions keeps the motion the same. The curve is computed with the same closed-form spring
the library animates with, so it is exact, not an approximation.

```ts
editor.value;        // the spring as an options object
editor.code();       // "{ duration: 0.45, bounce: 0.12 }"
editor.set({ stiffness: 300, damping: 20 });
editor.setMode("physical");
await editor.play();
editor.destroy();
```

## Only the curve: `springCurve`

```ts
import { springCurve } from "@weber-development/lagrangian-pro";

const curve = springCurve({ duration: 0.5, bounce: 0.3 });
curve.points;        // [{ t, value }, …] from 0 to 1
curve.duration;      // seconds until it rests
curve.overshoot;     // 0.12 means 12 % past the target
curve.dampingRatio;  // below 1 it bounces
```

Use it to draw your own preview or to check a spring in a test.

## Styling and other languages

Every element has a class that starts with `spring-editor-`: `-modes`, `-mode`, `-curve` (an SVG
that draws in `currentColor`), `-stage`, `-ball`, `-play`, `-row`, `-label`, `-input`, `-value`,
`-stats`, `-code`, `-copy`. The ball and the stage have a small inline size so the editor works
without any CSS. Pass `messages` to translate the texts, for example `{ play: "Abspielen",
copy: "Code kopieren" }`.
