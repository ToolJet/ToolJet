# Combobox — Rocket Design Spec
<!-- synced: 2026-03-19 -->

## Overview

Combobox is a searchable dropdown for choosing one value from a filtered list. The trigger is an input field that filters options as the user types. Reuses the same visual tokens as Input/Select (bg, border, focus ring, sizing).

Wraps shadcn Combobox (`@base-ui/react` Combobox primitive).

**v1 scope:** Single-select only. Multi-select (chips) deferred to v2.

## Sub-components

| Component | Wraps | Token overrides |
|---|---|---|
| `ComboboxInput` | shadcn `ComboboxInput` | Same tokens as Select trigger — bg, border, focus, hover, disabled, error, sizes |
| `ComboboxContent` | shadcn `ComboboxContent` | `bg-surface-layer-01`, `border-weak`, `rounded-lg` (10px), `elevation-300` |
| `ComboboxItem` | shadcn `ComboboxItem` | 32px height, `text-default`, hover → `interactive-hover`, `rounded-md` |
| `ComboboxEmpty` | shadcn `ComboboxEmpty` | `text-placeholder`, centered |

### Re-exported from shadcn (no token overrides)
`Combobox` (root), `ComboboxValue`, `ComboboxGroup`, `ComboboxLabel`, `ComboboxSeparator`, `ComboboxList`, `ComboboxCollection`

## Props (ComboboxInput)

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | large \| default \| small | default |
| className | string | — | — |
| disabled | boolean | — | false |
| readOnly | boolean | — | false |
| loading | boolean | — | false |
| showTrigger | boolean | — | true |
| showClear | boolean | — | false |

## Sizes (trigger/input)

| Value | Height | Font size | Tailwind |
|---|---|---|---|
| large | 40px | 14px / 20px | `tw-h-10 tw-text-lg` |
| default | 32px | 12px / 18px | `tw-h-8 tw-text-base` |
| small | 28px | 12px / 18px | `tw-h-7 tw-text-base` |

## Token Mapping — Input/Trigger

| Element | State | ToolJet token | Tailwind class |
|---|---|---|---|
| background | default | `--background-surface-layer-01` | `tw-bg-background-surface-layer-01` |
| border | default | `--border-default` | `tw-border-border-default` |
| border | hover | `--border-strong` | `hover:tw-border-border-strong` |
| text | default | `--text-default` | `tw-text-text-default` |
| placeholder | default | `--text-placeholder` | `placeholder:tw-text-text-placeholder` |
| shadow | default | `--elevation-000` | `tw-shadow-elevation-000` |
| focus ring | focus | `--interactive-focus-outline` | `focus:tw-ring-2 focus:tw-ring-[var(--interactive-focus-outline)] focus:tw-ring-offset-1` |
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

## Token Mapping — Empty

| Element | Token | Tailwind class |
|---|---|---|
| text | `--text-placeholder` | `tw-text-text-placeholder` |
| padding | — | `tw-py-6` |
| alignment | center | `tw-text-center` |

## Slots

- search icon (leading, optional, `ReactNode`) — defaults to `Search` from lucide
- clear button (trailing, optional) — controlled via `showClear` prop
- chevron trigger (trailing, optional) — controlled via `showTrigger` prop
- leading icon on items (optional, `ReactNode`) — via children composition

## States

| State | Trigger | Notes |
|---|---|---|
| default | normal appearance | — |
| hover | `--border-strong` border | — |
| focus | focus ring | — |
| disabled | muted bg, text, no border | `pointer-events-none` |
| readOnly | normal appearance, no typing | input is not editable, dropdown still works |
| loading | spinner replaces chevron | replaces trigger icon with Spinner |
| error | red border + bg | via `aria-invalid="true"` |

## CVA Shape

Shape C — sizes only (no variant axis). States handled via CSS pseudo-classes and aria attributes.

## Composition

### Basic
```jsx
<Combobox>
  <ComboboxInput placeholder="Search..." />
  <ComboboxContent>
    <ComboboxList>
      <ComboboxItem value="react">React</ComboboxItem>
      <ComboboxItem value="vue">Vue</ComboboxItem>
      <ComboboxItem value="svelte">Svelte</ComboboxItem>
    </ComboboxList>
    <ComboboxEmpty>No results found.</ComboboxEmpty>
  </ComboboxContent>
</Combobox>
```

### With Field
```jsx
<Field>
  <FieldLabel>Framework</FieldLabel>
  <Combobox>
    <ComboboxInput placeholder="Search frameworks..." />
    <ComboboxContent>
      <ComboboxList>
        <ComboboxItem value="react">React</ComboboxItem>
        <ComboboxItem value="vue">Vue</ComboboxItem>
      </ComboboxList>
      <ComboboxEmpty>No results found.</ComboboxEmpty>
    </ComboboxContent>
  </Combobox>
</Field>
```

### With clear and groups
```jsx
<Combobox>
  <ComboboxInput placeholder="Select country..." showClear />
  <ComboboxContent>
    <ComboboxList>
      <ComboboxGroup>
        <ComboboxLabel>Americas</ComboboxLabel>
        <ComboboxItem value="us">United States</ComboboxItem>
        <ComboboxItem value="ca">Canada</ComboboxItem>
      </ComboboxGroup>
      <ComboboxSeparator />
      <ComboboxGroup>
        <ComboboxLabel>Europe</ComboboxLabel>
        <ComboboxItem value="uk">United Kingdom</ComboboxItem>
        <ComboboxItem value="de">Germany</ComboboxItem>
      </ComboboxGroup>
    </ComboboxList>
    <ComboboxEmpty>No countries found.</ComboboxEmpty>
  </ComboboxContent>
</Combobox>
```

## Notes

- Trigger chevron: `ChevronDown` (lucide) — same as Select.
- Search icon: `Search` (lucide) — shown as leading icon inside input.
- Clear button: `X` (lucide) — shown when `showClear` is true and a value is selected.
- Loading state replaces the chevron trigger with a `Spinner` component.
- readOnly allows opening the dropdown to see options but prevents typing to filter.
- Multi-select (chips) support deferred to v2 — shadcn primitive supports it via `ComboboxChips`.
- Empty state shown when filter query matches no items.
