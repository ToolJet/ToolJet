import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Rocket/Input/Input';
import {
  InputGroup as ShadcnInputGroup,
  // Re-exported unchanged
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/Rocket/shadcn/input-group';

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
        'has-[[data-slot=input-group-control]:focus-visible]:tw-ring-2 has-[[data-slot=input-group-control]:focus-visible]:tw-ring-[var(--interactive-focus-outline)] has-[[data-slot=input-group-control]:focus-visible]:tw-ring-offset-1',
        // Error state override
        'has-[[data-slot][aria-invalid=true]]:tw-border-border-danger-strong has-[[data-slot][aria-invalid=true]]:tw-bg-background-error-weak',
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

// ── InputGroupInput — Rocket Input adapted for group context ──────────────

function InputGroupInput({ className, ...props }) {
  return (
    <Input
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
}
InputGroupInput.displayName = 'InputGroupInput';

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
