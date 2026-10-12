# @sweberdev/lagrangian-vue

## 2.0.0-next.0

### Major Changes

- 4d7bdd2: 2.0: the world is deterministic. Sleeping and sensors are decided in every simulation step instead of once per frame, so a run no longer depends on the frame rate. New: `seed` and `world.random()`, `world.advance()`, `world.time`, `world.snapshot()`, `world.restore()` and `world.hash()`. `legacyStepping: true` keeps the 1.x timing for one more minor version. Node 22 or newer is required to build. See docs/migrating-to-2.md.

### Patch Changes

- Updated dependencies [4d7bdd2]
  - @sweberdev/lagrangian@2.0.0-next.0

## 1.0.0

### Major Changes

- df1611d: 1.0.0: the public API is stable and follows semver from here on. Works with Lagrangian Pro 1.x. The root build, test and typecheck scripts now also run in Windows shells.

### Patch Changes

- Updated dependencies [df1611d]
  - @sweberdev/lagrangian@1.0.0

## 0.4.0

### Minor Changes

- e54e37c: The world now simulates convex polygons (`vertices`, with `regularPolygon()` as a helper): triangles, hexagons, arrows and any convex hull collide, roll, tip over and rest on a side, with mass and inertia from the shape. Face contacts of boxes and polygons now bounce evenly at both corners instead of spinning from the first one. New packages `@sweberdev/lagrangian-vue` (composables) and `@sweberdev/lagrangian-svelte` (actions and a spring store).

### Patch Changes

- Updated dependencies [e54e37c]
  - @sweberdev/lagrangian@0.4.0
