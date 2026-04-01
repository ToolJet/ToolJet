import React, { forwardRef, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
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
const tabsListVariants = cva(['tw-group/tabs-list tw-inline-flex tw-w-fit tw-items-center', '!tw-h-auto', 'tw-gap-0.5'], {
  variants: {
    variant: {
      underline: ['tw-border-0 tw-border-b tw-border-solid tw-border-border-weak', 'tw-bg-transparent tw-rounded-none'],
      'underline-inverted': [
        'tw-border-0 tw-border-t tw-border-solid tw-border-border-weak',
        'tw-bg-transparent tw-rounded-none',
      ],
      pill: ['tw-bg-background-surface-layer-02', 'tw-rounded-lg tw-p-1', 'tw-border-0'],
    },
  },
  defaultVariants: { variant: 'underline' },
});

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
  variant: PropTypes.oneOf(['underline', 'underline-inverted', 'pill']),
  className: PropTypes.string,
};

// ── TabsTrigger ─────────────────────────────────────────────────────────

// Variant-specific trigger classes — only one set applied per trigger
const triggerVariantClasses = {
  underline: [
    "after:tw-content-[''] after:tw-absolute after:tw-inset-x-0 after:tw-h-0.5",
    'after:tw-bg-transparent after:tw-transition-colors',
    'data-[state=active]:after:tw-bg-border-accent-strong',
    'data-[state=active]:tw-text-text-brand',
  ],
  'underline-inverted': [
    "after:tw-content-[''] after:tw-absolute after:tw-inset-x-0 after:tw-h-0.5",
    'after:tw-bg-transparent after:tw-transition-colors',
    'data-[state=active]:after:tw-bg-border-accent-strong',
    'data-[state=active]:tw-text-text-brand',
  ],
  pill: [
    'tw-rounded-md',
    'data-[state=active]:tw-bg-switch-tab',
    'data-[state=active]:tw-text-text-default',
    'data-[state=active]:tw-shadow-elevation-100',
  ],
};

// Indicator position per size × variant (underline = bottom, underline-inverted = top)
const indicatorPositionClasses = {
  underline: {
    large: 'after:-tw-bottom-1',
    default: 'after:-tw-bottom-1',
    small: 'after:-tw-bottom-1',
  },
  'underline-inverted': {
    large: 'after:-tw-top-1',
    default: 'after:-tw-top-1',
    small: 'after:-tw-top-1',
  },
};

// Trigger height per size × variant (pill is 4px shorter to show container padding)
const triggerHeightClasses = {
  underline: { large: 'tw-h-10', default: 'tw-h-8', small: 'tw-h-7' },
  'underline-inverted': { large: 'tw-h-10', default: 'tw-h-8', small: 'tw-h-7' },
  pill: { large: 'tw-h-9', default: 'tw-h-7', small: 'tw-h-6' },
};

const tabsTriggerVariants = cva(
  [
    'tw-relative tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5',
    'tw-bg-transparent tw-border-0 tw-border-solid tw-appearance-none tw-outline-none',
    'tw-cursor-pointer tw-whitespace-nowrap',
    'tw-px-2',
    'tw-transition-colors',
    // Default text
    'tw-text-text-placeholder',
    // Hover
    'hover:tw-text-text-default',
    // Disabled
    'disabled:tw-pointer-events-none disabled:tw-cursor-not-allowed disabled:tw-text-text-disabled',
    // Focus ring
    'focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-1',
    // Icon sizing
    '[&_svg]:tw-pointer-events-none [&_svg]:tw-shrink-0 [&_svg:not([class*=size-])]:tw-size-4',
  ],
  {
    variants: {
      size: {
        large: 'tw-font-body-large',
        default: 'tw-font-body-default',
        small: 'tw-font-body-small',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const TabsTrigger = forwardRef(function TabsTrigger({ className, size = 'default', ...props }, ref) {
  const variant = useContext(TabsVariantContext);
  const resolvedSize = size || 'default';
  return (
    <ShadcnTabsTrigger
      ref={ref}
      className={cn(
        tabsTriggerVariants({ size: resolvedSize }),
        triggerHeightClasses[variant]?.[resolvedSize],
        triggerVariantClasses[variant],
        indicatorPositionClasses[variant]?.[resolvedSize],
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = 'TabsTrigger';

TabsTrigger.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
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
