# LinkButton — Rocket Design Spec

<!-- figma: Link button 33:1444 in https://www.figma.com/design/QHALzSYm32CKAZdjr2gBiF/Rocket---TJDB (node not readable over MCP; values below come from its instance in the Data toolbar, 34:502) -->
<!-- synced: 2026-11-17 -->

## Overview

Ghost, underlined text action for inline links ("Clear all filters", "View details"). Use it instead of Button when the action should read as a link.

## Props

| Prop                           | Type                | Default |
| ------------------------------ | ------------------- | ------- |
| danger                         | boolean             | false   |
| disabled, onClick, children, … | native button props | —       |

Figma also has `size`, leading/trailing visuals and a loading state. Not built: the toolbar uses one small instance. Add them when a second caller needs them.

## Measurements

Padding 6px × 3px, radius `default` (6px), gap 6px, label `title/small` (Inter Medium 11/16, -0.22px), underlined.

## Token Mapping

| Element    | State           | Class                                                                                                         |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| label      | default         | `tw-text-text-accent`                                                                                         |
| label      | danger          | `tw-text-text-danger`                                                                                         |
| label      | disabled        | `tw-text-text-disabled`                                                                                       |
| background | hover / pressed | `hover:tw-bg-interactive-hover` / `active:tw-bg-interactive-selected` (assumed ghost wash, not in the export) |
| focus      | keyboard        | 2px `interactive-focus-outline` ring                                                                          |

## CVA Shape

Shape B — one variant (`danger`).
