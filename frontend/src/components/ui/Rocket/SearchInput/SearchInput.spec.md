# SearchInput — Rocket Design Spec
<!-- figma: https://www.figma.com/design/Qbsk9zjX1MtrNRGZmZy09U/Dashboards--Sep-2026?node-id=4925-1670 -->
<!-- synced: 2026-11-17 -->

## Overview

Controlled single-line search field: leading search icon, text, and a clear button while there is text. Built from Rocket `InputGroup` (small, 28px), `InputGroupInput` and a ghost icon `Button`.

The field in the Tables panel is the only reference (28px, `border-default`, 6px radius, 16px leading icon, 12px placeholder). The clear button and focus ring have no mock; they reuse the `InputGroup` and `Button` styling.

## Props

| Prop | Type | Default |
|---|---|---|
| value | string | required |
| onValueChange | `(value: string) => void` | required |
| clearLabel | string (accessible name of the clear button) | "Clear search" |
| className | string (on the group) | — |
| …rest | passed to the `<input>` (`placeholder`, `aria-label`, `data-cy`, …) | — |

## Behaviour

- Reports exactly what was typed. Trimming and case-folding belong to the caller's matching rule.
- The clear button shows only while `value` is non-empty. It calls `onValueChange('')` and puts focus back in the field.
- Pass an `aria-label` (there is no visible label).

## Token Mapping

| Element | Class |
|---|---|
| group | `InputGroup size="small"` (28px, `tw-border-border-default`) |
| leading icon | lucide `Search`, `tw-size-4` (16px), `tw-text-icon-default` from the group |
| clear button | `Button variant="ghost" size="small" iconOnly` |

## CVA Shape

Shape D — no CVA, composed from Rocket parts.

## Notes

- `type="text"`, not `search`: the browser's own clear affordance on `type=search` would double up with the clear button.
