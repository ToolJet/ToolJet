# EnvironmentSwitcher — Rocket Design Spec
<!-- figma: https://www.figma.com/design/Qbsk9zjX1MtrNRGZmZy09U/Dashboards--Sep-2026?node-id=4928-79378 -->
<!-- synced: 2026-11-17 -->

## Overview

Compact outline button that shows the current environment and opens a menu to switch it. Controlled and presentational: it knows nothing about stores or routes. Pages feed it options and handle the change (see `_ui/Header/HeaderEnvironmentSelect.tsx`, which binds it to the header).

Trigger: `● 0005 | Development` (status dot, optional meta, 1px divider, label). Menu: one single-select row per option (accent tick on the current one, status dot, label, `meta` at the end), then an optional footer row after a divider (label, arrow).

Built from Rocket `Button` (outline, medium), `DropdownMenu`, `Tooltip` and `StatusDot`.

## Props

| Prop | Type | Default |
|---|---|---|
| options | `EnvironmentSwitcherOption[]` | required |
| value | `string \| undefined` (option id; undefined while options load) | required |
| onValueChange | `(id: string) => void` | required |
| footerAction | `{ label, onSelect }` — a row under the options, e.g. "View migration history"; not an environment | — |
| disabled | boolean | false |
| tooltip | `ReactNode` — shown on trigger hover and focus | — |
| className | string (trigger) | — |

`EnvironmentSwitcherOption`: `id`, `label`, `tone` (StatusDot tone, default neutral), `meta` (node: the number shown in the trigger while this option is current, and at the end of its menu row), `disabled`, `disabledReason` (tooltip on the disabled row).

## States (Figma 🖱️ state)

| State | How |
|---|---|
| rest | outline Button, `tw-shadow-elevation-100` |
| hover | Button outline hover |
| focus | Button focus ring |
| disabled | `disabled` prop, Button disabled |
| pressed | menu open: `data-[state=open]` uses the outline pressed fill |

## Token Mapping

| Element | ToolJet class |
|---|---|
| trigger | Button `variant="outline" size="medium"` + `tw-shadow-elevation-100` |
| meta text | `tw-font-title-default tw-text-text-default` |
| divider | `tw-h-4 tw-w-px tw-bg-border-default` |
| menu | DropdownMenu default (radius large, `tw-border-border-weak`), group `tw-p-2` |

## CVA Shape

Shape E — composed from Rocket parts, no CVA of its own.

## Notes

- No trailing chevron: the Figma trigger has none.
- Selecting the current option is a no-op, so the menu cannot end up with nothing selected.
- Dismissing the menu hands focus back to the trigger. The tooltip stays off from then until the pointer re-enters or focus leaves, so it does not pop open on its own.
- Loading and overflow are N/A in the design: switching is immediate and names are short.
