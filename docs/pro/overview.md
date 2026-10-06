---
title: Lagrangian Pro
description: Ready-made physical UI on top of Lagrangian, with prices, installation and what each piece does.
---

Lagrangian Pro adds ready-made interface pieces that run on the same physics as the free
library. Gestures hand over to springs without a jolt, interruptions keep their momentum and
reduced motion is respected throughout.

| Piece | What it does |
|---|---|
| [Bottom sheet](sheet.md) | Detents, lands where the throw would carry it, closes on a flick, Escape or a tap on the backdrop |
| [Swipe stack](swipe-stack.md) | Cards that tilt around the grip point, fly off at the thrown speed, undo |
| [Sortable lists](sortable.md) | Drag to reorder with springs, keyboard and screen reader support, layout transitions |
| [Jelly, ropes and sounds](effects.md) | Squash and stretch from velocity, Verlet ropes, synthesized impact sounds |

## Packages

| Package | Contents |
|---|---|
| `@weber-development/lagrangian-pro` | All pieces, framework-free |
| `@weber-development/lagrangian-pro-react` | React hooks (React 18 and 19, Strict Mode) |

Both need `@sweberdev/lagrangian` 0.1 or newer.

## Installation

Lagrangian Pro is delivered through GitHub Packages. After buying, you connect your GitHub
account in Polar and get read access to `Weber-Development/lagrangian-pro-dist`, which contains
the step-by-step guide. In short:

```ini
# .npmrc
@weber-development:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${LAGRANGIAN_PRO_TOKEN}
```

```sh
pnpm add @sweberdev/lagrangian @weber-development/lagrangian-pro
```

`LAGRANGIAN_PRO_TOKEN` is a classic GitHub token with the `read:packages` scope.

## Licence

Prices are per licence, not per project. Freelancer covers one person, Agency and Lifetime up to
ten. Your own customers never need a licence for websites you build with it. After cancelling,
every version you already received keeps working; only updates and repository access end.
