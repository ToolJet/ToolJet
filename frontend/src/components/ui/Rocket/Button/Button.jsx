import React, { forwardRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { Loader } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button as ShadcnButton } from '@/components/ui/Rocket/shadcn/button';

// Figma builds danger only for these variants; others should use secondary + danger
const DANGER_VARIANTS = {
  text: ['primary', 'secondary'],
  iconOnly: ['primary', 'secondary', 'ghost'],
};

// Inactive states key off aria-disabled (not :disabled) so loading, which stays focusable, shares the disabled look.
// Icon rules use `[&_svg]:aria-*:` order; `aria-*:[&_svg]:` would target the svg's own attribute instead.
const buttonVariants = cva(
  [
    // Overrides of the shadcn base
    'tw-relative tw-py-0 tw-border-0 tw-border-solid tw-appearance-none tw-outline-none',
    'focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline',
    'disabled:tw-opacity-100 aria-disabled:tw-pointer-events-none aria-disabled:tw-shadow-elevation-none',
    // Colored <img> visuals don't follow the disabled icon token
    '[&_img]:aria-disabled:tw-grayscale',
  ],
  {
    variants: {
      variant: {
        primary: [
          'tw-bg-button-primary tw-text-text-on-solid tw-shadow-elevation-100',
          'hover:tw-bg-button-primary-hover',
          'active:tw-bg-button-primary-pressed',
          'aria-disabled:tw-bg-button-primary-disabled aria-disabled:tw-text-text-disabled-on-solid',
          '[&_svg]:aria-busy:tw-text-icon-on-solid',
          // Inner ring separates the focus outline from the solid fill
          'focus-visible:tw-shadow-[inset_0_0_0_2px_var(--interactive-focus-inner-shadow)]',
        ],
        secondary: [
          'tw-bg-button-secondary tw-text-text-default tw-border tw-border-border-accent-weak tw-shadow-elevation-100',
          '[&_svg]:tw-text-icon-brand',
          'hover:tw-bg-button-secondary-hover hover:tw-border-border-accent-strong',
          'active:tw-bg-button-secondary-pressed active:tw-border-border-accent-strong',
          'aria-disabled:tw-bg-button-secondary-disabled aria-disabled:tw-border-border-weak',
          'aria-disabled:tw-text-text-disabled [&_svg]:aria-disabled:tw-text-icon-disabled',
        ],
        outline: [
          'tw-bg-button-outline tw-text-text-default tw-border tw-border-border-weak tw-shadow-elevation-100',
          '[&_svg]:tw-text-icon-default',
          'hover:tw-bg-button-outline-hover hover:tw-border-border-default',
          'active:tw-bg-button-outline-pressed active:tw-border-border-default',
          'aria-disabled:tw-bg-button-outline-disabled',
          'aria-disabled:tw-text-text-disabled [&_svg]:aria-disabled:tw-text-icon-disabled',
        ],
        ghost: [
          'tw-bg-transparent tw-text-text-default tw-shadow-elevation-none',
          '[&_svg]:tw-text-icon-default',
          'hover:tw-bg-button-outline-hover',
          'active:tw-bg-button-outline-pressed',
          'aria-disabled:tw-text-text-disabled [&_svg]:aria-disabled:tw-text-icon-disabled',
        ],
        ghostBrand: [
          'tw-bg-transparent tw-text-text-brand tw-shadow-elevation-none',
          'hover:tw-bg-button-secondary-hover',
          'active:tw-bg-button-secondary-pressed',
          'aria-disabled:tw-text-text-disabled [&_svg]:aria-disabled:tw-text-icon-disabled',
        ],
      },
      size: {
        large: 'tw-h-10 tw-px-5 tw-gap-2 tw-rounded-large tw-font-title-large [&_svg]:tw-size-5',
        default: 'tw-h-8 tw-px-3 tw-gap-1.5 tw-rounded-default tw-font-title-default [&_svg]:tw-size-4',
        medium: 'tw-h-7 tw-px-2.5 tw-gap-1.5 tw-rounded-default tw-font-title-default [&_svg]:tw-size-3.5',
        small: 'tw-h-5 tw-px-2 tw-gap-1 tw-rounded-sm tw-font-title-small [&_svg]:tw-size-3',
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
      // iconOnly: square box; Figma's padding is just the centred icon's inset
      { iconOnly: true, size: 'large', class: 'tw-w-10' },
      { iconOnly: true, size: 'default', class: 'tw-w-8 tw-rounded-medium' },
      { iconOnly: true, size: 'medium', class: 'tw-w-7' },
      { iconOnly: true, size: 'small', class: 'tw-w-5' },
      // A lone icon uses the stronger neutral token than an icon beside a label
      { iconOnly: true, variant: ['outline', 'ghost'], class: '[&_svg]:tw-text-icon-strong' },
      {
        variant: 'primary',
        danger: true,
        class: [
          'tw-bg-button-danger-primary',
          'hover:tw-bg-button-danger-primary-hover',
          'active:tw-bg-button-danger-primary-pressed',
          // Figma keeps on-solid text here (a known low-contrast gap in the design)
          'aria-disabled:tw-bg-button-danger-primary-disabled aria-disabled:tw-text-text-on-solid',
        ],
      },
      {
        variant: 'secondary',
        danger: true,
        class: [
          // Rest fill stays button-secondary (per design); only hover/pressed/disabled use danger tokens
          'tw-border-border-danger-weak [&_svg]:tw-text-icon-danger',
          'hover:tw-bg-button-danger-secondary-hover hover:tw-border-border-danger-strong',
          'active:tw-bg-button-danger-secondary-pressed active:tw-border-border-danger-strong',
          'aria-disabled:tw-bg-button-danger-secondary-disabled',
        ],
      },
      {
        variant: 'ghost',
        danger: true,
        iconOnly: true,
        class: [
          '[&_svg]:tw-text-icon-danger',
          'hover:tw-bg-button-danger-secondary-hover',
          'active:tw-bg-button-danger-secondary-pressed',
        ],
      },
    ],
    defaultVariants: { variant: 'primary', size: 'default', danger: false, iconOnly: false },
  }
);

function useDevWarnings({ variant, danger, iconOnly, ariaLabel, ariaLabelledBy }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const supported = DANGER_VARIANTS[iconOnly ? 'iconOnly' : 'text'];
    if (danger && !supported.includes(variant)) {
      console.warn(
        `[Rocket Button] danger is not designed for ${iconOnly ? 'icon-only ' : ''}"${variant}" buttons. ` +
          `Use one of: ${supported.join(', ')}.`
      );
    }

    if (iconOnly && !ariaLabel && !ariaLabelledBy) {
      console.warn('[Rocket Button] icon-only buttons need an aria-label or aria-labelledby.');
    }
  }, [variant, danger, iconOnly, ariaLabel, ariaLabelledBy]);
}

