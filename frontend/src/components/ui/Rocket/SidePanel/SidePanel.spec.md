# SidePanel — Rocket Design Spec
<!-- figma: https://www.figma.com/design/Qbsk9zjX1MtrNRGZmZy09U/Dashboards--Sep-2026?node-id=4925-1659 -->
<!-- synced: 2026-11-17 -->

## Overview

Slim, fixed-width panel for the left edge of a page: header (title and icon actions), a labelled section row with a count, and a scrolling body. Presentational. Showing and hiding it is the page's job (the collapsed design simply removes the panel), so there is no collapse state or animation here.

## Parts

| Part | Role |
|---|---|
| `SidePanel` | `<aside>`; forward every attribute, so pass `aria-label`. |
| `SidePanelHeader` | `title` (rendered as `<h2>`) and optional `actions` (icon buttons, 2px apart). |
| `SidePanelSection` | `label` (uppercase) and optional `count`. A count of `0` still shows. |
| `SidePanelBody` | Scrolling column for the list. 8px padding, 2px gap. Scrollbar is the Rocket one (`Rocket/scrollbar.ts`). |

Anything between the section row and the body (a search field, filters) is the caller's markup.

## Layout (Figma, px)

| Element | Value | Class |
|---|---|---|
| panel width | 232 | `tw-w-[232px] tw-shrink-0` |
| header | 48 high, left 16, right 12, bottom border | `tw-h-12 tw-pl-4 tw-pr-3 tw-border-b` |
| section row | 40 high, 16 inset, 4 gap | `tw-h-10 tw-px-4 tw-gap-1` |
| body | 8 padding, 2 gap | `tw-p-2 tw-gap-0.5` |

## Token Mapping

| Element | Figma token | ToolJet class |
|---|---|---|
| panel background | page/page-weak | `tw-bg-page-weak` |
| panel and header border | border/weak | `tw-border-border-weak` |
| title | title/x large, text/default | `tw-font-title-x-large tw-text-text-default` |
| section label | title/section title, text/placeholder | `tw-font-title-section-title tw-text-text-placeholder` |
| section count | body/small, text/placeholder | `tw-font-body-small` |

## CVA Shape

Shape E — compound, static `cn()` classes, no CVA.

## Notes

- No shadcn primitive underneath: shadcn `sidebar` brings a provider, cookie state, mobile sheet and a keyboard shortcut, none of which this panel uses. Plain elements are the base.
- The section label's letter spacing is the `section title` style's (`-0.22px`); the Figma node sets `-0.24px`. The 0.02px difference is not worth a one-off override.
- Preflight is off, so a solid border style alone gives every side without a width the browser's 3px default. The panel and header add `tw-border-0` before their single-side border; do the same wherever a one-sided border is used.
