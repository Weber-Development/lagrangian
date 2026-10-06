# @sweberdev/lagrangian-vue

Vue 3 composables for [Lagrangian](https://packages.sweber.dev/lagrangian): physical springs, draggable elements with inertia, scroll areas and a 2D physics world with gravity and collisions. Elements are styled directly, so nothing re-renders on every frame.

```sh
pnpm add @sweberdev/lagrangian @sweberdev/lagrangian-vue
```

| Composable | What it does |
|---|---|
| `useSpringProps(el, props, options)` | springs the element to `{ x, y, scale, rotate, opacity, --custom }` whenever they change |
| `useSpring(target, options)` | a number that follows `target` (ref or getter) with momentum |
| `usePhysicsValue(initial)` | a physical value that lives as long as the component |
| `useDraggable(el, options)` | makes the element draggable and throwable; returns a ref to the handle |
| `useScroller(el, options)` | a scroll area with inertia, rubber-banding and snap points |
| `useWorld(el, options)` | the element becomes the walls of a running `World` |
| `useBody(world, el, options)` | an element that follows a body in the world |

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useBody, useSpringProps, useWorld } from "@sweberdev/lagrangian-vue";

const open = ref(false);
const panel = ref<HTMLElement>();
useSpringProps(panel, () => ({ x: open.value ? 0 : -320 }), { bounce: 0.15 });

const stage = ref<HTMLElement>();
const ball = ref<HTMLElement>();
const world = useWorld(stage);
useBody(world, ball, { x: 100, y: 40, radius: 24, restitution: 0.7 });
</script>

<template>
  <aside ref="panel">…</aside>
  <div ref="stage" style="position: relative; height: 400px">
    <div ref="ball" style="position: absolute; left: 0; top: 0; width: 48px; height: 48px" />
  </div>
</template>
```

Docs: [packages.sweber.dev/lagrangian/docs](https://packages.sweber.dev/lagrangian/docs). MIT © Seya Weber
