# Pagination — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=9877-52 -->
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=9877-59 -->
<!-- synced: 2026-03-18 -->

## Overview

Compound component for page navigation. Composed of nav wrapper, content list, page links, previous/next buttons, and ellipsis indicator.

## Sub-components

| Component | Element | Purpose |
|---|---|---|
| Pagination | `<nav>` | Root wrapper with aria-label="pagination" |
| PaginationContent | `<ul>` | Flex container for items |
| PaginationItem | `<li>` | List item wrapper |
| PaginationLink | `<a>` / `<button>` | Individual page number link |
| PaginationPrevious | PaginationLink | "Previous" button with chevron-left |
| PaginationNext | PaginationLink | "Next" button with chevron-right |
| PaginationEllipsis | `<span>` | MoreHorizontal icon for truncated ranges |

## Props

### PaginationLink

| Prop | Type | Values | Default |
|---|---|---|---|
| isActive | boolean | — | false |
| disabled | boolean | — | false |
| className | string | — | — |

### PaginationPrevious / PaginationNext

| Prop | Type | Values | Default |
|---|---|---|---|
| disabled | boolean | — | false |
| className | string | — | — |

### Pagination (root)

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | large \| default \| small | default |
| className | string | — | — |

Size is set on Pagination root and flows to all sub-components via React context.

### PaginationContent, PaginationItem, PaginationEllipsis

Only `className` prop — no variants.

## Sizes

### PaginationLink (page items)

| Value | Size | Tailwind |
|---|---|---|
| large | 32px | tw-size-8 |
| default | 28px | tw-size-7 |
| small | 24px | tw-size-6 |

### PaginationPrevious / PaginationNext

| Value | Height | Padding | Tailwind |
|---|---|---|---|
| large | 32px | px-3 py-1 | tw-h-8 tw-px-3 tw-py-1 |
| default | 28px | px-2.5 py-1 | tw-h-7 tw-px-2.5 tw-py-1 |
| small | 24px | px-2 py-0.5 | tw-h-6 tw-px-2 tw-py-0.5 |

### PaginationEllipsis

| Value | Size | Tailwind |
|---|---|---|
| large | 32px | tw-size-8 |
| default | 28px | tw-size-7 |
| small | 24px | tw-size-6 |

## Layout

```
┌─ nav (pagination) ──────────────────────────────────────────────┐
│ [← Previous]  [1] [2] [3] [...] [8] [9] [10]  [Next →]         │
└─────────────────────────────────────────────────────────────────┘
```

- Container: inline-flex, gap 4px (`tw-gap-1`), items centered
- Page items: size-dependent (default 28×28px `tw-size-7`), rounded-md
- Previous/Next: rounded-md, px-2.5, py-1, gap-1.5
- Icon size: 14px for chevrons, 16px for ellipsis dots

## Token Mapping

### PaginationLink — default (inactive)

| Element | Figma token | ToolJet class |
|---|---|---|
| background | — | tw-bg-transparent |
| text | text/default | tw-text-text-default |
| font weight | weight/regular (400) | tw-font-normal |

### PaginationLink — hover

| Element | Figma token | ToolJet class |
|---|---|---|
| background | interactive/hover | hover:tw-bg-interactive-hover |

### PaginationLink — isActive (current page)

| Element | Figma token | ToolJet class |
|---|---|---|
| background | --bg-surface-layer-01 | tw-bg-background-surface-layer-01 |
| border | border/weak | tw-border tw-border-border-weak |
| font weight | weight/medium (500) | tw-font-medium |
| text | text/default | tw-text-text-default |

### PaginationPrevious / PaginationNext

| Element | Figma token | ToolJet class |
|---|---|---|
| text | cc-text/primary | tw-text-text-default |
| font | IBM Plex Sans Medium 12px | tw-text-sm tw-font-medium |
| icon color | Icons/weak | tw-text-icon-weak |

### PaginationEllipsis

| Element | Figma token | ToolJet class |
|---|---|---|
| icon color | icon/default | tw-text-icon-default |

## CVA Shape

Shape C — sizes only. CVA on PaginationLink with size variants. `isActive` handled via conditional `cn()` merge. Size flows from Pagination root via React context.

## Notes

- Size set on Pagination root, flows via context. Figma shows 28px (default) only — large/small extrapolated.
- Previous/Next buttons reuse the text Button pattern from Figma (Button/text variant) but are self-contained here.
- Font: 12px / 18px line-height for page numbers, 12px / 20px for prev/next labels.
- Ellipsis uses MoreHorizontal icon from lucide-react.
- Chevrons: ChevronLeft / ChevronRight from lucide-react, 14px.
- "state5" in Figma maps to the PaginationEllipsis sub-component (not a state of PaginationLink).
- "active" in Figma is the CSS hover state, not a prop.
- "selected" in Figma maps to `isActive={true}` prop on PaginationLink.
