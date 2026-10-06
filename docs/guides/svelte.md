---
title: Svelte
description: Actions and stores for springs, dragging, scrolling and the world in Svelte.
---

```sh
pnpm add @sweberdev/lagrangian @sweberdev/lagrangian-svelte
```

The package contains plain actions and stores and imports nothing from `svelte`, so it works with Svelte 3, 4 and 5.

```svelte
<script>
  import { drag, scroll, spring, springStore } from "@sweberdev/lagrangian-svelte";

  let open = false;
  const progress = springStore(0, { bounce: 0.2 });
  $: progress.set(open ? 1 : 0);
</script>

<!-- Spring on state change: it keeps its momentum when `open` flips mid-flight -->
<aside use:spring={{ props: { x: open ? 0 : -320 }, options: { duration: 0.5, bounce: 0.15 } }}>…</aside>

<!-- Drag and throw onto snap points -->
<div use:drag={{ axis: "y", snap: { y: [0, 400] } }}>…</div>

<!-- A scroll area with inertia and rubber-banding -->
<div class="viewport" use:scroll={{ snap: { y: [0, 320, 640] } }}><ul>…</ul></div>

<p>{Math.round($progress * 100)} %</p>
```

## World

```svelte
<script>
  import { World } from "@sweberdev/lagrangian";
  import { body, physics } from "@sweberdev/lagrangian-svelte";
  const world = new World({ gravity: { x: 0, y: 9.81 } });
</script>

<div use:physics={{ world }} style="position: relative; height: 400px">
  <div use:body={{ world, x: 100, y: 40, radius: 24 }} style="position: absolute; left: 0; top: 0; width: 48px; height: 48px" />
</div>
```

`springStore(initial, options)` is a readable store with `set(target)` (resolves when settled), `jump(value)` and the physical `value` behind it.
