---
"@sweberdev/lagrangian": major
"@sweberdev/lagrangian-react": major
"@sweberdev/lagrangian-vue": major
"@sweberdev/lagrangian-svelte": major
---

2.0: the world is deterministic. Sleeping and sensors are decided in every simulation step instead of once per frame, so a run no longer depends on the frame rate. New: `seed` and `world.random()`, `world.advance()`, `world.time`, `world.snapshot()`, `world.restore()` and `world.hash()`. `legacyStepping: true` keeps the 1.x timing for one more minor version. Node 22 or newer is required to build. See docs/migrating-to-2.md.
