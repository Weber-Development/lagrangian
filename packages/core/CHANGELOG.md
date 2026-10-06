# @sweberdev/lagrangian

## 0.3.0

### Minor Changes

- eeffe2c: New `scroller()`: a scroll area with inertia, rubber-banding, snap points, mouse wheel, keyboard and `scrollTo` on the same physical values. The world gets joints (`pin`, `hinge`, `rod`, with motors), so pendulums, chains, wheels and windmills work, and sensors (`sensor: true` with `onEnter` and `onLeave`, `world.touching()`) for drop zones and triggers. React: `useScroller`. The size budgets grew to about 10 kB for everything.

## 0.2.0

### Minor Changes

- 77822a6: The world can now simulate rotating boxes (`width` and `height` instead of `radius`) that fall, tip over, stack and spin when hit off centre, and bodies fall asleep one by one instead of only the whole world (`body.sleeping`, `world.wake(body)`). Slow contacts stick, so resting boxes do not creep. The build targets ES2022, which makes every part tree-shakeable: `spring` + `value` is now about 2.1 kB instead of 3.5 kB.

## 0.1.0

### Minor Changes

- 64fbdb0: First release: closed-form springs that keep their momentum when interrupted, throws with friction into bounds and onto snap points, draggable elements with rubber-banding, a 2D world with gravity, collisions, friction and rolling, RK4 for your own equations of motion, and React hooks.
