# shadcn/ui Component Reference

> Source: https://github.com/shadcn-ui/ui/tree/main/apps/v4/content/docs/components/radix
> Synced: 2026-03-18 | shadcn CLI version at sync: 4.x

This is the authoritative local reference for deciding whether to install a shadcn primitive
or write the Rocket HOC directly.

## Decision rule

> Can you run `npx shadcn@latest add {name}` and get a component that wraps a headless
> primitive (Radix, Base UI, cmdk, vaul, react-day-picker, embla, input-otp, sonner)?
> - **Yes** → install via CLI, run `shadcn-to-v3` skill, then wrap in Rocket HOC
> - **No (pure styling)** → write Rocket HOC directly (no shadcn install)
>
> **Registry bug (as of 2026-03-18):** Some newer components (e.g. Combobox) only exist
> in the `new-york-v4` registry, not `new-york`. If `npx shadcn@latest add {name}` returns
> a 404, try: `npx shadcn@latest add https://ui.shadcn.com/r/styles/new-york-v4/{name}.json`

---

## Use shadcn CLI — headless-backed

These components wrap real headless primitives with state machines, focus management, keyboard
nav, and/or ARIA roles. Install via CLI, convert with `shadcn-to-v3`, then wrap in Rocket HOC.

### Radix-backed

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
| Direction | @radix-ui/react-direction | `npx shadcn@latest add direction` |
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

### Base UI backed

| Component | Library | CLI command |
|---|---|---|
| Combobox | @base-ui/react | `npx shadcn@latest add https://ui.shadcn.com/r/styles/new-york-v4/combobox.json` |

### Third-party library backed

These wrap non-Radix headless libraries but ARE installable via shadcn CLI and provide
useful structural primitives worth wrapping.

| Component | Library | CLI command |
|---|---|---|
| Calendar | react-day-picker | `npx shadcn@latest add calendar` |
| Carousel | embla-carousel-react | `npx shadcn@latest add carousel` |
| Command | cmdk | `npx shadcn@latest add command` |
| Drawer | vaul | `npx shadcn@latest add drawer` |
| Input OTP | input-otp | `npx shadcn@latest add input-otp` |
| Sonner | sonner | `npx shadcn@latest add sonner` |

---

## Skip shadcn — write Rocket HOC directly

These are pure styling components (CVA + HTML element). No headless primitive underneath.
Write the HOC directly using the hoc-template.md shapes.

| Component | What it is |
|---|---|
| Alert | styled div with icon + message layout |
| Badge | styled span, CVA variants |
| Breadcrumb | styled nav + ol + li |
| Button | CVA + Slot — no Radix state machine |
| Button Group | styled div wrapper |
| Card | styled div with header/content/footer slots |
| Chart | styled wrapper for recharts |
| Empty | empty state placeholder layout |
| Field | styled form field wrapper (label + input + error) |
| Form | form layout/validation wrapper |
| Input | styled input element |
| Input Group | styled wrapper for Input with addons |
| Item | generic styled list item |
| Kbd | styled keyboard shortcut indicator |
| Native Select | styled native `<select>` element |
| Pagination | styled nav with prev/next links |
| Sidebar | styled sidebar layout |
| Skeleton | animated styled div |
| Spinner | animated SVG/div |
| Table | styled table/thead/tbody/tr/td |
| Textarea | styled textarea element |
| Typography | styled heading/paragraph utilities |

---

## Composition patterns — docs-only, not in registry

These appear in shadcn docs as usage examples but have no registry entry (`npx shadcn add` returns 404).
Build them by composing their constituent installed primitives.

| Pattern | Composed from | Notes |
|---|---|---|
| Data Table | Table + @tanstack/react-table | Sortable/filterable table |
| Date Picker | Calendar + Popover | Date selection dropdown |

---

## Notes

- **Button** uses `Slot` from `radix-ui` only for `asChild` prop delegation — not a state machine.
  Import `Slot` directly from `@radix-ui/react-slot` (already installed).
- **Label** IS Radix-backed — `@radix-ui/react-label` provides accessible `for` association.
- **Separator** IS Radix-backed — provides `role="separator"` and `aria-orientation`.
- **Avatar** IS Radix-backed — provides image load detection and fallback state machine.
- **Direction** provides RTL/LTR context via `@radix-ui/react-direction`.
- **Command** wraps `cmdk` — provides search/filter state machine, keyboard nav, grouping.
- **Combobox** wraps `@base-ui/react` — standalone primitive with built-in search, filtering,
  multi-select (chips), and positioning. NOT a Command + Popover composition (that was the old pattern).
  Requires `new-york-v4` registry URL due to shadcn registry bug.
- **Drawer** wraps `vaul` — provides swipe-to-dismiss, snap points, nested drawers.
- **Sonner** wraps `sonner` — provides toast notifications with stacking, swipe dismiss.
- When this doc feels stale, re-sync from:
  `gh api repos/shadcn-ui/ui/contents/apps/v4/content/docs/components/radix --jq '.[].name'`
