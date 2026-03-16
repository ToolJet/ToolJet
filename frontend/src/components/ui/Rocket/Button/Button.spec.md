# Button — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=4957-23692 -->
<!-- measurements: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=5773-11679 -->
<!-- synced: 2026-03-13 -->

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| variant | string | primary \| secondary \| ghost \| ghostBrand \| outline | primary |
| size | string | large \| default \| medium \| small | default |
| danger | boolean | — | false |
| disabled | boolean | — | false |
| loading | boolean | — | false |
| leadingVisual | ReactNode | icon element | — |
| trailingVisual | ReactNode | icon element | — |
| children | ReactNode | label text | — |
| asChild | boolean | render delegation via Slot | false |

## Sizes

| Value | Height | Font size | Line height | Tailwind h | Tailwind text |
|---|---|---|---|---|---|
| large | 40px | 14px | 20px | tw-h-10 | tw-text-lg |
| default | 32px | 12px | 18px | tw-h-8 | tw-text-base |
| medium | 28px | 12px | 18px | tw-h-7 | tw-text-base |
| small | 20px | 11px | 16px | tw-h-5 | tw-text-sm |

Horizontal padding per size:
- large: tw-px-4 (16px)
- default: tw-px-3 (12px)
- medium: tw-px-3 (12px)
- small: tw-px-2 (8px)

Icon gap: tw-gap-1.5 for large/default, tw-gap-1 for medium/small

## Token Mapping

| Variant | Element | State | Figma token | ToolJet class |
|---|---|---|---|---|
| primary | background | default | button/primary | tw-bg-button-primary |
| primary | background | hover | button/primary-hover | hover:tw-bg-button-primary-hover |
| primary | background | pressed | button/primary-pressed | active:tw-bg-button-primary-pressed |
| primary | background | disabled | button/primary-disabled | disabled:tw-bg-button-primary-disabled |
| primary | text + icon | all | icon/on-solid | tw-text-text-on-solid |
| primary | shadow | default | Elevations/100 | tw-shadow-elevation-100 |
| primary+danger | background | default | button/danger-primary | tw-bg-button-danger-primary |
| primary+danger | background | hover | button/danger-primary-hover | hover:tw-bg-button-danger-primary-hover |
| primary+danger | background | pressed | button/danger-primary-pressed | active:tw-bg-button-danger-primary-pressed |
| primary+danger | background | disabled | button/danger-primary-disabled | disabled:tw-bg-button-danger-primary-disabled |
| secondary | background | default | button/secondary | tw-bg-button-secondary |
| secondary | background | hover | button/secondary-hover | hover:tw-bg-button-secondary-hover |
| secondary | background | pressed | button/secondary-pressed | active:tw-bg-button-secondary-pressed |
| secondary | background | disabled | button/secondary-disabled | disabled:tw-bg-button-secondary-disabled |
| secondary | border | default | border/accent-weak | tw-border tw-border-border-accent-weak |
| secondary | text + icon | default | icon/brand | tw-text-text-brand |
| secondary | shadow | default | Elevations/100 | tw-shadow-elevation-100 |
| secondary+danger | border | default | border/danger-weak | tw-border-border-danger-weak |
| secondary+danger | text + icon | default | icon/danger | tw-text-text-danger |
| ghost | background | hover | — | hover:tw-bg-interactive-hover |
| ghost | background | pressed | — | active:tw-bg-interactive-selected |
| ghost | text + icon | default | icon/strong | tw-text-text-medium |
| ghostBrand | background | hover | — | hover:tw-bg-interactive-hover |
| ghostBrand | background | pressed | — | active:tw-bg-interactive-selected |
| ghostBrand | text + icon | default | icon/brand | tw-text-text-brand |
| outline | background | default | button/outline | tw-bg-button-outline |
| outline | background | hover | button/outline-hover | hover:tw-bg-button-outline-hover |
| outline | background | pressed | button/outline-pressed | active:tw-bg-button-outline-pressed |
| outline | border | default | border/weak | tw-border tw-border-border-weak |
| outline | text + icon | default | icon/strong | tw-text-text-medium |
| all | focus ring | focus | interactive/focus-outline | focus-visible:tw-ring-2 focus-visible:tw-ring-[var(--interactive-focus-outline)] focus-visible:tw-ring-offset-1 |
| all | cursor | disabled | — | disabled:tw-pointer-events-none disabled:tw-opacity-50 |

## Slots

- `leadingVisual` — optional `ReactNode` icon, rendered before label. Hidden when `loading=true`.
- `children` — required, label text. Hidden when `loading=true`.
- `trailingVisual` — optional `ReactNode` icon, rendered after label. Hidden when `loading=true`.
- When `loading=true`: show `<Loader2 />` (lucide-react) spinning icon centred. Replace with `<Spinner />` once Rocket Spinner component is built.

## CVA Shape

Shape A — variants + sizes

Uses CVA `compoundVariants` for the `danger` boolean modifier on primary and secondary variants.

## Notes

- Uses shadcn Button as structural base (Slot/asChild, forwardRef). All styling overridden by Rocket CVA via tailwind-merge.
- `asChild` prop enables render delegation via shadcn's built-in `@radix-ui/react-slot`.
- `danger` modifier applies to: primary (→ danger-primary tokens), secondary (→ danger border/text). Ghost, ghostBrand, outline have no danger variant in Figma.
- `loading` state: hides content, shows centred `Loader2` icon spinning. Loader2 is a stand-in until Rocket Spinner is built.
- Font: IBM Plex Sans Medium — handled by global body font, no explicit font-family class needed.
- Elevation/100 shadow on primary + secondary only (not ghost/ghostBrand/outline).
- Border radius: `tw-rounded-md` (6px) for all sizes.
