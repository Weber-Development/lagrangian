---
title: Lagrangian Pro API
description: Every function, option and method of the framework-free Lagrangian Pro package, generated from its type declarations.
---

```ts
import { sheet, dialog, board /* … */ } from "@weber-development/lagrangian-pro";
```

From 1.0 these signatures follow semantic versioning: options and methods are only removed in a major version, and deprecated ones are listed in the changelog first.

## board

```ts
board(target: HTMLElement | readonly HTMLElement[], options?: BoardOptions): Board
```

| Option | Type | |
| --- | --- | --- |
| `handle` | `string` | Selector of the drag handle inside each item. Default the whole item. |
| `lift` | `number` | Scale of the lifted item. Default 1.03. |
| `spring` | `SpringOptions` |  |
| `autoScroll` | `boolean \| AutoScrollOptions` | Scroll the page or the scrollable parent while an item is held near its edge. Default true; `{ edge, speed }` tunes it, `false` turns it off. |
| `canDrop` | `(item: HTMLElement, container: HTMLElement) => boolean` | Decides whether an item may be dropped into a container. Default always. |
| `onMove` | `(change: BoardChange) => void` | Called after an item has been dropped in a new place. |
| `commit` | `(change: BoardChange) => void \| Promise<void>` | Changes the order yourself, e.g. through framework state. The DOM is put back as it was, then this is called with the change; the transition plays once the returned promise resolves, so resolve it after the DOM is updated. |
| `messages` | `Partial<BoardMessages>` | Screen reader announcements, e.g. translated. English by default. |

| Member | Type | |
| --- | --- | --- |
| `containers` | `HTMLElement[]` |  |
| `dragging` | `boolean` |  |
| `move` | `(item: HTMLElement, container: HTMLElement, index: number): void` | Moves an item to a container and index with a spring transition. |
| `destroy` | `(): void` |  |

## carousel

```ts
carousel(viewport: HTMLElement, options?: CarouselOptions): Carousel
```

| Option | Type | |
| --- | --- | --- |
| `track` | `HTMLElement` | The element that moves. Default the first child of the viewport; its children are the slides. |
| `align` | `"start" \| "center"` | Where the active slide rests in the viewport. Default "start". |
| `initial` | `number` | Slide to start at. Default 0. |
| `flick` | `number` | Speed in px/s from which a flick moves at least one slide. Default 350. |
| `spring` | `SpringOptions` | Spring for settling. |
| `label` | `string` | Label read by screen readers. |
| `onChange` | `(index: number) => void` | Called when a new slide becomes the active one. |

| Member | Type | |
| --- | --- | --- |
| `index` | `number` |  |
| `count` | `number` |  |
| `x` | `PhysicsValue` |  |
| `dragging` | `boolean` |  |
| `goTo` | `(index: number): Promise<boolean>` |  |
| `next` | `(): Promise<boolean>` |  |
| `prev` | `(): Promise<boolean>` |  |
| `refresh` | `(): void` | Measures the slides again, e.g. after a resize or after adding slides. |
| `destroy` | `(): void` |  |

## dialog

```ts
dialog(element: HTMLElement, options?: DialogOptions): Dialog
```

| Option | Type | |
| --- | --- | --- |
| `backdrop` | `HTMLElement` | Element behind the dialog that fades with it; a click on it closes the dialog. |
| `initialFocus` | `HTMLElement \| string` | Element to focus when opening. Default the first focusable element. |
| `closeOnEscape` | `boolean` | Close with Escape. Default true. |
| `closeOnBackdrop` | `boolean` | Close with a click on the backdrop. Default true. |
| `lockScroll` | `boolean` | Stop the page behind from scrolling while open. Default true. |
| `from` | `number` | Scale the dialog starts from. Default 0.92. |
| `spring` | `SpringOptions` | Spring for the transition. |
| `onChange` | `(open: boolean) => void` |  |

| Member | Type | |
| --- | --- | --- |
| `open` | `boolean` |  |
| `show` | `(): Promise<boolean>` |  |
| `hide` | `(): Promise<boolean>` |  |
| `destroy` | `(): void` |  |

## drawer

```ts
drawer(element: HTMLElement, options?: DrawerOptions): Drawer
```

