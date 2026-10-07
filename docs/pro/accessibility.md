---
title: Accessibility
description: What Lagrangian Pro does for keyboard and screen reader users, for reduced motion and for touch, part by part.
---

Every part works without a pointer and respects `prefers-reduced-motion`. When the user asks for
reduced motion, automatic motion jumps to its end; movement the user makes themselves, such as
dragging, still follows the pointer.

| Part | Keyboard | Announcements and roles |
| --- | --- | --- |
| `sheet` | Escape closes | Give the sheet a `role` and label yourself |
| `drawer` | Escape closes, focus moves in and back | `aria-hidden` follows the state, give it a `role` and label yourself |
| `dialog` | Escape closes, Tab stays inside, focus returns | `role="dialog"`, `aria-modal="true"` |
| `popover` | Escape closes, focus moves in and back | `aria-haspopup`, `aria-expanded` on the trigger |
| `carousel` | Arrow keys, Home, End | `role="region"` (carousel) with your `label`, slides as groups with `aria-current` |
| `sortable` | Space picks up, arrows move, Space or Enter drops, Escape cancels | Live region, texts can be translated with `messages` |
| `board` | Same as `sortable`, also between columns | Live region with the column name, translatable |
| `toasts` | Timers pause while the stack has focus | `role="status"`, or `role="alert"` for errors |
| `indicator` | Uses the buttons you provide | You mark the selected item (`aria-selected` or `aria-current`) |
| `zoom` | `+`, `-`, `0` and arrow keys on the focused viewport | Give the viewport a label |
| `pullToRefresh` | Provide a button for the same action | `aria-busy` while refreshing |
| `fall` | Decorative, turn it off for reduced motion | Content stays in the DOM and in reading order |

## Things you do

- Give dialogs, drawers and sheets an accessible name with `aria-label` or `aria-labelledby`.
- Offer a non-gesture way to do what a gesture does: a close button in a sheet, a refresh button
  next to pull to refresh, arrow buttons next to a carousel.
- Translate the announcements of `sortable` and `board` with the `messages` option.
- Keep the focus order of the DOM sensible; Lagrangian never changes it, and it puts the focus
  back where it was when something closes.
