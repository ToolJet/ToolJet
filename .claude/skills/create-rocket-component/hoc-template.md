# HOC Template

Use this as the basis for every Rocket component. Pick the CVA shape that matches the
component's dimension matrix, then fill in the bracketed parts.

---

## CVA shape decision

```
Is it a compound/multi-part component? (Root + Content + Item + …)
  └── YES → Shape E: compound (multiple wrappers, shared context, re-exports)

Has visual variants? (primary/secondary/danger…)
  ├── YES + has sizes  → Shape A: full CVA (variants + size)
  ├── YES + no sizes   → Shape B: CVA (variants only)
  └── NO
       ├── has sizes   → Shape C: CVA (size only)
       └── no sizes    → Shape D: no CVA — static cn() call
```

---

## Shape A — variants + sizes (e.g. Button)

```jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { [ShadcnName] as Shadcn[Name] } from '@/components/ui/Rocket/shadcn/[name]';

const [name]Variants = cva(
  [
    'tw-inline-flex tw-items-center',
    'tw-transition-colors',
    'focus-visible:tw-outline-none',
    'focus-visible:tw-ring-2 focus-visible:tw-ring-[var(--interactive-focus-outline)] focus-visible:tw-ring-offset-1',
    'disabled:tw-pointer-events-none disabled:tw-cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        // Use ToolJet token classes — never shadcn semantic classes (tw-bg-primary etc.)
        [variant1]: [
          'tw-bg-button-primary tw-text-text-on-solid',
          'hover:tw-bg-button-primary-hover',
          'active:tw-bg-button-primary-pressed',
          'disabled:tw-bg-button-primary-disabled disabled:tw-text-text-disabled',
        ],
        // add more variants…
      },
      size: {
        sm:      'tw-h-7 tw-px-3 tw-text-sm tw-rounded-md',
        default: 'tw-h-8 tw-px-4 tw-text-base tw-rounded-md',
        lg:      'tw-h-9 tw-px-5 tw-text-lg tw-rounded-lg',
      },
    },
    defaultVariants: { variant: '[default]', size: 'default' },
  }
);

const [Name] = forwardRef(function [Name](
  { className, variant, size, ...props },
  ref
) {
  return (
    <Shadcn[Name]
      ref={ref}
      className={cn([name]Variants({ variant, size }), className)}
      {...props}
    />
  );
});

[Name].displayName = '[Name]';

[Name].propTypes = {
  variant: PropTypes.oneOf([/* list variants */]),
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  className: PropTypes.string,
};

export { [Name], [name]Variants };
```

---

## Shape B — variants only, no sizes (e.g. Badge)

Drop the `size` key from CVA, from destructuring, and from PropTypes.

```jsx
const [name]Variants = cva(
  ['tw-inline-flex tw-items-center tw-rounded-full tw-border tw-transition-colors'],
  {
    variants: {
      variant: {
        [variant1]: 'tw-bg-background-accent-weak tw-text-text-brand tw-border-border-accent-weak',
        // add more variants…
      },
    },
    defaultVariants: { variant: '[default]' },
  }
);

const [Name] = forwardRef(function [Name](
  { className, variant, ...props },
  ref
) {
  return (
    <Shadcn[Name]
      ref={ref}
      className={cn([name]Variants({ variant }), className)}
      {...props}
    />
  );
});

[Name].propTypes = {
  variant: PropTypes.oneOf([/* list variants */]),
  className: PropTypes.string,
};
```

---

## Shape C — sizes only, no visual variants (e.g. Spinner, Avatar)

Drop the `variant` key from CVA, from destructuring, and from PropTypes.

```jsx
const [name]Variants = cva(
  ['tw-rounded-full tw-bg-background-surface-layer-02'],
  {
    variants: {
      size: {
        sm:      'tw-h-6 tw-w-6',
        default: 'tw-h-8 tw-w-8',
        lg:      'tw-h-10 tw-w-10',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const [Name] = forwardRef(function [Name](
  { className, size, ...props },
  ref
) {
  return (
    <Shadcn[Name]
      ref={ref}
      className={cn([name]Variants({ size }), className)}
      {...props}
    />
  );
});

[Name].propTypes = {
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  className: PropTypes.string,
};
```

---

## Shape D — no variants, no sizes (e.g. Separator, Skeleton)

No CVA needed. Static base classes, `cn()` for className override passthrough.
Still export a `[name]Classes` constant so callers can reference the base classes if needed.

```jsx
const [name]Classes = [
  'tw-bg-border-default',
  'tw-shrink-0',
].join(' ');

const [Name] = forwardRef(function [Name](
  { className, ...props },
  ref
) {
  return (
    <Shadcn[Name]
      ref={ref}
      className={cn([name]Classes, className)}
      {...props}
    />
  );
});

[Name].propTypes = {
  className: PropTypes.string,
};

export { [Name], [name]Classes };
```

---

## Shape E — compound / multi-part components (e.g. Combobox, Select, InputGroup)

Some shadcn components are **compound** — they export multiple sub-components (Root, Input,
Content, Item, etc.) that work together. These don't fit Shapes A–D because:

- Multiple sub-components each need their own styled wrapper
- Sub-components may share state via React context (e.g. anchor refs)
- The root component may need to inject default props (e.g. `selectionMode`)
- Some sub-components need CVA; others just need static `cn()` overrides

### Pattern

```jsx
import React, { forwardRef, createContext, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  [Name] as Shadcn[Name],
  [Name]Part as Shadcn[Name]Part,
  // Re-exported unchanged (no visual tokens to override)
  [Name]OtherPart,
} from '@/components/ui/Rocket/shadcn/[name]';

// ── Shared context (if sub-components need to communicate) ────────────────
// Example: anchor ref for dropdown width matching
const [Name]AnchorContext = createContext(null);

// ── Sub-component with CVA (the "main" styled part) ──────────────────────
const [name]PartVariants = cva(
  [/* base classes using ToolJet tokens */],
  {
    variants: {
      size: {
        large: '...',
        default: '...',
        small: '...',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const [Name]Part = forwardRef(function [Name]Part(
  { className, size, ...props },
  ref
) {
  return (
    <Shadcn[Name]Part
      ref={ref}
      className={cn([name]PartVariants({ size }), className)}
      {...props}
    />
  );
});
[Name]Part.displayName = '[Name]Part';

// ── Sub-component with static styling ────────────────────────────────────
const [Name]OtherPart = forwardRef(function [Name]OtherPart(
  { className, ...props },
  ref
) {
  return (
    <Shadcn[Name]OtherPart
      ref={ref}
      className={cn('tw-token-class tw-another-token', className)}
      {...props}
    />
  );
});

// ── Root (context provider + default props) ──────────────────────────────
function [Name](props) {
  const anchorRef = useRef(null);
  return (
    <[Name]AnchorContext.Provider value={anchorRef}>
      <Shadcn[Name] {...props} />
    </[Name]AnchorContext.Provider>
  );
}

// ── Exports ──────────────────────────────────────────────────────────────
export {
  [Name],
  [Name]Part,
  [name]PartVariants,
  // Re-exports from shadcn (no visual tokens to override)
  [Name]OtherPart,
};
```

### Key rules for compound components

| Rule | Details |
|---|---|
| **forwardRef on EVERY sub-component** | Base UI uses `React.cloneElement` with refs for internal state. A missing ref breaks features silently (see below). |
| **Re-export unchanged parts** | If a shadcn sub-component has no visual tokens to override, re-export it directly — don't wrap it. |
| **Context for cross-part state** | Use React context when sub-components need shared state (e.g. anchor ref for dropdown positioning). |
| **Default props on root** | Set sensible defaults that differ from Base UI's internals (e.g. `selectionMode`). |
| **One CVA per styled sub-component** | Not every sub-component needs CVA — many just need a static `cn()` call. |

### forwardRef — THE critical rule for compound components

**Every Rocket wrapper component that gets used as a `render` prop target MUST use `forwardRef`.**

Base UI's `useRenderElement` calls `React.cloneElement(renderElement, { ref, value, ... })`.
In React 18, if the target component is NOT wrapped in `forwardRef`, the ref is silently dropped.
This breaks Base UI's internal state management — it can't find DOM elements it needs.

**Real failure case (Combobox):** `InputGroupInput` was a plain function (no `forwardRef`).
Base UI's `ComboboxPrimitive.Input` passed a ref through `render={<InputGroupInput />}`.
The ref was dropped → `setInputElement` never ran → `inputInsidePopup` stayed at default `true`
→ `shouldFillInput` evaluated to `false` → selecting an item never updated the input value.
The fix: wrapping `InputGroupInput` in `forwardRef`.

**Rule of thumb:** If a Rocket component is ever passed as `render={<Component />}` or used
inside `React.cloneElement`, it MUST forward its ref. When in doubt, always use `forwardRef`.

---

## For components not available in shadcn (rare)

Only use this when shadcn does not provide the component at all (e.g. Spinner).
Use a plain HTML element or `Slot` from `@radix-ui/react-slot` as base.

```jsx
import { Slot } from '@radix-ui/react-slot';

const [Name] = forwardRef(function [Name](
  { className, variant, size, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'div'; // or 'span', etc.
  return (
    <Comp
      ref={ref}
      className={cn([name]Variants({ variant, size }), className)}
      {...props}
    />
  );
});
```

**This is the exception, not the rule.** Default to installing + wrapping shadcn.

---

## Token reference (most common)

```
Background:    tw-bg-button-primary / tw-bg-background-surface-layer-01
Text:          tw-text-text-default / tw-text-text-on-solid / tw-text-text-brand
Border:        tw-border-border-default / tw-border-border-accent-strong
Icon:          tw-text-icon-default / tw-text-icon-strong / tw-text-icon-on-solid
Focus ring:    focus-visible:tw-ring-[var(--interactive-focus-outline)]
Hover overlay: hover:tw-bg-interactive-hover
Shadow:        tw-shadow-elevation-100
Border radius: tw-rounded-sm (4px) / tw-rounded-md (6px) / tw-rounded-lg (8px)
```
