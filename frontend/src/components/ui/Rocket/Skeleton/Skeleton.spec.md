# Skeleton — Rocket Design Spec
<!-- synced: 2026-04-07 -->

## Overview

Skeleton is a loading placeholder primitive — a pulsing rectangle. Used in loading states for content (text, lists, tables, cards) before real data arrives.

Wraps shadcn skeleton with ToolJet token override.

## Props

| Prop | Type | Default |
|---|---|---|
| className | string | — |

Sized via Tailwind utilities (e.g. `tw-h-4 tw-w-32`).

## Token Mapping

| Element | ToolJet class |
|---|---|
| bg | `tw-bg-interactive-hover` |
| animation | `tw-animate-pulse` |
| radius | `tw-rounded-md` |

## CVA Shape

Shape D — no CVA. Single static class set.

## Notes

- Brought from PR #14498 (`Rocket/skeleton.jsx`).
- Background uses `tw-bg-interactive-hover` (subtle gray) instead of shadcn's `tw-bg-muted` semantic token.
- Consumer sets dimensions via className.
