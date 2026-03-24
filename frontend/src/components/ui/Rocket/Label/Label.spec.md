# Label — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=5301-263198 -->
<!-- synced: 2026-03-20 -->

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | sm \| default \| lg | default |
| required | boolean | — | false |
| disabled | boolean | — | false |

## Sizes

| Value | Font size | Line height | Figma name |
|---|---|---|---|
| lg | 14px | 20px | large |
| default | 13px | 18px | default - new |
| sm | 12px | 18px | default |

## Token Mapping

| Element | State | Figma token | ToolJet class |
|---|---|---|---|
| text | default | text/default | tw-text-text-default |
| text | disabled | text/disabled | tw-text-text-disabled |
| required asterisk | default | text/danger | tw-text-text-danger |
| required asterisk | disabled | text/disabled | tw-text-text-disabled |

## Typography

- Font: IBM Plex Sans, Medium (500)
- All sizes: `tw-font-medium`

## Slots

- label text (required, `children` — string or ReactNode)
- required asterisk (conditional, rendered when `required` is true)

## CVA Shape

Shape C — sizes only (no visual variants)

## Notes

- The required asterisk `*` is rendered inline after the label text with a small gap
- When disabled, both the label text and the asterisk use the disabled color
- Font family is inherited from the app (IBM Plex Sans) — no need to set explicitly
