# @sweberdev/lagrangian-svelte

Svelte actions and stores for [Lagrangian](https://packages.sweber.dev/lagrangian): physical springs, draggable elements with inertia, scroll areas and a 2D physics world with gravity and collisions. Works with Svelte 3, 4 and 5 and imports nothing from `svelte`.

```sh
pnpm add @sweberdev/lagrangian @sweberdev/lagrangian-svelte
```

| Export | What it does |
|---|---|
| `use:spring={{ props, options }}` | springs the node to `{ x, y, scale, rotate, opacity, --custom }` whenever they change |
| `springStore(initial, options)` | a store that springs to whatever you `set`, keeping its momentum |
| `use:drag={options}` | makes the node draggable and throwable |
| `use:scroll={options}` | a scroll area with inertia, rubber-banding and snap points |
| `use:physics={{ world }}` | the node becomes the walls of a running `World` |
| `use:body={{ world, x, y, radius }}` | a node that follows a body in the world |

```svelte
<script>
  import { World } from "@sweberdev/lagrangian";
  import { body, physics, spring, springStore } from "@sweberdev/lagrangian-svelte";

  let open = false;
  const progress = springStore(0, { bounce: 0.2 });
  $: progress.set(open ? 1 : 0);

  const world = new World();
</script>

<aside use:spring={{ props: { x: open ? 0 : -320 }, options: { bounce: 0.15 } }}>…</aside>
<p>{Math.round($progress * 100)} %</p>

<div use:physics={{ world }} style="position: relative; height: 400px">
  <div use:body={{ world, x: 100, y: 40, radius: 24 }} style="position: absolute; left: 0; top: 0; width: 48px; height: 48px" />
</div>
```

Docs: [packages.sweber.dev/lagrangian/docs](https://packages.sweber.dev/lagrangian/docs). MIT © Seya Weber
