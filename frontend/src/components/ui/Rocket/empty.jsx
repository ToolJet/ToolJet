import React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

function Empty({ className, ...props }) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-gap-6 tw-text-balance tw-rounded-lg tw-border-dashed tw-p-6 tw-text-center md:tw-p-12',
        className
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }) {
  return (
    <div
      data-slot="empty-header"
      className={cn('tw-flex tw-max-w-sm tw-flex-col tw-items-center tw-gap-2 tw-text-center', className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  'tw-mb-2 tw-flex tw-shrink-0 tw-items-center tw-justify-center [&_svg]:tw-pointer-events-none [&_svg]:tw-shrink-0',
  {
    variants: {
      variant: {
        default: 'tw-bg-transparent',
        icon: 'tw-bg-muted tw-text-foreground tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg [&_svg:not([class*=size-])]:tw-size-6',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function EmptyMedia({ className, variant = 'default', ...props }) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }) {
  return (
    <div
      data-slot="empty-title"
      className={cn('tw-text-text-default tw-text-lg tw-font-medium tw-tracking-tight', className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        'tw-text-muted-foreground [&>a:hover]:tw-text-primary tw-text-sm/relaxed [&>a]:tw-underline [&>a]:tw-underline-offset-4',
        className
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        'tw-flex tw-w-full tw-min-w-0 tw-max-w-sm tw-flex-col tw-items-center tw-gap-4 tw-text-balance tw-text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia };
