# Sheet — Rocket Design Spec
<!-- synced: 2026-04-07 -->

## Overview

Sheet is a slide-in panel from the right edge of the viewport. Used for multi-step forms or detail views that need more space than a Dialog can provide (e.g. adding a new datasource through multiple steps).

Wraps Radix Dialog primitives via shadcn (sheet is a Dialog with side animations). Mirrors Dialog's structure (Header / Body / Footer) including the conditional footer overflow border.

## Props (SheetContent)

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | large \| default \| small | default |
| showCloseButton | boolean | — | true |
| preventClose | boolean | — | false |

## Sizes

| Value | Width | Tailwind |
|---|---|---|
| small | 400px | tw-w-[400px] |
| default | 560px | tw-w-[560px] |
| large | 720px | tw-w-[720px] |

## Sub-components

| Component | Wraps | Styling |
|---|---|---|
| `Sheet` | Radix Dialog.Root (pass-through) | none |
| `SheetTrigger` | Re-export from shadcn | none |
| `SheetClose` | Re-export from shadcn | none |
| `SheetPortal` | Re-export from shadcn | none |
| `SheetOverlay` | Radix Overlay (direct) | tw-bg-black/50, animations |
| `SheetContent` | Radix Content (direct) | size CVA, slide-in from right, tokens |
| `SheetHeader` | plain div | border-bottom, fixed 56px height, horizontal padding |
| `SheetBody` | plain div (custom) | scrollable, ResizeObserver for overflow detection |
| `SheetFooter` | plain div | border-top (conditional on body overflow), padding |
| `SheetTitle` | Radix Title (direct) | tw-font-title-large + color |
| `SheetDescription` | Radix Description (direct) | tw-font-body-small + color |

## Token Mapping

| Element | State | ToolJet class |
|---|---|---|
| content bg | default | tw-bg-background-surface-layer-01 |
| content shadow | default | tw-shadow-elevation-400 |
| content border-left | default | tw-border-solid tw-border-l tw-border-border-weak |
| overlay bg | default | tw-bg-black/50 |
| header border | default | tw-border-solid tw-border-b tw-border-border-weak |
| header height | default | tw-h-14 |
| header padding | default | tw-px-6 tw-py-0 |
| title text | default | tw-font-title-large tw-text-text-default |
| description text | default | tw-font-body-small tw-text-text-placeholder |
| body padding | default | tw-p-6 |
| footer border (overflowing) | default | tw-border-solid tw-border-t tw-border-border-weak |
| footer border (no overflow) | default | tw-border-transparent |
| footer padding | default | tw-px-6 tw-py-4 |
| footer layout | default | tw-flex tw-justify-between tw-items-center |
| close button position | default | absolute top-right of content |

## CVA Shape

Shape C — sizes only. `sheetContentVariants` has `size` CVA for max-width. Rest use static `cn()`.

## Notes

- Right-side only for now (not exposing `side` prop). Sheet always slides in from the right edge.
- Slide-in animation via `data-[state=open]:tw-slide-in-from-right` and `data-[state=closed]:tw-slide-out-to-right`.
- **Overflow border** on footer mirrors Dialog: ResizeObserver on SheetBody detects when content overflows, sets context, footer reads context for `border-t` color.
- `preventClose` blocks overlay click via `onInteractOutside` + Escape via `onEscapeKeyDown` (same as Dialog).
- Close button is positioned absolute top-right of content (same as Dialog).
- Full viewport height — sheet stretches from top to bottom of the screen.
- Typography uses `tw-font-*` plugin utilities.
