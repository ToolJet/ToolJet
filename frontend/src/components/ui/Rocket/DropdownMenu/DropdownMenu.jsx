import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuTrigger as ShadcnDropdownMenuTrigger,
  DropdownMenuContent as ShadcnDropdownMenuContent,
  DropdownMenuItem as ShadcnDropdownMenuItem,
  DropdownMenuCheckboxItem as ShadcnDropdownMenuCheckboxItem,
  DropdownMenuLabel as ShadcnDropdownMenuLabel,
  DropdownMenuSeparator as ShadcnDropdownMenuSeparator,
  DropdownMenuShortcut as ShadcnDropdownMenuShortcut,
  DropdownMenuSubTrigger as ShadcnDropdownMenuSubTrigger,
  DropdownMenuSubContent as ShadcnDropdownMenuSubContent,
  // Re-exported unchanged (no visual tokens to override)
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuRadioGroup,
} from '@/components/ui/Rocket/shadcn/dropdown-menu';

// ── Content ──────────────────────────────────────────────────────────────────

const contentClasses = [
  'tw-bg-background-surface-layer-01',
  'tw-border-solid tw-border-border-default',
  'tw-shadow-elevation-300',
  'tw-rounded-lg',
  'tw-text-text-default',
].join(' ');

const DropdownMenuContent = forwardRef(function DropdownMenuContent({ className, sideOffset = 4, ...props }, ref) {
  return (
    <ShadcnDropdownMenuContent ref={ref} sideOffset={sideOffset} className={cn(contentClasses, className)} {...props} />
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';
DropdownMenuContent.propTypes = {
  sideOffset: PropTypes.number,
  className: PropTypes.string,
};

// ── Item ─────────────────────────────────────────────────────────────────────

const itemClasses = [
  'tw-text-text-default',
  'tw-rounded-md',
  'focus:tw-bg-interactive-hover focus:tw-text-text-default',
  'data-[disabled]:tw-opacity-50 data-[disabled]:tw-pointer-events-none',
].join(' ');

const DropdownMenuItem = forwardRef(function DropdownMenuItem({ className, inset, destructive, ...props }, ref) {
  return (
    <ShadcnDropdownMenuItem
      ref={ref}
      inset={inset}
      className={cn(itemClasses, destructive && 'tw-text-text-danger focus:tw-text-text-danger', className)}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';
DropdownMenuItem.propTypes = {
  inset: PropTypes.bool,
  destructive: PropTypes.bool,
  className: PropTypes.string,
};

// ── CheckboxItem ─────────────────────────────────────────────────────────────

const checkRadioClasses = [
  'tw-text-text-default',
  'tw-rounded-md',
  'focus:tw-bg-interactive-hover focus:tw-text-text-default',
  'data-[disabled]:tw-opacity-50 data-[disabled]:tw-pointer-events-none',
  '[&>span]:tw-text-text-default',
].join(' ');

const DropdownMenuCheckboxItem = forwardRef(function DropdownMenuCheckboxItem({ className, ...props }, ref) {
  return <ShadcnDropdownMenuCheckboxItem ref={ref} className={cn(checkRadioClasses, className)} {...props} />;
});
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

// ── RadioItem ────────────────────────────────────────────────────────────────

// Selected = brand check, same as Select and Combobox (shadcn draws a dot).
const DropdownMenuRadioItem = forwardRef(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        'tw-relative tw-flex tw-cursor-default tw-select-none tw-items-center tw-gap-2 tw-py-1.5 tw-pl-[30px] tw-pr-2 tw-text-base tw-outline-none',
        itemClasses,
        className
      )}
      {...props}
    >
      <span className="tw-absolute tw-left-2 tw-flex tw-h-3.5 tw-w-3.5 tw-items-center tw-justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check size={14} className="tw-text-text-brand" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

// ── Label ────────────────────────────────────────────────────────────────────

const DropdownMenuLabel = forwardRef(function DropdownMenuLabel({ className, inset, ...props }, ref) {
  return (
    <ShadcnDropdownMenuLabel
      ref={ref}
      inset={inset}
      className={cn('tw-text-text-default tw-font-semibold', className)}
      {...props}
    />
  );
});
DropdownMenuLabel.displayName = 'DropdownMenuLabel';
DropdownMenuLabel.propTypes = {
  inset: PropTypes.bool,
  className: PropTypes.string,
};

// ── Separator ────────────────────────────────────────────────────────────────

const DropdownMenuSeparator = forwardRef(function DropdownMenuSeparator({ className, ...props }, ref) {
  return <ShadcnDropdownMenuSeparator ref={ref} className={cn('tw-bg-border-weak', className)} {...props} />;
});
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

// ── Shortcut ─────────────────────────────────────────────────────────────────

function DropdownMenuShortcut({ className, ...props }) {
  return <ShadcnDropdownMenuShortcut className={cn('tw-text-text-placeholder tw-opacity-100', className)} {...props} />;
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

// ── SubTrigger ───────────────────────────────────────────────────────────────

const DropdownMenuSubTrigger = forwardRef(function DropdownMenuSubTrigger({ className, inset, ...props }, ref) {
  return (
    <ShadcnDropdownMenuSubTrigger
      ref={ref}
      inset={inset}
      className={cn(
        'tw-text-text-default tw-rounded-md',
        'focus:tw-bg-interactive-hover data-[state=open]:tw-bg-interactive-hover',
        className
      )}
      {...props}
    />
  );
});
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';
DropdownMenuSubTrigger.propTypes = {
  inset: PropTypes.bool,
  className: PropTypes.string,
};

// ── SubContent ───────────────────────────────────────────────────────────────

const DropdownMenuSubContent = forwardRef(function DropdownMenuSubContent({ className, ...props }, ref) {
  return <ShadcnDropdownMenuSubContent ref={ref} className={cn(contentClasses, className)} {...props} />;
});
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

// ── Root (pass-through) ──────────────────────────────────────────────────────

const DropdownMenu = ShadcnDropdownMenu;
const DropdownMenuTrigger = ShadcnDropdownMenuTrigger;

// ── Exports ──────────────────────────────────────────────────────────────────

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  // Re-exports from shadcn (no visual tokens to override)
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuRadioGroup,
};
