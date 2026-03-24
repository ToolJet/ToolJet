# Rocket v2 Design System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish the Rocket v2 design system — a HOC wrapper layer over shadcn/Radix primitives, token-mapped to ToolJet's design tokens, with dark mode support, co-located Storybook stories, and an interactive `create-rocket-component` skill.

**Architecture:**
- `src/components/ui/Rocket/shadcn/` — shadcn primitives, installed via CLI, **never hand-edited**
- `src/components/ui/Rocket/{Name}/{Name}.jsx` — Rocket HOC wrappers that map ToolJet's API → shadcn API + ToolJet tokens
- Token source: `src/_styles/componentdesign.scss` (loaded after Tailwind in `theme.scss`)
- shadcn semantic vars (`--primary`, `--background`, etc.) are overridden in `componentdesign.scss` to point to ToolJet tokens

**Tech Stack:** React 18 (JSX), Tailwind CSS v3.4 (`tw-` prefix), CVA, clsx + tailwind-merge, Radix UI, shadcn/ui (new-york style), Storybook 7, `@/lib/utils` for `cn()`

**Tailwind rules (IMPORTANT):**
- Modifiers (`md:`, `hover:`, `group-data-[...]:`, `dark:`) — NO `tw-` prefix
- Utility classes (`flex`, `bg-blue-500`) — ALWAYS have `tw-` prefix
- Complex data selectors (`[[data-sidebar=menu-action]]`) — correct as-is

---

## Codebase Context (READ BEFORE STARTING)

Key paths:
- `frontend/tailwind.config.js` — Tailwind v3 config with `tw-` prefix, `darkMode: ['class']` (BROKEN — needs fix, see Task 0.2)
- `frontend/src/_styles/componentdesign.scss` — **Token source of truth**: CSS vars for light/dark, loaded in `theme.scss` after Tailwind utilities
- `frontend/src/_styles/theme.scss` — Main SCSS entry, imports componentdesign.scss last
- `frontend/src/lib/utils.js` — `cn()` utility (classnames + tailwind-merge with tw- prefix)
- `frontend/components.json` — shadcn config: style=new-york, tsx=false, prefix=tw-, "ui" alias = `@/components/ui` (MUST UPDATE, see Task 0.5)
- `frontend/src/styles/globals.css` — shadcn-generated, uses Tailwind v4 syntax — **NOT loaded in production**, only used by shadcn CLI. Do not edit.
- `frontend/.storybook/main.js` — scans `src/**/*.stories.@(js|jsx|...)` (co-located stories just work)
- `frontend/.storybook/decorators.jsx` — `withColorScheme` sets `.dark-theme` class when Storybook dark bg is selected

Existing `src/components/ui/Button/Button.jsx` — quality implementation using CVA + Radix Slot. Study it as the reference pattern for HOCs. Rocket/Button will be a **new file** (not a copy) that follows the same pattern but lives in the Rocket/ directory.

Already installed (no need to reinstall):
- `class-variance-authority` (CVA)
- `classnames` + `tailwind-merge`
- `@radix-ui/react-slot`
- `lucide-react`

---

## Phase 0: Foundation

### Task 0.1: Install the shadcn/ui Claude Code skill

**Why first:** The official shadcn skill auto-activates when `components.json` is present and equips every subsequent Claude session with deep knowledge of the shadcn CLI, component composition rules, and our project config. It must be in place before the first `shadcn add`.

```bash
cd frontend && pnpm dlx skills add shadcn/ui
```

What it gives Claude:
- Runs `shadcn info --json` → reads our `components.json` (style, aliases, `tw-` prefix)
- Full CLI reference: `add`, `diff`, `info`, `docs`, `search`
- Understands Tailwind v3.4 patterns including prefix handling
- Will correctly use `@/components/ui/Rocket/shadcn` as the install target after Task 0.5

**Note:** This installs to `~/.claude/skills/` — no git commit needed.

**Works alongside:**
- `shadcn-to-v3` skill (already installed) — converts v4 syntax after install
- `create-rocket-component` skill (Phase 5) — uses both of the above internally

---

### Task 0.2: Create the branch

**Step 1: Verify you're on the right base**
```bash
cd frontend && git log --oneline -5
git branch
```
Expected: you should be on `lts-3.16` or can create from it.

**Step 2: Create branch**
```bash
git checkout lts-3.16
git checkout -b design/rocket-v2
```

**Step 3: Verify**
```bash
git branch
```
Expected: `* design/rocket-v2`

---

### Task 0.2: Fix dark mode selector in tailwind.config.js

