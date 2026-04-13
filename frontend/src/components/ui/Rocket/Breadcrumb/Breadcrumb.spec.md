# Breadcrumb — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=128-55224 -->
<!-- synced: 2026-03-25 -->

## Overview

Navigation breadcrumb trail showing the user's current location within a hierarchy. Compound component (Shape E) wrapping shadcn breadcrumb primitives. No variants, no sizes — one consistent visual treatment.

## Sub-components

| Sub-component | shadcn base | Rocket wrapper? | Notes |
|---|---|---|---|
| Breadcrumb | Breadcrumb (nav) | Re-export | Structural root, no styling needed |
| BreadcrumbList | BreadcrumbList (ol) | Yes | Token-styled container |
| BreadcrumbItem | BreadcrumbItem (li) | Re-export | Structural wrapper, no styling needed |
| BreadcrumbLink | BreadcrumbLink (a/Slot) | Yes | Styled link with hover/disabled states |
| BreadcrumbPage | BreadcrumbPage (span) | Yes | Current page — distinct styling |
| BreadcrumbSeparator | BreadcrumbSeparator (li) | Yes | Separator icon with token color |
| BreadcrumbEllipsis | BreadcrumbEllipsis (span) | Yes | Collapsed items indicator |

## Props

### BreadcrumbLink
| Prop | Type | Values | Default |
|---|---|---|---|
| asChild | boolean | — | false |
| disabled | boolean | — | false |

### BreadcrumbSeparator
| Prop | Type | Values | Default |
|---|---|---|---|
| children | ReactNode | custom separator icon | ChevronRightIcon |

### BreadcrumbEllipsis
| Prop | Type | Values | Default |
|---|---|---|---|
| children | ReactNode | custom ellipsis content | MoreHorizontalIcon |

## States

| State | Applies to | Behaviour |
|---|---|---|
| default | BreadcrumbLink | Normal link appearance |
| hover | BreadcrumbLink | Text darkens to text-default |
| disabled | BreadcrumbLink | Reduced opacity, no pointer events |
| current (page) | BreadcrumbPage | Non-interactive, text-default, font-medium |

## Token Mapping

| Element | State | ToolJet token | Tailwind class |
|---|---|---|---|
| link text | default | text-placeholder | tw-text-text-placeholder |
| link text | hover | text-default | hover:tw-text-text-default |
| link text | disabled | text-disabled | tw-text-text-disabled |
| page text | current | text-default | tw-text-text-default |
| page text | current | font-title-small | tw-font-title-small |
| separator icon | default | icon-default | tw-text-icon-default |
| ellipsis icon | default | icon-default | tw-text-icon-default |
| ellipsis container | hover | interactive-hover | hover:tw-bg-interactive-hover |
| list container | — | font-body-small | tw-font-body-small tw-gap-1.5 tw-flex-wrap |

## Slots

- separator (optional, `ReactNode`) — custom separator icon, defaults to ChevronRightIcon
- ellipsis (optional, `ReactNode`) — custom ellipsis content, defaults to MoreHorizontalIcon

## CVA Shape

Shape E — compound/multi-part
- No sub-component needs CVA (no variants, no sizes)
- All sub-components use static `cn()` with ToolJet token classes
- Structural sub-components (Breadcrumb, BreadcrumbItem) are re-exported directly

## Notes

- Breadcrumb uses `tw-font-body-small` (11px/16px, regular) for links and `tw-font-title-small` (11px/16px, medium) for current page — uses typography plugin tokens, never manual font combos
- BreadcrumbLink supports `asChild` via shadcn's Slot — allows wrapping React Router `<Link>` etc.
- BreadcrumbEllipsis gets a rounded hover background for interactive affordance
- Separator defaults to ChevronRightIcon but can be overridden with any icon or string (e.g. "/")
- `tw-border-solid` not needed — no borders in this component
