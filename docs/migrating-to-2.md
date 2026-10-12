---
title: Migrating to 2.0
description: What changes between Lagrangian 1.x and 2.0, and how to keep the old behaviour while you update.
---

Lagrangian 2.0 makes the world deterministic. The API of springs, dragging, the scroller and the adapters is unchanged, so most projects only update the version.

```sh
pnpm update @sweberdev/lagrangian @sweberdev/lagrangian-react @sweberdev/lagrangian-svelte
```

## What changed

- **Sleeping and sensors are decided in every simulation step, not once per animation frame.** A body still falls asleep after a second at rest, but the exact moment no longer depends on the frame rate, and `onEnter` and `onLeave` fire in the step in which a body crosses the edge. In a few scenes a body now falls asleep or triggers a sensor one or two frames earlier or later than before.
- **`world.step(dt)` also settles and senses.** In 1.x a manual step moved the bodies only. Now it does everything a frame does except drawing, so a manually stepped world matches a running one.
- **Node 22 or newer** is required to build and test (Node 20 reached its end of life). The packages run in every browser they ran in before.

## Keep the old behaviour

```ts
const world = new World({ bounds, legacyStepping: true });
```

`legacyStepping` restores the 1.x timing of sleeping and sensors. It is meant as a bridge: it is removed in 2.1, and a world with it is not reproducible across frame rates.

## New in 2.0

- `seed` and `world.random()` for random numbers that repeat.
- `world.advance(seconds)`, `world.time`, `world.snapshot()`, `world.restore()` and `world.hash()`. See [Reproducible runs](guides/world).
- Lagrangian Pro 1.0.1 and newer works with 2.x. Pro 1.0.0 declares a peer range below 2: update it first (`pnpm update @weber-development/lagrangian-pro`) or your package manager warns.

## Removed

Nothing from the 1.x API was marked deprecated, so no export is removed.

## Not yet available

`@sweberdev/lagrangian-vue` could not be published to npm so far (the registry rejects the first publish of the new package). It will follow at the same version as soon as that works.
