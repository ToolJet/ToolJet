---
name: shadcn-to-v3
description: Use when a shadcn component has been installed via npx/pnpm dlx and needs conversion from Tailwind v4 syntax to v3.4 with tw- prefix. Triggers after any `shadcn add` command in a project that uses Tailwind v3.4 with a prefix.
---

# shadcn → Tailwind v3.4 Conversion

## Overview

shadcn CLI generates components with Tailwind v4 class syntax. This project uses **Tailwind v3.4 with `tw-` prefix**. Every shadcn-installed file must be converted before use.

Run this immediately after every `npx shadcn@latest add <component>` or `pnpm dlx shadcn@latest add <component>`.

---

## Step 1: Find modified files

```bash
git diff --name-only
```

Also check:
```bash
git status --short | grep "src/components/ui/Rocket/shadcn/"
```

---

## Step 2: Check for issues before editing

Run all three checks on each file:

```bash
FILE="frontend/src/components/ui/Rocket/shadcn/<component>.jsx"

# Check 1: utility classes missing tw- prefix
grep -n 'className' "$FILE" | grep -P '(?<!["\s:])(?<!tw-)\b(flex|grid|block|inline|hidden|items-|justify-|self-|w-|h-|min-|max-|size-|p-|px-|py-|pt-|pr-|pb-|pl-|m-|mx-|my-|mt-|mr-|mb-|ml-|gap-|space-|divide-|bg-|text-|border|rounded|shadow|ring|outline|opacity|font-|leading-|tracking-|align-|cursor-|select-|overflow-|z-|aspect-|col-|row-|sr-only|truncate|whitespace-|break-|underline|italic|uppercase|capitalize|lowercase|transition|duration-|ease-|delay-|animate-|scale-|rotate-|translate-|skew-)' || echo "✅ No missing prefixes found"

# Check 2: v4 important syntax (! at end)
grep -n '\b\w\+!' "$FILE" | grep -v '// ' || echo "✅ No v4 important syntax found"

# Check 3: modifiers with tw- prefix (wrong)
grep -n 'tw-hover:\|tw-focus:\|tw-active:\|tw-disabled:\|tw-group-\|tw-peer-\|tw-data-\|tw-aria-\|tw-md:\|tw-sm:\|tw-lg:\|tw-xl:\|tw-2xl:\|tw-dark:' "$FILE" || echo "✅ No incorrect modifier prefixes found"
```

---

## Step 3: Apply conversions

### Rule 1 — Add `tw-` to utility classes (most common)

**Pattern:** bare Tailwind utility inside a className string, not after a modifier `:`

```jsx
// v4 (wrong in this project)
className="flex items-center gap-2 rounded-md border p-4 text-sm font-medium"

// v3.4 (correct)
className="tw-flex tw-items-center tw-gap-2 tw-rounded-md tw-border tw-p-4 tw-text-sm tw-font-medium"
```

### Rule 2 — Modifier prefix rule (CRITICAL)

Modifiers get **NO** `tw-`. The utility class after `:` gets `tw-`.

```jsx
// v4 (wrong)
"hover:bg-accent focus:outline-none disabled:opacity-50"
// ✅ v3.4
"hover:tw-bg-accent focus:tw-outline-none disabled:tw-opacity-50"

// ALSO wrong (tw- on modifier)
"tw-hover:bg-accent tw-focus:outline-none"
// ✅ correct
"hover:tw-bg-accent focus:tw-outline-none"
```

**Modifier list — never add `tw-` to these:**
`hover:` `focus:` `focus-visible:` `focus-within:` `active:` `disabled:` `checked:` `selected:`
`group-hover:` `group-focus:` `group-data-[...]:` `group-has-[...]:` `group-[...]/name:`
`peer-data-[...]:` `peer-checked:` `peer-[...]/name:`
`dark:` `md:` `sm:` `lg:` `xl:` `2xl:`
`data-[...]:` `aria-[...]:` `not-[...]:` `has-[...]:` `is-[...]:` `where-[...]:`
`first:` `last:` `odd:` `even:` `nth-[...]:` `before:` `after:` `placeholder:`

