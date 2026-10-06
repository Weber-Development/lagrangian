# @sweberdev/lagrangian-vue

## 0.4.0

### Minor Changes

- e54e37c: The world now simulates convex polygons (`vertices`, with `regularPolygon()` as a helper): triangles, hexagons, arrows and any convex hull collide, roll, tip over and rest on a side, with mass and inertia from the shape. Face contacts of boxes and polygons now bounce evenly at both corners instead of spinning from the first one. New packages `@sweberdev/lagrangian-vue` (composables) and `@sweberdev/lagrangian-svelte` (actions and a spring store).

### Patch Changes

- Updated dependencies [e54e37c]
  - @sweberdev/lagrangian@0.4.0
