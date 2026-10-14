# ToggleGroup — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=7406-50531 -->
<!-- synced: 2026-03-18 -->

## Props

### ToggleGroup (container)

| Prop | Type | Values | Default |
|---|---|---|---|
| type | string | single \| multiple | single |
| size | string | large \| default \| medium \| small | default |
| value | string \| string[] | controlled | — |
| defaultValue | string \| string[] | uncontrolled default | — |
| onValueChange | function | callback | — |
| disabled | boolean | — | false |
| className | string | — | — |

### ToggleGroupItem

| Prop | Type | Values | Default |
|---|---|---|---|
| value | string | item identifier (required) | — |
| size | string | large \| default \| medium \| small | inherits from group |
| disabled | boolean | — | false |
| className | string | — | — |
| children | ReactNode | text label or icon | — |

## Layout

```
┌─ container (grey pill, 2px padding, rounded-md) ──────────────────┐
│ [active item ▪ white bg + shadow]  [inactive]  [inactive]  [inactive] │
└───────────────────────────────────────────────────────────────────┘
```

- Container: `tw-bg-interactive-default`, `tw-p-0.5`, `tw-rounded-md`
- Items: `tw-rounded-[5px]`, padding varies by size
- Icon size: 18×18

## Sizes

| Value | Item height | Tailwind |
|---|---|---|
| large | 36px | tw-h-9 tw-px-2.5 tw-text-lg |
| default | 28px | tw-h-7 tw-px-1.5 tw-text-base |
| medium | 24px | tw-h-6 tw-px-1.5 tw-text-base |
| small | 20px | tw-h-5 tw-px-1 tw-text-sm |

Size is set on ToggleGroup and flows to items via React context. Items can override individually.

## Token Mapping

### Container

| Element | Figma token | ToolJet class |
|---|---|---|
| background | Interactive/default | tw-bg-interactive-default |
| padding | 2px | tw-p-0.5 |
| border-radius | 6px | tw-rounded-md |

### Item — active (data-[state=on])

| Element | Figma token | ToolJet class |
|---|---|---|
| background | --bg-surface-layer-01 | data-[state=on]:tw-bg-background-surface-layer-01 |
| shadow | Elevations/100 | data-[state=on]:tw-shadow-elevation-100 |
| text color | text/default | data-[state=on]:tw-text-text-default |
| icon color | icon/strong | data-[state=on]:tw-text-icon-strong |

### Item — inactive

| Element | Figma token | ToolJet class |
|---|---|---|
| background | — | tw-bg-transparent |
| text color | text/disabled | tw-text-text-disabled |
| icon color | icon/weak | tw-text-icon-weak |

## CVA Shape

Shape C — sizes only, no visual variants. CVA on items with size variants.

## Notes

- Segmented control pattern — NOT independent toggle buttons.
- Uses shadcn ToggleGroup as structural base (Radix `@radix-ui/react-toggle-group` — manages selection state, keyboard nav, aria).
- Single visual style — no ghost/outline variants. The container always has the grey pill appearance.
- Active item styling is driven by Radix `data-[state=on]` attribute.
- Inner border-radius is 5px (container 6px minus 2px padding = logical 4px, but Figma uses 5px explicitly).
- Font: 12px / 18px line-height, IBM Plex Sans Medium — `tw-text-base tw-font-medium`.