**Why:** The app uses `.dark-theme` CSS class for dark mode (set by Storybook decorator and ToolJet's theme system). Tailwind's `dark:` modifier currently looks for `.dark` class — meaning no `dark:` utilities work in our codebase.

**File:** `frontend/tailwind.config.js`

**Step 1: Read the file first**
Read `frontend/tailwind.config.js` lines 1–10.

**Step 2: Make the fix**

Change:
```js
darkMode: ['class'],
```

To:
```js
darkMode: ['class', '[class~="dark-theme"]'],
```

This makes `dark:tw-text-white` apply whenever `.dark-theme` is present on any ancestor element.

**Step 3: Also fix the typo on line 31**

Change:
```js
'background-warning-stong': 'var(--background-warning-stong)',
```

To:
```js
'background-warning-strong': 'var(--background-warning-strong)',
```

> Note: `componentdesign.scss` has `--background-warning-strong` defined (no typo there). The tailwind.config.js had the typo. After this fix, `tw-bg-background-warning-strong` will work.

**Step 4: Commit**
```bash
git add frontend/tailwind.config.js
git commit -m "fix(tailwind): use .dark-theme selector for dark: modifier, fix warning-strong typo"
```

---

### Task 0.3: Add missing tokens + shadcn semantic bridges to componentdesign.scss

**Why:** Two things needed:
1. Radius tokens (currently hardcoded as px values in components — e.g. `tw-rounded-[8px]`)
2. shadcn semantic CSS var bridges — shadcn primitives reference `--primary`, `--background`, `--ring`, etc. internally. We override these to point to our ToolJet tokens, so installed shadcn components automatically use our design language without any extra work in Rocket HOCs.

**File:** `frontend/src/_styles/componentdesign.scss`

**Step 1: Read current file bottom (to find the right insertion point)**
Read `frontend/src/_styles/componentdesign.scss` — look at where `:root {` ends (around line 124).

**Step 2: Add to the `:root {}` block** (before the closing `}` on ~line 124):

```scss
    // ── Radius tokens ─────────────────────────────────────────────────
    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-xl: 12px;
    --radius-full: 9999px;

    // ── Overlay / backdrop ─────────────────────────────────────────────
    --overlay-backdrop: rgba(0, 0, 0, 0.5);

    // ── shadcn semantic bridges ────────────────────────────────────────
    // These map shadcn's expected CSS vars to our ToolJet design tokens.
    // shadcn-installed primitives in Rocket/shadcn/ reference these vars internally.
    // Rocket HOC wrappers use ToolJet tailwind classes directly (tw-bg-button-primary etc.)
    // and do NOT rely on these shadcn vars — but the underlying Radix behaviour does.
    --background: var(--background-surface-layer-01);
    --foreground: var(--text-default);
    --card: var(--background-surface-layer-01);
    --card-foreground: var(--text-default);
    --popover: var(--background-surface-layer-01);
    --popover-foreground: var(--text-default);
    --primary: var(--button-primary);
    --primary-foreground: var(--text-on-solid);
    --secondary: var(--background-surface-layer-02);
    --secondary-foreground: var(--text-default);
    --muted: var(--background-surface-layer-02);
    --muted-foreground: var(--text-medium);
    --accent: var(--background-accent-weak);
    --accent-foreground: var(--text-brand);
    --destructive: var(--background-error-strong);
    --destructive-foreground: var(--text-on-solid);
    --border: var(--border-default);
    --input: var(--border-default);
    --ring: var(--interactive-focus-outline);
    --radius: var(--radius-md);
    --sidebar: var(--background-surface-layer-01);
    --sidebar-foreground: var(--text-default);
    --sidebar-border: var(--border-weak);
    --sidebar-ring: var(--interactive-focus-outline);
    --sidebar-primary: var(--button-primary);
    --sidebar-primary-foreground: var(--text-on-solid);
    --sidebar-accent: var(--interactive-hover);
    --sidebar-accent-foreground: var(--text-default);
```

**Step 3: Add the same bridges to `.dark-theme {}` block** (before its closing `}`):

```scss
    // ── Radius tokens (same values — radius doesn't change in dark mode) ─
    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-xl: 12px;
    --radius-full: 9999px;

    // ── Overlay / backdrop ─────────────────────────────────────────────
    --overlay-backdrop: rgba(0, 0, 0, 0.7);

    // ── shadcn semantic bridges (dark overrides) ───────────────────────
    --background: var(--background-surface-layer-01);
    --foreground: var(--text-default);
    --card: var(--background-surface-layer-01);
    --card-foreground: var(--text-default);
    --popover: var(--background-surface-layer-02);
    --popover-foreground: var(--text-default);
    --primary: var(--button-primary);
    --primary-foreground: var(--text-on-solid);
    --secondary: var(--background-surface-layer-02);
    --secondary-foreground: var(--text-default);
    --muted: var(--background-surface-layer-03);
    --muted-foreground: var(--text-medium);
    --accent: var(--background-accent-weak);
    --accent-foreground: var(--text-brand);
    --destructive: var(--background-error-strong);
    --destructive-foreground: var(--text-on-solid);
    --border: var(--border-default);
    --input: var(--border-default);
    --ring: var(--interactive-focus-outline);
    --radius: var(--radius-md);
    --sidebar: var(--background-surface-layer-02);
    --sidebar-foreground: var(--text-default);
    --sidebar-border: var(--border-weak);
    --sidebar-ring: var(--interactive-focus-outline);
    --sidebar-primary: var(--button-primary);
    --sidebar-primary-foreground: var(--text-on-solid);
    --sidebar-accent: var(--interactive-hover);
    --sidebar-accent-foreground: var(--text-default);
```

Also add to tailwind.config.js `colors` object (for `tw-bg-radius-*` to work — actually no, radius isn't a color; instead add to `borderRadius`):

In `tailwind.config.js`, inside `theme.extend`, add:
```js
borderRadius: {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-full)',
},
```

This enables `tw-rounded-sm`, `tw-rounded-md`, `tw-rounded-lg`, `tw-rounded-xl` to use our tokens.

**Step 4: Commit**
```bash
git add frontend/src/_styles/componentdesign.scss frontend/tailwind.config.js
git commit -m "feat(tokens): add radius tokens, overlay, shadcn semantic bridges for light + dark"
```

---

### Task 0.4: Update components.json to install shadcn to Rocket/shadcn/

**Why:** Currently `npx shadcn@latest add button` installs to `src/components/ui/button.jsx`. We want it at `src/components/ui/Rocket/shadcn/button.jsx`.

**File:** `frontend/components.json`

**Step 1: Read current file**
Read `frontend/components.json`.

**Step 2: Update the `"ui"` alias**

Change:
```json
"ui": "@/components/ui",
```
To:
```json
"ui": "@/components/ui/Rocket/shadcn",
```

Full resulting file:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": "tw-"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui/Rocket/shadcn",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Step 3: Create the directory**
```bash
mkdir -p frontend/src/components/ui/Rocket/shadcn
```

**Step 4: Commit**
```bash
git add frontend/components.json
git commit -m "feat(shadcn): route shadcn CLI installs to Rocket/shadcn/ directory"
```

---

### Task 0.5: Create Rocket/shadcn/ARCHITECTURE.md

**Why:** This is the most important guard against accidental edits. Every AI agent or engineer that enters this folder should immediately know the rule.

**File:** `frontend/src/components/ui/Rocket/shadcn/ARCHITECTURE.md`

**Step 1: Create the file**

```markdown
# Rocket/shadcn/ — Source Material

## THE RULE: Never hand-edit files in this directory.

Files here are installed by the shadcn CLI:
```
npx shadcn@latest add <component>
```

They are **source material**, not source code. Treat them like `node_modules`.

## Why

- `npx shadcn@latest add <component> --overwrite` must always be safe to run
- This directory gets replaced wholesale when components are updated
- Any customization here will be lost silently

## Where to customize instead

**Rocket HOC wrappers live one level up:**
```
src/components/ui/Rocket/Button/Button.jsx   ← your code goes here
src/components/ui/Rocket/Input/Input.jsx
src/components/ui/Rocket/Badge/Badge.jsx
...
```

HOC wrappers import from this directory:
```jsx
import { Button as ShadcnButton } from '@/components/ui/Rocket/shadcn/button';
```

## Architecture diagram

```
shadcn/button.jsx          ← installed, never touched
       ↓ imported by
Rocket/Button/Button.jsx   ← ToolJet API: variants, sizes, tokens
       ↓ used by
Blocks, Widgets, Features
```

## Token strategy

Rocket HOC wrappers use ToolJet Tailwind token classes directly:
- ✅ `tw-bg-button-primary`
- ✅ `tw-text-text-on-solid`
- ❌ `tw-bg-primary` (shadcn semantic — don't use in HOCs)

shadcn's own CSS vars (`--primary`, `--background`, etc.) are overridden in
`src/_styles/componentdesign.scss` to point to our ToolJet values, so shadcn's
internal behaviour (focus rings, selection states from Radix) gets our colours
without needing explicit overrides in every HOC.

## Adding a new component

Use the `create-rocket-component` skill, or manually:
1. `cd frontend && npx shadcn@latest add <component>`
2. Verify it installed to `Rocket/shadcn/<component>.jsx`
3. Create `Rocket/<Name>/<Name>.jsx` (HOC wrapper)
4. Create `Rocket/<Name>/<Name>.stories.jsx`
```

**Step 2: Commit**
```bash
git add frontend/src/components/ui/Rocket/shadcn/ARCHITECTURE.md
git commit -m "docs(rocket): add shadcn/ directory architecture guard"
```

---

### Task 0.6: Create Rocket/index.js — the public API barrel

**Why:** Consumers import from one place. When internal structure changes, only the barrel needs to update.

**File:** `frontend/src/components/ui/Rocket/index.js`

```js
// Rocket — ToolJet Design System Components
// Import from here, not from individual files.

export { Button, buttonVariants } from './Button/Button';
// Add exports here as components are added:
// export { Input } from './Input/Input';
// export { Badge, badgeVariants } from './Badge/Badge';
```

**Step 2: Commit**
```bash
git add frontend/src/components/ui/Rocket/index.js
git commit -m "feat(rocket): add public API barrel export"
```

---

## Phase 1: Rocket Button

The existing `src/components/ui/Button/Button.jsx` is a high-quality reference implementation. We create a **new** `Rocket/Button/Button.jsx` that follows the same patterns but is the canonical Rocket-layer component. The old Button stays unchanged for now (existing consumers aren't broken).

Key differences in Rocket/Button vs old Button:
- Lives in `Rocket/Button/`
- Does NOT wrap a shadcn primitive (Button is simple enough to use CVA + Radix Slot directly — double-wrapping adds zero value for primitives this simple)
- All `disabled:` states use the correct Tailwind disabled: modifier (not `tw-disabled:`)
- No `Button.scss` import — pure Tailwind
- Exported from `Rocket/index.js`

### Task 1.1: Create Rocket/Button/Button.jsx

**File:** `frontend/src/components/ui/Rocket/Button/Button.jsx`

```jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { DynamicIcon } from 'lucide-react/dynamic.mjs';
import { cn } from '@/lib/utils';

// ── Variant definitions ──────────────────────────────────────────────────────
// Rule: modifiers (hover:, active:, disabled:, dark:) have NO tw- prefix.
// Rule: utility classes (bg, text, border, rounded, px, h) have tw- prefix.
// Rule: ToolJet token classes (tw-bg-button-primary) are used — NOT shadcn semantic classes.

const buttonVariants = cva(
  [
    'tw-inline-flex tw-items-center tw-justify-center tw-gap-2',
    'tw-font-medium tw-whitespace-nowrap tw-transition-colors',
    'focus-visible:tw-outline-none',
    'focus-visible:tw-ring-2 focus-visible:tw-ring-[var(--interactive-focus-outline)] focus-visible:tw-ring-offset-2',
    'disabled:tw-pointer-events-none disabled:tw-cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        primary: [
          'tw-bg-button-primary tw-text-text-on-solid tw-border-none',
          'tw-shadow-elevation-000',
          'hover:tw-bg-button-primary-hover',
          'active:tw-bg-button-primary-pressed active:tw-border-border-accent-strong',
          'disabled:tw-bg-button-primary-disabled',
        ],
        secondary: [
          'tw-bg-button-secondary tw-text-text-brand',
          'tw-border tw-border-solid tw-border-border-accent-weak',
          'tw-shadow-elevation-000',
          'hover:tw-bg-button-secondary-hover hover:tw-border-border-accent-strong',
          'active:tw-bg-button-secondary-pressed active:tw-border-border-accent-strong',
          'disabled:tw-bg-button-secondary-disabled disabled:tw-text-text-disabled disabled:tw-border-border-default',
        ],
        outline: [
          'tw-bg-button-outline tw-text-text-default',
          'tw-border tw-border-solid tw-border-border-default',
          'tw-shadow-elevation-000',
          'hover:tw-bg-button-outline-hover',
          'active:tw-bg-button-outline-pressed active:tw-border-border-strong',
          'disabled:tw-bg-button-outline-disabled disabled:tw-text-text-disabled',
        ],
        ghost: [
          'tw-bg-transparent tw-text-text-default tw-border-none',
          'hover:tw-bg-button-outline-hover',
          'active:tw-bg-button-outline-pressed',
          'disabled:tw-bg-transparent disabled:tw-text-text-disabled',
        ],
        ghostBrand: [
          'tw-bg-transparent tw-text-text-accent tw-border-none',
          'hover:tw-bg-button-secondary-hover',
          'active:tw-bg-button-secondary-pressed',
          'disabled:tw-bg-transparent disabled:tw-text-text-disabled',
        ],
        dangerPrimary: [
          'tw-bg-button-danger-primary tw-text-text-on-solid tw-border-none',
          'tw-shadow-elevation-000',
          'hover:tw-bg-button-danger-primary-hover',
          'active:tw-bg-button-danger-primary-pressed',
          'disabled:tw-bg-button-danger-primary-disabled',
        ],
        dangerSecondary: [
          'tw-bg-button-secondary tw-text-text-default',
          'tw-border tw-border-solid tw-border-border-danger-weak',
          'tw-shadow-elevation-000',
          'hover:tw-bg-button-danger-secondary-hover hover:tw-border-border-danger-strong',
          'active:tw-bg-button-danger-secondary-pressed active:tw-border-border-danger-strong',
          'disabled:tw-bg-button-danger-secondary-disabled disabled:tw-text-text-disabled disabled:tw-border-border-default',
        ],
      },
      size: {
        large:   'tw-h-[40px] tw-rounded-lg tw-text-lg',
        default: 'tw-h-[32px] tw-rounded-md tw-text-base',
        medium:  'tw-h-[28px] tw-rounded-md tw-text-base',
        small:   'tw-h-[20px] tw-rounded-md tw-text-sm',
      },
      iconOnly: {
        true:  '',
        false: '',
      },
    },
    compoundVariants: [
      // icon-only: square buttons
      { iconOnly: true,  size: 'large',   className: 'tw-w-[40px] tw-px-[10px]' },
      { iconOnly: true,  size: 'default', className: 'tw-w-[32px] tw-px-[7px]'  },
      { iconOnly: true,  size: 'medium',  className: 'tw-w-[28px] tw-px-[5px]'  },
      { iconOnly: true,  size: 'small',   className: 'tw-w-[20px] tw-px-[2px]'  },
      // text buttons: horizontal padding
      { iconOnly: false, size: 'large',   className: 'tw-px-[20px] tw-py-[10px]' },
      { iconOnly: false, size: 'default', className: 'tw-px-[12px] tw-py-[7px]'  },
      { iconOnly: false, size: 'medium',  className: 'tw-px-[10px] tw-py-[5px]'  },
      { iconOnly: false, size: 'small',   className: 'tw-px-[8px]  tw-py-[2px]'  },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      iconOnly: false,
    },
  }
);

// ── Icon size map ────────────────────────────────────────────────────────────
const ICON_SIZE = { large: 16, default: 14, medium: 12, small: 10 };

// ── Component ────────────────────────────────────────────────────────────────
const Button = forwardRef(function Button(
  {
    className,
    variant = 'primary',
    size = 'default',
    asChild = false,
    iconOnly = false,
    leadingIcon,
    trailingIcon,
    isLoading = false,
    disabled,
    children,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot : 'button';
  const iconSize = ICON_SIZE[size] ?? 14;

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, iconOnly, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        // Minimal loader: keeps button width stable by rendering invisible children
        <span className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-size-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-current tw-border-t-transparent" />
          {!iconOnly && <span className="tw-invisible">{children}</span>}
        </span>
      ) : (
        <>
          {leadingIcon && (
            <DynamicIcon name={leadingIcon} size={iconSize} aria-hidden />
          )}
          {children}
          {trailingIcon && (
            <DynamicIcon name={trailingIcon} size={iconSize} aria-hidden />
          )}
        </>
      )}
    </Comp>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'ghostBrand', 'dangerPrimary', 'dangerSecondary']),
  size: PropTypes.oneOf(['large', 'default', 'medium', 'small']),
  iconOnly: PropTypes.bool,
  asChild: PropTypes.bool,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  leadingIcon: PropTypes.string,
  trailingIcon: PropTypes.string,
  className: PropTypes.string,
};

export { Button, buttonVariants };
```

**Step 2: Commit**
```bash
git add frontend/src/components/ui/Rocket/Button/Button.jsx
git commit -m "feat(rocket/button): add Rocket Button HOC with CVA variants and dark mode"
```

---

### Task 1.2: Create Rocket/Button/Button.stories.jsx

**File:** `frontend/src/components/ui/Rocket/Button/Button.stories.jsx`

Story structure: CSF3 (component story format 3). One story per distinct use case. Dark mode is handled automatically by the Storybook decorator (sets `.dark-theme` on the wrapper when dark background selected).

```jsx
import React from 'react';
import { Button } from './Button';

export default {
  title: 'Rocket/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'ghostBrand', 'dangerPrimary', 'dangerSecondary'],
    },
    size: {
      control: 'select',
      options: ['large', 'default', 'medium', 'small'],
    },
  },
};

// ── Single variant stories ───────────────────────────────────────────────────

export const Primary = { args: { children: 'Button', variant: 'primary' } };
export const Secondary = { args: { children: 'Button', variant: 'secondary' } };
export const Outline = { args: { children: 'Button', variant: 'outline' } };
export const Ghost = { args: { children: 'Button', variant: 'ghost' } };
export const GhostBrand = { args: { children: 'Button', variant: 'ghostBrand' } };
export const DangerPrimary = { args: { children: 'Delete', variant: 'dangerPrimary' } };
export const DangerSecondary = { args: { children: 'Delete', variant: 'dangerSecondary' } };

// ── States ───────────────────────────────────────────────────────────────────

export const Loading = { args: { children: 'Saving...', variant: 'primary', isLoading: true } };
export const Disabled = { args: { children: 'Disabled', variant: 'primary', disabled: true } };

// ── With icons ───────────────────────────────────────────────────────────────

export const WithLeadingIcon = {
  args: { children: 'Create app', variant: 'primary', leadingIcon: 'plus' },
};
export const WithTrailingIcon = {
  args: { children: 'Open', variant: 'outline', trailingIcon: 'external-link' },
};
export const IconOnly = {
  args: { variant: 'ghost', iconOnly: true, leadingIcon: 'settings', 'aria-label': 'Settings' },
};
export const IconOnlyDanger = {
  args: { variant: 'dangerPrimary', iconOnly: true, leadingIcon: 'trash-2', 'aria-label': 'Delete' },
};

// ── Sizes ────────────────────────────────────────────────────────────────────

export const Sizes = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-3">
      <Button size="large">Large</Button>
      <Button size="default">Default</Button>
      <Button size="medium">Medium</Button>
      <Button size="small">Small</Button>
    </div>
  ),
};

// ── All variants ─────────────────────────────────────────────────────────────

export const AllVariants = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {['primary', 'secondary', 'outline', 'ghost', 'ghostBrand', 'dangerPrimary', 'dangerSecondary'].map(
        (variant) => (
          <div key={variant} className="tw-flex tw-items-center tw-gap-3">
            <span className="tw-w-36 tw-text-sm tw-text-text-medium font-title-default">{variant}</span>
            <Button variant={variant} leadingIcon="rocket">
              Button
            </Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
            <Button variant={variant} isLoading>
              Loading
            </Button>
          </div>
        )
      )}
    </div>
  ),
  parameters: { layout: 'padded' },
};
```

**Step 2: Update Rocket/index.js to export Button**
Already done in Task 0.6. Verify it's correct.

**Step 3: Commit**
```bash
git add frontend/src/components/ui/Rocket/Button/Button.stories.jsx
git commit -m "feat(rocket/button): add Storybook stories for all variants, sizes, states"
```

---

## Phase 2: Rocket Input

Input wraps the shadcn `input` primitive, which handles the native input element behaviour correctly. Our HOC adds: ToolJet token styling, label, helper text, validation states, leading/trailing slots.

### Task 2.1: Install shadcn input primitive

**Step 1: Run install**
```bash
cd frontend && npx shadcn@latest add input
```

Expected: creates `src/components/ui/Rocket/shadcn/input.jsx`

**Step 2: Verify location**
```bash
ls frontend/src/components/ui/Rocket/shadcn/
```
Expected: `input.jsx` (and `ARCHITECTURE.md`)

**Step 3: Check if globals.css was modified**
```bash
git diff frontend/src/styles/globals.css
```
If shadcn added something to globals.css that we need (like new CSS vars), copy only the CSS vars portion to `componentdesign.scss`. Then revert globals.css.

**Step 4: Run shadcn-to-v3 conversion (REQUIRED)**

The shadcn CLI generates Tailwind v4 syntax. Use the `shadcn-to-v3` skill to convert to v3.4:
```
invoke: shadcn-to-v3
file: frontend/src/components/ui/Rocket/shadcn/input.jsx
```

Verify all checks pass before committing.

**Step 5: Commit the shadcn file only**
```bash
git add frontend/src/components/ui/Rocket/shadcn/input.jsx
git commit -m "chore(shadcn): install + v3.4-convert input primitive to Rocket/shadcn/"
```

---

### Task 2.2: Create Rocket/Input/Input.jsx

**File:** `frontend/src/components/ui/Rocket/Input/Input.jsx`

Design spec for Input:
- **Sizes**: `sm` (28px), `default` (32px), `lg` (40px)
- **States**: default, focus, error, success, disabled
- **Slots**: leading icon, trailing icon/element
- **Label**: optional, above input
- **Helper text**: optional, below input (error overrides helper text)

```jsx
import React, { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import { DynamicIcon } from 'lucide-react/dynamic.mjs';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ── Wrapper (outermost label+input+helper container) ─────────────────────────
const inputWrapperVariants = cva('tw-flex tw-flex-col tw-gap-1', {
  variants: {
    fullWidth: { true: 'tw-w-full', false: '' },
  },
  defaultVariants: { fullWidth: false },
});

// ── Input container (icon slots + native input) ───────────────────────────────
// state is 'default' | 'error' | 'success' | 'disabled'
const inputContainerVariants = cva(
  [
    'tw-flex tw-items-center tw-gap-2',
    'tw-rounded-md tw-border tw-border-solid',
    'tw-transition-colors',
    'focus-within:tw-ring-2 focus-within:tw-ring-[var(--interactive-focus-outline)] focus-within:tw-ring-offset-1',
  ],
  {
    variants: {
      size: {
        sm:      'tw-h-[28px] tw-px-[8px]  tw-text-sm',
        default: 'tw-h-[32px] tw-px-[10px] tw-text-base',
        lg:      'tw-h-[40px] tw-px-[12px] tw-text-lg',
      },
      state: {
        default:  'tw-bg-background-surface-layer-01 tw-border-border-default hover:tw-border-border-strong',
        error:    'tw-bg-background-surface-layer-01 tw-border-border-danger-strong',
        success:  'tw-bg-background-surface-layer-01 tw-border-border-success-strong',
        disabled: 'tw-bg-background-surface-layer-02 tw-border-border-disabled tw-cursor-not-allowed',
      },
    },
    defaultVariants: { size: 'default', state: 'default' },
  }
);

// ── Native <input> (unstyled, stretches to fill container) ───────────────────
const nativeInputClass = [
  'tw-flex-1 tw-min-w-0 tw-bg-transparent tw-outline-none',
  'tw-text-text-default tw-placeholder-text-placeholder',
  'disabled:tw-cursor-not-allowed disabled:tw-text-text-disabled',
].join(' ');

// ── Component ────────────────────────────────────────────────────────────────
const Input = forwardRef(function Input(
  {
    className,
    size = 'default',
    label,
    helperText,
    errorText,
    successText,
    leadingIcon,
    trailingIcon,
    trailingElement,
    fullWidth = false,
    disabled = false,
    id: idProp,
    ...props
  },
  ref
) {
  const autoId = useId();
  const id = idProp ?? autoId;

  // Derive state from props — errorText > successText > disabled > default
  const state = disabled
    ? 'disabled'
    : errorText
    ? 'error'
    : successText
    ? 'success'
    : 'default';

  const subText = errorText ?? successText ?? helperText;
  const subTextClass = cn(
    'tw-text-sm',
    state === 'error'   && 'tw-text-text-danger',
    state === 'success' && 'tw-text-text-success',
    !errorText && !successText && 'tw-text-text-medium',
  );

  return (
    <div className={inputWrapperVariants({ fullWidth })}>
      {label && (
        <label
          htmlFor={id}
          className="font-title-default tw-text-text-default"
        >
          {label}
        </label>
      )}

      <div className={cn(inputContainerVariants({ size, state }), className)}>
        {leadingIcon && (
          <DynamicIcon
            name={leadingIcon}
            size={14}
            className="tw-shrink-0 tw-text-icon-default"
            aria-hidden
          />
        )}

        <input
          ref={ref}
          id={id}
          disabled={disabled}
          className={nativeInputClass}
          {...props}
        />

        {trailingElement ?? (trailingIcon && (
          <DynamicIcon
            name={trailingIcon}
            size={14}
            className="tw-shrink-0 tw-text-icon-default"
            aria-hidden
          />
        ))}
      </div>

      {subText && (
        <span className={subTextClass}>{subText}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  label: PropTypes.string,
  helperText: PropTypes.string,
  errorText: PropTypes.string,
  successText: PropTypes.string,
  leadingIcon: PropTypes.string,
  trailingIcon: PropTypes.string,
  trailingElement: PropTypes.node,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  className: PropTypes.string,
};

export { Input };
```

**Step 2: Update Rocket/index.js**

Add to the exports:
```js
export { Input } from './Input/Input';
```

**Step 3: Commit**
```bash
git add frontend/src/components/ui/Rocket/Input/Input.jsx frontend/src/components/ui/Rocket/index.js
git commit -m "feat(rocket/input): add Rocket Input HOC with states, icons, label, helper text"
```

---

### Task 2.3: Create Rocket/Input/Input.stories.jsx

**File:** `frontend/src/components/ui/Rocket/Input/Input.stories.jsx`

```jsx
import React, { useState } from 'react';
import { Input } from './Input';

export default {
  title: 'Rocket/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export const Default = {
  args: { placeholder: 'Enter value...' },
};

export const WithLabel = {
  args: { label: 'Email address', placeholder: 'you@company.com' },
};

export const WithHelperText = {
  args: { label: 'API key', placeholder: 'sk-...', helperText: 'Find this in your account settings.' },
};

export const ErrorState = {
  args: {
    label: 'Email address',
    placeholder: 'you@company.com',
    defaultValue: 'not-an-email',
    errorText: 'Please enter a valid email address.',
  },
};

export const SuccessState = {
  args: {
    label: 'Username',
    defaultValue: 'nithin',
    successText: 'Username is available.',
  },
};

export const Disabled = {
  args: { label: 'API endpoint', defaultValue: 'https://api.tooljet.io', disabled: true },
};

export const WithLeadingIcon = {
  args: { placeholder: 'Search...', leadingIcon: 'search' },
};

export const WithTrailingIcon = {
  args: { type: 'email', placeholder: 'you@company.com', trailingIcon: 'mail' },
};

export const Sizes = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-w-72">
      <Input size="sm" placeholder="Small (28px)" label="Small" />
      <Input size="default" placeholder="Default (32px)" label="Default" />
      <Input size="lg" placeholder="Large (40px)" label="Large" />
    </div>
  ),
};

export const PasswordToggle = {
  render: () => {
    const [visible, setVisible] = useState(false);
    return (
      <Input
        type={visible ? 'text' : 'password'}
        label="Password"
        placeholder="Enter password"
        trailingElement={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="tw-text-icon-default hover:tw-text-icon-strong"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {/* inline dynamic import for brevity */}
            <span className="tw-text-sm">{visible ? '🙈' : '👁'}</span>
          </button>
        }
      />
    );
  },
};

export const FullWidth = {
  render: () => (
    <div className="tw-w-96">
      <Input label="Full width input" placeholder="Stretches to container" fullWidth />
    </div>
  ),
};
```

**Step 2: Commit**
```bash
git add frontend/src/components/ui/Rocket/Input/Input.stories.jsx
git commit -m "feat(rocket/input): add Storybook stories for all states, sizes, slots"
```

---

## Phase 3: Rocket Badge

Badge is a pure CVA component — no shadcn primitive needed (Radix has no Badge primitive).

### Task 3.1: Create Rocket/Badge/Badge.jsx

Design spec:
- **Variants**: `default` (neutral), `accent` (brand), `success`, `warning`, `danger`, `outline`
- **Sizes**: `sm`, `default`, `lg`
- **Optional**: dot indicator, leading icon, dismissible

**File:** `frontend/src/components/ui/Rocket/Badge/Badge.jsx`

```jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { DynamicIcon } from 'lucide-react/dynamic.mjs';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  [
    'tw-inline-flex tw-items-center tw-gap-1 tw-font-medium',
    'tw-whitespace-nowrap tw-rounded-full',
  ],
  {
    variants: {
      variant: {
        default: [
          'tw-bg-background-surface-layer-03 tw-text-text-medium',
          'tw-border tw-border-solid tw-border-border-default',
        ],
        accent: [
          'tw-bg-background-accent-weak tw-text-text-brand',
          'tw-border tw-border-solid tw-border-border-accent-weak',
        ],
        success: [
          'tw-bg-background-success-weak tw-text-text-success',
          'tw-border tw-border-solid tw-border-border-success-weak',
        ],
        warning: [
          'tw-bg-background-warning-weak tw-text-text-warning',
          'tw-border tw-border-solid tw-border-border-warning-weak',
        ],
        danger: [
          'tw-bg-background-error-weak tw-text-text-danger',
          'tw-border tw-border-solid tw-border-border-danger-weak',
        ],
        outline: [
          'tw-bg-transparent tw-text-text-medium',
          'tw-border tw-border-solid tw-border-border-default',
        ],
      },
      size: {
        sm:      'tw-h-[18px] tw-px-[6px]  tw-text-sm',
        default: 'tw-h-[22px] tw-px-[8px]  tw-text-sm',
        lg:      'tw-h-[26px] tw-px-[10px] tw-text-base',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

// Dot colour matches the variant text colour
const DOT_CLASS = {
  default: 'tw-bg-text-medium',
  accent:  'tw-bg-text-brand',
  success: 'tw-bg-text-success',
  warning: 'tw-bg-text-warning',
  danger:  'tw-bg-text-danger',
  outline: 'tw-bg-text-medium',
};

const Badge = forwardRef(function Badge(
  { className, variant = 'default', size = 'default', dot, icon, onDismiss, children, ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn('tw-size-[6px] tw-rounded-full tw-shrink-0', DOT_CLASS[variant])}
          aria-hidden
        />
      )}
      {icon && !dot && (
        <DynamicIcon name={icon} size={10} className="tw-shrink-0" aria-hidden />
      )}
      {children}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="tw-ml-0.5 tw-shrink-0 tw-opacity-70 hover:tw-opacity-100"
          aria-label="Dismiss"
        >
          <DynamicIcon name="x" size={10} aria-hidden />
        </button>
      )}
    </span>
  );
});

Badge.displayName = 'Badge';

Badge.propTypes = {
  variant: PropTypes.oneOf(['default', 'accent', 'success', 'warning', 'danger', 'outline']),
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  dot: PropTypes.bool,
  icon: PropTypes.string,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};

export { Badge, badgeVariants };
```

**Step 2: Update Rocket/index.js**
```js
export { Badge, badgeVariants } from './Badge/Badge';
```

**Step 3: Commit**
```bash
git add frontend/src/components/ui/Rocket/Badge/Badge.jsx frontend/src/components/ui/Rocket/index.js
git commit -m "feat(rocket/badge): add Rocket Badge HOC with status variants and dot/icon/dismiss"
```

---

### Task 3.2: Create Rocket/Badge/Badge.stories.jsx

**File:** `frontend/src/components/ui/Rocket/Badge/Badge.stories.jsx`

```jsx
import React from 'react';
import { Badge } from './Badge';

export default {
  title: 'Rocket/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'accent', 'success', 'warning', 'danger', 'outline'],
    },
    size: { control: 'select', options: ['sm', 'default', 'lg'] },
  },
};

export const Default = { args: { children: 'Badge' } };
export const Accent = { args: { children: 'Brand', variant: 'accent' } };
export const Success = { args: { children: 'Active', variant: 'success' } };
export const Warning = { args: { children: 'Pending', variant: 'warning' } };
export const Danger = { args: { children: 'Error', variant: 'danger' } };
export const Outline = { args: { children: 'Draft', variant: 'outline' } };

export const WithDot = { args: { children: 'Online', variant: 'success', dot: true } };
export const WithIcon = { args: { children: 'Verified', variant: 'accent', icon: 'check-circle' } };
export const Dismissible = {
  args: { children: 'Filter: Active', variant: 'accent', onDismiss: () => {} },
};

export const AllVariants = {
  render: () => (
    <div className="tw-flex tw-flex-wrap tw-gap-3">
      {['default', 'accent', 'success', 'warning', 'danger', 'outline'].map((v) => (
        <Badge key={v} variant={v} dot>
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </Badge>
      ))}
    </div>
  ),
};

export const Sizes = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-3">
      <Badge size="sm" variant="accent">Small</Badge>
      <Badge size="default" variant="accent">Default</Badge>
      <Badge size="lg" variant="accent">Large</Badge>
    </div>
  ),
};
```

**Step 2: Commit**
```bash
git add frontend/src/components/ui/Rocket/Badge/Badge.stories.jsx
git commit -m "feat(rocket/badge): add Storybook stories for all variants and states"
```

---

## Phase 4: create-rocket-component Skill

This is the `create-rocket-component` skill from the Katana skill repository. It automates the full workflow: identify component → install shadcn if needed → generate Rocket HOC → generate stories.

### Task 4.1: Create the skill file

**File:** `~/.claude/skills/create-rocket-component.md`

> Note: Skills live in the user's home directory Claude skills folder, not in the repo. After writing this skill, install it with `cp ~/.claude/skills/create-rocket-component.md ~/.claude/skills/` (already in the right place). Include it in the Katana repo at `skills/create-rocket-component/`.

The skill is documented as a separate deliverable in the Katana repo plan. This task creates the initial version.

**Step 1: Write skill to `~/.claude/skills/create-rocket-component.md`** — see the skill template below.

**Step 2: Commit the skill to the Katana repo structure (within ToolJet repo)**
```bash
mkdir -p docs/skills
```
Save skill content to `docs/skills/create-rocket-component.md`

```bash
git add docs/skills/create-rocket-component.md
git commit -m "feat(katana): add create-rocket-component skill"
```

### Skill content specification

The skill must:

1. **Greet and ask** (interactive):
   - "Which component do you want to add? (e.g. select, dialog, tooltip, combobox)"
   - "Does a matching shadcn primitive exist? (yes/no/unsure)"
   - If yes: install it. If unsure: check https://ui.shadcn.com/docs/components and ask again.

2. **Install shadcn primitive** (if applicable):
   ```bash
   cd frontend && npx shadcn@latest add {component}
   ```
   Verify it installed to `src/components/ui/Rocket/shadcn/{component}.jsx`.
   **IMMEDIATELY run `shadcn-to-v3` skill** — shadcn generates Tailwind v4 syntax; convert before any other step.
   Check `git diff src/styles/globals.css` — if modified, copy new CSS vars to componentdesign.scss, then revert globals.css.

3. **Figma MCP step** (ask):
   - "Do you have a Figma node URL for this component? (paste it or press Enter to skip)"
   - If URL provided: use Figma MCP to read the node → extract variants, prop names, states, sizes
   - If skipped: ask interactively about variants and states (see step 4)

4. **Interactive variant/state collection** (if no Figma):
   Ask in sequence:
   - "What are the visual variants? (e.g. primary, secondary, outline, ghost)"
   - "What sizes does it support? (e.g. sm, default, lg)"
   - "What interactive states? (hover, active, disabled, loading, focus — list which apply)"
   - "Any special features? (e.g. leading icon, trailing icon, clearable, counter)"

5. **Generate Rocket HOC** at `src/components/ui/Rocket/{Name}/{Name}.jsx`:
   - Uses CVA for variants and sizes
   - Imports shadcn primitive from `@/components/ui/Rocket/shadcn/{name}`
   - Uses ToolJet tailwind token classes (NOT shadcn semantic classes)
   - forwardRef, PropTypes, displayName
   - Following the Button/Badge pattern from this plan

6. **Generate stories** at `src/components/ui/Rocket/{Name}/{Name}.stories.jsx`:
   - One story per variant
   - One story per state (disabled, loading if applicable)
   - One `AllVariants` composite story
   - One `Sizes` composite story

7. **Update Rocket/index.js** barrel export

8. **Output checklist**:
   ```
   ✅ shadcn/{name}.jsx installed (if applicable)
   ✅ Rocket/{Name}/{Name}.jsx generated
   ✅ Rocket/{Name}/{Name}.stories.jsx generated
   ✅ Rocket/index.js updated

   📋 Manual TODOs:
   - [ ] Visually verify all variants match the Figma design
   - [ ] Test dark mode in Storybook (select dark background)
   - [ ] Check accessibility: keyboard nav, ARIA labels, focus ring visibility
   - [ ] Run `cd frontend && npx storybook dev` to review stories
   - [ ] Raise PR: feat(rocket/{name}): add Rocket {Name} component
   ```

---

## Phase 5: PR Strategy

Each component = one PR. Raise them in sequence.

### PR 1: Foundation (Phase 0)
Branch: `design/rocket-v2`
- Tailwind dark mode fix
- Token additions
- shadcn alias update
- ARCHITECTURE.md
- Barrel export

### PR 2: Button
- Rocket/Button/Button.jsx + stories

### PR 3: Input
- shadcn input primitive
- Rocket/Input/Input.jsx + stories

### PR 4: Badge
- Rocket/Badge/Badge.jsx + stories

### PR 5: create-rocket-component skill
- docs/skills/create-rocket-component.md

---

## Checklist — Before each PR

- [ ] `cd frontend && npx storybook dev` — all stories render
- [ ] Toggle dark mode in Storybook (dark background) — colours respond via `.dark-theme`
- [ ] `dark:` utility classes work (test by adding `dark:tw-bg-red-500` temporarily and confirming it applies)
- [ ] No hardcoded hex/rgba colour values in HOC files
- [ ] No shadcn semantic token classes in HOC files (`tw-bg-primary` etc.)
- [ ] All interactive states covered in stories (disabled, hover visual, focus ring)
- [ ] PropTypes defined for all props
- [ ] forwardRef used
- [ ] displayName set
- [ ] No `console.log` in component files

---

## Common Patterns Reference

### Dark mode in stories

Stories automatically work with dark mode because the Storybook decorator wraps them in `.dark-theme` when the dark background is selected. You don't need to add anything to stories. The `dark:` Tailwind modifier will just work after Task 0.2.

### Token classes cheat sheet

| Use case | Token class |
|---|---|
| Page background | `tw-bg-page-default` |
| Surface (card, panel) | `tw-bg-background-surface-layer-01` |
| Nested surface | `tw-bg-background-surface-layer-02` |
| Body text | `tw-text-text-default` |
| Secondary text | `tw-text-text-medium` |
| Placeholder | `tw-text-text-placeholder` |
| Brand text | `tw-text-text-brand` |
| Error text | `tw-text-text-danger` |
| Success text | `tw-text-text-success` |
| Warning text | `tw-text-text-warning` |
| Disabled text | `tw-text-text-disabled` |
| Default border | `tw-border-border-default` |
| Strong border | `tw-border-border-strong` |
| Accent border | `tw-border-border-accent-strong` |
| Focus ring | `tw-ring-[var(--interactive-focus-outline)]` |
| Primary button bg | `tw-bg-button-primary` |
| Elevation shadow 100 | `tw-shadow-elevation-100` |
| Icon default | `tw-text-icon-default` |
| Icon strong | `tw-text-icon-strong` |
| Border radius sm/md/lg | `tw-rounded-sm / tw-rounded-md / tw-rounded-lg` |

### Tailwind modifier rules

```jsx
// ✅ Correct
'hover:tw-bg-button-primary-hover'   // modifier: no tw-, utility: tw-
'disabled:tw-text-text-disabled'     // modifier: no tw-, utility: tw-
'dark:tw-bg-background-surface-layer-02'  // same rule
'focus-visible:tw-ring-2'            // same rule

// ❌ Wrong
'tw-hover:tw-bg-button-primary-hover'  // never tw- on modifier
'hover:bg-button-primary-hover'        // utility must have tw-
```

### CVA variant array syntax

```jsx
const variants = cva('tw-base-class', {
  variants: {
    variant: {
      primary: [
        'tw-bg-button-primary',
        'hover:tw-bg-button-primary-hover',    // ← modifier in array = fine
        'disabled:tw-bg-button-primary-disabled',
      ],
    },
  },
});
```

### shadcn data attribute selectors

For shadcn components that use Radix data attributes (e.g. `data-[state=open]`, `data-[disabled]`), use the correct Tailwind syntax:

```jsx
// ✅ Correct — no tw- on complex selectors
'data-[state=open]:tw-rotate-180'
'data-[disabled]:tw-opacity-50'
'group-data-[state=open]:tw-block'

// In @apply or raw CSS
// [&[data-state=open]]:tw-bg-background-accent-weak
```
