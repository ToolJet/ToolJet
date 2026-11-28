# EmptyAndNoResultsState — Rocket Design Spec

<!-- figma: https://www.figma.com/design/tg0MyOw2kpYFyczTEaSQyn/Rocket-organisms?node-id=13336-655 -->
<!-- synced: 2026-11-18 -->

## Overview

Empty, no-results and no-table-open states for a table view or a panel. It centres its own content; centre it in a region with a flex parent (`tw-flex tw-items-center tw-justify-center`).

## Props

| Prop            | Type                                       | Default   |
| --------------- | ------------------------------------------ | --------- |
| variant         | `empty` \| `no-results` \| `no-table-open` | required  |
| size            | `default` \| `compact`                     | `default` |
| title           | string, overrides the variant's            | —         |
| description     | string, overrides the variant's            | —         |
| hideDescription | boolean                                    | false     |
| action          | ReactNode, the single action               | none      |

## Variants

| Variant         | Title                         | Description                                                    | Action (passed by the caller)         |
| --------------- | ----------------------------- | -------------------------------------------------------------- | ------------------------------------- |
| `empty`         | No records yet                | This table is ready. Add its first record to get started.      | secondary Button "Add data" with plus |
| `no-results`    | No records match your filters | Try changing a condition, or clear the filters.                | `LinkButton` "Clear filters"          |
| `no-table-open` | No table open                 | Pick a table from the Database list, or open one with the plus | secondary Button "Open a table"       |

`no-table-open` also has a 24px table icon (16px compact), `icon/default`. There is no error state and no secondary action.

## Measurements

| Size    | Width | Padding | Gap | Title             | Description        |
| ------- | ----- | ------- | --- | ----------------- | ------------------ |
| default | 360   | 24      | 16  | `title/large` 14  | `body/default` 12  |
| compact | 240   | 16      | 12  | `title/default` 12 | `body/small` 11   |

`no-results` at the default size is looser: 24px × 40px padding (the design's 56px is not on the scale), 8px gaps, and a 14px (`body/large`) description.

## Notes

- The action is a slot, not an `onAction`: `empty` uses a menu trigger and `no-table-open` a popover trigger, so the caller owns what the button does.
- Width is fixed, capped by `max-w-full`.
