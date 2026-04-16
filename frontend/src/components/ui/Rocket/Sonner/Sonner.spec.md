# Sonner — Rocket Design Spec
<!-- figma: https://www.figma.com/design/SZKm4ecuzgBwFq0v4sfrO5/Sanitation---Miscellaneous?node-id=2868-334374 -->
<!-- synced: 2026-04-02 -->

## Overview

Sonner is the toast notification system for Rocket. It wraps the `sonner` library with ToolJet tokens. Consists of two parts:
1. `<Toaster />` — provider component, placed once in the app root
2. `toast()` — imperative API to trigger toasts from anywhere

## Toaster Props

| Prop | Type | Values | Default |
|---|---|---|---|
| position | string | top-center \| top-right \| bottom-right \| etc. | top-center |
| closeButton | boolean | — | true |
| richColors | boolean | — | true |
| duration | number | ms | 4000 |

## Toast Types

| Type | Icon | Color intent |
|---|---|---|
| default | none | neutral (surface bg) |
| success | CircleCheckIcon | green/success |
| error | OctagonXIcon | red/danger |
| warning | TriangleAlertIcon | orange/warning |
| info | InfoIcon | blue/brand |
| loading | Loader2Icon (spinning) | neutral |

## Token Mapping (from Figma)

| Element | Figma token | ToolJet class |
|---|---|---|
| toast bg | Base/Light/white 00 | `tw-bg-background-surface-layer-01` |
| toast border | slate/light/05 (#E6E8EB) | `tw-border-solid tw-border tw-border-border-weak` |
| toast shadow | Shadow/06 (0 32 64 -12) | `tw-shadow-[0px_32px_64px_-12px_rgba(16,24,40,0.14)]` |
| toast radius | 6px | `tw-rounded-md` |
| toast padding | 16px | `tw-p-4` |
| toast text | 14px Medium / 20px (slate/light/12) | `tw-font-title-large tw-text-text-default` |
| icon gap | 8px | `tw-gap-2` |
| close icon | slate/light/09 (#889096) | `tw-text-icon-default` |
| close icon size | 16px | `tw-size-4` |
| type icon size | 20px | `tw-size-5` |

## Usage Pattern

```jsx
// In app root (once)
<Toaster />

// Anywhere in the app
import { toast } from 'sonner';

toast('Default notification');
toast.success('Item saved');
toast.error('Workspace already exists');
toast.warning('Proceed with caution');
toast.info('New version available');
toast.loading('Uploading...');

// With description
toast.success('Saved', { description: 'Your changes have been saved.' });

// With action
toast('Item deleted', {
  action: { label: 'Undo', onClick: () => undoDelete() },
});
```

## CVA Shape

Shape D — no CVA. Sonner handles its own rendering. Rocket HOC overrides styles via `toastOptions.classNames` and inline style variables.

## Notes

- `sonner` library handles all toast rendering, stacking, swipe-to-dismiss, and auto-dismiss.
- No `next-themes` — ToolJet uses `.dark-theme` class. Theme not passed to sonner.
- Icons from `lucide-react` — type icons are 20px (`tw-size-5`), close icon is 16px (`tw-size-4`).
- `closeButton={true}` by default — all toasts get a close button.
- Position defaults to `top-center`.
- `richColors={true}` enables sonner's built-in semantic coloring for typed toasts.
- Shadow is heavier than standard elevation tokens — uses custom shadow from Figma.
- Typography uses `tw-font-title-large` (14px Medium / 20px) — not the default body font.
