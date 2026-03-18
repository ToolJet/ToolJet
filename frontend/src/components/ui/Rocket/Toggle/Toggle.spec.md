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

| Value | Height | Min-width | Tailwind |
|---|---|---|---|
| large | 40px | 40px | tw-h-10 tw-min-w-10 tw-px-2.5 |
| default | 32px | 32px | tw-h-8 tw-min-w-8 tw-px-2 |
| medium | 28px | 28px | tw-h-7 tw-min-w-7 tw-px-1.5 |
| small | 20px | 20px | tw-h-5 tw-min-w-5 tw-px-1 |

## Token Mapping

| Element | State | ToolJet class |
|---|---|---|
| background | default | tw-bg-transparent |
| background | hover | hover:tw-bg-interactive-hover |
| background | on (data-[state=on]) | data-[state=on]:tw-bg-interactive-selected |
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
- `min-width` equals height for square icon-only toggles; content can expand width.
- `pressed` / `defaultPressed` / `onPressedChange` pass through to Radix.
