# TruncatingText — Rocket Design Spec
<!-- synced: 2026-04-27 -->

## Overview

TruncatingText renders a string with CSS ellipsis. When the rendered text actually overflows its container, it sets a `title` attribute on the element so the browser's native tooltip reveals the full string on hover. When the text fits, no `title` is attached — short values get no tooltip noise.

Use it anywhere text may or may not fit its container: row labels in dropdowns, selected values in Select triggers, table cells, sidebar entries.

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| text | node | — | String content. Wins over `children` when both are passed. |
| children | node | — | Alternative way to pass content. |
| className | string | — | Forwarded to the rendered `<span>`. |
| title | string | — | Manual override. When set, replaces the auto-detected title. Use this if `children` is JSX and you want to provide the plain-text equivalent for the tooltip. |

## Usage

```jsx
// Basic — auto-detects overflow on the string
<TruncatingText text={query.name} />

// Inside a flex row — parent needs min-w-0 to allow shrinking
<div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
  <Icon />
  <TruncatingText text={longLabel} className="tw-flex-1" />
</div>

// Wrapping a component that renders text from context (Radix SelectValue)
<TruncatingText title={query.name}>
  <SelectValue />
</TruncatingText>
```

## Behavior

- Renders `<span>` with `tw-block tw-truncate` (applies `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`).
- Sets `title={fullText}` only when `scrollWidth - clientWidth > 0.5`. Hover triggers the OS tooltip.
- Re-measures on:
  - Container resize — via `ResizeObserver` on the span itself.
  - Children prop change — via the React effect dependency.
  - Descendant text mutations — via `MutationObserver` on the subtree (`childList + characterData`). Required so wrappers like Radix `SelectValue` / `ComboboxValue`, which render selected text from context (not from props), trigger re-measurement when the selection changes.
- The `title` attribute is only auto-set for **string content**. If `children` is a React element (e.g. `<SelectValue />`), the auto-detection still measures correctly but cannot extract a string for the title — pass it explicitly via the `title` prop.
- SSR-safe: initial `title` is `undefined`, set after mount via `useLayoutEffect`. First paint is the bare ellipsis; the title appears once measurement runs.

## Why native title, not a styled tooltip

Considered wrapping in our Rocket `Tooltip` (Radix-based) so the hover bubble matches design-system styling. Rejected for these reasons:

- **Composition fragility** — nesting Radix Tooltip inside Radix Select/Combobox triggers caused event/portal interaction bugs that were hard to isolate.
- **DOM stability** — toggling between "wrap in Tooltip" and "no wrap" required remounting the trigger span, breaking observers and adding race conditions.
- **Overhead** — every truncated row would carry a Radix subtree, materially worse in long lists.
- **Provider requirement** — every consumer would need a `<TooltipProvider>` ancestor, easy to forget.
- **Discoverability** — native browser tooltips are the universal pattern for "reveal overflow content," instantly understood by users.

The native `title` attribute eliminates all of the above. The DOM shape never changes; only the attribute toggles. The styled Rocket `Tooltip` remains the right choice for **deliberate informational tooltips** (help text, descriptions) — different job, different primitive.

## Architecture Notes

- **No shadcn base.** TruncatingText has no shadcn primitive equivalent. It's a small composition utility — the "every Rocket component wraps shadcn" rule is explicitly suspended for this component. Documented here so the exception is visible.
- For truncation to activate inside a flex container, the flex child (or this component's parent) needs `min-w-0`. Otherwise the element grows to its content's intrinsic width and never clips. CSS convention, not a TruncatingText quirk.
