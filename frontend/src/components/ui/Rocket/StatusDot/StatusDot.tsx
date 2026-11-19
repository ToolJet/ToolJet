import React, { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const statusDotVariants = cva('tw-box-border tw-inline-block tw-shrink-0 tw-rounded-full', {
  variants: {
    tone: {
      info: 'tw-bg-background-accent-strong',
      success: 'tw-bg-background-success-strong',
      warning: 'tw-bg-background-warning-strong',
      danger: 'tw-bg-background-error-strong',
      // A ring, so "inactive or unknown" still reads without colour
      neutral: 'tw-border tw-border-solid tw-border-icon-weak tw-bg-transparent',
    },
    size: {
      default: 'tw-size-2',
      small: 'tw-size-1.5',
    },
  },
  defaultVariants: { tone: 'neutral', size: 'default' },
});

export type StatusDotTone = NonNullable<VariantProps<typeof statusDotVariants>['tone']>;

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusDotVariants> {}

// Decorative: the status is always given in words next to it.
function StatusDot({ tone, size, className, ...props }: StatusDotProps) {
  return <span aria-hidden className={cn(statusDotVariants({ tone, size }), className)} {...props} />;
}

export { StatusDot, statusDotVariants };
