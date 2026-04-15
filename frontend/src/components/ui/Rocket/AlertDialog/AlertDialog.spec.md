# AlertDialog — Rocket Design Spec
<!-- figma: https://www.figma.com/design/XQdM9x8x9YHcj1lUK8abUG/Rocket-components?node-id=8996-1761 -->
<!-- synced: 2026-04-01 -->

## Overview

AlertDialog is a modal confirmation dialog that **cannot be dismissed** by pressing Escape or clicking outside. The user must explicitly choose an action (confirm or cancel). Used for destructive or irreversible operations.

Structurally simpler than Dialog — no header/footer borders, no body scroll. Uses Radix AlertDialog primitives which enforce the non-dismissible behavior natively.

## Props (AlertDialogContent)

| Prop | Type | Values | Default |
|---|---|---|---|
| size | string | default \| small | default |
| className | string | — | — |

## Sizes

| Value | Max-width | Header alignment | Footer layout |
|---|---|---|---|
| default | 460px | left-aligned | horizontal, justify-between |
| small | 360px | centered | stacked, reverse order |

## Sub-components

| Component | Wraps | Styling |
|---|---|---|
| `AlertDialog` | Radix AlertDialog.Root (pass-through) | none |
| `AlertDialogTrigger` | Re-export from shadcn | none |
| `AlertDialogPortal` | Re-export from shadcn | none |
| `AlertDialogOverlay` | Radix Overlay (direct) | tw-bg-black/50, animations |
| `AlertDialogContent` | Radix Content (direct) | card with padding, shadow, rounded, size CVA |
| `AlertDialogMedia` | plain div | 40px icon/image slot |
| `AlertDialogHeader` | plain div | groups media + title + description |
| `AlertDialogTitle` | Radix Title (direct) | tw-font-title-x-large + color |
| `AlertDialogDescription` | Radix Description (direct) | tw-font-body-default + color |
| `AlertDialogFooter` | plain div | justify-between layout, no border |
| `AlertDialogAction` | Radix Action (direct) | accepts Rocket Button as child via asChild |
| `AlertDialogCancel` | Radix Cancel (direct) | accepts Rocket Button as child via asChild |

## Token Mapping

| Element | State | Figma token | ToolJet class |
|---|---|---|---|
| content bg | default | bg-surface-layer-01 | tw-bg-background-surface-layer-01 |
| content shadow | default | Elevations/400 | tw-shadow-elevation-400 |
| content radius | default | 8px | tw-rounded-lg |
| content padding | default | 24px | tw-p-6 |
| content gap | default | 24px (between body and footer) | tw-gap-6 |
| overlay bg | default | black/50 | tw-bg-black/50 |
| media size | default | 40px | tw-size-10 |
| body gap | default | 8px (between media/title/desc) | tw-gap-2 |
| title text | default | text/default, 16px Medium 24px | tw-font-title-x-large tw-text-text-default |
| description text | default | text/default, 12px Regular 18px | tw-font-body-default tw-text-text-default |
| footer layout | default | justify-between | tw-flex tw-justify-between tw-items-center |

## Slots

- media (optional, `ReactNode`) — 40px icon or image at top, via `AlertDialogMedia`
- title (required, `string`) — heading text
- description (optional, `string`) — supporting text
- cancel (required) — Rocket Button (typically `variant="outline"`)
- action (required) — Rocket Button (typically `variant="primary"` or `variant="primary" danger`)
- secondary action (optional) — additional Rocket Button grouped with action on the right

## Usage Pattern

```jsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="primary" danger>Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogMedia><WarningIcon /></AlertDialogMedia>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel asChild>
        <Button variant="outline">Cancel</Button>
      </AlertDialogCancel>
      <AlertDialogAction asChild>
        <Button variant="primary" danger>Delete</Button>
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## CVA Shape

Shape C — sizes only. `alertDialogContentVariants` has `size` CVA for max-width. Rest use static `cn()` with `group-data-[size=...]` responsive classes.

## Notes

- **Non-dismissible by design**: Radix AlertDialog natively prevents Escape and overlay click dismiss. No `preventClose` prop needed (unlike Dialog).
- No header/footer borders — simpler layout than Dialog.
- No close button (X) — users must use Cancel or Action.
- `small` size: header text centers, footer stacks buttons vertically (reversed so action is on top).
- Footer uses Rocket Button components directly via `asChild` on Action/Cancel.
- The right side of the footer (default size) can hold multiple action buttons (secondary + primary) grouped with `tw-gap-2`.
- Typography uses `tw-font-*` plugin utilities — never manual font combos.
- `data-size` attribute on Content enables `group-data-[size=small]` selectors on child components.
