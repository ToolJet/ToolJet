# Tabs — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=6848-534 -->
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=7579-4973 -->
<!-- synced: 2026-03-25 -->

## Overview

Tab navigation component for switching between content panels. Compound component (Shape E) wrapping shadcn tabs primitives (Radix `@radix-ui/react-tabs`). Three visual variants (underline, underline-inverted, pill) and three sizes.

## Sub-components

| Sub-component | shadcn base | Rocket wrapper? | Notes |
|---|---|---|---|
| Tabs | Tabs (Root) | Re-export | Structural root, no styling needed |
| TabsList | TabsList (List) | Yes | Token-styled container, variant-aware |
| TabsTrigger | TabsTrigger (Trigger) | Yes | Styled tab button with variant/size/state |
| TabsContent | TabsContent (Content) | Yes | Content panel with minimal token styling |

## Props

### TabsList
| Prop | Type | Values | Default |
|---|---|---|---|
| variant | string | underline \| underline-inverted \| pill | underline |

### TabsTrigger
| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | large \| default \| small | default |
| disabled | boolean | — | false |

## Sizes

| Value | Height | Tailwind | Font |
|---|---|---|---|
| large | 40px | tw-h-10 | tw-font-body-large |
| default | 32px | tw-h-8 | tw-font-body-default |
| small | 28px | tw-h-7 | tw-font-body-small |

## States

| State | Applies to | Behaviour |
|---|---|---|
| default | TabsTrigger | Inactive tab appearance |
| hover | TabsTrigger | Background overlay or text darkens |
| active (selected) | TabsTrigger | Visually distinct — underline indicator or pill background |
| disabled | TabsTrigger | Reduced opacity, no pointer events |
| focus-visible | TabsTrigger | Focus ring |

## Token Mapping

### Underline variant

| Element | State | ToolJet token | Tailwind class |
|---|---|---|---|
| list container | — | border-weak (bottom border) | tw-border-b tw-border-solid tw-border-border-weak |
| trigger text | default | text-placeholder | tw-text-text-placeholder |
| trigger text | hover | text-default | hover:tw-text-text-default |
| trigger bg | hover | interactive-hover | hover:tw-bg-interactive-hover |
| trigger text | active | text-brand | data-[state=active]:tw-text-text-brand |
| trigger indicator | active | border-accent-strong | bottom border/pseudo-element tw-bg-border-accent-strong |
| trigger text | disabled | text-disabled | tw-text-text-disabled |
| trigger | focus | interactive-focus-outline | focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline |

### Underline-inverted variant

| Element | State | ToolJet token | Tailwind class |
|---|---|---|---|
| list container | — | border-weak (top border) | tw-border-t tw-border-solid tw-border-border-weak |
| trigger text | default | text-placeholder | tw-text-text-placeholder |
| trigger text | hover | text-default | hover:tw-text-text-default |
| trigger bg | hover | interactive-hover | hover:tw-bg-interactive-hover |
| trigger text | active | text-brand | data-[state=active]:tw-text-text-brand |
| trigger indicator | active | border-accent-strong | top border/pseudo-element tw-bg-border-accent-strong |
| trigger text | disabled | text-disabled | tw-text-text-disabled |
| trigger | focus | interactive-focus-outline | focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline |

### Pill variant

| Element | State | ToolJet token | Tailwind class |
|---|---|---|---|
| list container | — | background-surface-layer-02 | tw-bg-background-surface-layer-02 tw-rounded-lg tw-p-1 |
| trigger text | default | text-placeholder | tw-text-text-placeholder |
| trigger text | hover | text-default | hover:tw-text-text-default |
| trigger bg | hover | interactive-hover | hover:tw-bg-interactive-hover |
| trigger bg | active | switch-tab | data-[state=active]:tw-bg-switch-tab |
| trigger text | active | text-default | data-[state=active]:tw-text-text-default |
| trigger shadow | active | elevation-100 | data-[state=active]:tw-shadow-elevation-100 |
| trigger text | disabled | text-disabled | tw-text-text-disabled |
| trigger | focus | interactive-focus-outline | focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline |

## Slots

- icon (optional, `ReactNode`) — leading icon inside TabsTrigger, rendered before label
- badge (optional, `ReactNode`) — trailing badge/counter inside TabsTrigger, rendered after label

## CVA Shape

Shape E — compound/multi-part
- TabsList: CVA with `variant` (underline | underline-inverted | pill) — Shape B
- TabsTrigger: CVA with `size` (large | default | small) — Shape C
- Variant-specific trigger styling handled via compound variants or `data-[variant=*]` from parent list
- Tabs (root): re-export, no CVA
- TabsContent: static cn(), no CVA

## Notes

- Underline variant uses a bottom border on the list and an active indicator (bottom pseudo-element) on the trigger
- Underline-inverted variant mirrors underline but with the indicator and list border on top instead of bottom
- Pill variant uses a contained background on the list with rounded pill-shaped active triggers
- TabsTrigger receives variant context from its parent TabsList via `data-variant` attribute (already set by shadcn)
- Uses `group-data-[variant=*]/tabs-list:` modifier to style triggers differently per variant
- Typography uses plugin tokens: `tw-font-body-large`, `tw-font-body-default`, `tw-font-body-small` — never manual font combos
- Icons inside triggers should inherit text color and size via `[&_svg]:tw-size-4` pattern
- Badges are passed as children after the label text — no special wrapper needed
- `tw-border-solid` required on all border elements (preflight is off)