| Option | Type | |
| --- | --- | --- |
| `side` | `"left" \| "right"` | Edge the drawer sits at. Default "left". |
| `open` | `boolean` | Start open. Default false. |
| `handle` | `HTMLElement` | The part that can be dragged. Default the whole drawer. |
| `backdrop` | `HTMLElement` | An element whose opacity follows the drawer; a click on it closes the drawer. |
| `closeOnEscape` | `boolean` | Close with the Escape key while open. Default true. |
| `flick` | `number` | Speed in px/s from which a flick opens or closes. Default 400. |
| `spring` | `SpringOptions` | Spring for opening and closing. |
| `onChange` | `(open: boolean) => void` | Called when the drawer settles open or closed. |

| Member | Type | |
| --- | --- | --- |
| `x` | `PhysicsValue` | Horizontal translation: 0 is open, the width (negative on the left) is closed. |
| `open` | `boolean` |  |
| `dragging` | `boolean` |  |
| `show` | `(): Promise<boolean>` |  |
| `hide` | `(): Promise<boolean>` |  |
| `toggle` | `(): Promise<boolean>` |  |
| `destroy` | `(): void` |  |

## fall

```ts
fall(root: HTMLElement, options?: FallOptions): Fall
```

| Option | Type | |
| --- | --- | --- |
| `selector` | `string` | Elements that fall. Default the children of `root`. |
| `bounds` | `Rect` | Floor and walls in viewport pixels. Default the viewport. |
| `gravity` | `number` | Gravity in m/s². Default 9.81. |
| `restitution` | `number` | Bounciness of the pieces, 0 to 1. Default 0.3. |
| `stagger` | `number` | Milliseconds between two pieces letting go, from the bottom up. Default 40. |
| `spring` | `SpringOptions` | Spring used to bring the pieces home. |

| Member | Type | |
| --- | --- | --- |
| `active` | `boolean` | True from `start()` until `restore()` has finished. |
| `world` | `World` | The world the pieces live in, e.g. to add more bodies. |
| `start` | `(): void` | Lets the pieces go. |
| `explode` | `(origin?: { x: number; y: number; }, strength?: number): void` | Throws the pieces away from a point in viewport pixels. `strength` is a speed in px/s. |
| `restore` | `(): Promise<void>` | Springs every piece back into the layout. |
| `destroy` | `(): void` |  |

## measure

```ts
measure(targets: Targets): Snapshot
```

| Member | Type | |
| --- | --- | --- |
| `play` | `(spring?: SpringOptions): void` | Springs every measured element from where it was to where it is now. |

## indicator

```ts
indicator(track: HTMLElement, element: HTMLElement, options?: IndicatorOptions): Indicator
```

| Option | Type | |
| --- | --- | --- |
| `itemSelector` | `string` | CSS selector of the items inside the track. Default the track's children. |
| `initial` | `number \| HTMLElement` | Item selected at the start. Default the one with `aria-selected="true"`, else the first. |
| `clickToSelect` | `boolean` | Select an item when it is clicked. Default true. |
| `spring` | `SpringOptions` |  |
| `onSelect` | `(index: number, item: HTMLElement) => void` |  |

| Member | Type | |
| --- | --- | --- |
| `index` | `number` |  |
| `select` | `(target: number \| HTMLElement): void` |  |
| `refresh` | `(): void` | Moves to the selected item without animation, e.g. after a resize. |
| `destroy` | `(): void` |  |

## jelly

```ts
jelly(skin: HTMLElement | SVGElement, options?: JellyOptions): Jelly
```

| Option | Type | |
| --- | --- | --- |
| `source` | `JellySource` | What moves: a draggable, a pair of values, an element animated with Lagrangian, or a function returning the velocity in px/s (e.g. of a World body). Default the parent element. |
| `strength` | `number` | Stretch per 1000 px/s. Default 0.1. |
| `max` | `number` | Largest stretch, e.g. 0.3 for 30 %. Default 0.3. |
| `frequency` | `number` | Wobble frequency in Hz. Default 4.5. |
| `damping` | `number` | Damping ratio of the wobble, 0 to 1. Lower wobbles longer. Default 0.3. |

