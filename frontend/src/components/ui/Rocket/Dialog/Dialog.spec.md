# Dialog — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=8996-1514 -->
<!-- synced: 2026-03-20 -->

## Props (DialogContent)

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | small \| default \| large \| extraLarge \| fullscreen | default |
| showCloseButton | boolean | — | true |
| preventClose | boolean | — | false |
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
| content shadow | default | Elevations/400 | tw-shadow-[var(--elevation-400-box-shadow)] |
| content radius | default | 8px | tw-rounded-lg |
| header border | default | border/weak | tw-border-solid tw-border-b tw-border-border-weak |
| header padding | default | 24px | tw-p-6 |
| title text | default | text/default 16px Medium | tw-text-text-default tw-text-base tw-font-medium |
| description text | default | text/placeholder | tw-text-text-placeholder tw-text-sm |
| body padding | default | 24px | tw-p-6 |
| footer border | default | border/weak | tw-border-solid tw-border-t tw-border-border-weak |
| footer padding | default | 24px | tw-p-6 |
| overlay bg | default | black/50 | tw-bg-black/50 |
| close button | default | icon/default | tw-text-icon-default |
| close button | hover | — | hover:tw-text-icon-strong |

## Sub-components

| Component | Wraps shadcn? | Styling |
|---|---|---|
| `Dialog` | Re-export (Root) | none |
| `DialogTrigger` | Re-export | none |
| `DialogClose` | Re-export | none |
| `DialogPortal` | Re-export | none |
| `DialogContent` | HOC wrapper | size CVA, tokens, noPadding, preventClose, scrollable |
| `DialogOverlay` | HOC wrapper | token overlay bg |
| `DialogHeader` | HOC wrapper | border-bottom, padding |
| `DialogFooter` | HOC wrapper | border-top, padding |
| `DialogTitle` | HOC wrapper | token text + font |
| `DialogDescription` | HOC wrapper | token text |

## CVA Shape

Shape E — compound/multi-part. Only `DialogContent` gets CVA (for size). Rest use static `cn()`.

## Notes

- No anchor context needed — Dialog is centered, not positioned relative to trigger
- `preventClose` blocks overlay click via `onInteractOutside` + Escape via `onEscapeKeyDown`
- `scrollable` adds `tw-overflow-y-auto tw-max-h-[85vh]` to the body area
- `noPadding` removes default body padding (header/footer keep theirs)
- `fullscreen` size removes border-radius and uses full viewport
- Header has 56px height from Figma (tw-h-14), border-bottom
- Footer has border-top, flex row for action buttons
- Close button positioned absolute top-right of content
