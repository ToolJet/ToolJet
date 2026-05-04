# Popover — Rocket Design Spec
<!-- figma: n/a (interactive spec — modeled after Dialog tokens) -->
<!-- synced: 2026-04-20 -->

## Overview

Popover is a lightweight, non-modal overlay anchored to a trigger element. Used to surface supplementary information, simple forms, or quick actions without blocking the rest of the UI. Unlike Dialog, there is no backdrop overlay, no focus trap escalation, and no close button — clicking outside dismisses.

Structurally identical to the shadcn primitive's sub-component set. Styling matches Dialog's card tokens (surface, elevation, radius) with tighter padding to suit its smaller footprint.

## Props (PopoverContent)

| Prop | Type | Values | Default |
|---|---|---|---|
| align | string | start \| center \| end | center |
| side | string | top \| right \| bottom \| left | bottom |
| sideOffset | number | — | 4 |
| className | string | — | — |

(All other props forward to Radix `Popover.Content` — `onOpenAutoFocus`, `onInteractOutside`, etc.)

## Sub-components

| Component | Wraps | Styling |
|---|---|---|
| `Popover` | Radix Popover.Root (pass-through) | none |
| `PopoverTrigger` | Re-export from shadcn | none |
| `PopoverContent` | Radix Content (direct, via Portal) | card tokens, padding, animations |
| `PopoverHeader` | plain div | flex column, tight gap |
| `PopoverTitle` | plain div | tw-font-title-large + color |
| `PopoverDescription` | plain div | tw-font-body-small + color |

## Token Mapping

| Element | State | Figma token | ToolJet class |
|---|---|---|---|
| content bg | default | bg-surface-layer-01 | tw-bg-background-surface-layer-01 |
| content shadow | default | Elevations/400 | tw-shadow-elevation-400 |
| content radius | default | 8px | tw-rounded-lg |
| content border | default | border/weak | tw-border-solid tw-border tw-border-border-weak |
| content padding | default | 12px | tw-p-3 |
| content width | default | 288px (overridable via className) | tw-w-72 |
| content gap | default | 10px (between header and other content) | tw-gap-2.5 |
| header gap | default | 2px (between title and description) | tw-gap-0.5 |
| title text | default | text/default 14px Medium | tw-font-title-large tw-text-text-default |
| description text | default | text/placeholder 11px Regular | tw-font-body-small tw-text-text-placeholder |

## Slots

- trigger (required) — any element that opens the popover, via `PopoverTrigger` + `asChild`
- content (required) — arbitrary children inside `PopoverContent`
- header (optional) — `PopoverHeader` groups title + description
- title (optional) — `PopoverTitle`, typically inside header
- description (optional) — `PopoverDescription`, typically inside header

## Usage Pattern

```jsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open</Button>
  </PopoverTrigger>
  <PopoverContent align="start">
    <PopoverHeader>
      <PopoverTitle>Dimensions</PopoverTitle>
      <PopoverDescription>Set the width and height.</PopoverDescription>
    </PopoverHeader>
    {/* arbitrary body content */}
  </PopoverContent>
</Popover>
```

## CVA Shape

Shape E — compound/multi-part, but **no CVA on any sub-component** (no variants, no sizes). All sub-components use static `cn()` calls. No `popoverVariants` export.

## Notes

- No overlay / backdrop — Radix Popover is non-modal; the page behind stays interactive.
- No close button — dismiss by clicking outside, pressing Escape, or re-clicking the trigger (native Radix behavior).
- No arrow indicator — not requested.
- No `PopoverAnchor` re-export — the trigger IS the anchor (Radix default). If a consumer needs a separate anchor later, add as a pass-through re-export.
- Typography uses plugin token utilities (`tw-font-title-large`, `tw-font-body-small`) — matches Dialog scale, not AlertDialog's larger scale.
- Padding is `tw-p-3` (12px), tighter than Dialog's 24px body padding — popovers are compact.
- Default width `tw-w-72` (288px) from shadcn — overridable via `className` on `PopoverContent`.
- Animations inherited from shadcn: `data-[state=open]:tw-animate-in`, `data-[state=closed]:tw-animate-out`, side-based slide-in.
- `forwardRef` is required on `PopoverContent` — Radix internally uses `React.cloneElement` for positioning refs; missing forwardRef silently breaks alignment.
- Header/Title/Description wrap plain `div`/`p` elements (not Radix primitives) — there is no `Popover.Title`/`Popover.Description` in Radix UI. shadcn's generated file also uses plain divs.
