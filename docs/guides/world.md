---
title: The world
description: Gravity, collisions, friction, rolling, springs and grabbing for round bodies.
---

```ts
import { World } from "@sweberdev/lagrangian";

const world = new World({
  bounds: container,             // walls from the element, or { left, top, right, bottom }
  gravity: { x: 0, y: 9.81 },    // m/s²
  pixelsPerMeter: 500,           // scale between simulation and screen
  airDrag: 0.05,                 // per second
  onCollide: (a, b, speed) => {}, // for sounds or haptics
}).start();

const ball = world.add({
  x: 100, y: 50, radius: 24,     // pixels
  restitution: 0.7,              // 0 clay … 1 superball
  friction: 0.4,                 // Coulomb coefficient
  density: 1,                    // or mass in kg
  element: document.querySelector(".ball"),
});
```

## What it simulates

- **Gravity and air drag** with semi-implicit Euler at a fixed 240 Hz step, independent of the display.
- **Collisions** between circles and with the walls, resolved with impulses. Momentum is conserved and restitution sets how much energy survives a bounce. Slow contacts do not bounce, so bodies come to rest instead of jittering.
- **Friction and rolling.** Friction acts at the contact point and creates torque, so a sliding ball starts to roll. A solid disc ends up rolling without slipping at two thirds of its sliding speed, as in a physics textbook.
- **Rolling resistance** (`rollingResistance`, default 0.05): a braking torque proportional to the contact force, so rolling bodies come to a stop. Like real oranges, a pile on a flat floor can still slowly roll apart.
- **Links** between bodies: damped springs with a frequency in Hz and a damping ratio, stable regardless of mass.
- **Grabbing.** `world.bindPointer()` lets the pointer pick up bodies with a critically damped joint. Let go while moving and the body flies on.

## Controlling it

`world.push(body, { x, y }, at?)` adds an impulse (at a point for spin). `world.link(a, b, { length, frequency, damping })` connects bodies. `world.grab(body, x, y)` returns `{ move, release }` for your own input. `world.step(dt)` advances it manually, e.g. for tests or video. `onFrame` runs after every frame, for drawing on a canvas.

When nothing has moved for a second, the world stops its frame loop. Adding bodies, grabbing, pushing or resizing wakes it; after changing bodies by hand call `world.wake()`.

## Limits

Bodies are circles. This keeps the engine small and exact; it is meant for playful interfaces, not games with polygons and joints.
