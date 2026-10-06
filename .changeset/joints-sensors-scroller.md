---
"@sweberdev/lagrangian": minor
"@sweberdev/lagrangian-react": minor
---

New `scroller()`: a scroll area with inertia, rubber-banding, snap points, mouse wheel, keyboard and `scrollTo` on the same physical values. The world gets joints (`pin`, `hinge`, `rod`, with motors), so pendulums, chains, wheels and windmills work, and sensors (`sensor: true` with `onEnter` and `onLeave`, `world.touching()`) for drop zones and triggers. React: `useScroller`. The size budgets grew to about 10 kB for everything.
