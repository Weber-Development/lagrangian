---
title: Equations of motion
description: Step your own physics with RK4, e.g. a double pendulum from its Lagrangian.
---

When springs and the world are not enough, write the equations of motion yourself. `system(f, initial)` steps a state vector with fourth-order Runge-Kutta at a fixed 240 Hz.

## A pendulum

The Lagrangian of a pendulum of length `L` is `L = ½·m·L²·θ'² + m·g·L·cos θ`. The Euler-Lagrange equation gives `θ'' = −(g/L)·sin θ`. As a first-order system with state `[θ, ω]`:

```ts
import { loop, system } from "@sweberdev/lagrangian";

const g = 9.81;
const length = 1;
const pendulum = system(([theta, omega]) => [omega, -(g / length) * Math.sin(theta)], [Math.PI / 2, 0]);

loop.add((dt) => {
  const [theta] = pendulum.advance(dt);
  bob.style.transform = `rotate(${theta}rad)`;
});
```

## A double pendulum

The demo on packages.sweber.dev uses the textbook double pendulum. Its state is `[θ₁, θ₂, ω₁, ω₂]`, and the derivatives follow from its Lagrangian. Tiny changes in the start angle lead to completely different paths, which is chaos you can watch. Because RK4 conserves energy well at this step size, the motion stays believable for minutes.

`rk4(state, t, dt, f)` is exported on its own if you want to integrate with your own time stepping.
