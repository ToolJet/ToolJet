# Table — Rocket Design Spec
<!-- synced: 2026-04-07 -->

## Overview

Table is the low-level Rocket primitive for tabular data. Wraps shadcn's `<table>` primitive with ToolJet token overrides. Used as the structural base for higher-level compositions like `DataTable` (TanStack-driven) and feature tables (apps list, datasources list, workflows list, etc.).

The HOC layer **only handles structure + visual tokens**. State (sorting, filtering, pagination, selection) is the responsibility of the consumer or the `DataTable` block.

Brought forward from PR #14498 with improved organization and ToolJet token usage.

## Props

### Table (root)

| Prop | Type | Values | Default |
|---|---|---|---|
| density | string | default \| compact | default |
| className | string | — | — |

### TableRow

| Prop | Type | Values | Default |
|---|---|---|---|
| data-state | string | "selected" \| undefined | — |
| className | string | — | — |

## Density (Sizes)

| Value | Header height | Header padding | Cell height | Cell padding | Font |
|---|---|---|---|---|---|
| default | 40px | 0 / 14px | 52px | 14px | `tw-text-base` (12px) |
| compact | 32px | 0 / 12px | 36px | 8px / 12px | `tw-text-base` (12px) |

Density is set via context on `Table` and read by `TableHead` / `TableCell`.

## Sub-components

| Component | Element | Token overrides |
|---|---|---|
| `Table` | `<table>` inside scrollable `<div>` | bg, w-full, font tokens |
| `TableHeader` | `<thead>` | border-bottom on rows |
| `TableBody` | `<tbody>` | last row no border |
| `TableFooter` | `<tfoot>` | border-top, surface bg, medium font |
| `TableRow` | `<tr>` | border-bottom, hover bg, selected bg |
| `TableHead` | `<th>` | header height (density), title font, text-default, left-align |
| `TableCell` | `<td>` | cell padding (density), body font, text-default |
| `TableCaption` | `<caption>` | mt-4, body small, text-placeholder |

## Token Mapping

| Element | State | ToolJet class |
|---|---|---|
| Table container | default | `tw-relative tw-w-full tw-overflow-auto` |
| Table | default | `tw-w-full tw-caption-bottom tw-border-separate tw-border-spacing-0 tw-font-body-default tw-text-text-default` |
| TableHeader | default | `tw-border-solid tw-border-0 tw-border-b tw-border-border-weak` |
| TableRow | default | `tw-transition-colors` |
| TableRow | hover | `hover:tw-bg-interactive-hover` |
| TableRow | selected | `data-[state=selected]:tw-bg-interactive-selected` |
| TableHead | default | `tw-h-10 tw-px-3.5 tw-py-0 tw-text-left tw-align-middle tw-font-title-default tw-text-text-default` |
| TableHead | compact | `tw-h-8 tw-px-3 tw-py-0` |
| TableCell | default | `tw-h-[52px] tw-p-3.5 tw-align-middle tw-text-text-default first:tw-rounded-l-[10px] last:tw-rounded-r-[10px]` |
| TableCell | compact | `tw-h-9 tw-px-3 tw-py-2 first:tw-rounded-l-[10px] last:tw-rounded-r-[10px]` |
| TableFooter | default | `tw-border-solid tw-border-0 tw-border-t tw-border-border-weak tw-bg-background-surface-layer-02 tw-font-title-default` |
| TableCaption | default | `tw-mt-4 tw-font-body-small tw-text-text-placeholder` |

## CVA Shape

Shape C — sizes only (`density`). Plus a `TableDensityContext` so child components (`TableHead`, `TableCell`) read density from the root `Table`.

## Slots

Standard HTML table slots — consumer composes via sub-components.

## Notes

- Wraps the shadcn `table` primitive (installed at `Rocket/shadcn/table.jsx`).
- Replaces all shadcn semantic classes (`tw-bg-muted`, `tw-text-foreground`) with ToolJet tokens via className override.
- `density` prop controls row/cell heights via context — font stays `12px Medium` (`tw-font-title-default`) on header and `12px Regular` (`tw-font-body-default`) on body across both densities.
- **Borderless rows** — rows do NOT have bottom borders. Visual separation comes from the hover/selected background which uses `rounded-[10px]` corners on the first/last cells, creating a "pill" highlight.
- The `<table>` itself uses `tw-border-separate tw-border-spacing-0` so the rounded cell corners render correctly (the default `border-collapse` collapses cell borders and breaks the rounded corners).
- Header has a single `border-bottom` (`tw-border-border-weak`) on `TableHeader` — separates header from body.
- Hover and selected states use `tw-bg-interactive-hover` and `tw-bg-interactive-selected`.
- `TableFooter` uses surface-layer-02 bg + medium font weight (slightly emphasized).
- Higher-level features (sorting indicators, sticky header, loading skeleton, empty state, pagination) live in the `DataTable` block (layer 2), not here.
- Typography uses `tw-font-*` plugin utilities — never manual font combos.