const Button = forwardRef(function Button(
  {
    className,
    variant = 'primary',
    size,
    danger = false,
    iconOnly = false,
    loading = false,
    disabled = false,
    asChild = false,
    type = 'button',
    leadingVisual,
    trailingVisual,
    onClick,
    children,
    ...props
  },
  ref
) {
  useDevWarnings({
    variant,
    danger,
    iconOnly,
    ariaLabel: props['aria-label'],
    ariaLabelledBy: props['aria-labelledby'],
  });

  // Loading blocks activation without native `disabled`, so focus isn't dropped to <body>
  const handleClick = (event) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const content = (
    <>
      {leadingVisual}
      {children}
      {trailingVisual}
    </>
  );

  const renderContent = () => {
    // Slot needs its single child untouched
    if (asChild) return children;
    if (!loading) return content;

    // Content stays in layout and in the accessibility tree, so width and accessible name don't change
    return (
      <>
        <span className="tw-inline-flex tw-items-center tw-gap-[inherit] tw-opacity-0">{content}</span>
        <Loader aria-hidden="true" className="tw-absolute tw-inset-0 tw-m-auto tw-animate-spin" />
      </>
    );
  };

  return (
    <ShadcnButton
      ref={ref}
      asChild={asChild}
      type={asChild ? undefined : type}
      disabled={disabled}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={cn(buttonVariants({ variant, size, danger, iconOnly }), className)}
      {...props}
    >
      {renderContent()}
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
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  leadingVisual: PropTypes.node,
  trailingVisual: PropTypes.node,
  onClick: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
};

export { Button, buttonVariants };
