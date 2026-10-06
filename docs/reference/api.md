---
title: API
description: Every export of @sweberdev/lagrangian and @sweberdev/lagrangian-react.
---

## @sweberdev/lagrangian

| Export | Signature |
|---|---|
| `animate` | `(targets, props, { duration?, bounce?, stiffness?, damping?, mass?, velocity?, delay?, stagger? }) => Animation` |
| `set` | `(targets, props) => void`: jump without animation |
| `getValue` | `(element, prop) => PhysicsValue` |
| `draggable` | `(element, { axis?, bounds?, rubberband?, inertia?, deceleration?, snap?, spring?, onStart?, onMove?, onEnd? }) => Draggable` |
| `value` | `(initial) => PhysicsValue` |
| `PhysicsValue` | `get()`, `velocity`, `animating`, `set(x)`, `jump(x)`, `to(target, spring?)`, `throw(decay?)`, `start(motion)`, `stop()`, `on(listener)` |
| `spring` | `(from, to, velocity?, options?) => Motion` |
| `decay` | `(from, { velocity?, deceleration?, min?, max?, snap?, bounce?, restDelta? }) => Motion` |
| `springParams`, `dampingRatio` | resolve `duration`/`bounce` into stiffness, damping, mass |
| `settleTime`, `restValue` | `(motion) => number` |
| `projectRest`, `timeConstant`, `nearest` | throw maths |
| `rubberband`, `rubberClamp` | iOS-style overscroll |
| `VelocityTracker` | `add(timeMs, value)`, `velocity(timeMs?)`, `reset()` |
| `scroller` | `(viewport, { axis?, content?, rubberband?, deceleration?, snap?, wheel?, keys?, spring?, onScroll? }) => Scroller`, see [Scrolling with physics](../guides/scroller.md) |
| `World`, `world` | see [The world](../guides/world.md): bodies, links, `pin`, `hinge`, `rod`, sensors |
| `rk4`, `system` | see [Equations of motion](../guides/equations-of-motion.md) |
| `loop` | `add(task)`, `manual(on)`, `step(ms)`, `size`: the shared frame loop |
| `reducedMotion`, `setReducedMotion` | see [Reduced motion](../guides/reduced-motion.md) |

`targets` is an element, a selector or a list of elements. An `Animation` has `finished: Promise<boolean>` and `stop()`. A `Motion` is `(seconds) => { value, velocity, done }`.

## @sweberdev/lagrangian-react

| Export | Signature |
|---|---|
| `useSpringProps` | `(props, options?) => RefObject` |
| `useSpring` | `(target, options?) => PhysicsValue` |
| `useValue` | `(value) => number` |
| `usePhysicsValue` | `(initial?) => PhysicsValue` |
| `useDraggable` | `(options?) => [ref, Draggable \| null]` |
| `useWorld` | `(options?) => [ref, World]` |
| `useBody` | `(world, options) => [ref, Body \| null]` |

## Testing

`loop.manual(true)` stops using `requestAnimationFrame`; `loop.step(ms)` then advances every animation and world by hand.
