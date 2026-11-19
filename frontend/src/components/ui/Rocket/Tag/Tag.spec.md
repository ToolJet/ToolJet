# Tag — Rocket Design Spec

<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-atoms?node-id=11411-21722 -->
<!-- synced: 2026-11-17 -->

## Overview

Pill for filters, labels, status and multi-select items. 20px tall, radius full, label `title/small` (Inter Medium 11/16, -0.22px). Built by hand (no shadcn primitive): shadcn's badge has no remove or loading part.

## Props

| Prop                           | Type         | Values                                               | Default                           |
| ------------------------------ | ------------ | ---------------------------------------------------- | --------------------------------- |
| variant                        | string       | solid \| background \| outline \| warning \| neutral | solid                             |
| prefix                         | ReactNode    | muted text before the label ("On update RESTRICT")   | —                                 |
| leadingVisual / trailingVisual | ReactNode    | 12px icon                                            | —                                 |
| removable                      | boolean      | shows the close button                               | false                             |
| onRemove                       | `() => void` | —                                                    | —                                 |
| removeLabel                    | string       | accessible name of the close button                  | "Remove {label}" for a text label |
| onClick                        | handler      | makes the tag clickable                              | — (static)                        |
| disabled                       | boolean      | —                                                    | false                             |
| loading                        | boolean      | spinner before the label, non-interactive            | false                             |

Figma "State" is not a prop: Static = no `onClick`; Rest/Hover/Pressed/Focused = CSS on a clickable tag; Disabled and Loading are props.

## Behaviour

- Static (no `onClick`) has no hover or pressed look.
- The remove button is a sibling of the clickable part, never nested in it (no button-in-button).
- Disabled and loading disable both buttons.
- Focus: 2px ring `interactive/focus-outline` around the whole pill when either button has keyboard focus.
- Long labels are truncated by the caller; the label span truncates inside `max-w-full`.

## Token Mapping

| Variant    | Fill                                         | Label           | Prefix                   | Remove icon     | Hover / pressed                                                      |
| ---------- | -------------------------------------------- | --------------- | ------------------------ | --------------- | -------------------------------------------------------------------- |
| solid      | `tw-bg-button-primary`                       | `text-on-solid` | `text-disabled-on-solid` | `icon-on-solid` | `button-primary-hover` / `-pressed`                                  |
| background | `tw-bg-tag-weak`                             | `text-accent`   | `text-placeholder`       | `icon-brand`    | `tag-weak-hover` / `-pressed`                                        |
| outline    | `tw-bg-button-secondary` + 1px `border-weak` | `text-default`  | `text-placeholder`       | `icon-default`  | `button-outline-hover` + `border-default` / `button-outline-pressed` |
| warning    | `background-warning-weak`                    | `text-warning`  | `text-placeholder`       | `icon-warning`  | `interactive-hover` / `interactive-selected` stacked over the fill   |
| neutral    | `interactive-default`                        | `text-disabled` | `text-disabled`          | `icon-default`  | same stacking                                                        |

Disabled: solid and background → `button-primary-disabled` fill; outline, warning and neutral → `button-outline-disabled` fill, `border-weak`, `text-disabled`.

New tokens (`componentdesign.scss`, `tailwind.config.js`): `tag-weak`, `tag-weak-hover`, `tag-weak-pressed`. Light values are from Figma (#ECF0FE / #DEE5FE / #C4D0F9). Dark values are **provisional**: weak and hover reuse the dark `button-secondary-hover` / `-pressed` pair, pressed (#2B49A8) is a guess until the Figma dark mode values are read.

## CVA Shape

Shape B — variants only (`variant`, plus internal `interactive` and `disabled` flags for compound states).

## Notes

- Used by the TJDB data toolbar for filter chips (outline, removable) and the "+N more" chip (outline, clickable, chevron).
