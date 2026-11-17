# ClosableTabs — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-atoms?node-id=12117-5108 (tab atom, closable? = true); strip: https://www.figma.com/design/QHALzSYm32CKAZdjr2gBiF/Rocket---TJDB?node-id=48-1538 -->
<!-- synced: 2026-11-17 -->

## Overview

Tab list for open items that can be closed (the TJDB open tables). Tabs are 200px wide (min 128, max 200), 48px tall, bottom-indicator variant of the Figma `_base/tab` atom. The strip around it (panel toggle, `+`, menu) is the caller's.

## Props

| Prop | Type | Default |
|---|---|---|
| tabs | `{ id, label, icon?, 'data-cy'? }[]` | required |
| activeId | string \| null | required |
| indicator | `bottom` \| `top` | bottom |
| onSelect | `(id) => void` | required |
| onClose | `(id) => void` | required |
| closeLabel | `(tab) => string` | "Close {label}" |
| scrollLeftLabel / scrollRightLabel | string | "Scroll tabs left/right" |
| className, …rest | on the root | — |

## Behaviour

- Tabs shrink from 200px to 128px; past that the list scrolls (no visible scrollbar).
- A chevron button plus a 1px divider shows on a side only while tabs are hidden past that side. Once the tabs overflow, both slots stay in the layout: the one at the scroll end is hidden (`invisible`, `aria-hidden`, disabled), not removed, because removing it would widen the list under the user's scroll and the tabs would jump. The slots leave the layout only when the tabs fit without them (no flicker at the threshold). In the Figma overflow frame the list is half-width; in the page it takes all the room its parent leaves, so give it a flex row and make sibling items `shrink-0`.
- The selected tab is scrolled fully into view when it changes.
- Selected: label `text/default`, icon `icon/accent`, 2px `border/accent-strong` underline across the whole tab. Unselected: `text/placeholder`, icon `icon/default`.
- The close button (ghost, small, `lucide/x`) is shown on hover, on keyboard focus, and on the selected tab. It stays in the layout while hidden, so nothing shifts.
- The hover wash and the focus ring wrap the whole 32px base: icon, label and close button. Focus: white base (`background/surface-layer-01`), 2px `interactive/focusActive` ring, label `text/default` even when unselected.
- `indicator="top"` puts the 2px accent line on the top edge instead.
- A truncated label shows the full name in a tooltip.
- No dirty/unsaved dot, no overflow chevron-down menu, by design.

## Accessibility

- `role="tablist"` / `role="tab"` / `aria-selected`; the selected tab (or the first when none is) is the only tab stop.
- Arrow Left/Right, Home and End move focus and select; Delete closes the focused tab.
- The close button is a sibling of the tab button (not nested) and is not a tab stop.

## Token Mapping

| Element | Class |
|---|---|
| tab base radius | `tw-rounded-default` |
| hover wash | `hover:tw-bg-interactive-hover` |
| focus ring | `has-[button:focus-visible]:tw-ring-2 tw-ring-interactive-focus-active` + `tw-bg-background-surface-layer-01` |
| close button radius | `tw-rounded-sm` (4px) |
| close / chevron icons | `icon/strong`, from the ghost icon-only `Button` |
| underline | `tw-border-b-2 tw-border-border-accent-strong` |
| divider | `tw-bg-border-weak` |

## CVA Shape

Shape D — no CVA (static classes).
