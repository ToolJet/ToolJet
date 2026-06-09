import * as React from 'react';
import { cva } from 'class-variance-authority';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

function Tabs({ className, orientation = 'horizontal', ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
      data-orientation={orientation}
      className={cn('tw-group/tabs tw-flex tw-gap-2 data-[orientation=horizontal]:tw-flex-col', className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  'tw-group/tabs-list tw-inline-flex tw-w-fit tw-items-center tw-justify-center tw-rounded-lg tw-p-[3px] tw-text-muted-foreground group-data-[orientation=horizontal]/tabs:tw-h-8 group-data-[orientation=vertical]/tabs:tw-h-fit group-data-[orientation=vertical]/tabs:tw-flex-col data-[variant=line]:tw-rounded-none',
  {
    variants: {
      variant: {
        default: 'tw-bg-muted',
        line: 'tw-gap-1 tw-bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function TabsList({ className, variant = 'default', ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'tw-relative tw-inline-flex tw-h-[calc(100%-1px)] tw-flex-1 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-md tw-border tw-border-transparent tw-px-1.5 tw-py-0.5 tw-text-sm tw-font-medium tw-whitespace-nowrap tw-text-foreground/60 tw-transition-all group-data-[orientation=vertical]/tabs:tw-w-full group-data-[orientation=vertical]/tabs:tw-justify-start hover:tw-text-foreground focus-visible:tw-border-ring focus-visible:tw-ring-[3px] focus-visible:tw-ring-ring/50 focus-visible:tw-outline-1 focus-visible:tw-outline-ring disabled:tw-pointer-events-none disabled:tw-opacity-50 dark:tw-text-muted-foreground dark:hover:tw-text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:tw-shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:tw-shadow-none [&_svg]:tw-pointer-events-none [&_svg]:tw-shrink-0 [&_svg:not([class*=size-])]:tw-size-4',
        'group-data-[variant=line]/tabs-list:tw-bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:tw-bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:tw-border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:tw-bg-transparent',
        'data-[state=active]:tw-bg-background data-[state=active]:tw-text-foreground dark:data-[state=active]:tw-border-input dark:data-[state=active]:tw-bg-input/30 dark:data-[state=active]:tw-text-foreground',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('tw-flex-1 tw-text-sm tw-outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
