import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button as ShadcnButton } from '@/components/ui/Rocket/shadcn/button';

const buttonVariants = cva(
  [
    // Resets not covered by shadcn base
    'tw-border-0 tw-border-solid tw-appearance-none tw-outline-none',
    // Override shadcn focus ring with ToolJet token
    'focus-visible:tw-ring-2 focus-visible:tw-ring-[var(--interactive-focus-outline)] focus-visible:tw-ring-offset-1',
  ],
  {
    variants: {
      variant: {
        primary: [
          'tw-bg-button-primary tw-text-text-on-solid tw-shadow-elevation-100',
          'hover:tw-bg-button-primary-hover',
          'active:tw-bg-button-primary-pressed',
          'disabled:tw-bg-button-primary-disabled',
        ],
        secondary: [
          'tw-bg-button-secondary tw-text-text-brand tw-border tw-border-border-accent-weak tw-shadow-elevation-100',
          'hover:tw-bg-button-secondary-hover',
          'active:tw-bg-button-secondary-pressed',
          'disabled:tw-bg-button-secondary-disabled',
        ],
        ghost: [
          'tw-bg-transparent',
          'tw-text-text-medium',
          'hover:tw-bg-interactive-hover',
          'active:tw-bg-interactive-selected',
        ],
        ghostBrand: [
          'tw-bg-transparent',
          'tw-text-text-brand',
          'hover:tw-bg-interactive-hover',
          'active:tw-bg-interactive-selected',
        ],
        outline: [
          'tw-bg-button-outline tw-text-text-medium tw-border tw-border-border-weak',
          'hover:tw-bg-button-outline-hover',
          'active:tw-bg-button-outline-pressed',
        ],
      },
      size: {
        large: 'tw-h-10 tw-px-4 tw-text-lg tw-gap-1.5',
        default: 'tw-h-8 tw-px-3 tw-text-base tw-gap-1.5',
        medium: 'tw-h-7 tw-px-3 tw-text-base tw-gap-1',
        small: 'tw-h-5 tw-px-2 tw-text-sm tw-gap-1',
      },
      danger: {
        true: '',
        false: '',
      },
      iconOnly: {
        true: 'tw-px-0',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'primary',
        danger: true,
        class: [
          'tw-bg-button-danger-primary',
          'hover:tw-bg-button-danger-primary-hover',
          'active:tw-bg-button-danger-primary-pressed',
          'disabled:tw-bg-button-danger-primary-disabled',
        ],
      },
      {
        variant: 'secondary',
        danger: true,
        class: 'tw-border-border-danger-weak tw-text-text-danger',
      },
      // iconOnly — square dimensions per size
      { iconOnly: true, size: 'large', class: 'tw-w-10' },
      { iconOnly: true, size: 'default', class: 'tw-w-8' },
      { iconOnly: true, size: 'medium', class: 'tw-w-7' },
      { iconOnly: true, size: 'small', class: 'tw-w-5' },
    ],
    defaultVariants: { variant: 'primary', size: 'default', danger: false, iconOnly: false },
  }
);

const Button = forwardRef(function Button(
  {
    className,
    variant,
    size,
    danger = false,
    iconOnly = false,
    loading = false,
    disabled,
    leadingVisual,
    trailingVisual,
    children,
    ...props
  },
  ref
) {
  return (
    <ShadcnButton
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, danger, iconOnly }), className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="tw-h-4 tw-w-4 tw-animate-spin" />
      ) : (
        <>
          {leadingVisual && <span className="tw-shrink-0">{leadingVisual}</span>}
          {children}
          {trailingVisual && <span className="tw-shrink-0">{trailingVisual}</span>}
        </>
      )}
    </ShadcnButton>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'ghostBrand', 'outline']),
  size: PropTypes.oneOf(['large', 'default', 'medium', 'small']),
  danger: PropTypes.bool,
  iconOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  asChild: PropTypes.bool,
  leadingVisual: PropTypes.node,
  trailingVisual: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
};

export { Button, buttonVariants };
