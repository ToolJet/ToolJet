import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Separator } from './separator';

function ItemGroup({ className, ...props }) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn('tw-group/item-group tw-flex tw-flex-col', className)}
      {...props}
    />
  );
}

function ItemSeparator({ className, ...props }) {
  return (
    <Separator data-slot="item-separator" orientation="horizontal" className={cn('tw-my-0', className)} {...props} />
  );
}

const itemVariants = cva(
  'group/item [a]:hover:tw-bg-accent/50 focus-visible:tw-border-ring focus-visible:tw-ring-ring/50 [a]:tw-transition-colors [a]:tw-transition-transform [a]:active:tw-scale-[0.97] tw-flex tw-flex-wrap tw-items-center tw-rounded-md tw-border tw-border-transparent tw-text-sm tw-outline-none tw-transition-colors tw-duration-100 focus-visible:tw-ring-[3px]',
  {
    variants: {
      variant: {
        default: 'tw-bg-transparent',
        outline: 'tw-border-border',
        muted: 'tw-bg-muted/50',
      },
      size: {
        default: 'tw-gap-4 tw-p-4',
        sm: 'tw-gap-2.5 tw-px-4 tw-py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Item({ className, variant = 'default', size = 'default', asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={cn(itemVariants({ variant, size, className }))}
      {...props}
    />
  );
}

const itemMediaVariants = cva(
  'tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-gap-2 group-has-[[data-slot=item-description]]/item:tw-translate-y-0.5 group-has-[[data-slot=item-description]]/item:tw-self-start [&_svg]:tw-pointer-events-none',
  {
    variants: {
      variant: {
        default: 'tw-bg-transparent',
        icon: 'tw-bg-muted tw-size-8 tw-rounded-sm tw-border [&_svg:not([class*=size-])]:tw-size-4',
        image: 'tw-size-10 tw-overflow-hidden tw-rounded-sm [&_img]:tw-size-full [&_img]:tw-object-cover',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function ItemMedia({ className, variant = 'default', ...props }) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function ItemContent({ className, ...props }) {
  return (
    <div
      data-slot="item-content"
      className={cn('tw-flex tw-flex-1 tw-flex-col tw-gap-1 [&+[data-slot=item-content]]:tw-flex-none', className)}
      {...props}
    />
  );
}

function ItemTitle({ className, ...props }) {
  return (
    <div
      data-slot="item-title"
      className={cn('tw-flex tw-w-fit tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-leading-snug', className)}
      {...props}
    />
  );
}

function ItemDescription({ className, ...props }) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        'tw-text-muted-foreground tw-line-clamp-2 tw-text-balance tw-text-sm tw-font-normal tw-leading-normal',
        '[&>a:hover]:tw-text-primary [&>a]:tw-underline [&>a]:tw-underline-offset-4',
        className
      )}
      {...props}
    />
  );
}

function ItemActions({ className, ...props }) {
  return <div data-slot="item-actions" className={cn('tw-flex tw-items-center tw-gap-2', className)} {...props} />;
}

function ItemHeader({ className, ...props }) {
  return (
    <div
      data-slot="item-header"
      className={cn('tw-flex tw-basis-full tw-items-center tw-justify-between tw-gap-2', className)}
      {...props}
    />
  );
}

function ItemFooter({ className, ...props }) {
  return (
    <div
      data-slot="item-footer"
      className={cn('tw-flex tw-basis-full tw-items-center tw-justify-between tw-gap-2', className)}
      {...props}
    />
  );
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
};
