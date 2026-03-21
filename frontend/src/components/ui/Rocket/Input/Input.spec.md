# Input — Rocket Design Spec
<!-- synced: 2026-03-16 -->

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | large \| default \| small | default |
| className | string | — | — |
| type | string | text \| password \| email \| number \| search \| tel \| url | text |
| disabled | boolean | — | false |
| placeholder | string | — | — |

All standard `<input>` HTML attributes are forwarded.

## Sizes

| Value | Height | Font size | Padding | Tailwind |
|---|---|---|---|---|
| large | 40px | 14px / 20px | 12px h, 10px v | `tw-h-10 tw-text-lg tw-px-3 tw-py-2.5` |
| default | 32px | 12px / 18px | 12px h, 8px v | `tw-h-8 tw-text-base tw-px-3 tw-py-2` |
| small | 28px | 12px / 18px | 12px h, 6px v | `tw-h-7 tw-text-base tw-px-3 tw-py-1.5` |

## Token Mapping

| Element | State | ToolJet token | Tailwind class |
|---|---|---|---|
| background | default | `--background-surface-layer-01` | `tw-bg-background-surface-layer-01` |
| border | default | `--border-default` | `tw-border-border-default` |
| border | hover | `--border-strong` | `hover:tw-border-border-strong` |
| text | default | `--text-default` | `tw-text-text-default` |
| placeholder | default | `--text-placeholder` | `placeholder:tw-text-text-placeholder` |
| shadow | default | `--elevation-none` | `tw-shadow-elevation-none` |
| focus ring | focus | `--interactive-focus-outline` | `focus-visible:tw-ring-2 focus-visible:tw-ring-[var(--interactive-focus-outline)] focus-visible:tw-ring-offset-1` |
| border | error | `--border-danger-strong` | `aria-[invalid=true]:tw-border-border-danger-strong` |
| background | error | `--background-error-weak` | `aria-[invalid=true]:tw-bg-background-error-weak` |
| background | disabled | `--background-surface-layer-02` | `disabled:tw-bg-background-surface-layer-02` |
| text | disabled | `--text-disabled` | `disabled:tw-text-text-disabled` |
| border | disabled | `--border-disabled` | `disabled:tw-border-border-disabled` |

## CVA Shape

Shape C — sizes only (no variant axis). States handled via CSS pseudo-classes and aria attributes.

## Notes

- Uses shadcn Input as structural base. All styling overridden by Rocket CVA via tailwind-merge.
- Error state triggered by `aria-invalid="true"` attribute (set by Field wrapper or manually).
- Border radius: `tw-rounded-md` (6px) inherited from shadcn base.
- Font: IBM Plex Sans — handled by global body font.
