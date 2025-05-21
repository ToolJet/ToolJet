import * as React from 'react';
// eslint-disable-next-line import/no-unresolved
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useState } from 'react';
import {
  CheckIcon,
  DropdownArrowIcon,
  LeadingIcon,
  TrailingAction,
  dropdownVariants,
} from './DropdownUtils/DropdownUtils';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef(({ className, children, open, size, ...props }, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        dropdownVariants({ size }),
        `tw-flex tw-items-center tw-justify-between tw-gap-[12px] tw-rounded-[8px] tw-border-[1px] tw-border-solid tw-border-border-default hover:tw-border-border-strong tw-bg-background-surface-layer-01 tw-text-[12px]/[18px] tw-font-normal tw-text-text-placeholder focus:tw-border-transparent focus:tw-outline-none focus:tw-ring-[1px] focus:tw-ring-interactive-focus-outline focus:tw-ring-offset-[1px] focus:tw-ring-offset-interactive-focus-outline disabled:tw-cursor-not-allowed disabled:tw-bg-[#CCD1D5]/30 disabled:tw-border-transparent ${
          open &&
          'tw-border-transparent tw-outline-none tw-ring-[1px] tw-ring-interactive-focus-outline tw-ring-offset-[1px] tw-ring-offset-interactive-focus-outline'
        }`,
        className
      )}
      style={{ width: props.width }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <div className="tw-flex tw-items-center tw-gap-[6px]">
        {props.leadingIcon && (
          <LeadingIcon avatarSrc={props.avatarSrc} avatarAlt={props.avatarAlt} avatarFall={props.avatarFall} />
        )}
        <div
          className={`${
            props.leadingIcon ? 'tw-max-w-[94px]' : 'tw-max-w-[116px]'
          } [&>span]:tw-text-left [&>span]:tw-line-clamp-1`}
        >
          {children}
        </div>
      </div>
      <SelectPrimitive.Icon asChild>
        <DropdownArrowIcon open={open} disabled={props.disabled} isHovered={isHovered} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('tw-flex tw-cursor-default tw-items-center tw-justify-center tw-py-1', className)}
    {...props}
  >
    <SolidIcon name="TriangleDownCenter" height="16px" width="16px" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('tw-flex tw-cursor-default tw-items-center tw-justify-center tw-py-1', className)}
    {...props}
  >
    <SolidIcon name="TriangleUpCenter" height="16px" width="16px" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef(({ className, children, position = 'popper', zIndex, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        `tw-relative tw-z-[${zIndex}] tw-max-h-96 tw-w-[170px] tw-p-[6px] tw-overflow-hidden tw-rounded-[10px] tw-border tw-bg-background-surface-layer-01 tw-text-text-default tw-shadow-md data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-zoom-out-95 data-[state=open]:tw-zoom-in-95 data-[side=bottom]:tw-slide-in-from-top-2 data-[side=left]:tw-slide-in-from-right-2 data-[side=right]:tw-slide-in-from-left-2 data-[side=top]:tw-slide-in-from-bottom-2`,
        position === 'popper' &&
          'data-[side=bottom]:tw-translate-y-1 data-[side=left]:-tw-translate-x-1 data-[side=right]:tw-translate-x-1 data-[side=top]:-tw-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport className={cn('tw-p-[2px]')}>{children}</SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('tw-py-1.5 tw-pl-8 tw-pr-2 tw-text-sm tw-font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'tw-relative tw-flex tw-w-full tw-h-[30px] tw-items-center tw-rounded-[6px] tw-py-[6px] tw-pl-[30px] tw-pr-[8px] tw-text-[12px]/[18px] tw-font-normal tw-text-text-default tw-outline-none focus-visible:tw-ring-[1px] focus-visible:tw-ring-offset-[1px] focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-interactive-focus-outline hover:tw-bg-[#CCD1D5]/30 active:tw-bg-[#ACB2B9]/35 data-[disabled]:tw-pointer-events-none data-[disabled]:tw-text-text-placeholder [&>span]:tw-w-[50px] [&>span]:tw-text-left [&>span]:tw-line-clamp-1',
      className
    )}
    {...props}
  >
    <div className="tw-absolute tw-left-[8px] tw-flex tw-h-[16px] tw-w-[16px] tw-items-center tw-justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon />
      </SelectPrimitive.ItemIndicator>
    </div>
    {props.leadingIcon && (
      <LeadingIcon
        avatarSrc={props.avatarSrc}
        avatarAlt={props.avatarAlt}
        avatarFall={props.avatarFall}
        className="tw-mr-[6px]"
      />
    )}
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    {props.trailingAction && <TrailingAction trailingAction={props.trailingAction} />}
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn('-tw-mx-1 tw-my-1 tw-h-px tw-bg-muted', className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
