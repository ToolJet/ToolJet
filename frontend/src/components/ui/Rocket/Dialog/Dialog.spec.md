# Dialog — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=8996-1514 -->
<!-- synced: 2026-03-25 -->

## Props (DialogContent)

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | small \| default \| large \| extraLarge \| fullscreen | default |
| showCloseButton | boolean | — | true |
| preventClose | boolean | — | false |

## Props (DialogBody)

| Prop | Type | Values | Default |
|---|---|---|---|
| noPadding | boolean | — | false |
| scrollable | boolean | — | false |

## Sizes

| Value | Max-width | Tailwind |
|---|---|---|
| small | 400px | tw-max-w-[400px] |
| default | 480px | tw-max-w-[480px] |
| large | 640px | tw-max-w-[640px] |
| extraLarge | 768px | tw-max-w-[768px] |
| fullscreen | 100vw/100vh | tw-max-w-none tw-w-screen tw-h-screen tw-rounded-none |

## Token Mapping

| Element | State | Figma token | ToolJet class |
|---|---|---|---|
| content bg | default | bg-surface-layer-01 | tw-bg-background-surface-layer-01 |
| content shadow | default | Elevations/400 | tw-shadow-elevation-400 |
| content radius | default | 8px | tw-rounded-lg |
| header border | default | border/weak | tw-border-solid tw-border-b tw-border-border-weak |
| header height | default | 56px | tw-h-14 |
| header padding | default | 24px horizontal | tw-px-6 tw-py-0 |
| title text | default | text/default 14px Medium | tw-font-title-large tw-text-text-default |
| description text | default | text/placeholder 11px Regular | tw-font-body-small tw-text-text-placeholder |
| body padding | default | 24px | tw-p-6 |
| footer border | default | border/weak | tw-border-solid tw-border-t tw-border-border-weak |
| footer padding | default | 24px h / 16px v | tw-px-6 tw-py-4 |
| footer layout | default | — | tw-justify-between (outline left, primary right) |
| overlay bg | default | black/50 | tw-bg-black/50 |
| close button | default | icon/default | tw-text-icon-default |
| close button | hover | — | hover:tw-text-icon-strong |

## Sub-components

| Component | Wraps | Styling |
|---|---|---|
| `Dialog` | Radix Root (pass-through) | none |
| `DialogTrigger` | Re-export from shadcn | none |
| `DialogClose` | Re-export from shadcn | none |
| `DialogPortal` | Re-export from shadcn | none |
| `DialogContent` | Radix Content (direct) | size CVA, tokens, preventClose, close button |
| `DialogOverlay` | Radix Overlay (direct) | tw-bg-black/50, animations |
| `DialogHeader` | plain div | border-bottom, fixed 56px height, horizontal padding |
| `DialogBody` | plain div (custom) | noPadding, scrollable |
| `DialogFooter` | plain div | border-top, justify-between layout |
| `DialogTitle` | Radix Title (direct) | tw-font-title-large + color |
| `DialogDescription` | Radix Description (direct) | tw-font-body-small + color |

## CVA Shape

Shape E — compound/multi-part. Only `DialogContent` gets CVA (for size). Rest use static `cn()`.

## Notes

- Uses Radix primitives directly (not shadcn wrappers) for Overlay, Content, Title, Description — ensures Rocket controls the overlay bg
- No anchor context needed — Dialog is centered, not positioned relative to trigger
- `preventClose` blocks overlay click via `onInteractOutside` + Escape via `onEscapeKeyDown`
- `scrollable` adds `tw-overflow-y-auto tw-max-h-[85vh]` to the body area (on DialogBody, not DialogContent)
- `noPadding` removes default body padding (header/footer keep theirs) — on DialogBody
- `fullscreen` size removes border-radius and uses full viewport
- Header/footer borders appear on ALL sizes (no conditional)
- Footer uses `justify-between` — outline/cancel button on left, primary on right
- Close button positioned absolute top-right of content
- Typography uses plugin token utilities (`tw-font-title-large`, `tw-font-body-small`) — not manual font combos