**Complex selector examples:**
```jsx
// v4 (wrong)
"group-data-[state=open]:rotate-180"
// ✅ v3.4
"group-data-[state=open]:tw-rotate-180"

// v4 (wrong)
"peer-data-[size=sm]/menu-button:top-1"
// ✅ v3.4
"peer-data-[size=sm]/menu-button:tw-top-1"

// [[data-sidebar=menu-action]] complex selectors — modifier part unchanged
"[[data-sidebar=menu-action]]:tw-right-1"          // ✅ already correct
"group-has-[[data-sidebar=menu-action]]:tw-pr-8"   // ✅ already correct
```

### Rule 3 — Fix v4 important syntax

```jsx
// v4 (wrong): ! at end
"tw-size-8!  tw-p-0!  tw-opacity-100!"

// ✅ v3.4: ! at start, before tw-
"!tw-size-8  !tw-p-0  !tw-opacity-100"
```

Also handles non-prefixed:
```jsx
// v4 without prefix
"size-8!  p-0!"
// ✅ v3.4
"!tw-size-8  !tw-p-0"
```

### Rule 4 — Negative utilities

```jsx
// v4
"-ml-1  -translate-x-1"
// ✅ v3.4
"-tw-ml-1  -tw-translate-x-1"
```

### Rule 5 — cn() and clsx() calls

Same rules apply inside `cn()` / `clsx()` arguments:
```jsx
// v4
cn("flex items-center", isOpen && "bg-accent")
// ✅ v3.4
cn("tw-flex tw-items-center", isOpen && "tw-bg-accent")
```

### Rule 6 — CVA (class-variance-authority) base and variants

```jsx
// v4
cva("flex items-center gap-2", {
  variants: {
    size: { sm: "h-8 px-2", default: "h-10 px-4" }
  }
})
// ✅ v3.4
cva("tw-flex tw-items-center tw-gap-2", {
  variants: {
    size: { sm: "tw-h-8 tw-px-2", default: "tw-h-10 tw-px-4" }
  }
})
```

---

## Step 4: Handle globals.css modifications

shadcn may append to `src/styles/globals.css` — this file uses Tailwind v4 syntax and is **NOT loaded in production** in this project.

```bash
git diff frontend/src/styles/globals.css
```

If modified:
1. Copy any new **CSS variable definitions** only (lines like `--sidebar-ring: oklch(...)`) to `frontend/src/_styles/componentdesign.scss` under `:root {}` and `.dark-theme {}` — converting oklch values to hex if needed (check Figma or use an oklch converter)
2. Revert globals.css: `git checkout frontend/src/styles/globals.css`

---

## Step 5: Verify — no issues remain

```bash
FILE="frontend/src/components/ui/Rocket/shadcn/<component>.jsx"

# Must return 0 matches for each:

# v4 important syntax
grep -n '\w!' "$FILE"

# Modifier with tw- (wrong)
grep -n 'tw-hover:\|tw-focus:\|tw-active:\|tw-disabled:\|tw-dark:\|tw-md:\|tw-sm:\|tw-lg:' "$FILE"

# Check for common unprefixed utilities (expand list as needed)
grep -onP '"[^"]*(?<![:\w])(flex|grid|block|hidden|items-center|justify-center|gap-\d|p-\d|px-\d|py-\d|w-|h-|bg-|text-\w|border(?!-\w)|rounded(?!-\w)|font-|overflow-)[^"]*"' "$FILE" | grep -v 'tw-'
```

If all return empty, the conversion is complete.

---

## Quick reference — modifier vs utility decision

Ask: **does the class come BEFORE or AFTER a `:`?**

- Before `:` → it's a modifier → **NO `tw-`**
- After `:` OR standalone → it's a utility → **YES `tw-`**

```
hover    :  tw-bg-accent
───────     ────────────
modifier    utility (needs tw-)
(no tw-)
```

---

## Common mistakes

| Mistake | Example | Fix |
|---|---|---|
| tw- on modifier | `tw-hover:bg-red` | `hover:tw-bg-red` |
| tw- on both | `tw-hover:tw-bg-red` | `hover:tw-bg-red` |
| v4 important | `tw-h-8!` | `!tw-h-8` |
| Missing prefix | `flex items-center` | `tw-flex tw-items-center` |
| Negative missing | `-ml-1` | `-tw-ml-1` |

---

## Integration with create-rocket-component

This skill must run automatically inside `create-rocket-component` after every `npx shadcn@latest add` step, before the Rocket HOC is generated. The HOC imports from the converted file — if the file has v4 classes, the HOC will break visually.
