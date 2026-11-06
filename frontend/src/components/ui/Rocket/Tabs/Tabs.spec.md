# Tabs — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=6848-534 -->
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=7579-4973 -->
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-atoms?node-id=11752-240 -->
<!-- synced: 2026-10-13 -->

## Overview

Tab navigation component for switching between content panels. Compound component (Shape E) wrapping shadcn tabs primitives (Radix `@radix-ui/react-tabs`). Two variants (underline, underline-inverted — Figma `bottom` / `top`) and three sizes.

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
| variant | string | underline \| underline-inverted | underline |

### TabsTrigger
| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | large \| default \| small | default |
| disabled | boolean | — | false |
| leadingVisual | ReactElement | single icon element | — |

## Sizes

| Value | Height | Tailwind | Font |
|---|---|---|---|
| large | 40px | tw-h-10 | tw-font-title-large |
| default | 32px | tw-h-8 | tw-font-title-default |
| small | 28px | tw-h-7 | tw-font-title-small |

## States

| State | Applies to | Behaviour |
|---|---|---|
| default | TabsTrigger | Inactive tab appearance |
| hover | TabsTrigger | Inset rounded background; text unchanged |
| active (selected) | TabsTrigger | Accent indicator, default text, accent icon |
| disabled | TabsTrigger | Disabled text and icon, no pointer events |
| focus-visible | TabsTrigger | Focus ring |

## Token Mapping

### Underline variant

| Element | State | ToolJet token | Tailwind class |
|---|---|---|---|
| list container | — | border-weak (bottom border) | tw-border-b tw-border-solid tw-border-border-weak |
| trigger text | default | text-placeholder | tw-text-text-placeholder |
| trigger bg | hover | interactive-hover | inset rounded `before:` box, hover:before:tw-bg-interactive-hover (text stays placeholder) |
| trigger text | active | text-default | data-[state=active]:tw-text-text-default |
| trigger indicator | active | border-accent-strong | bottom border/pseudo-element tw-bg-border-accent-strong |
| trigger text | disabled | text-disabled | tw-text-text-disabled |
| trigger | focus | interactive-focus-outline | focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline |

### Underline-inverted variant

| Element | State | ToolJet token | Tailwind class |
|---|---|---|---|
| list container | — | border-weak (top border) | tw-border-t tw-border-solid tw-border-border-weak |
| trigger text | default | text-placeholder | tw-text-text-placeholder |
| trigger bg | hover | interactive-hover | inset rounded `before:` box, hover:before:tw-bg-interactive-hover (text stays placeholder) |
| trigger text | active | text-default | data-[state=active]:tw-text-text-default |
| trigger indicator | active | border-accent-strong | top border/pseudo-element tw-bg-border-accent-strong |
| trigger text | disabled | text-disabled | tw-text-text-disabled |
| trigger | focus | interactive-focus-outline | focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline |

## Slots

- leadingVisual (optional, `ReactElement`) — `leadingVisual` prop on TabsTrigger, rendered before the label through Radix `Slot`, which merges `aria-hidden` and the colour classes onto the icon itself (no wrapper node). Colour follows tab state: `tw-text-icon-weak` at rest, `tw-text-icon-accent` when selected, `tw-text-icon-disabled` when disabled (via `group-*/tab-trigger`). Label gap is 4px (`tw-gap-1`).
- badge (optional, `ReactNode`) — trailing badge/counter inside TabsTrigger, rendered after label

## Composition: trailing actions

When buttons share the row with the tabs (filter, sort, etc.), keep them **outside** `TabsList`, as siblings in a wrapper row inside `Tabs`:

- `role="tablist"` may only own `role="tab"` elements; other controls inside it break ARIA ownership and tab counts.
- Radix arrow-key roving covers triggers only; actions stay in normal Tab order (tab → actions → panel).
- Give the wrapper row the full-width border and pass `tw-border-b-0` to `TabsList` to avoid a double line.
- Label the action group (`role="group"` + `aria-label`) and every icon-only button (`aria-label`).

See the `WithActions` story.

## CVA Shape

Shape E — compound/multi-part
- TabsList: CVA with `variant` (underline | underline-inverted) — Shape B
- TabsTrigger: CVA with `size` (large | default | small) and `variant` (indicator edge); `variant` comes from TabsList via context
- Tabs (root): re-export, no CVA
- TabsContent: static cn(), no CVA

## Notes

- Underline variant uses a bottom border on the list and an active indicator (bottom pseudo-element) on the trigger
- Underline-inverted variant mirrors underline but with the indicator and list border on top instead of bottom
- TabsTrigger reads the variant from TabsList through `TabsVariantContext`
- Typography uses plugin tokens: `tw-font-title-large`, `tw-font-title-default`, `tw-font-title-small` (medium weight, Figma `title/default`) — never manual font combos
- Pass icons via `leadingVisual`, not as children, so they get the state-based icon colour; size comes from the `[&_svg]:tw-size-4` pattern
- Badges are passed as children after the label text — no special wrapper needed
- `tw-border-solid` required on all border elements (preflight is off)
