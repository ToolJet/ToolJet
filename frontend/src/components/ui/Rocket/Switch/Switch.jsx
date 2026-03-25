import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Switch as ShadcnSwitch } from '@/components/ui/Rocket/shadcn/switch';

// ── Static classes (Shape D — no CVA) ────────────────────────────────────
const switchClasses = [
  // Layout
  'tw-peer tw-inline-flex tw-shrink-0 tw-items-center',
  'tw-shadow-elevation-000 tw-h-5 tw-w-9 tw-rounded-full',
  'tw-border-2 tw-border-solid tw-border-transparent',
  'tw-cursor-pointer tw-shadow-sm',
  'tw-transition-[colors,transform]',
  // Active press
  'active:tw-scale-[0.97]',
  // Track — unchecked
  'tw-bg-switch-tag',
  // Track — checked
  'data-[state=checked]:tw-bg-switch-background-on',
  // Disabled
  'disabled:tw-opacity-50 disabled:tw-cursor-not-allowed disabled:tw-pointer-events-none',
  // Focus ring
  'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-2',
];

const switchThumbClasses = [
  'tw-pointer-events-none tw-block tw-rounded-full',
  'tw-h-4 tw-w-4',
  'tw-bg-switch-tab',
  'tw-shadow-elevation-100 tw-ring-0',
  'tw-transition-transform',
  'data-[state=unchecked]:-tw-translate-x-1.5',
  'data-[state=checked]:tw-translate-x-2.5',
];

// ── Switch ───────────────────────────────────────────────────────────────
const Switch = forwardRef(function Switch({ className, ...props }, ref) {
  return (
    <ShadcnSwitch
      ref={ref}
      className={cn(switchClasses, className)}
      thumbClassName={cn(switchThumbClasses)}
      {...props}
    />
  );
});
Switch.displayName = 'Switch';

Switch.propTypes = {
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

// ── Exports ──────────────────────────────────────────────────────────────
export { Switch, switchClasses };
