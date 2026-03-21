# Toggle — Rocket Design Spec
<!-- synced: 2026-03-17 -->

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| variant | string | ghost \| outline | ghost |
| size | string | large \| default \| medium \| small | default |
| disabled | boolean | — | false |
| pressed | boolean | controlled on/off | — |
| defaultPressed | boolean | uncontrolled default | false |
| onPressedChange | function | callback | — |
| className | string | — | — |

## Sizes (matches Button)

| Value | Height | Tailwind |
|---|---|---|
| large | 40px | tw-h-10 tw-px-2.5 tw-text-lg |
| default | 32px | tw-h-8 tw-px-2 tw-text-base |
| medium | 28px | tw-h-7 tw-px-1.5 tw-text-base |
| small | 20px | tw-h-5 tw-px-1 tw-text-sm |

## Token Mapping

| Element | State | ToolJet class |
|---|---|---|
| background | default | tw-bg-transparent |
| background | hover | hover:tw-bg-interactive-hover |
| background | on (data-[state=on]) | data-[state=on]:tw-bg-interactive-selected |
| shadow | off (data-[state=off]) | data-[state=off]:tw-shadow-elevation-100 |
| text | default | tw-text-text-medium |
| text | on | data-[state=on]:tw-text-text-default |
| border (outline only) | default | tw-border tw-border-border-weak |
| focus ring | focus | focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-1 |
| disabled | all | disabled:tw-pointer-events-none disabled:tw-opacity-50 |

## CVA Shape

Shape A — variants + sizes

## Notes

- Uses shadcn Toggle as structural base (Radix `@radix-ui/react-toggle` — manages pressed state, keyboard, aria-pressed).
- Follows Button sizing exactly (large/default/medium/small).
- Min-width forced to 0 (`!tw-min-w-0`) to override shadcn's default. Icon-only toggles use `[&:has(>svg:only-child)]:tw-aspect-square` for square shape.
- `pressed` / `defaultPressed` / `onPressedChange` pass through to Radix.
- Off state has subtle shadow (`data-[state=off]:tw-shadow-elevation-100`).
