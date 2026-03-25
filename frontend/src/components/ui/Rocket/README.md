# Rocket — ToolJet Design System

Rocket is ToolJet's component library built on a 3-layer architecture: shadcn/Radix primitives, Rocket HOCs with CVA + ToolJet design tokens, and composed Blocks/Features.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Blocks / Features          (composed UI + state)   │
├─────────────────────────────────────────────────────┤
│  Rocket HOCs                (CVA + ToolJet tokens)  │
│  src/components/ui/Rocket/{Name}/{Name}.jsx         │
├─────────────────────────────────────────────────────┤
│  shadcn primitives          (Radix, never edited)   │
│  src/components/ui/Rocket/shadcn/                   │
└─────────────────────────────────────────────────────┘
```

- **shadcn layer**: CLI-installed Radix wrappers. Never hand-edited. See `shadcn/ARCHITECTURE.md`.
- **HOC layer**: Wraps shadcn with `className` override using CVA variants + ToolJet token classes + tailwind-merge. This is where all visual styling lives.
- **Blocks/Features**: Composed patterns with real application state (future).

## Components

| Component | Sub-components | Key features |
|---|---|---|
| Button | — | 6 variants, 3 sizes, danger, icon-only, loading |
| Avatar | — | 7 sizes (xs–2xl), image + fallback initials |
| InlineInfo | — | 3 types (info/warning/danger) × 4 variants |
| Input | — | 3 sizes, error/disabled, browser resets |
| Field | FieldLabel, FieldDescription, FieldError, FieldGroup + 5 more | Form field composition |
| InputGroup | InputGroupAddon, InputGroupButton, InputGroupInput + 3 more | Grouped input pattern |
| Select | SelectTrigger, SelectContent, SelectItem + 4 more | Native-feel dropdown |
| Combobox | ComboboxInput, ComboboxContent, ComboboxItem + 8 more | Searchable, filterable |
| Toggle | — | ghost/outline × 4 sizes |
| ToggleGroup | ToggleGroupItem | Segmented control |
| Pagination | PaginationContent, PaginationLink + 4 more | 3 sizes via context |
| Tooltip | TooltipTrigger, TooltipContent, TooltipArrow | Side, align, custom content |
| Label | — | default/description variants |
| DropdownMenu | 10 sub-components | Checkbox/radio items, sub-menus |
| Dialog | DialogContent, DialogHeader, DialogBody, DialogFooter + 6 more | 5 sizes + fullscreen |
| Empty | EmptyHeader, EmptyMedia, EmptyTitle + 3 more | SVG illustrations, page-level states |
| Breadcrumb | BreadcrumbList, BreadcrumbLink, BreadcrumbPage + 3 more | Ellipsis, custom separator |
| Tabs | TabsList, TabsTrigger, TabsContent | 3 variants × 3 sizes |

## Usage

```jsx
import { Button, Input, Field, FieldLabel, FieldError } from '@/components/ui/Rocket';
```

Always import from the barrel (`Rocket/index.js`), never from individual component directories.

## Running Storybook

```bash
cd frontend && npm run storybook
```

All 18 components have stories demonstrating variants, sizes, states, and composition patterns.

---

## Developer guide: building new components

### Adding a component (with Claude Code)

```bash
# This runs the full workflow: Figma spec → shadcn install → HOC + stories
/create-rocket-component Badge
```

### Adding a component (manual or other LLMs)

1. **Check if a shadcn primitive exists** — see `.claude/skills/create-rocket-component/shadcn-reference.md`
2. If yes: install via `npx shadcn@latest add <name>`, then convert with the `shadcn-to-v3` skill
3. Create a `.spec.md` from Figma (see any existing component's spec as reference)
4. Write the HOC following CVA patterns in `.claude/skills/create-rocket-component/hoc-template.md`
5. Write Storybook stories following `.claude/skills/create-rocket-component/story-template.md`
6. Export from `Rocket/index.js`

### Key files to reference

| File | Purpose |
|---|---|
| `tailwind.config.js` | All available token classes |
| `src/_styles/componentdesign.scss` | Token source of truth (CSS vars, light + dark) |
| `src/lib/utils.js` | `cn()` — prefix-aware tailwind-merge |
| `components.json` | shadcn CLI config |
| `src/components/ui/Rocket/index.js` | Barrel — all public exports |
| `.claude/skills/create-rocket-component/hoc-template.md` | CVA shape patterns A–E with examples |
| `.claude/skills/create-rocket-component/shadcn-reference.md` | Which components have shadcn primitives |
| Any component's `.spec.md` | Example design spec format |

### Rules

1. **Tailwind prefix**: Utility classes always get `tw-` prefix. Modifiers (`hover:`, `dark:`, `focus-visible:`) never do.
2. **Important syntax**: `!tw-h-8` not `tw-h-8!`
3. **Token layer**: HOCs use ToolJet tokens only (`tw-bg-button-primary`). Never use shadcn semantic tokens (`tw-bg-primary`).
4. **Border**: `tw-border-solid` is required alongside border color (preflight is off).
5. **Never edit shadcn**: Files in `Rocket/shadcn/` are CLI-managed. Regenerate, don't edit.
6. **Size props**: Use `small | default | large` — not `sm | md | lg`.
7. **Typography**: Use `tw-font-*` plugin utilities, never manual font combos.
8. **forwardRef**: All components must forward refs.
9. **displayName**: Set on all components.
10. **Imports**: Always use `cn()` from `@/lib/utils` for class merging.

### Component anatomy (example: Button)

```jsx
import React, { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button as ShadcnButton } from '@/components/ui/Rocket/shadcn/button';

const buttonVariants = cva(
  ['tw-border-0 tw-border-solid ...base classes...'],
  {
    variants: {
      variant: {
        primary: ['tw-bg-button-primary tw-text-text-on-solid ...'],
        secondary: ['tw-bg-button-secondary ...'],
      },
      size: {
        default: ['tw-h-9 tw-px-4 tw-font-body-default'],
        small: ['tw-h-7 tw-px-3 tw-font-body-small'],
        large: ['tw-h-11 tw-px-5 tw-font-body-large'],
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
);

const Button = forwardRef(({ variant, size, className, ...props }, ref) => (
  <ShadcnButton
    ref={ref}
    className={cn(buttonVariants({ variant, size }), className)}
    {...props}
  />
));
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Design spec format

Each component has a `.spec.md` co-located with its source. These are machine-readable specs extracted from Figma containing:
- Token mappings (which CSS vars map to which visual properties)
- Variant matrix (all combinations of variant × size × state)
- Sizing table (height, padding, icon size, gap per size)
- Sub-component API (for compound components)

Spec files serve as the contract between design (Figma) and code.
