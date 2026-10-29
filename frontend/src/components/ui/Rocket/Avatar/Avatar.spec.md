# Avatar — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=68-45650 -->
<!-- synced: 2026-03-16 -->

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | xs \| sm \| default \| md \| lg \| xl \| 2xl | default |
| src | string | image URL | — |
| alt | string | alt text | — |
| fallback | ReactNode | initials or icon | — |
| className | string | — | — |

## Sizes

| Value | Dimensions | Tailwind |
|---|---|---|
| xs | 20×20 | tw-h-5 tw-w-5 |
| sm | 24×24 | tw-h-6 tw-w-6 |
| default | 32×32 | tw-h-8 tw-w-8 |
| md | 40×40 | tw-h-10 tw-w-10 |
| lg | 48×48 | tw-h-12 tw-w-12 |
| xl | 56×56 | tw-h-14 tw-w-14 |
| 2xl | 64×64 | tw-h-16 tw-w-16 |

## Token Mapping

| Element | State | Figma token | ToolJet class |
|---|---|---|---|
| fallback background | default | Bases/Base | tw-bg-background-surface-layer-02 |
| fallback text | default | — | tw-text-text-medium |
| shape | all | rounded-[1000px] | tw-rounded-full |
| image | all | — | tw-object-cover |

## Slots

- `src` + `alt` — avatar image (via Radix AvatarImage)
- `fallback` — ReactNode shown when image is absent or fails to load (via Radix AvatarFallback). Typically initials or an icon.

## CVA Shape

Shape C — sizes only

## Notes

- Uses shadcn Avatar as structural base (Radix `@radix-ui/react-avatar` underneath — handles image loading state, fallback rendering).
- Always circular (`tw-rounded-full`).
- No visual variants in Figma — only size differs.
- Fallback font size should scale with avatar size.
- `overflow-hidden` on the root to clip image to circle.
