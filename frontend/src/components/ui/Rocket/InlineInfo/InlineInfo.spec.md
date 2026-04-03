# InlineInfo — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=8802-5649 -->
<!-- synced: 2026-03-16 -->

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| type | string | info \| warning \| danger | info |
| variant | string | ghost \| secondary \| outline \| filled | ghost |
| title | ReactNode | — | — |
| description | ReactNode | — | — |
| action | ReactNode | — | — |
| icon | ReactNode | custom icon override | auto per type |
| className | string | — | — |

## Layout

```
[icon 18×18]  [content]
               ├── title (12px medium, text/medium)
               ├── description (12px regular, text/placeholder) — optional
               └── action slot — optional
```

- Root: `flex`, `gap-1.5` (6px)
- Content: `flex-col`, `gap-2` (8px)
- Icon is 18×18, shrink-0, top-aligned

## Token Mapping

### Type → icon color

| Type | Figma token | ToolJet class |
|---|---|---|
| info | icon/accent | tw-text-icon-accent |
| warning | icon/warning | tw-text-icon-warning |
| danger | icon/danger | tw-text-icon-danger |

### Variant → container style

| Variant | Figma token | ToolJet class | Extra |
|---|---|---|---|
| ghost | — | (no bg) | no padding, no radius |
| secondary | Interactive/default | tw-bg-interactive-default | tw-p-3 tw-rounded-md |
| outline | --bg-surface-layer-01 | tw-bg-background-surface-layer-01 | tw-p-3 tw-rounded-md tw-shadow-elevation-100 |
| filled + info | --bg-accent-weak | tw-bg-background-accent-weak | tw-p-3 tw-rounded-md |
| filled + warning | background/warning-weak | tw-bg-background-warning-weak | tw-p-3 tw-rounded-md |
| filled + danger | background/error-weak | tw-bg-background-error-weak | tw-p-3 tw-rounded-md |

### Text

| Element | Figma token | ToolJet class |
|---|---|---|
| title | text/medium | tw-text-text-medium tw-font-medium |
| description | text/placeholder | tw-text-text-placeholder |

Both 12px / 18px line-height → tw-text-base (maps to 12px in ToolJet config)

## Default icons

| Type | Icon (lucide) |
|---|---|
| info | `AlertCircle` or `Info` |
| warning | `AlertTriangle` |
| danger | `AlertTriangle` |

Icon size: 18px (matches Figma's 18×18 frame).

## CVA Shape

Shape B — variants only (type + variant), no sizes

Uses `filled` variant with type-specific bg applied dynamically.

## Notes

- Uses shadcn Alert as structural base (`role="alert"` for accessibility). AlertTitle and AlertDescription used for sub-content.
- `action` slot accepts any ReactNode — typically a `<Button variant="outline" size="medium">` per Figma.
- Icon auto-selects per `type` prop but can be overridden via `icon` prop.
- `variant="ghost"` has no padding/radius — inline appearance.
- All other variants get `tw-p-3 tw-rounded-md`.
