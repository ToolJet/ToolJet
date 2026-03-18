import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('tw-relative tw-w-full tw-rounded-md tw-p-3 tw-text-xs tw-flex tw-gap-1.5 tw-items-start', {
  variants: {
    type: {
      info: '',
      warning: '',
      danger: '',
    },
    background: {
      none: '',
      grey: 'tw-bg-interactive-default',
      white: 'tw-bg-background-surface-layer-01 tw-shadow-elevation-100',
      'state-specific': '',
    },
  },
  compoundVariants: [
    // Info variants
    {
      type: 'info',
      background: 'state-specific',
      class: 'tw-bg-background-accent-weak',
    },
    // Warning variants
    {
      type: 'warning',
      background: 'state-specific',
      class: 'tw-bg-background-warning-weak',
    },
    // Danger variants
    {
      type: 'danger',
      background: 'state-specific',
      class: 'tw-bg-background-error-weak',
    },
  ],
  defaultVariants: {
    type: 'info',
    background: 'none',
  },
});

const Alert = React.forwardRef(({ className, type, background, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ type, background }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('tw-font-medium tw-leading-[18px] tw-text-[#2d343b] tw-text-[12px] tw-mb-0', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('tw-font-normal tw-leading-[18px] tw-text-text-placeholder tw-text-[12px]', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
