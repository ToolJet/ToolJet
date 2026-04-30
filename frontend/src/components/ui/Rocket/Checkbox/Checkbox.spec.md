# Checkbox — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=93-52292 -->
<!-- synced: 2026-04-07 -->

## Overview

Binary input control. Wraps Radix Checkbox via shadcn. Supports `checked`, `indeterminate`, and `disabled` states. Sized via context-free `size` prop.

Label is **not** baked in — consumers compose `<label>` + `<Checkbox>` themselves.

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | large \| default | default |
| checked | boolean \| 'indeterminate' | — | false |
| disabled | boolean | — | false |
| className | string | — | — |

Plus standard Radix Checkbox props (`onCheckedChange`, `name`, `value`, `required`, `defaultChecked`).

## Sizes

| Value | Box | Border radius | Check icon |
|---|---|---|---|
| default | 16px (`tw-size-4`) | 5px (`tw-rounded-[5px]`) | 10px |
| large | 20px (`tw-size-5`) | 7px (`tw-rounded-[7px]`) | 12px |

## Token Mapping

| Element | State | Figma token | ToolJet class |
|---|---|---|---|
| bg | unchecked | `--bg-surface-layer-01` | `tw-bg-background-surface-layer-01` |
| border | unchecked | `border/default` | `tw-border-solid tw-border tw-border-border-default` |
| bg | checked / indeterminate | `button/primary` | `data-[state=checked]:tw-bg-button-primary data-[state=indeterminate]:tw-bg-button-primary` |
| border | checked / indeterminate | `button/primary` | `data-[state=checked]:tw-border-button-primary data-[state=indeterminate]:tw-border-button-primary` |
| icon (check / minus) | checked / indeterminate | `icon/on-solid` | `tw-text-text-on-solid` |
| bg | disabled | `controls/base-inactive` | `disabled:tw-bg-controls-base-inactive disabled:tw-border-transparent` |
| icon | disabled | (muted) | `disabled:tw-text-icon-default` |
| focus ring | focused | `interactive/focusActive` | `focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-1` |
| cursor | disabled | — | `disabled:tw-cursor-not-allowed` |
| opacity | disabled | — | `disabled:tw-opacity-50` (only on icon — bg uses its own disabled token) |

## CVA Shape

Shape C — sizes only (no variants).

## Notes

- Wraps Radix `Checkbox.Root` + `Checkbox.Indicator` via shadcn.
- **Indeterminate** state set via `checked="indeterminate"` (Radix native). Renders a `MinusIcon` instead of `CheckIcon`. Determined inside the `Indicator` via `data-state`.
- Focus ring uses `tw-ring-offset-1` so the ring sits just outside the box border (matches Figma's 2px outer ring).
- Border radius is intentionally per-size — `5px` for default and `7px` for large match Figma exactly (not standard `tw-rounded-md`).
- Disabled state: bg becomes `controls-base-inactive` (subtle gray), border removed (transparent), icon muted. Both checked and unchecked disabled states use the same bg.
- Consumer composes the label: `<label className="tw-flex tw-items-center tw-gap-2"><Checkbox /> <span>Label</span></label>`.
- Typography (for the label text) is the consumer's responsibility — `tw-font-body-default` is the typical choice.
