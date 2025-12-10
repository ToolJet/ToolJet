import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('tw-inline-flex tw-items-center tw-justify-center', {
  variants: {
    variant: {
      default: 'tw-rounded-lg tw-bg-muted tw-p-1 tw-text-muted-foreground',
      secondary: 'tw-bg-transparent tw-py-0 tw-px-0 tw-text-foreground',
    },
    size: {
      default: 'tw-h-10',
    },
    badgeStyle: {
      none: '',
      styled:
        '**:data-[slot=badge]:tw-bg-muted-foreground/30 **:data-[slot=badge]:tw-size-5 **:data-[slot=badge]:tw-rounded-full **:data-[slot=badge]:tw-px-1',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    badgeStyle: 'none',
  },
});

const TabsList = React.forwardRef(({ className, variant, size, badgeStyle, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn(tabsListVariants({ variant, size, badgeStyle, className }))} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  'tw-inline-flex tw-items-center tw-justify-center tw-gap-1 tw-whitespace-nowrap tw-rounded-md tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-text-text-placeholder tw-ring-offset-background tw-transition-all focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ring focus-visible:tw-ring-offset-2 disabled:tw-pointer-events-none disabled:tw-opacity-50',
  {
    variants: {
      variant: {
        default:
          'data-[state=active]:tw-bg-background data-[state=active]:tw-text-foreground data-[state=active]:tw-shadow',
        secondary:
          'tw-rounded-none tw-shadow-none tw-border-b-2 tw-border-b-transparent data-[state=active]:tw-text-text-default data-[state=active]:tw-border-b-border-accent-strong tw-bg-transparent',
      },
      size: {
        default: 'tw-h-10 tw-px-3 tw-py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const TabsTrigger = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref} className={cn(tabsTriggerVariants({ variant, size, className }))} {...props} />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'tw-mt-2 tw-ring-offset-background focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ring focus-visible:tw-ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants };
