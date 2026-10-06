# Lagrangian

Animation with real physics. Lagrangian moves interface elements the way objects move: **springs solved in closed form** that keep their velocity when you interrupt them, **throws with friction** that glide into bounds or land on snap points, **drag with iOS-style rubber-banding**, and a **small 2D world** with gravity, collisions, friction and rolling. Framework-agnostic, about 12 kB for everything, and unused parts are tree-shaken away.

**Docs and live demo:** [packages.sweber.dev/lagrangian](https://packages.sweber.dev/lagrangian)

| Package | What it does |
|---|---|
| [`@sweberdev/lagrangian`](packages/core) | `animate`, `value`, `draggable`, `scroller`, `spring`, `decay`, `World`, `rk4`, `system` |
| [`@sweberdev/lagrangian-react`](packages/react) | `useSpring`, `useSpringProps`, `useDraggable`, `useScroller`, `useWorld`, `useBody`, `useValue` |

## Springs that can be interrupted

```ts
import { animate } from "@sweberdev/lagrangian";

animate(".card", { x: 240, rotate: 4 }, { duration: 0.6, bounce: 0.3 });
// Click again mid-flight: the card turns around with its current momentum, no jolt.
animate(".card", { x: 0, rotate: 0 }, { duration: 0.6, bounce: 0.3 });
```

The spring is the exact solution of `m·x'' + c·x' + k·x = 0`, not a step-by-step approximation. It gives the same result at 30 and 144 Hz and knows its position and velocity at every moment.

## Throw, glide, snap

```ts
import { draggable } from "@sweberdev/lagrangian";

draggable(sheet, {
  axis: "y",
  bounds: { top: 0, bottom: 480 },
  snap: { y: [0, 240, 480] },
});
```

Velocity comes from a least-squares fit over the last 100 ms of pointer movement. On release the element glides with friction (`x(t) = x₀ + v₀·τ·(1 − e^(−t/τ))`) and lands exactly on the snap point nearest to where it would have stopped. Past the bounds it resists like iOS and springs back.

## A world with gravity

```ts
import { World } from "@sweberdev/lagrangian";

const world = new World({ bounds: container }).start();
world.add({ x: 120, y: 40, radius: 32, element: ball, restitution: 0.7 });
world.bindPointer(); // grab and throw
```

Round bodies with mass, restitution and Coulomb friction, so they bounce, slide and roll. Springs, hinges, rods and motors between bodies, sensors for drop zones, a pointer joint for grabbing, a fixed 240 Hz step and a world that stops using CPU when everything rests. Gravity is 9.81 m/s² at 500 px per meter unless you change it.

## Your own equations of motion

```ts
import { system } from "@sweberdev/lagrangian";

// A pendulum from its Lagrangian: θ'' = −(g/L)·sin θ
const pendulum = system(([theta, omega]) => [omega, -(9.81 / 1) * Math.sin(theta)], [1, 0]);
pendulum.advance(1 / 60);
```

## React

```tsx
import { useDraggable, useSpringProps } from "@sweberdev/lagrangian-react";

const panel = useSpringProps<HTMLDivElement>({ x: open ? 0 : -320 }, { bounce: 0.2 });
const [handle] = useDraggable<HTMLDivElement>({ snap: { x: [0, 160] } });
```

## Reduced motion

When the user asks for reduced motion, springs and throws jump to where they would come to rest. Dragging and the world still follow the pointer, because the user is moving them. `setReducedMotion("never" | "always")` overrides this.

## Size

| Import | min+gzip |
|---|---|
| `spring` + `value` | about 2.1 kB |
| `animate` + `draggable` | about 3.8 kB |
| `scroller` | about 4.6 kB |
| `World` | about 7.3 kB |
| everything | about 12 kB |

`pnpm size` checks these budgets in CI.

## Development

```sh
pnpm install
pnpm build && pnpm test && pnpm lint && pnpm size
```

Changes go through pull requests with a changeset (`pnpm changeset`). Merging the version PR publishes to npm.

## Licence

MIT © Seya Weber
