# HOC Template

Use this as the basis for every Rocket component. Fill in the bracketed parts.

## For components that wrap a shadcn primitive

```jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
// Import the shadcn primitive — NEVER edit the file it points to
import { [ShadcnName] as Shadcn[Name] } from '@/components/ui/Rocket/shadcn/[name]';

const [name]Variants = cva(
  // Base classes shared by all variants
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
          'tw-bg-[token] tw-text-[token]',
          'hover:tw-bg-[token-hover]',
          'active:tw-bg-[token-pressed]',
          'disabled:tw-bg-[token-disabled] disabled:tw-text-text-disabled',
        ],
      },
      size: {
        sm:      'tw-h-[Xpx] tw-px-[Xpx] tw-text-sm tw-rounded-md',
        default: 'tw-h-[Xpx] tw-px-[Xpx] tw-text-base tw-rounded-md',
        lg:      'tw-h-[Xpx] tw-px-[Xpx] tw-text-lg tw-rounded-lg',
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
      // Map ToolJet props → shadcn props here if names differ
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

## For components that don't need a shadcn primitive

Same as above but:
- No shadcn import
- Use `'[element]'` or `Slot` from `@radix-ui/react-slot` as the base element
- Import `{ Slot } from '@radix-ui/react-slot'` and add `asChild` prop if needed

```jsx
import { Slot } from '@radix-ui/react-slot';

const [Name] = forwardRef(function [Name](
  { className, variant, size, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button'; // or 'span', 'div', etc.
  return (
    <Comp
      ref={ref}
      className={cn([name]Variants({ variant, size }), className)}
      {...props}
    />
  );
});
```

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
