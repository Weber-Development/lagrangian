---
"@sweberdev/lagrangian": minor
"@sweberdev/lagrangian-react": minor
---

The world can now simulate rotating boxes (`width` and `height` instead of `radius`) that fall, tip over, stack and spin when hit off centre, and bodies fall asleep one by one instead of only the whole world (`body.sleeping`, `world.wake(body)`). Slow contacts stick, so resting boxes do not creep. The build targets ES2022, which makes every part tree-shakeable: `spring` + `value` is now about 2.1 kB instead of 3.5 kB.
