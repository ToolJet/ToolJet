# Button — Rocket Design Spec
<!-- figma text set:      https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-atoms?node-id=4930-11540 -->
<!-- figma icon-only set: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-atoms?node-id=4957-23693 -->
<!-- figma overview:      https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-atoms?node-id=5263-7313 -->
<!-- synced: 2026-10-15 -->

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| variant | string | primary \| secondary \| ghost \| ghostBrand \| outline | primary |
| size | string | large \| default \| medium \| small | default |
| danger | boolean | see [Danger](#danger) | false |
| iconOnly | boolean | — | false |
| disabled | boolean | — | false |
| loading | boolean | — | false |
| type | string | button \| submit \| reset | button |
| leadingVisual | ReactNode | icon element | — |
| trailingVisual | ReactNode | icon element | — |
| children | ReactNode | label text (or the icon when `iconOnly`) | — |
| asChild | boolean | render delegation via Slot | false |

## Sizes

### Text

| Size | Height | Padding x | Gap | Radius | Icon | Typography |
|---|---|---|---|---|---|---|
| large | 40 `tw-h-10` | 20 `tw-px-5` | 8 `tw-gap-2` | 10 `tw-rounded-large` | 20 | `tw-font-title-large` (Inter 14/20) |
| default | 32 `tw-h-8` | 12 `tw-px-3` | 6 `tw-gap-1.5` | 6 `tw-rounded-default` | 16 | `tw-font-title-default` (Inter 12/18) |
| medium | 28 `tw-h-7` | 10 `tw-px-2.5` | 6 `tw-gap-1.5` | 6 `tw-rounded-default` | 14 | `tw-font-title-default` (Inter 12/18) |
| small | 20 `tw-h-5` | 8 `tw-px-2` | 4 `tw-gap-1` | 4 `tw-rounded-sm` | 12 | `tw-font-title-small` (Inter 11/16) |

### Icon-only

Square box with no horizontal padding. Figma's padding (10/8/7/4) is just the inset of the centred icon.

| Size | Box | Radius | Icon |
|---|---|---|---|
| large | 40 `tw-w-10` | 10 `tw-rounded-large` | 20 |
| default | 32 `tw-w-8` | **8** `tw-rounded-medium` | 16 |
| medium | 28 `tw-w-7` | 6 `tw-rounded-default` | 14 |
| small | 20 `tw-w-5` | 4 `tw-rounded-sm` | 12 |

Icon size is set with `[&_svg]:tw-size-*`, so it overrides any size class a caller puts on the icon.

## Colours

| Variant | Background | Border | Label | Icon (text button) | Icon (icon-only) | Shadow |
|---|---|---|---|---|---|---|
| primary | `button-primary` | — | `text-on-solid` | inherits | inherits | elevation-100 |
| secondary | `button-secondary` | `border-accent-weak` | `text-default` | `icon-brand` | `icon-brand` | elevation-100 |
| outline | `button-outline` | `border-weak` | `text-default` | `icon-default` | `icon-strong` | elevation-100 |
| ghost | transparent | — | `text-default` | `icon-default` | `icon-strong` | none |
| ghostBrand | transparent | — | `text-brand` | inherits | inherits | none |

### Hover / pressed

| Variant | Background (hover / pressed) | Border (hover and pressed) |
|---|---|---|
| primary | `button-primary-hover` / `-pressed` | — |
| secondary | `button-secondary-hover` / `-pressed` | `border-accent-strong` |
| outline | `button-outline-hover` / `-pressed` | `border-default` |
| ghost | `button-outline-hover` / `-pressed` | — |
| ghostBrand | `button-secondary-hover` / `-pressed` | — |

### Focus

- **All variants:** 2px `interactive-focus-outline` ring, flush with the edge (no offset).
- **Primary (and primary + danger):** also a 2px inset ring in `interactive-focus-inner-shadow`, which separates the outline from the solid fill.
- **Known Figma inconsistency:** on text buttons, Figma also puts the inset ring on secondary + danger and ghostBrand. On icon-only buttons it doesn't. Those fills are the same colour as the inset ring, so it's only applied to primary.

## Danger

| Shape | Supported variants |
|---|---|
| Text | primary, secondary |
| Icon-only | primary, secondary, ghost |

On any other variant, `danger` has no visual effect, and in development a `console.warn` suggests a supported variant. Figma's guidance is to use secondary + danger instead.

| Combination | Rest | Hover / pressed | Disabled background |
|---|---|---|---|
| primary + danger | `button-danger-primary`, `text-on-solid` | `button-danger-primary-hover` / `-pressed` | `button-danger-primary-disabled` (label stays on-solid; known low-contrast gap in Figma) |
| secondary + danger | `button-secondary`, `border-danger-weak`, `text-default` label, `icon-danger` icon | `button-danger-secondary-hover` / `-pressed`, border `border-danger-strong` | `button-danger-secondary-disabled` |
| ghost + danger (icon-only) | transparent, `icon-danger` | `button-danger-secondary-hover` / `-pressed` | transparent |

## Disabled

All variants drop the shadow. No opacity is applied; the shadcn `disabled:tw-opacity-50` is cancelled.

| Variant | Background | Border | Label | Icon |
|---|---|---|---|---|
| primary | `button-primary-disabled` | — | `text-disabled-on-solid` | inherits |
| secondary | `button-secondary-disabled` | `border-weak` | `text-disabled` | `icon-disabled` |
| outline | `button-outline-disabled` | `border-weak` | `text-disabled` | `icon-disabled` |
| ghost / ghostBrand | transparent | — | `text-disabled` | `icon-disabled` |

Colored `<img>` visuals get `grayscale`.

## Loading

- **Look:** same tokens as disabled.
- **Content:** label and visuals stay in layout at `opacity: 0`, so the width never changes and the accessible name stays.
- **Spinner:** `lucide-react` `Loader`, absolutely centred, sized like the icon for that button size. Colour is `icon-on-solid` on primary and `icon-disabled` on every other variant.
- **Behaviour:** the button stays focusable (`aria-disabled`, not native `disabled`). Clicks are swallowed with `preventDefault`, which also stops form submission. `aria-busy="true"` is set.

## Accessibility

- **`type`:** defaults to `"button"`, so a Button inside a `<form>` doesn't submit it unless `type="submit"` is passed. Not set when `asChild`.
- **Icon-only name:** needs `aria-label` or `aria-labelledby`; a dev warning fires otherwise.
- **Disabled styling:** `disabled` sets both native `disabled` and `aria-disabled`. All inactive styling keys off `aria-disabled`, so disabled and loading share one set of classes.
- **Focus ring:** `interactive-focus-outline`, 2px, 1px offset, on `:focus-visible`.

## Implementation notes

- **Base:** the shadcn Button provides the structure (Slot/asChild, forwardRef). Rocket CVA overrides its styling through `cn()` (tailwind-merge).
- **Stacking order:** state-on-button rules for icons must be written `[&_svg]:aria-disabled:…` (giving `.btn[aria-disabled] svg`). The reverse order, `aria-disabled:[&_svg]:…`, compiles to `.btn svg[aria-disabled]` and never matches.
- **Radius tokens:** `tw-rounded-default` (6), `tw-rounded-medium` (8) and `tw-rounded-large` (10) map to `--radius-default`, `--radius-medium` and `--radius-large`. They are registered in `cn()` (`src/lib/utils.js`) because tailwind-merge only recognises t-shirt keys, and would otherwise keep shadcn's `tw-rounded-md` alongside them.
- **Font precedence:** shadcn's `tw-text-sm` stays in the class list, but the `tw-font-title-*` plugin utilities are emitted after it, so their size and line-height win.
