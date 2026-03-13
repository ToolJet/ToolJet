# shadcn/ui Component Reference

> Source: https://github.com/shadcn-ui/ui/tree/main/apps/v4/content/docs/components/radix
> Synced: 2026-03-13 | shadcn CLI version at sync: 4.0.6

This is the authoritative local reference for deciding whether to install a shadcn primitive
or write the Rocket HOC directly.

## Decision rule

> Does the component have a Radix primitives API doc link in its frontmatter?
> - **Yes** → `npx shadcn@latest add {name}` then run `shadcn-to-v3` skill
> - **No** → write Rocket HOC directly (no shadcn install)

---

## Use shadcn CLI — Radix-backed

These components have real Radix state machines: focus management, keyboard nav, ARIA roles,
compound component API. Install via CLI, convert with `shadcn-to-v3`, then wrap in Rocket HOC.

| Component | Radix primitive | CLI command |
|---|---|---|
| Accordion | @radix-ui/react-accordion | `npx shadcn@latest add accordion` |
| Alert Dialog | @radix-ui/react-alert-dialog | `npx shadcn@latest add alert-dialog` |
| Aspect Ratio | @radix-ui/react-aspect-ratio | `npx shadcn@latest add aspect-ratio` |
| Avatar | @radix-ui/react-avatar | `npx shadcn@latest add avatar` |
| Checkbox | @radix-ui/react-checkbox | `npx shadcn@latest add checkbox` |
| Collapsible | @radix-ui/react-collapsible | `npx shadcn@latest add collapsible` |
| Context Menu | @radix-ui/react-context-menu | `npx shadcn@latest add context-menu` |
| Dialog | @radix-ui/react-dialog | `npx shadcn@latest add dialog` |
| Dropdown Menu | @radix-ui/react-dropdown-menu | `npx shadcn@latest add dropdown-menu` |
| Hover Card | @radix-ui/react-hover-card | `npx shadcn@latest add hover-card` |
| Label | @radix-ui/react-label | `npx shadcn@latest add label` |
| Menubar | @radix-ui/react-menubar | `npx shadcn@latest add menubar` |
| Navigation Menu | @radix-ui/react-navigation-menu | `npx shadcn@latest add navigation-menu` |
| Popover | @radix-ui/react-popover | `npx shadcn@latest add popover` |
| Progress | @radix-ui/react-progress | `npx shadcn@latest add progress` |
| Radio Group | @radix-ui/react-radio-group | `npx shadcn@latest add radio-group` |
| Resizable | @radix-ui/react-resizable-panels | `npx shadcn@latest add resizable` |
| Scroll Area | @radix-ui/react-scroll-area | `npx shadcn@latest add scroll-area` |
| Select | @radix-ui/react-select | `npx shadcn@latest add select` |
| Separator | @radix-ui/react-separator | `npx shadcn@latest add separator` |
| Sheet | @radix-ui/react-dialog | `npx shadcn@latest add sheet` |
| Slider | @radix-ui/react-slider | `npx shadcn@latest add slider` |
| Switch | @radix-ui/react-switch | `npx shadcn@latest add switch` |
| Tabs | @radix-ui/react-tabs | `npx shadcn@latest add tabs` |
| Toggle | @radix-ui/react-toggle | `npx shadcn@latest add toggle` |
| Toggle Group | @radix-ui/react-toggle-group | `npx shadcn@latest add toggle-group` |
| Tooltip | @radix-ui/react-tooltip | `npx shadcn@latest add tooltip` |

---

## Skip shadcn — write Rocket HOC directly

These are pure styling components (CVA + HTML element). Installing via shadcn would just add
a file we'd immediately overwrite. Write the HOC directly using the hoc-template.md shapes.

| Component | What it is |
|---|---|
| Alert | styled div with icon + message layout |
| Badge | styled span, CVA variants |
| Breadcrumb | styled nav + ol + li |
| Button | CVA + Slot — no Radix state machine |
| Button Group | styled div wrapper |
| Calendar | built on react-day-picker (install separately if needed) |
| Card | styled div with header/content/footer slots |
| Carousel | built on embla-carousel (install separately if needed) |
| Chart | built on recharts (install separately if needed) |
| Combobox | composed from Command + Popover — install those individually |
| Command | built on cmdk (install separately if needed) |
| Data Table | composed from Table + tanstack/react-table |
| Date Picker | composed from Calendar + Popover |
| Drawer | built on vaul (install separately if needed) |
| Input | styled input element |
| Input Group | styled wrapper for Input with addons |
| Input OTP | built on input-otp (install separately if needed) |
| Native Select | styled native `<select>` element |
| Pagination | styled nav with prev/next links |
| Skeleton | animated styled div |
| Spinner | animated SVG/div |
| Table | styled table/thead/tbody/tr/td |
| Textarea | styled textarea element |
| Toast / Sonner | built on sonner (install separately if needed) |
| Typography | styled heading/paragraph utilities |

---

## Notes

- **Button** uses `Slot` from `radix-ui` only for `asChild` prop delegation — not a state machine.
  Import `Slot` directly from `@radix-ui/react-slot` (already installed).
- **Label** IS Radix-backed — `@radix-ui/react-label` provides accessible `for` association.
- **Separator** IS Radix-backed — provides `role="separator"` and `aria-orientation`.
- **Avatar** IS Radix-backed — provides image load detection and fallback state machine.
- **Combobox** and **Date Picker** are compositions, not primitives — build by combining
  their constituent shadcn primitives.
- When this doc feels stale, re-sync from:
  `gh api repos/shadcn-ui/ui/contents/apps/v4/content/docs/components/radix --jq '.[].name'`
