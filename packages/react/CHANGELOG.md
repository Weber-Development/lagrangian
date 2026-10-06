# @sweberdev/lagrangian-react

## 0.2.0

### Minor Changes

- 77822a6: The world can now simulate rotating boxes (`width` and `height` instead of `radius`) that fall, tip over, stack and spin when hit off centre, and bodies fall asleep one by one instead of only the whole world (`body.sleeping`, `world.wake(body)`). Slow contacts stick, so resting boxes do not creep. The build targets ES2022, which makes every part tree-shakeable: `spring` + `value` is now about 2.1 kB instead of 3.5 kB.

### Patch Changes

- Updated dependencies [77822a6]
  - @sweberdev/lagrangian@0.2.0

## 0.1.0

### Minor Changes

- 64fbdb0: First release: closed-form springs that keep their momentum when interrupted, throws with friction into bounds and onto snap points, draggable elements with rubber-banding, a 2D world with gravity, collisions, friction and rolling, RK4 for your own equations of motion, and React hooks.

### Patch Changes

- Updated dependencies [64fbdb0]
  - @sweberdev/lagrangian@0.1.0
