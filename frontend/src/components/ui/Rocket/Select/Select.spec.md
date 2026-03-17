# Select — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=6866-4557 -->
<!-- synced: 2026-03-17 -->

## Overview

Select is a trigger + dropdown combo for choosing one value from a list. The trigger reuses the same visual tokens as Input (bg, border, focus ring, sizing). The dropdown is a popover panel with selectable items.

Wraps shadcn Select (Radix `@radix-ui/react-select`).

## Sub-components

| Component | Wraps | Token overrides |
|---|---|---|
| `SelectTrigger` | shadcn `SelectTrigger` | Same tokens as Input — bg, border, focus, hover, disabled, error, sizes |
| `SelectContent` | shadcn `SelectContent` | `bg-surface-layer-01`, `border-weak`, `rounded-lg` (10px), `elevation-300` |
| `SelectItem` | shadcn `SelectItem` | 32px height, `text-default`, hover → `interactive-hover`, `rounded-md` |

### Re-exported from shadcn (no token overrides)
`Select` (root), `SelectValue`, `SelectGroup`, `SelectLabel`, `SelectSeparator`

## Props (SelectTrigger)

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | large \| default \| small | default |
| className | string | — | — |
| disabled | boolean | — | false |

## Sizes (trigger)

| Value | Height | Font size | Tailwind |
|---|---|---|---|
| large | 40px | 14px / 20px | `tw-h-10 tw-text-lg` |
| default | 32px | 12px / 18px | `tw-h-8 tw-text-base` |
| small | 28px | 12px / 18px | `tw-h-7 tw-text-base` |

## Token Mapping — Trigger

| Element | State | ToolJet token | Tailwind class |
|---|---|---|---|
| background | default | `--background-surface-layer-01` | `tw-bg-background-surface-layer-01` |
| border | default | `--border-default` | `tw-border-border-default` |
| border | hover | `--border-strong` | `hover:tw-border-border-strong` |
| text | default | `--text-default` | `tw-text-text-default` |
| placeholder | default | `--text-placeholder` | `data-[placeholder]:tw-text-text-placeholder` |
| shadow | default | `--elevation-000` | `tw-shadow-elevation-000` |
| focus ring | focus | `--interactive-focus-outline` | `focus:tw-ring-2 focus:tw-ring-[var(--interactive-focus-outline)] focus:tw-ring-offset-1` |
| chevron icon | default | `--icon-default` | `tw-text-icon-default` |
| border | error | `--border-danger-strong` | `aria-[invalid=true]:tw-border-border-danger-strong` |
| background | error | `--background-error-weak` | `aria-[invalid=true]:tw-bg-background-error-weak` |
| background | disabled | `--switch-tag` | `disabled:tw-bg-[var(--switch-tag)]` |
| text | disabled | `--text-disabled` | `disabled:tw-text-text-disabled` |
| border | disabled | none (no border) | `disabled:tw-border-transparent` |

## Token Mapping — Content (dropdown)

| Element | Token | Tailwind class |
|---|---|---|
| background | `--background-surface-layer-01` | `tw-bg-background-surface-layer-01` |
| border | `--border-weak` | `tw-border-border-weak` |
| border radius | 10px | `tw-rounded-[10px]` |
| shadow | elevation-300 | `tw-shadow-elevation-300` |
| padding | 8px | `tw-p-2` |

## Token Mapping — Item

| Element | State | Token | Tailwind class |
|---|---|---|---|
| text | default | `--text-default` | `tw-text-text-default` |
| height | — | 32px | `tw-h-8` |
| padding | — | — | `tw-px-2 tw-py-1.5` |
| border-radius | — | 6px | `tw-rounded-md` |
| background | hover/focus | `--interactive-hover` | `focus:tw-bg-interactive-hover` |
| check icon | selected | `--text-brand` | `tw-text-text-brand` |

## Composition

### Basic
```jsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>
```

### With Field
```jsx
<Field>
  <FieldLabel>Country</FieldLabel>
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Select country" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="us">United States</SelectItem>
      <SelectItem value="uk">United Kingdom</SelectItem>
    </SelectContent>
  </Select>
</Field>
```

## Notes

- Trigger chevron: `ChevronDown` (lucide) when closed, arrow rotates via Radix data attributes.
- `allowClearSelection` from Figma is not in v1 — can be added later as an enhancement.
- Leading visual on trigger (icon before placeholder) from Figma — supported via children composition inside SelectTrigger.
- Leading/trailing visuals on items — supported via custom content inside SelectItem children.
- Disabled state uses `--switch-tag` bg token (same as Figma's `controls/switch-tag`).