| Member | Type | |
| --- | --- | --- |
| `stretch` | `number` | Current stretch along the main axis, e.g. 0.12 for 12 %; negative is squashed. |
| `impact` | `(vx: number, vy: number): void` | Squashes the shape as after a hit with this velocity in px/s, e.g. from `onCollide`. |
| `destroy` | `(): void` |  |

## popover

```ts
popover(trigger: HTMLElement, element: HTMLElement, options?: PopoverOptions): Popover
```

| Option | Type | |
| --- | --- | --- |
| `side` | `PopoverSide` | Side of the trigger the popover opens on. Default "bottom". |
| `align` | `PopoverAlign` | Alignment along that side. Default "center". |
| `offset` | `number` | Distance to the trigger in pixels. Default 8. |
| `margin` | `number` | Keep this far from the edge of the window in pixels. Default 8. |
| `flip` | `boolean` | Open on the other side when there is no room. Default true. |
| `closeOnEscape` | `boolean` | Close with Escape. Default true. |
| `closeOnOutside` | `boolean` | Close with a click outside of the popover and the trigger. Default true. |
| `focus` | `boolean` | Move the focus into the popover when opening. Default true. |
| `from` | `number` | Scale the popover starts from. Default 0.9. |
| `spring` | `SpringOptions` |  |
| `onChange` | `(open: boolean) => void` |  |

| Member | Type | |
| --- | --- | --- |
| `open` | `boolean` |  |
| `side` | `PopoverSide` | The side it is currently on, after flipping. |
| `show` | `(): Promise<boolean>` |  |
| `hide` | `(): Promise<boolean>` |  |
| `toggle` | `(): Promise<boolean>` |  |
| `update` | `(): void` | Positions it again, e.g. after its content changed size. |
| `destroy` | `(): void` |  |

## pullToRefresh

```ts
pullToRefresh(container: HTMLElement, options: PullToRefreshOptions): PullToRefresh
```

| Option | Type | |
| --- | --- | --- |
| `onRefresh` | `() => void \| Promise<void>` | Called on release past the threshold. The content waits until the promise settles. |
| `content` | `HTMLElement` | The element that moves. Default the first child of the scroll container. |
| `threshold` | `number` | Pull distance in pixels that triggers a refresh. Default 72. |
| `max` | `number` | Largest visible pull in pixels. Default 2.2 times the threshold. |
| `spring` | `SpringOptions` | Spring for holding and returning. |
| `onProgress` | `(progress: number, state: PullState) => void` | Called on every move with the pull as a fraction of the threshold (0 to 1+). |
| `onState` | `(state: PullState) => void` | Called when the state changes; also written to `data-state` on the container. |

| Member | Type | |
| --- | --- | --- |
| `state` | `PullState` |  |
| `refresh` | `(): Promise<void>` | Runs a refresh from code, e.g. for a keyboard button. Resolves when the content is back. |
| `destroy` | `(): void` |  |

## rope

```ts
rope(options: RopeOptions): Rope
```

| Option | Type | |
| --- | --- | --- |
| `from` | `Vector` | First point, pinned. In pixels. |
| `to` | `Vector` | Last point. Pinned when `pinEnd` is true, otherwise only its starting place. |
| `segments` | `number` | Number of segments. More is smoother and slower. Default 20. |
| `length` | `number` | Rest length in pixels. Default 1.1 × the distance between `from` and `to`, or 200. |
| `pinEnd` | `boolean` | Pin the last point as well, e.g. for a garland. Default false. |
| `gravity` | `Vector` | Gravity in px/s². Default `{ x: 0, y: 2000 }`. |
| `drag` | `number` | Fraction of velocity lost per second to air and internal friction. Default 0.8. |
| `iterations` | `number` | Constraint passes per step. More is less stretchy. Default 20. |
| `onFrame` | `(rope: Rope) => void` | Called after every frame, e.g. to draw. |

## sheet

```ts
sheet(element: HTMLElement, options?: SheetOptions): Sheet
```

