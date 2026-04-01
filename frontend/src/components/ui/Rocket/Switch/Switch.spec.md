# Switch — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=93-52599 -->
<!-- synced: 2026-03-25 -->

## Overview

Toggle switch component for binary on/off states. Single-part component (Shape D) wrapping shadcn Switch primitive (Radix `@radix-ui/react-switch`). No visual variants, no size variants — token overrides only.

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| disabled | boolean | — | false |

## States

| State | Behaviour |
|---|---|
| unchecked (default) | Off appearance — neutral track |
| checked | On appearance — accent track, thumb slides right |
| disabled | Reduced opacity, no pointer events |
| focus-visible | Focus ring |

## Token Mapping

| Element | State | ToolJet token | Tailwind class |
|---|---|---|---|
| track bg | unchecked | switch-tag | tw-bg-switch-tag |
| track bg | checked | switch-background-on | data-[state=checked]:tw-bg-switch-background-on |
| thumb bg | — | switch-tab | tw-bg-switch-tab |
| track | disabled | — | disabled:tw-opacity-50 disabled:tw-cursor-not-allowed disabled:tw-pointer-events-none |
| track | focus | interactive-focus-outline | focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-1 |

## CVA Shape

Shape D — no CVA (static classes)

## Notes

- No variants or sizes — single visual appearance
- Track transitions between `switch-background-off` and `switch-background-on` on toggle
- Thumb uses `switch-tab` token (white in light, dark in dark mode)
- `tw-border-solid` required on any border elements (preflight is off)
- Radix v1 uses `data-[state=checked]` / `data-[state=unchecked]` attributes
