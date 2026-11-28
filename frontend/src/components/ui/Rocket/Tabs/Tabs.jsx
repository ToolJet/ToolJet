import React, { forwardRef, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import {
  Tabs as ShadcnTabs,
  TabsList as ShadcnTabsList,
  TabsTrigger as ShadcnTabsTrigger,
  TabsContent as ShadcnTabsContent,
} from '@/components/ui/Rocket/shadcn/tabs';

// ── Re-export (structural, no visual tokens to override) ────────────────
const Tabs = ShadcnTabs;

// ── Variant context (TabsList → TabsTrigger) ────────────────────────────
const TabsVariantContext = createContext('underline');

// ── TabsList ────────────────────────────────────────────────────────────
const tabsListVariants = cva(
  ['tw-group/tabs-list tw-inline-flex tw-w-fit tw-items-center', '!tw-h-auto', 'tw-gap-0.5'],
  {
    variants: {
      variant: {
        underline: [
          'tw-border-0 tw-border-b tw-border-solid tw-border-border-weak',
          'tw-bg-transparent tw-rounded-none',
        ],
        'underline-inverted': [
          'tw-border-0 tw-border-t tw-border-solid tw-border-border-weak',
          'tw-bg-transparent tw-rounded-none',
        ],
      },
    },
    defaultVariants: { variant: 'underline' },
  }
);

const TabsList = forwardRef(function TabsList({ className, variant = 'underline', ...props }, ref) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <ShadcnTabsList
        ref={ref}
        data-variant={variant}
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
});
TabsList.displayName = 'TabsList';

TabsList.propTypes = {
  variant: PropTypes.oneOf(['underline', 'underline-inverted']),
  className: PropTypes.string,
};

// ── TabsTrigger ─────────────────────────────────────────────────────────
const tabsTriggerVariants = cva(
  [
    'tw-group/tab-trigger tw-relative tw-isolate tw-inline-flex tw-items-center tw-justify-center tw-gap-1',
    'tw-bg-transparent tw-border-0 tw-border-solid tw-appearance-none tw-outline-none',
    'tw-cursor-pointer tw-whitespace-nowrap',
    'tw-px-2',
    'tw-transition-colors',
    // Text
    'tw-text-text-placeholder data-[state=active]:tw-text-text-default',
    // Hover fills an inset rounded box behind the label, not the full trigger height.
    // `isolate` keeps the -z-10 pseudo-element above ancestor backgrounds but below the label.
    "before:tw-content-[''] before:tw-absolute before:tw-inset-x-0 before:-tw-z-10 before:tw-rounded-md",
    'before:tw-transition-colors hover:before:tw-bg-interactive-hover',
    // Active indicator
    "after:tw-content-[''] after:tw-absolute after:tw-inset-x-0 after:tw-h-0.5",
    'after:tw-bg-transparent after:tw-transition-colors data-[state=active]:after:tw-bg-border-accent-strong',
    // Disabled
    'disabled:tw-pointer-events-none disabled:tw-cursor-not-allowed disabled:tw-text-text-disabled',
    // Focus ring
    'focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-1',
    // Icon sizing
    '[&_svg]:tw-pointer-events-none [&_svg]:tw-shrink-0 [&_svg:not([class*=size-])]:tw-size-4',
  ],
  {
    variants: {
      // Hover box is line-height + 4px tall, centred in the trigger
      size: {
        large: 'tw-h-10 tw-font-title-large before:tw-inset-y-2',
        default: 'tw-h-8 tw-font-title-default before:tw-inset-y-[5px]',
        small: 'tw-h-7 tw-font-title-small before:tw-inset-y-1',
      },
      // Indicator edge
      variant: {
        underline: 'after:-tw-bottom-1',
        'underline-inverted': 'after:-tw-top-1',
      },
    },
    defaultVariants: { size: 'default', variant: 'underline' },
  }
);

// Icon colour follows the trigger state, independent of the label colour
const tabsLeadingVisualClasses =
  'tw-text-icon-weak group-data-[state=active]/tab-trigger:tw-text-icon-accent group-disabled/tab-trigger:tw-text-icon-disabled';

const TabsTrigger = forwardRef(function TabsTrigger(
  { className, size = 'default', leadingVisual, children, ...props },
  ref
) {
  const variant = useContext(TabsVariantContext);
  return (
    <ShadcnTabsTrigger
      ref={ref}
      className={cn(tabsTriggerVariants({ size: size || 'default', variant }), className)}
      {...props}
    >
      {/* Slot merges the classes onto the icon itself, avoiding a wrapper node */}
      {leadingVisual && (
        <Slot aria-hidden="true" className={tabsLeadingVisualClasses}>
          {leadingVisual}
        </Slot>
      )}
      {children}
    </ShadcnTabsTrigger>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

TabsTrigger.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  disabled: PropTypes.bool,
  /** Decorative icon element before the label; coloured by tab state. */
  leadingVisual: PropTypes.element,
  className: PropTypes.string,
  children: PropTypes.node,
};

// ── TabsContent ─────────────────────────────────────────────────────────
const tabsContentClasses = 'tw-flex-1 tw-outline-none';

const TabsContent = forwardRef(function TabsContent({ className, ...props }, ref) {
  return <ShadcnTabsContent ref={ref} className={cn(tabsContentClasses, className)} {...props} />;
});
TabsContent.displayName = 'TabsContent';

TabsContent.propTypes = {
  className: PropTypes.string,
};

// ── Exports ─────────────────────────────────────────────────────────────
export { Tabs, TabsList, tabsListVariants, TabsTrigger, tabsTriggerVariants, TabsContent, tabsContentClasses };
