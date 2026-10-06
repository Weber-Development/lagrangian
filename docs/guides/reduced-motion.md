---
title: Reduced motion
description: What happens when users ask their system for less motion.
---

With `prefers-reduced-motion: reduce`, springs and throws do not animate: the value jumps to where the motion would come to rest, and `finished` resolves at once. Snap points and bounds still apply, so the layout ends up the same.

Direct manipulation is not affected. Dragging follows the finger and the world keeps simulating, because the user is the one moving things. If a world only runs as decoration, do not start it for these users:

```ts
import { reducedMotion } from "@sweberdev/lagrangian";

if (!reducedMotion()) world.start();
```

`setReducedMotion("always")` skips motion everywhere, `"never"` ignores the setting, `"user"` (default) follows it.
