---
title: Springs
description: Configure springs by feel or by physics, read velocity, and use the maths directly.
---

## By feel

```ts
animate(el, { x: 200 }, { duration: 0.5, bounce: 0.25 });
```

`duration` is the period of the spring in seconds, `bounce` goes from -1 to 1: `0` is critically damped (fastest without overshoot), `0.3` a gentle bounce, negative values creep in slowly. This is the same model as SwiftUI.

## By physics

```ts
animate(el, { x: 200 }, { stiffness: 300, damping: 18, mass: 1.5 });
```

The default is stiffness 170, damping 26, mass 1. `dampingRatio(options)` tells you how bouncy a configuration is (below 1 it overshoots).

## Values with momentum

`value()` creates a number with momentum that you can render however you like, e.g. on a canvas or as text:

```ts
import { value } from "@sweberdev/lagrangian";

const zoom = value(1);
zoom.on((z) => (canvas.style.scale = String(z)));
zoom.to(2, { bounce: 0.2 });
zoom.velocity; // units per second, live
await zoom.to(1).finished; // true when it came to rest, false when interrupted
```

`set(x)` moves it directly and measures the velocity from successive calls, `jump(x)` moves it and drops the momentum, `stop()` freezes it but keeps the velocity for the next `to` or `throw`. `getValue(element, "x")` returns the value behind an element's property, so you can mix `animate` with your own gestures.

## The maths

`spring(from, to, velocity, options)` returns a function from elapsed seconds to `{ value, velocity, done }`. It is exact for all three regimes (under-, critically and overdamped). `settleTime(motion)` returns how long it takes to come to rest, `restValue(motion)` where it ends up. Use them to drive anything, for example Web Animations keyframes.
