# RadioGroup — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=93-52292 -->
<!-- synced: 2026-04-07 -->

## Overview

Single-selection group of radio inputs. Wraps Radix RadioGroup via shadcn. The visual design mirrors Checkbox but uses circular shapes — same sizes, same color tokens, same focus/disabled states.

Two sub-components:
- `RadioGroup` — group container, manages selection state
- `RadioGroupItem` — individual radio circle

Label is **not** baked in — consumers compose `<label>` + `<RadioGroupItem>`.

## Props

### RadioGroup

| Prop | Type | Default |
|---|---|---|
| value | string | — |
| defaultValue | string | — |
| onValueChange | function | — |
| disabled | boolean | false |
| name | string | — |
| className | string | — |

### RadioGroupItem

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | large \| default | default |
| value | string (required) | — | — |
| disabled | boolean | — | false |
| className | string | — | — |

## Sizes

| Value | Box | Inner dot |
|---|---|---|
| default | 16px (`tw-size-4`) | small filled circle |
| large | 20px (`tw-size-5`) | small filled circle |

## Token Mapping

| Element | State | Figma token | ToolJet class |
|---|---|---|---|
| bg | unchecked | `--bg-surface-layer-01` | `tw-bg-background-surface-layer-01` |
| border | unchecked | `border/default` | `tw-border-solid tw-border tw-border-border-default` |
| bg | checked | `button/primary` | `data-[state=checked]:tw-bg-button-primary` |
| border | checked | `button/primary` | `data-[state=checked]:tw-border-button-primary` |
| inner dot | checked | `icon/on-solid` (white) | `tw-bg-text-on-solid` |
| bg | disabled | `controls/base-inactive` | `disabled:tw-bg-controls-base-inactive disabled:tw-border-transparent` |
| focus ring | focused | `interactive/focusActive` | `focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-2` |
| cursor | disabled | — | `disabled:tw-cursor-not-allowed` |

## CVA Shape

Shape C — sizes only, applied to `RadioGroupItem`.

## Notes

- Wraps Radix `RadioGroup.Root` + `RadioGroup.Item` + `RadioGroup.Indicator` via shadcn.
- Both circular: `tw-rounded-full` for default and large.
- Inner dot rendered via `<RadioGroup.Indicator>` containing a smaller filled circle.
- Inner dot size: `tw-size-1.5` (6px) for default, `tw-size-2` (8px) for large.
- `RadioGroup` wrapper provides selection state via Radix context — items must be wrapped in a `RadioGroup`.
- Disabled state: bg becomes `controls-base-inactive` (subtle gray), border removed (transparent).
- Same token tokens as Checkbox — consistent UX across binary controls.
- Consumer composes label: `<label className="tw-flex tw-items-center tw-gap-2"><RadioGroupItem value="x" /> <span>Label</span></label>`.
