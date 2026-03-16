# HOC Template

Use this as the basis for every Rocket component. Pick the CVA shape that matches the
component's dimension matrix, then fill in the bracketed parts.

---

## CVA shape decision

```
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
