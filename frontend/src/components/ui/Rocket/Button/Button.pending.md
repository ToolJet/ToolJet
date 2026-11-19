# Button — Pending Scenarios

Work left after the 2026-10-15 alignment with Figma. Implemented behaviour lives in [Button.spec.md](./Button.spec.md).

## Not implemented

- **Addon slot:** Figma's text button has an optional trailing `addon` (a shortcut hint such as `⌘E`). It's skipped because the design has no scenario that uses it yet.

## Open with design

| Item | Detail |
|---|---|
| Icon-only default radius | Figma binds 8px (`medium`) for icon-only default, but 6px for the text default. Implemented as designed; confirm it's intentional |
| Primary disabled icon colour | Icons inherit `text-disabled-on-solid`. Figma doesn't bind an icon token for this state |
| Primary + danger disabled / loading contrast | Figma keeps `text-on-solid` on the faded fill. Listed by design as a known legacy gap |
| Small (20px) target size | Below the WCAG 2.5.8 minimum of 24×24. Acceptable only with enough free space around the target |
| Focus inset ring | Text secondary + danger and ghostBrand have the white inset ring; their icon-only versions don't. Icon-only secondary + danger focus also switches the border to `border-danger-strong`. Code follows primary-only for now |
| Overview page icon tokens | The overview examples bind `icon/default` for text-button icons, which matches the implementation. Keep the page and the component set consistent |

## Engineering follow-ups

- **Stories:** update [Button.stories.jsx](./Button.stories.jsx) with:
  - a grid of icon-only sizes × variants, including ghost + danger;
  - loading next to rest, to show the width doesn't change;
  - disabled for every variant.

  The existing `size={14}` on story icons is now overridden by the per-size icon classes.
- **Call-site review:** these consumers will look different (font, padding, radius, icon size):
  - `Rocket/Dialog/Dialog.jsx`, `Rocket/Sheet/Sheet.jsx`
  - `Rocket/shadcn/input-group.jsx`, `Rocket/shadcn/combobox.jsx`
  - `ActionConfigurationPanels/GotoApp.jsx`, `ActionConfigurationPanels/SwitchPage.jsx`
  - `_hooks/useAutoSyncNotifications.js`

  `GotoApp.jsx` passes `<Plus className="tw-h-2.5 tw-w-2.5" />`, which now renders at 12px (the small icon size).
- **Invalid size in combobox:** `Rocket/shadcn/combobox.jsx:213` passes `size="icon-xs"`, which isn't a Rocket size. No Rocket size classes apply, so the chip-remove button falls back to shadcn's default `tw-h-9 tw-px-4`. Use `size="small" iconOnly` with an `aria-label`.
- **Same bug in ToggleGroup:** `Rocket/ToggleGroup/ToggleGroup.jsx` uses `data-[state=on]:[&_svg]:tw-text-icon-strong`. That compiles to `svg[data-state=on]` and never matches; it should be `[&_svg]:data-[state=on]:…`.
- **Spinner component:** swap `Loader` for a Rocket `Spinner` once one exists.
