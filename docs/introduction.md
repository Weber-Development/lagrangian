---
title: Why Lagrangian
description: "Animation with real physics: interruptible springs, throws with friction, gravity and collisions."
---

Most web animation is a curve over a fixed duration. That works until the user interrupts: click twice and the element stops dead and starts again, throw something and it ignores how fast you threw it. Real objects do not behave like that. They have mass and velocity, and whatever happens next starts from where they are and how fast they move.

Lagrangian animates with physics instead of durations:

- **Exact springs.** A spring is the closed-form solution of the damped oscillator `m·x'' + c·x' + k·x = 0`. Position and velocity are known at any moment, independent of the frame rate, so a new target simply continues the motion.
- **Momentum everywhere.** Every animated property is a physical value with a velocity. `animate()`, `draggable()` and your own code can take over from each other mid-flight.
- **Throws that feel right.** Velocity from a least-squares fit over the last 100 ms, friction like iOS scrolling, rubber-banding past the edges, and snap points that the throw lands on exactly.
- **A small world.** Round bodies with gravity, air drag, restitution and Coulomb friction, so they bounce, slide and roll. Springs between bodies, a pointer joint for grabbing, a fixed 240 Hz step. It sleeps when everything rests.
- **Your own physics.** `rk4` and `system` step any equations of motion, e.g. a double pendulum derived from its Lagrangian.
- **Reduced motion respected.** Automatic motion jumps to its end when the user asks for less motion.
- **Small and framework-agnostic.** About 7 kB min+gzip for everything, plus React hooks.

## When to use something else

[Sigmoid](https://packages.sweber.dev/sigmoid) is the better fit for scroll-linked motion: it runs on native CSS scroll timelines and its spring easings work in plain CSS. [Motion](https://motion.dev) and [GSAP](https://gsap.com) do layout animations, SVG morphing and long timelines. For rigid polygons, joints and thousands of bodies use a game physics engine such as Matter.js or Rapier.

## Name

Joseph-Louis Lagrange reformulated mechanics around one function, the Lagrangian `L = T − V`, kinetic minus potential energy. Every equation of motion in this library, from the spring to the pendulum in the demo, follows from it.
