# Tooltip — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=7661-2505 -->
<!-- synced: 2026-03-20 -->

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| side | string | top \| bottom \| left \| right | top |
| align | string | start \| center \| end | center |
| sideOffset | number | — | 4 |
| showArrow | boolean | — | true |

## Sub-components

| Part | Wraps | Needs styling? |
|---|---|---|
| TooltipProvider | Radix Provider | No — re-export |
| Tooltip | Radix Root | No — re-export |
| TooltipTrigger | Radix Trigger | No — re-export |
| TooltipContent | Radix Content + Portal | Yes — main styled part |
| TooltipArrow | Radix Arrow | Yes — fill color |

## Token Mapping

| Element | State | Figma token | ToolJet class |
|---|---|---|---|
| content background | default | background/inverse | tw-bg-background-inverse |
| content text | default | text/on-solid | tw-text-text-on-solid |
| arrow fill | default | background/inverse | tw-fill-background-inverse |
| content shadow | default | Elevations/400 | tw-shadow-elevation-400 |

## Typography

- Font: IBM Plex Sans Medium, 12px / 18px line-height
- Classes: `tw-text-xs tw-leading-[18px] tw-font-medium`

## Dimensions

- Border radius: 8px → `tw-rounded-lg`
- Padding: 12px → `tw-p-3`
- Content gap: 4px → `tw-gap-1`
- Arrow sideOffset: 4px (default)
- Max width: ~293px → `tw-max-w-xs`

## CVA Shape

Shape D — no variants, no sizes. Static `cn()` call on TooltipContent.
Compound (Shape E structure) but only TooltipContent and TooltipArrow need styling.

## Notes

- Pointer placement (9 Figma variants) maps to Radix's `side` + `align` props — no custom code needed
- Arrow is a Radix primitive — just needs fill color to match background
- Animation classes from shadcn are kept (animate-in/out, fade, zoom, slide)
- `delayDuration` on Provider defaults to 700ms in Radix — consider lowering to 200ms for snappier UX