| Option | Type | |
| --- | --- | --- |
| `detents` | `number[]` | Visible heights the sheet rests at, lowest first: pixels, or fractions of the sheet's height for values up to 1. Default `[0.5, 1]`. |
| `initial` | `number` | Detent to start at, or -1 for closed. Default -1 when dismissible, otherwise 0. |
| `dismissible` | `boolean` | Whether a drag or throw downwards can close the sheet. Default true. |
| `handle` | `HTMLElement` | The part of the sheet that can be dragged. Default the whole sheet. |
| `backdrop` | `HTMLElement` | An element whose opacity follows the sheet, from 0 (closed) to 1 (at the first detent). |
| `closeOnEscape` | `boolean` | Close with the Escape key while open. Default true when dismissible. |
| `flick` | `number` | Speed in px/s from which a flick moves at least one detent. Default 400. |
| `spring` | `SpringOptions` | Spring for settling on a detent. Default a quick spring with a hint of bounce. |
| `onChange` | `(index: number) => void` | Called when the sheet settles on a new detent index, -1 when it closes. |

| Member | Type | |
| --- | --- | --- |
| `y` | `PhysicsValue` | The vertical translation in pixels: 0 is fully open, the sheet height is closed. |
| `index` | `number` | Current detent index, -1 when closed. |
| `dragging` | `boolean` |  |
| `snapTo` | `(index: number): Promise<boolean>` | Springs to a detent, or closes with -1. Keeps the current velocity. |
| `open` | `(index?: number): Promise<boolean>` | Opens at the given detent, default the first. |
| `close` | `(): Promise<boolean>` |  |
| `destroy` | `(): void` |  |

## sortable

```ts
sortable(list: HTMLElement, options?: SortableOptions): Sortable
```

| Option | Type | |
| --- | --- | --- |
| `axis` | `"x" \| "y"` | Direction of the list. Default "y". |
| `handle` | `string` | Selector of the drag handle inside each item. Default the whole item. |
| `lift` | `number` | Scale of the lifted item. Default 1.03. |
| `spring` | `SpringOptions` | Spring for making room and settling. |
| `messages` | `Partial<SortableMessages>` | Screen reader announcements, e.g. translated. English by default. |
| `autoScroll` | `boolean \| AutoScrollOptions` | Scroll the page or the scrollable parent while an item is held near its edge. Default true; `{ edge, speed }` tunes it, `false` turns it off. |
| `onReorder` | `(from: number, to: number, items: HTMLElement[]) => void` | Called after the order changed, with the old and new index and the items in order. |
| `reorder` | `(from: number, to: number) => void \| Promise<void>` | Changes the order yourself instead of moving the DOM nodes, e.g. through framework state. Called for every single move; the transition plays once the returned promise resolves (or right away when nothing is returned), so resolve it after the DOM is updated. |

| Member | Type | |
| --- | --- | --- |
| `items` | `HTMLElement[]` | The items in their current order. |
| `dragging` | `boolean` |  |
| `move` | `(from: number, to: number): void` | Moves an item to a new index with a spring transition. |
| `destroy` | `(): void` |  |

## impactSound

```ts
impactSound(options?: ImpactSoundOptions): ImpactSound
```

| Option | Type | |
| --- | --- | --- |
| `volume` | `number` | Master volume, 0 to 1. Default 0.4. |
| `material` | `Material` | Timbre. Default "wood". |
| `minSpeed` | `number` | Impacts slower than this in px/s are silent. Default 120. |
| `maxSpeed` | `number` | Impact speed in px/s that plays at full volume. Default 2500. |
| `pitch` | `number` | Pitch multiplier. Default 1. |
| `voices` | `number` | Sounds playing at once. Default 6. |
| `context` | `AudioContext` | An existing audio context. Default a new one, created on first use. |

| Member | Type | |
| --- | --- | --- |
| `muted` | `boolean` | Silences all sounds without destroying anything. |
| `volume` | `number` |  |
| `material` | `Material` |  |
| `play` | `(strength: number, size?: number): boolean` | Plays one impact. `strength` 0 to 1, `size` in pixels (a radius; default 24). Returns false when it was skipped (muted, too quiet, no audio, or all voices busy). |
| `collide` | `(a: Body, b: Body \| null, speed: number) => void` | Use as a World's `onCollide`: `new World({ onCollide: sound.collide })`. |
| `unlock` | `(): Promise<void>` | Resumes audio after a user gesture. Called automatically on the first pointer or key press. |
| `destroy` | `(): void` |  |

## swipeStack

```ts
swipeStack(container: HTMLElement, options?: SwipeStackOptions): SwipeStack
```

