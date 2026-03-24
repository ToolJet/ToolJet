import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Toggle as ShadcnToggle } from '@/components/ui/Rocket/shadcn/toggle';

// Shared base classes for Toggle and ToggleGroup items
const toggleBaseClasses = [
  'tw-inline-flex tw-items-center tw-justify-center',
  'tw-font-medium tw-whitespace-nowrap tw-transition-colors',
  'tw-border-0 tw-border-solid tw-appearance-none tw-outline-none',
  'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-1',
  'disabled:tw-pointer-events-none disabled:tw-opacity-50',
  // Override shadcn leaks
  '!tw-min-w-0', // shadcn forces min-w-9
  '[&_svg]:tw-size-auto', // shadcn forces svg to size-4 (16px)
  // Auto-square when only child is an icon (svg)
  '[&:has(>svg:only-child)]:tw-aspect-square [&:has(>svg:only-child)]:tw-px-0',
];

const toggleVariants = cva(
  [
    ...toggleBaseClasses,
    'data-[state=off]:tw-shadow-elevation-100',
    'tw-gap-1.5 tw-rounded-md',
    'tw-text-text-medium',
    'hover:tw-bg-interactive-hover',
    'data-[state=on]:tw-bg-interactive-selected data-[state=on]:tw-text-text-default',
  ],
  {
    variants: {
      variant: {
        ghost: 'tw-bg-transparent',
        outline: 'tw-bg-transparent tw-border tw-border-border-weak',
      },
      size: {
        large: 'tw-h-10 tw-px-2.5 tw-text-lg',
        default: 'tw-h-8 tw-px-2 tw-text-base',
        medium: 'tw-h-7 tw-px-1.5 tw-text-base',
        small: 'tw-h-5 tw-px-1 tw-text-sm',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'default' },
  }
);

const Toggle = forwardRef(function Toggle({ className, variant, size, ...props }, ref) {
  return <ShadcnToggle ref={ref} className={cn(toggleVariants({ variant, size }), className)} {...props} />;
});

Toggle.displayName = 'Toggle';

Toggle.propTypes = {
  variant: PropTypes.oneOf(['ghost', 'outline']),
  size: PropTypes.oneOf(['large', 'default', 'medium', 'small']),
  pressed: PropTypes.bool,
  defaultPressed: PropTypes.bool,
  onPressedChange: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export { Toggle, toggleVariants, toggleBaseClasses };
