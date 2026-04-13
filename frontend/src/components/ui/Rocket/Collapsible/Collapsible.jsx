import React, { createContext, forwardRef, useContext } from 'react';
import PropTypes from 'prop-types';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Variant context ─────────────────────────────────────────────────────────

const CollapsibleVariantContext = createContext('bordered');

// ── Collapsible (root) ──────────────────────────────────────────────────────

const collapsibleVariants = cva('', {
  variants: {
    variant: {
      bordered: 'tw-border-solid tw-border tw-border-border-weak tw-rounded-lg tw-bg-background-surface-layer-01',
      ghost: '',
    },
  },
  defaultVariants: { variant: 'bordered' },
});

const Collapsible = forwardRef(function Collapsible({ className, variant = 'bordered', ...props }, ref) {
  return (
    <CollapsibleVariantContext.Provider value={variant}>
      <CollapsiblePrimitive.Root
        ref={ref}
        data-slot="collapsible"
        data-variant={variant}
        className={cn(collapsibleVariants({ variant }), className)}
        {...props}
      />
    </CollapsibleVariantContext.Provider>
  );
});
Collapsible.displayName = 'Collapsible';
Collapsible.propTypes = {
  variant: PropTypes.oneOf(['bordered', 'ghost']),
  defaultOpen: PropTypes.bool,
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  className: PropTypes.string,
};

// ── CollapsibleTrigger ──────────────────────────────────────────────────────

const collapsibleTriggerVariants = cva(
  [
    // Reset (preflight is off)
    'tw-appearance-none tw-border-0 tw-bg-transparent tw-outline-none',
    'tw-group tw-flex tw-w-full tw-items-center tw-justify-between tw-cursor-pointer',
    'tw-font-title-default tw-text-text-default',
    'hover:tw-bg-interactive-hover tw-transition-colors',
  ],
  {
    variants: {
      variant: {
        bordered:
          'tw-px-4 tw-py-3 tw-rounded-t-md tw-border-solid tw-border-0 data-[state=open]:tw-border-b data-[state=open]:tw-border-border-weak data-[state=closed]:tw-rounded-b-md data-[state=closed]:tw-border-transparent',
        ghost: 'tw-py-2 tw-px-2 tw-rounded-md',
      },
    },
    defaultVariants: { variant: 'bordered' },
  }
);

const CollapsibleTrigger = forwardRef(function CollapsibleTrigger({ className, children, ...props }, ref) {
  const variant = useContext(CollapsibleVariantContext);

  return (
    <CollapsiblePrimitive.Trigger
      ref={ref}
      data-slot="collapsible-trigger"
      className={cn(collapsibleTriggerVariants({ variant }), className)}
      {...props}
    >
      {children}
      <CollapsibleIcon />
    </CollapsiblePrimitive.Trigger>
  );
});
CollapsibleTrigger.displayName = 'CollapsibleTrigger';
CollapsibleTrigger.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── CollapsibleIcon ─────────────────────────────────────────────────────────
// Auto-rotating chevron. Reads data-state from the nearest Radix Collapsible root.

function CollapsibleIcon({ className, ...props }) {
  return (
    <ChevronDown
      aria-hidden
      className={cn(
        'tw-size-4 tw-text-icon-default tw-shrink-0',
        'tw-transition-transform tw-duration-200',
        // Radix sets data-state on the trigger — parent selector
        'group-data-[state=open]:tw-rotate-180',
        className
      )}
      {...props}
    />
  );
}
CollapsibleIcon.displayName = 'CollapsibleIcon';

// ── CollapsibleContent ──────────────────────────────────────────────────────

const collapsibleContentVariants = cva(
  [
    'tw-grid tw-transition-[grid-template-rows,padding] tw-duration-200 tw-ease-in-out',
    'data-[state=closed]:tw-grid-rows-[0fr] data-[state=closed]:!tw-p-0',
    'data-[state=open]:tw-grid-rows-[1fr]',
  ],
  {
    variants: {
      variant: {
        bordered: 'tw-px-4 tw-py-3',
        ghost: 'tw-py-2',
      },
    },
    defaultVariants: { variant: 'bordered' },
  }
);

const CollapsibleContent = forwardRef(function CollapsibleContent({ className, children, ...props }, ref) {
  const variant = useContext(CollapsibleVariantContext);

  return (
    <CollapsiblePrimitive.Content
      ref={ref}
      forceMount
      data-slot="collapsible-content"
      className={cn(collapsibleContentVariants({ variant }), className)}
      {...props}
    >
      <div className="tw-overflow-hidden tw-min-h-0">{children}</div>
    </CollapsiblePrimitive.Content>
  );
});
CollapsibleContent.displayName = 'CollapsibleContent';
CollapsibleContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── Exports ─────────────────────────────────────────────────────────────────

export {
  Collapsible,
  collapsibleVariants,
  CollapsibleTrigger,
  collapsibleTriggerVariants,
  CollapsibleIcon,
  CollapsibleContent,
  collapsibleContentVariants,
};
