# Collapsible — Rocket Design Spec
<!-- figma: https://www.figma.com/design/lOW96V8fTBx9J6yolOLhdC/01-Dashboards---Applications?node-id=4216-38603 -->
<!-- synced: 2026-04-01 -->

## Overview

Collapsible is a disclosure component — a trigger row that expands/collapses hidden content. Used inside modals, settings panels, and detail views to group secondary information.

Wraps Radix Collapsible primitives via shadcn.

## Props (Collapsible — root)

| Prop | Type | Values | Default |
|---|---|---|---|
| variant | string | bordered \| ghost | bordered |
| defaultOpen | boolean | — | false |
| open | boolean | — | — |
| onOpenChange | function | — | — |

## Sub-components

| Component | Wraps | Styling |
|---|---|---|
| `Collapsible` | Radix Collapsible.Root | variant CVA (bordered vs ghost) |
| `CollapsibleTrigger` | Radix Trigger (re-export) | none — consumer styles the trigger content |
| `CollapsibleContent` | Radix Content | padding, animated height |

## Token Mapping

| Element | Variant | State | ToolJet class |
|---|---|---|---|
| root container | bordered | default | `tw-border-solid tw-border tw-border-border-weak tw-rounded-lg` |
| root container | ghost | default | no border, no bg |
| trigger row | all | default | `tw-flex tw-items-center tw-justify-between tw-w-full tw-cursor-pointer` |
| trigger row | bordered | default | `tw-px-4 tw-py-3` |
| trigger row | ghost | default | `tw-py-2` |
| trigger text | all | default | `tw-font-title-default tw-text-text-default` |
| trigger chevron | all | default | `tw-text-icon-default tw-size-4` |
| trigger chevron | all | open | `tw-rotate-180` (via data-[state=open]) |
| content area | bordered | default | `tw-px-4 tw-pb-3` |
| content area | ghost | default | `tw-py-2` |
| content text | all | default | `tw-font-body-default tw-text-text-default` |

## Slots

- trigger (required, `ReactNode`) — the clickable header content (label, count badge, etc.)
- children (required, `ReactNode`) — the collapsible content area

## CVA Shape

Shape B — variants only (`bordered` | `ghost`). No sizes.

## Usage Pattern

```jsx
<Collapsible variant="bordered">
  <CollapsibleTrigger>
    <span>Missing user groups (5)</span>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <p>Group 1, Group 2, Group 3, Group 4, Group 5</p>
  </CollapsibleContent>
</Collapsible>
```

## Notes

- Radix handles open/close state, keyboard (Enter/Space), and aria-expanded automatically.
- The chevron rotation is handled via `data-[state=open]:tw-rotate-180` on the icon inside the trigger. Since the trigger is consumer-composed, Rocket provides a `CollapsibleIcon` helper that auto-rotates.
- Animated height transition on CollapsibleContent via `tw-overflow-hidden` + CSS `grid-template-rows` animation (same pattern as shadcn accordion).
- Typography uses `tw-font-*` plugin utilities.
