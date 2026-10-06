---
title: Vue
description: Composables for springs, dragging, scrolling and the world in Vue 3.
---

```sh
pnpm add @sweberdev/lagrangian @sweberdev/lagrangian-vue
```

The composables take a template ref and write styles directly to the element, so a running animation does not re-render your component. They attach when the element appears and clean up when it goes away or the component unmounts.

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useDraggable, useScroller, useSpring, useSpringProps } from "@sweberdev/lagrangian-vue";

// Spring on state change
const open = ref(false);
const drawer = ref<HTMLElement>();
useSpringProps(drawer, () => ({ x: open.value ? 0 : -320 }), { duration: 0.5, bounce: 0.15 });

// Drag and throw onto snap points
const sheet = ref<HTMLElement>();
useDraggable(sheet, { axis: "y", snap: { y: [0, 400] } });

// A scroll area with inertia
const list = ref<HTMLElement>();
const scroller = useScroller(list, { snap: { y: [0, 320, 640] } });

// A number that follows a target
const count = ref(0);
const shown = useSpring(count);
</script>
```

## World

```vue
<script setup lang="ts">
const stage = ref<HTMLElement>();
const ball = ref<HTMLElement>();
const world = useWorld(stage, { gravity: { x: 0, y: 9.81 } });
useBody(world, ball, { x: 100, y: 40, radius: 24 });
</script>
<template>
  <div ref="stage" style="position: relative; height: 400px">
    <div ref="ball" style="position: absolute; left: 0; top: 0; width: 48px; height: 48px" />
  </div>
</template>
```

Options can be refs or getters for `useDraggable` and `useScroller`; callbacks always see the latest ones.
