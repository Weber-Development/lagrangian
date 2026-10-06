---
title: Jelly, ropes and impact sounds
description: Squash and stretch from velocity, Verlet ropes you can grab, and synthesized impact sounds.
---

## Jelly

```ts
import { draggable } from "@sweberdev/lagrangian";
import { jelly } from "@weber-development/lagrangian-pro";

const drag = draggable(ball);
const skin = jelly(ball.querySelector(".skin"), {
  source: drag,      // a draggable, { x, y } values, an element, or () => ({ x, y }) in px/s
  strength: 0.1,     // stretch per 1000 px/s
  max: 0.3,
  frequency: 4.5,    // wobble in Hz
  damping: 0.3,
});
```

The deformation is a strain that springs towards the current velocity, so a fast element
stretches along its path, keeps its area, and wobbles back when it stops. Put the jelly on an
inner element; the outer one keeps its own transform. For a World body:

```ts
const j = jelly(skin, { source: () => ({ x: body.vx, y: body.vy }) });
new World({ onCollide: (a, b, speed) => a === body && j.impact(a.vx, a.vy) });
```

## Ropes

```ts
import { rope } from "@weber-development/lagrangian-pro";

const cable = rope({
  from: { x: 160, y: 0 },        // pinned
  to: { x: 460, y: 0 },          // optional
  pinEnd: true,                  // garland between two points
  length: 360,
  segments: 20,
  gravity: { x: 0, y: 2000 },    // px/s²
  drag: 0.8,
  onFrame: (r) => path.setAttribute("d", r.path()),
}).start();

cable.attach(tag, -1);           // hang an element by its top centre from the last point
cable.bindPointer(svg);          // grab and swing
cable.push({ x: 600, y: 0 });    // a gust of wind
cable.draw(ctx);                 // or render on a canvas
```

Verlet integration with distance constraints at a fixed 120 Hz. The rope sleeps when it rests and
wakes when touched.

## Impact sounds

```ts
import { World } from "@sweberdev/lagrangian";
import { impactSound } from "@weber-development/lagrangian-pro";

const sound = impactSound({ material: "glass", volume: 0.4, minSpeed: 120, maxSpeed: 2500 });
const world = new World({ bounds: box, onCollide: sound.collide }).start();

sound.play(0.6, 24); // strength 0–1, size in px
sound.muted = true;
```

Sounds are synthesized with Web Audio, so there are no files to load. Loudness follows the
impact speed, pitch follows the size and the material (wood, glass, metal, rubber, stone) sets
the timbre. Repeated hits of resting bodies are filtered and a voice limit keeps a falling pile
from turning into noise. Browsers allow audio only after a user gesture; the player unlocks
itself on the first pointer or key press.
