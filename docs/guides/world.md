---
title: The world
description: Gravity, collisions, friction, rolling, springs, joints, sensors and grabbing for round, rectangular and polygonal bodies.
---

```ts
import { regularPolygon, World } from "@sweberdev/lagrangian";

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

// Boxes rotate, fall, tip over and stack
const card = world.add({
  x: 220, y: 40, width: 120, height: 72, angle: 0.3,
  element: document.querySelector(".card"),
});

// Any convex shape: triangles, hexagons, arrows
const hex = world.add({
  x: 400, y: 40,
  vertices: regularPolygon(6, 36), // corners in pixels, relative to (x, y)
  element: document.querySelector(".hex"),
});
```

Polygons turn around their centre of mass and get mass and inertia from the shape. Give the corners in either winding; a concave outline collides as its convex hull. `regularPolygon(sides, radius, rotation?)` builds the common shapes. The element of a polygon has the size of the bounding box of the corners (`body.width` and `body.height`); the body rotates it around the centre of mass.

## What it simulates

- **Gravity and air drag** with semi-implicit Euler at a fixed 240 Hz step, independent of the display.
- **Collisions** between circles, rotating boxes and convex polygons (separating axis test with up to two contact points) and the walls, resolved with impulses. Momentum is conserved and restitution sets how much energy survives a bounce. Slow contacts do not bounce, so bodies come to rest instead of jittering.
- **Friction and rolling.** Friction acts at the contact point and creates torque, so a sliding ball starts to roll. A solid disc ends up rolling without slipping at two thirds of its sliding speed, as in a physics textbook. Boxes have the inertia of a solid plate, so off-centre hits spin them, and slow contacts stick instead of creeping.
- **Rolling resistance** (`rollingResistance`, default 0.05): a braking torque proportional to the contact force, so rolling bodies come to a stop. Like real oranges, a pile on a flat floor can still slowly roll apart.
- **Links** between bodies: damped springs with a frequency in Hz and a damping ratio, stable regardless of mass.
- **Grabbing.** `world.bindPointer()` lets the pointer pick up bodies with a critically damped joint. Let go while moving and the body flies on.

## Joints

```ts
// A pendulum on a nail: the pin holds a point of the body to a point of the page
const bob = world.add({ x: 300, y: 260, radius: 18 });
world.rod(bob, { x: 300, y: 10 });                      // rigid rod to the page

// A chain: every link is hinged to the next
world.pin(links[0], { x: 100, y: 40 });
for (let i = 1; i < links.length; i++) world.hinge(links[i - 1], links[i], { x: 100 + i * 40, y: 40 });

// A wheel with a motor, or a windmill
world.pin(wheel, { x: wheel.x, y: wheel.y }, { speed: 3, torque: 5 });
```

`pin(body, at?, motor?)` fixes a point of a body to a point of the page, `hinge(a, b, at, motor?)` joins two bodies at a point, and `rod(a, b | point, { from?, to?, length? })` keeps two anchors a fixed distance apart. The anchors turn with their bodies. A motor drives the angular speed (rad/s) with at most `torque` N·m; a hinge turns the second body against the first. `world.unjoin(joint)` removes one, and removing a body removes its joints. Joints are solved with impulses and a gentle correction of drift, so a swinging pendulum keeps the period `2π√(L/g)` physics gives it.

## Sensors

```ts
const goal = world.add({
  x: 300, y: 440, width: 200, height: 60, fixed: true, sensor: true,
  onEnter: (body) => score(body),
  onLeave: (body) => {},
});

world.touching(goal); // the bodies inside right now
```

A sensor overlaps other bodies instead of colliding with them. It reports bodies that enter and leave while the world runs, for drop zones, triggers and goals. A sensor can also move: give it a velocity or let the user drag it.

## Controlling it

`world.push(body, { x, y }, at?)` adds an impulse (at a point for spin). `world.link(a, b, { length, frequency, damping })` connects bodies. `world.grab(body, x, y)` returns `{ move, release }` for your own input. `world.step(dt)` advances it manually, e.g. for tests or video. `onFrame` runs after every frame, for drawing on a canvas.

## Sleeping

Bodies fall asleep one by one when they have moved less than a few pixels for a second (`body.sleeping`), so a big pile stays calm while a single ball keeps rolling. A sleeping body is woken when something hits it, when it is grabbed, pushed or linked to a moving body, or when the body below it is removed. When every body sleeps, the world stops its frame loop and uses no CPU. After changing bodies by hand call `world.wake()`, or `world.wake(body)` for one of them.

## Limits

Bodies are circles, boxes and convex polygons. This keeps the engine small; it is meant for playful interfaces, not games with concave shapes or thousands of bodies. A box needs `width` and `height`, a polygon `vertices`, instead of `radius`; `body.radius` is then the radius of the circle around it.
