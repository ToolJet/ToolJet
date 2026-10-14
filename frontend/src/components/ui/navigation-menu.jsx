/* eslint-disable import/no-unresolved */
import * as React from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

const NavigationMenu = React.forwardRef(({ className, children, viewport = true, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    data-slot="navigation-menu"
    data-viewport={viewport}
    className={cn(
      'tw-group/navigation-menu tw-relative tw-flex tw-flex-1 tw-items-center tw-justify-center',
      className
    )}
    {...props}
  >
    {children}
    {viewport && <NavigationMenuViewport />}
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    data-slot="navigation-menu-list"
    className={cn('tw-group tw-flex tw-flex-1 tw-list-none tw-items-center tw-justify-center', className)}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Item
    ref={ref}
    data-slot="navigation-menu-item"
    className={cn('tw-relative', className)}
    {...props}
  />
));
NavigationMenuItem.displayName = NavigationMenuPrimitive.Item.displayName;

const navigationMenuTriggerStyle = cva(
  'tw-group tw-inline-flex tw-h-10 tw-w-max tw-items-center tw-justify-center tw-rounded-md tw-bg-background tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-transition-[color, box-shadow] hover:tw-bg-accent hover:tw-text-accent-foreground focus:tw-bg-accent focus:tw-text-accent-foreground focus:tw-outline-none disabled:tw-pointer-events-none disabled:tw-opacity-50 data-[state=open]:tw-text-accent-foreground data-[state=open]:tw-bg-accent/50 data-[state=open]:hover:tw-bg-accent data-[state=open]:focus:tw-bg-accent'
);

const NavigationMenuTrigger = React.forwardRef(({ className, children, indicator = true, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    data-slot="navigation-menu-trigger"
    className={cn(navigationMenuTriggerStyle(), 'tw-group', className)}
    {...props}
  >
    {children}{' '}
    {indicator && (
      <ChevronDown
        className="tw-relative tw-top-[1px] tw-ml-1 tw-h-3 tw-w-3 tw-transition tw-duration-200 group-data-[state=open]:tw-rotate-180"
        aria-hidden="true"
      />
    )}
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    data-slot="navigation-menu-content"
    className={cn(
      'data-[motion^=from-]:tw-animate-in data-[motion^=to-]:tw-animate-out data-[motion^=from-]:tw-fade-in data-[motion^=to-]:tw-fade-out data-[motion=from-end]:tw-slide-in-from-right-52 data-[motion=from-start]:tw-slide-in-from-left-52 data-[motion=to-end]:tw-slide-out-to-right-52 data-[motion=to-start]:tw-slide-out-to-left-52 tw-top-0 tw-right-0 tw-p-2 tw-pr-2.5 tw-absolute tw-w-auto',
      'data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-zoom-out-95 data-[state=open]:tw-zoom-in-95 data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-fade-out-0 group-data-[viewport=false]/navigation-menu:tw-top-full group-data-[viewport=false]/navigation-menu:tw-mt-1.5 group-data-[viewport=false]/navigation-menu:tw-overflow-hidden group-data-[viewport=false]/navigation-menu:tw-rounded-md group-data-[viewport=false]/navigation-menu:tw-border group-data-[viewport=false]/navigation-menu:tw-shadow group-data-[viewport=false]/navigation-menu:tw-duration-200 :data-[slot=navigation-menu-link]:focus:tw-ring-0 :data-[slot=navigation-menu-link]:focus:tw-outline-none',
      className
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuViewport = React.forwardRef(({ className, ...props }, ref) => (
  <div className={cn('tw-absolute tw-left-0 tw-top-full tw-flex tw-justify-center')}>
    <NavigationMenuPrimitive.Viewport
      data-slot="navigation-menu-viewport"
      className={cn(
        'tw-origin-top-center tw-bg-popover tw-text-popover-foreground data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-zoom-out-95 data-[state=open]:tw-zoom-in-90 tw-relative tw-mt-1.5 tw-h-[var(--radix-navigation-menu-viewport-height)] tw-w-full tw-overflow-hidden tw-rounded-md tw-border tw-shadow md:tw-w-[var(--radix-navigation-menu-viewport-width)]',
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

const NavigationMenuIndicator = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      'tw-top-full tw-z-[1] tw-flex tw-h-1.5 tw-items-end tw-justify-center tw-overflow-hidden data-[state=visible]:tw-animate-in data-[state=hidden]:tw-animate-out data-[state=hidden]:tw-fade-out data-[state=visible]:tw-fade-in',
      className
    )}
    {...props}
  >
    <div className="tw-relative tw-top-[60%] tw-h-2 tw-w-2 tw-rotate-45 tw-rounded-tl-sm tw-bg-border tw-shadow-md" />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};
