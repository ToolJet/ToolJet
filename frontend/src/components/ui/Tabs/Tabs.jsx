import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'tw-inline-flex tw-items-start tw-rounded-[6px] tw-bg-[#CCD1D5]/30 tw-p-[2px] tw-shadow-[inset_0px_1px_0px_0px_rgba(0,0,0,0.06)]',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'tw-group tw-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-[5px] tw-px-[6px] tw-py-[5px] tw-border-0 tw-text-text-disabled tw-text-center tw-text-[12px]/[18px] tw-font-medium tw-transition-all hover:tw-bg-[#CCD1D5]/30 hover:tw-text-text-placeholder data-[state=active]:tw-bg-background-surface-layer-01 data-[state=active]:tw-text-text-default data-[state=active]:tw-shadow-[0px_1px_0px_0px_rgba(0,0,0,0.10)]',
      className
    )}
    {...props}
  />
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

export { Tabs, TabsList, TabsTrigger, TabsContent };
