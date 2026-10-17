// shadcn/ui popups for the pack: Select and Popover, portalled into the pack's root so they keep its look.
import React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from './cn';

/** Body-level root for Radix portals: outside any widget (so popups are not clipped) but inside `.tj-shadcn`. */
let portalRoot: HTMLDivElement | null = null;
export const getPortalRoot = () => {
  if (typeof document === 'undefined') return undefined;
  if (!portalRoot || !document.body.contains(portalRoot)) {
    portalRoot = document.createElement('div');
    portalRoot.className = 'tj-shadcn';
    portalRoot.setAttribute('data-shadcn-portal', '');
    document.body.appendChild(portalRoot);
  }
  return portalRoot;
};

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'tw-flex tw-h-9 tw-w-full tw-items-center tw-justify-between tw-whitespace-nowrap tw-rounded-ui2-md tw-border tw-border-ui2-input tw-bg-transparent tw-px-3 tw-py-2 tw-text-ui2-sm tw-shadow-sm tw-ring-offset-ui2-background placeholder:tw-text-ui2-muted-foreground focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-ui2-ring disabled:tw-cursor-not-allowed disabled:tw-opacity-50 [&>span]:tw-line-clamp-1 data-[placeholder]:tw-text-ui2-muted-foreground',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="tw-h-4 tw-w-4 tw-opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal container={getPortalRoot()}>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'tw-relative tw-z-[1060] tw-max-h-96 tw-min-w-[8rem] tw-overflow-hidden tw-rounded-ui2-md tw-border tw-bg-ui2-popover tw-text-ui2-popover-foreground tw-shadow-md data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-zoom-out-95 data-[state=open]:tw-zoom-in-95',
        position === 'popper' &&
          'data-[side=bottom]:tw-translate-y-1 data-[side=left]:-tw-translate-x-1 data-[side=right]:tw-translate-x-1 data-[side=top]:-tw-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="tw-flex tw-cursor-default tw-items-center tw-justify-center tw-py-1">
        <ChevronUp className="tw-h-4 tw-w-4" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport
        className={cn(
          'tw-p-1',
          position === 'popper' &&
            'tw-h-[var(--radix-select-trigger-height)] tw-w-full tw-min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="tw-flex tw-cursor-default tw-items-center tw-justify-center tw-py-1">
        <ChevronDown className="tw-h-4 tw-w-4" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'tw-relative tw-flex tw-w-full tw-cursor-default tw-select-none tw-items-center tw-rounded-ui2-sm tw-py-1.5 tw-pl-2 tw-pr-8 tw-text-ui2-sm tw-outline-none focus:tw-bg-ui2-accent focus:tw-text-ui2-accent-foreground data-[disabled]:tw-pointer-events-none data-[disabled]:tw-opacity-50',
      className
    )}
    {...props}
  >
    <span className="tw-absolute tw-right-2 tw-flex tw-h-3.5 tw-w-3.5 tw-items-center tw-justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="tw-h-4 tw-w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
/** A popover's name is required: Radix gives its content role="dialog", which a screen reader announces by name. */
type PopoverContentProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { 'aria-label': string };
export const PopoverContent = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Content>, PopoverContentProps>(
  ({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal container={getPortalRoot()}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'tw-z-[1060] tw-w-72 tw-rounded-ui2-md tw-border tw-bg-ui2-popover tw-p-4 tw-text-ui2-popover-foreground tw-shadow-md tw-outline-none data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-zoom-out-95 data-[state=open]:tw-zoom-in-95',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
);
PopoverContent.displayName = 'PopoverContent';
