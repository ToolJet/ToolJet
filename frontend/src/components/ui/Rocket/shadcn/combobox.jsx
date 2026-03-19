'use client';

import * as React from 'react';
import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/Button/Button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/Rocket/InputGroup/InputGroup';

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue({ ...props }) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxTrigger({ className, children, ...props }) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn('[&_svg:not([class*=size-])]:tw-size-4', className)}
      {...props}
    >
      {children}
      <ChevronDownIcon
        data-slot="combobox-trigger-icon"
        className="tw-pointer-events-none tw-size-4 tw-text-muted-foreground"
      />
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className, ...props }) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(className)}
      {...props}
    >
      <XIcon className="tw-pointer-events-none" />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxInput({ className, children, disabled = false, showTrigger = true, showClear = false, ...props }) {
  return (
    <InputGroup className={cn('tw-w-auto', className)}>
      <ComboboxPrimitive.Input render={<InputGroupInput disabled={disabled} />} {...props} />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            asChild
            data-slot="input-group-button"
            className="group-has-[[data-slot=combobox-clear]]/input-group:tw-hidden data-[pressed]:tw-bg-transparent"
            disabled={disabled}
          >
            <ComboboxTrigger />
          </InputGroupButton>
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

function ComboboxContent({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="tw-isolate tw-z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            'tw-group/combobox-content tw-relative tw-max-h-96 tw-w-[var(--anchor-width)] tw-max-w-[var(--available-width)] tw-min-w-[calc(var(--anchor-width)+1.75rem)] tw-origin-[var(--transform-origin)] tw-overflow-hidden tw-rounded-md tw-bg-popover tw-text-popover-foreground tw-shadow-md tw-ring-1 tw-ring-foreground/10 tw-duration-100 data-[chips=true]:tw-min-w-[var(--anchor-width)] data-[side=bottom]:tw-slide-in-from-top-2 data-[side=left]:tw-slide-in-from-right-2 data-[side=right]:tw-slide-in-from-left-2 data-[side=top]:tw-slide-in-from-bottom-2 *:data-[slot=input-group]:tw-m-1 *:data-[slot=input-group]:tw-mb-0 *:data-[slot=input-group]:tw-h-8 *:data-[slot=input-group]:tw-border-input/30 *:data-[slot=input-group]:tw-bg-input/30 *:data-[slot=input-group]:tw-shadow-none data-[open]:tw-animate-in data-[open]:tw-fade-in-0 data-[open]:tw-zoom-in-95 data-[closed]:tw-animate-out data-[closed]:tw-fade-out-0 data-[closed]:tw-zoom-out-95',
            className
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({ className, ...props }) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        'tw-max-h-[min(21.75rem,calc(var(--available-height)-2.25rem))] tw-scroll-py-1 tw-overflow-y-auto tw-p-1 data-[empty]:tw-p-0',
        className
      )}
      {...props}
    />
  );
}

function ComboboxItem({ className, children, ...props }) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        'tw-relative tw-flex tw-w-full tw-cursor-default tw-items-center tw-gap-2 tw-rounded-sm tw-py-1.5 tw-pr-8 tw-pl-2 tw-text-sm tw-outline-none tw-select-none data-[highlighted]:tw-bg-accent data-[highlighted]:tw-text-accent-foreground data-[disabled]:tw-pointer-events-none data-[disabled]:tw-opacity-50 [&_svg]:tw-pointer-events-none [&_svg]:tw-shrink-0 [&_svg:not([class*=size-])]:tw-size-4',
        className
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        data-slot="combobox-item-indicator"
        render={
          <span className="tw-pointer-events-none tw-absolute tw-right-2 tw-flex tw-size-4 tw-items-center tw-justify-center" />
        }
      >
        <CheckIcon className="tw-pointer-events-none tw-size-4" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup({ className, ...props }) {
  return <ComboboxPrimitive.Group data-slot="combobox-group" className={cn(className)} {...props} />;
}

function ComboboxLabel({ className, ...props }) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn('tw-px-2 tw-py-1.5 tw-text-xs tw-text-muted-foreground', className)}
      {...props}
    />
  );
}

function ComboboxCollection({ ...props }) {
  return <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />;
}

function ComboboxEmpty({ className, ...props }) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        'tw-hidden tw-w-full tw-justify-center tw-py-2 tw-text-center tw-text-sm tw-text-muted-foreground group-data-[empty]/combobox-content:tw-flex',
        className
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({ className, ...props }) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn('tw--mx-1 tw-my-1 tw-h-px tw-bg-border', className)}
      {...props}
    />
  );
}

function ComboboxChips({ className, ...props }) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        'tw-flex tw-min-h-9 tw-flex-wrap tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-input tw-bg-transparent tw-bg-clip-padding tw-px-2.5 tw-py-1.5 tw-text-sm tw-shadow-sm tw-transition-[color,box-shadow] focus-within:tw-border-ring focus-within:tw-ring-[3px] focus-within:tw-ring-ring/50 has-[[aria-invalid]]:tw-border-destructive has-[[aria-invalid]]:tw-ring-[3px] has-[[aria-invalid]]:tw-ring-destructive/20 has-[[data-slot=combobox-chip]]:tw-px-1.5 dark:tw-bg-input/30 dark:has-[[aria-invalid]]:tw-border-destructive/50 dark:has-[[aria-invalid]]:tw-ring-destructive/40',
        className
      )}
      {...props}
    />
  );
}

function ComboboxChip({ className, children, showRemove = true, ...props }) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        'tw-flex tw-h-[1.375rem] tw-w-fit tw-items-center tw-justify-center tw-gap-1 tw-rounded-sm tw-bg-muted tw-px-1.5 tw-text-xs tw-font-medium tw-whitespace-nowrap tw-text-foreground has-[:disabled]:tw-pointer-events-none has-[:disabled]:tw-cursor-not-allowed has-[:disabled]:tw-opacity-50 has-[[data-slot=combobox-chip-remove]]:tw-pr-0',
        className
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="icon-xs" />}
          className="tw--ml-1 tw-opacity-50 hover:tw-opacity-100"
          data-slot="combobox-chip-remove"
        >
          <XIcon className="tw-pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipsInput({ className, children, ...props }) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn('tw-min-w-16 tw-flex-1 tw-outline-none', className)}
      {...props}
    />
  );
}

function useComboboxAnchor() {
  return React.useRef(null);
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
};
