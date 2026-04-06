# Empty — Rocket Design Spec
<!-- synced: 2026-03-23 -->

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | large \| default \| small | default |

## Sub-components

| Sub-component | Role | Notes |
|---|---|---|
| Empty | Root container | Flex column, centered, dashed border |
| EmptyMedia | Illustration / icon slot | Accepts variant: `default` (freeform) or `icon` (contained box) |
| EmptyHeader | Groups title + description | Max-width constrained |
| EmptyTitle | Heading text | |
| EmptyDescription | Supporting text | Muted color |
| EmptyContent | Action area (footer) | Slot for buttons / links |

## Sizes

| Value | Padding | Icon size (variant=icon) | Title text | Description text |
|---|---|---|---|---|
| small | tw-p-4 | tw-size-8 | tw-font-title-default | tw-text-xs |
| default | tw-p-6 | tw-size-10 | tw-font-title-large | tw-text-sm |
| large | tw-p-8 | tw-size-12 | tw-font-title-x-large | tw-text-sm |

## Slots

- media (optional, `ReactNode`) — illustration, image, or icon
- title (required, `string`)
- description (optional, `string`)
- content/actions (optional, `ReactNode`) — buttons, links

## CVA Shape

Shape E — compound/multi-part
- Empty (root): size CVA (padding, gap, rounded)
- EmptyMedia: media variant CVA (`default` | `icon`) + size context for icon dimensions
- EmptyTitle: size context for text size
- EmptyDescription: size context for text size
- EmptyHeader: static cn()
- EmptyContent: static cn()

## Notes

- Size is set on root `<Empty size="...">` and propagated to children via React context
- Only one visual variant ("default") so no `variant` CVA on root — size is the only axis
- EmptyMedia keeps its own `variant` prop (default vs icon) from shadcn