| Option | Type | |
| --- | --- | --- |
| `directions` | `SwipeDirection[]` | Directions a card can leave in. Default left and right. |
| `threshold` | `number` | Distance as a fraction of the card size after which a release swipes. Default 0.35. |
| `velocity` | `number` | Throw speed in px/s that swipes regardless of the distance. Default 650. |
| `rotate` | `number` | Tilt in degrees at the threshold. Default 12. |
| `visible` | `number` | Cards behind the top one that stay visible. Default 2. |
| `depth` | `{ scale?: number; y?: number; }` | How much smaller and lower each card behind is. Default `{ scale: 0.05, y: 14 }`. |
| `spring` | `SpringOptions` | Spring for returning and moving up. |
| `onMove` | `(direction: SwipeDirection \| null, progress: number, card: HTMLElement) => void` | Called while dragging with the leading direction and progress to the threshold (0 to 1). |
| `onSwipe` | `(card: HTMLElement, direction: SwipeDirection, index: number) => void` | Called when a card leaves. |
| `onEmpty` | `() => void` | Called when the last card has left. |

| Member | Type | |
| --- | --- | --- |
| `top` | `HTMLElement \| null` | The card on top, or null when all are gone. |
| `remaining` | `number` | Cards left on the stack. |
| `swipe` | `(direction: SwipeDirection): Promise<boolean>` | Swipes the top card away, as if thrown. Resolves when it is off screen. |
| `undo` | `(): boolean` | Brings the last swiped card back onto the stack. Returns false when there is none. |
| `refresh` | `(): void` | Reads the cards from the container again, e.g. after adding new ones at the end. |
| `destroy` | `(): void` |  |

## toasts

```ts
toasts(container: HTMLElement, options?: ToastOptions): Toasts
```

| Option | Type | |
| --- | --- | --- |
| `edge` | `"top" \| "bottom"` | Where the stack sits; new toasts arrive from this edge. Default "bottom". |
| `max` | `number` | Toasts shown at once; older ones are dismissed. Default 4. |
| `duration` | `number` | Milliseconds until a toast closes itself. 0 keeps it. Default 5000. |
| `swipe` | `boolean` | Swipe sideways to dismiss. Default true. |
| `distance` | `number` | Distance in pixels a toast travels when it arrives. Default 32. |
| `spring` | `SpringOptions` |  |

| Member | Type | |
| --- | --- | --- |
| `show` | `(content: string \| Node, options?: ShowOptions): ToastHandle` |  |
| `clear` | `(): Promise<void>` | Dismisses every toast. |
| `count` | `number` |  |
| `destroy` | `(): void` |  |

## zoom

```ts
zoom(viewport: HTMLElement, options?: ZoomOptions): Zoom
```

| Option | Type | |
| --- | --- | --- |
| `content` | `HTMLElement` | The element that is zoomed. Default the first child of the viewport. |
| `min` | `number` | Smallest and largest scale. Default 1 and 6. |
| `max` | `number` |  |
| `doubleTap` | `number \| false` | Scale a double tap zooms to. Default 2.5; false turns the gesture off. |
| `wheel` | `boolean` | Zoom with the mouse wheel and trackpad pinch. Default true. |
| `keys` | `boolean` | Keys: + and - zoom, 0 resets, arrows pan, while the viewport has focus. Default true. |
| `rubberband` | `number` | Resistance past the edges, 0 to 1. Default 0.55. |
| `spring` | `SpringOptions` |  |
| `onChange` | `(state: ZoomState) => void` |  |

| Member | Type | |
| --- | --- | --- |
| `state` | `ZoomState` |  |
| `scale` | `PhysicsValue` |  |
| `x` | `PhysicsValue` |  |
| `y` | `PhysicsValue` |  |
| `zoomTo` | `(scale: number, around?: { x: number; y: number; }, spring?: SpringOptions): void` | Zooms to a scale around a point in viewport pixels (default the centre). |
| `panTo` | `(point: { x: number; y: number; }, spring?: SpringOptions): void` | Moves the content so the point (in content pixels) is at the centre of the viewport. |
| `reset` | `(spring?: SpringOptions): void` |  |
| `refresh` | `(): void` | Measures again after the sizes changed. |
| `destroy` | `(): void` |  |

