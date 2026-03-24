import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { SelectTrigger } from '@/components/ui/Rocket/Select/Select';
import {
  InputGroup as ShadcnInputGroup,
  // Re-exported unchanged
  InputGroupAddon as ShadcnInputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/Rocket/shadcn/input-group';
import { func } from 'superstruct';

// ── Wrapped (border/focus token override to match Rocket Input) ───────────

const inputGroupSizes = {
  large: 'tw-h-10',
  default: 'tw-h-8',
  small: 'tw-h-7',
};

function InputGroup({ className, size = 'default', ...props }) {
  return (
    <ShadcnInputGroup
      className={cn(
        // Override shadcn border/bg with ToolJet tokens (border-solid: preflight is off)
        'tw-border-solid tw-border-border-default tw-bg-background-surface-layer-01 tw-shadow-elevation-none',
        // Default icon colour
        '[&_svg]:tw-text-icon-default',
        // Size
        inputGroupSizes[size],
        // Focus ring override
        'has-[[data-slot=input-group-control]:focus-visible]:tw-ring-2 has-[[data-slot=input-group-control]:focus-visible]:tw-ring-interactive-focus-outline has-[[data-slot=input-group-control]:focus-visible]:tw-ring-offset-1',
        // Error state override
        'has-[[data-slot][aria-invalid=true]]:tw-border-border-danger-strong has-[[data-slot][aria-invalid=true]]:tw-bg-background-error-weak',
        '[&_[data-slot=input-group-addon]_button]:tw-rounded-md [&_[data-slot=input-group-addon]_button]:-tw-mr-0.5',
        className
      )}
      {...props}
    />
  );
}
InputGroup.displayName = 'InputGroup';
InputGroup.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  className: PropTypes.string,
};

function InputGroupAddon({ className, align = 'inline-start', children, ...props }) {
  return (
    <ShadcnInputGroupAddon className={cn('tw-max-h-full tw-py-0.5', className)} {...props}>
      {children}
    </ShadcnInputGroupAddon>
  );
}
InputGroupAddon.displayName = 'InputGroupAddon';
InputGroupAddon.propTypes = {
  align: PropTypes.oneOf(['inline-start', 'inline-end']),
  className: PropTypes.string,
};
// ── InputGroupInput — Rocket Input adapted for group context ──────────────

const InputGroupInput = forwardRef(function InputGroupInput({ className, ...props }, ref) {
  return (
    <Input
      ref={ref}
      data-slot="input-group-control"
      className={cn(
        // Strip standalone Input styling — parent InputGroup owns border/bg/shadow/ring/error
        'tw-h-auto tw-flex-1 tw-rounded-none tw-border-0 tw-bg-transparent tw-shadow-none',
        // Kill focus ring — parent InputGroup shows the ring via has-[...] selector
        'focus-visible:tw-ring-0 focus-visible:tw-ring-offset-0 focus-visible:tw-shadow-none',
        // Kill error styles — parent InputGroup handles error border/bg
        'aria-[invalid=true]:tw-border-0 aria-[invalid=true]:tw-bg-transparent',
        className
      )}
      {...props}
    />
  );
});
InputGroupInput.displayName = 'InputGroupInput';

// ── InputGroupSelect — Rocket SelectTrigger adapted for group context ────

const inputGroupSelectVariants = cva(
  [
    // Strip standalone SelectTrigger styling — parent InputGroup owns border/bg/shadow/ring/error
    'tw-border-0 tw-bg-transparent tw-shadow-none',
    // No width constraint — shrink to content, let InputGroupInput take remaining space
    'tw-w-auto tw-flex-shrink-0',
    // Kill focus ring — parent InputGroup shows the ring via has-[...] selector
    'focus:tw-ring-0 focus:tw-ring-offset-0',
    // Kill border hover — parent InputGroup owns border; add ghost-style bg hover + rounded
    'hover:tw-border-0 hover:tw-bg-interactive-hover tw-rounded-md',
    // Kill error styles — parent InputGroup handles error border/bg
    'aria-[invalid=true]:tw-border-0 aria-[invalid=true]:tw-bg-transparent',
    // Kill disabled styles — parent InputGroup handles disabled
    'disabled:tw-bg-transparent disabled:tw-border-0 disabled:tw-shadow-none',
  ],
  {
    variants: {
      size: {
        large: 'tw-h-8 tw-px-2.5 tw-text-lg',
        default: 'tw-h-6 tw-px-2 tw-text-base',
        small: 'tw-h-5 tw-px-1.5 tw-text-base',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const InputGroupSelect = forwardRef(function InputGroupSelect(
  { className, size, children, ...props },
  ref
) {
  return (
    <SelectTrigger
      ref={ref}
      data-slot="input-group-control"
      className={cn(inputGroupSelectVariants({ size }), className)}
      {...props}
    >
      {children}
    </SelectTrigger>
  );
});
InputGroupSelect.displayName = 'InputGroupSelect';
InputGroupSelect.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  className: PropTypes.string,
  children: PropTypes.node,
};

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupSelect,
  InputGroupTextarea,
};
