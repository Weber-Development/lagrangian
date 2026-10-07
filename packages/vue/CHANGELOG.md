# @sweberdev/lagrangian-vue

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
