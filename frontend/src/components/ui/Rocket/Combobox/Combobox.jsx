import React, { forwardRef, createContext, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import {
  Combobox as ShadcnCombobox,
  ComboboxInput as ShadcnComboboxInput,
  ComboboxContent as ShadcnComboboxContent,
  ComboboxList as ShadcnComboboxList,
  ComboboxItem as ShadcnComboboxItem,
  ComboboxEmpty as ShadcnComboboxEmpty,
  ComboboxTrigger as ShadcnComboboxTrigger,
  ComboboxLabel as ShadcnComboboxLabel,
  ComboboxSeparator as ShadcnComboboxSeparator,
  // Re-exported unchanged (no visual tokens to override)
  ComboboxValue,
  ComboboxGroup,
  ComboboxCollection,
} from '@/components/ui/Rocket/shadcn/combobox';

// ── Anchor context ────────────────────────────────────────────────────────
// Base UI Positioner anchors to the Trigger (chevron button, ~28px).
// We need it to anchor to the full-width InputGroup wrapper instead.
// Combobox → provides ref, ComboboxInput → attaches it, ComboboxContent → uses it as anchor.
const ComboboxAnchorContext = createContext(null);

// ── ComboboxInput ─────────────────────────────────────────────────────────
// className is forwarded to InputGroup via ShadcnComboboxInput → InputGroup's cn(),
// so tailwind-merge resolves conflicts on the same element (same pattern as SelectTrigger).

const comboboxInputVariants = cva(
  [
    // ── Override InputGroup defaults ──────────────────────────────────────
    // InputGroup: tw-border-input → our token (tw-border-solid needed — preflight is off)
    'tw-border-solid tw-border-border-default',
    // shadcn ComboboxInput sets tw-w-auto on InputGroup — override to full width so dropdown matches
    'tw-w-full',
    // InputGroup: tw-shadow-xs → flat
    'tw-shadow-none',
    // InputGroup: (no light bg) → add surface bg
    'tw-bg-background-surface-layer-01',
    // InputGroup: dark:tw-bg-input/30 → override dark bg with same token (CSS var handles dark)
    'dark:tw-bg-background-surface-layer-01',
    'tw-rounded-md',

    // ── Text (descendant selectors into inner <input>) ───────────────────
    '[&_input]:tw-text-text-default',
    '[&_input]:placeholder:tw-text-text-placeholder',

    // ── Chevron icon colour + rotation animation ─────────────────────────
    '[&_[data-slot=combobox-trigger-icon]]:tw-text-icon-default',
    '[&_[data-slot=combobox-trigger-icon]]:tw-transition-transform',
    '[&_[data-slot=combobox-trigger-icon]]:tw-duration-200',
    // When trigger has data-popup-open, rotate the chevron icon
    '[&_[data-slot=combobox-trigger][data-popup-open]_[data-slot=combobox-trigger-icon]]:tw-rotate-180',

    // ── Trigger button — clean ghost ─────────────────────────────────────
    '[&_[data-slot=combobox-trigger]]:tw-border-0',
    '[&_[data-slot=combobox-trigger]]:tw-shadow-none',
    '[&_[data-slot=combobox-trigger]]:tw-bg-transparent',

    // ── Hover ────────────────────────────────────────────────────────────
    'hover:tw-border-border-strong',

    // ── Focus ring — match InputGroup's EXACT modifier so tw-merge wins ──
    // InputGroup: has-[…:focus-visible]:tw-ring-ring + tw-ring-1
    'has-[[data-slot=input-group-control]:focus-visible]:tw-ring-2',
    'has-[[data-slot=input-group-control]:focus-visible]:tw-ring-interactive-focus-outline',
    'has-[[data-slot=input-group-control]:focus-visible]:tw-ring-offset-1',

    // ── Error — match InputGroup's EXACT modifier so tw-merge wins ───────
    // InputGroup: has-[[data-slot][aria-invalid=true]]:tw-border-destructive + tw-ring-destructive/20
    'has-[[data-slot][aria-invalid=true]]:tw-border-border-danger-strong',
    'has-[[data-slot][aria-invalid=true]]:tw-ring-0',
    'has-[[data-slot][aria-invalid=true]]:tw-bg-background-error-weak',
    // Neutralize InputGroup's dark error ring too
    'dark:has-[[data-slot][aria-invalid=true]]:tw-ring-0',
  ],
  {
    variants: {
      size: {
        large: 'tw-h-10 [&_input]:tw-text-lg',
        default: 'tw-h-8 [&_input]:tw-text-base',
        small: 'tw-h-7 [&_input]:tw-text-base',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const ComboboxInput = forwardRef(function ComboboxInput(
  { className, size, loading, disabled, readOnly, ...props },
  ref
) {
  const anchorRef = useContext(ComboboxAnchorContext);

  const handleClick = (e) => {
    // Don't steal focus from button clicks (trigger, clear)
    if (e.target.closest('button')) return;
    // Focus the input inside
    anchorRef.current?.querySelector('input')?.focus();
  };

  return (
    <div ref={anchorRef} className="tw-w-full" onClick={handleClick}>
      <ShadcnComboboxInput
        ref={ref}
        disabled={disabled}
        readOnly={readOnly}
        showTrigger={!loading}
        className={cn(
          comboboxInputVariants({ size }),
          // Disabled
          disabled && [
            'tw-bg-background-surface-layer-02',
            'tw-text-text-disabled',
            'tw-border-transparent',
            'tw-shadow-none',
            'tw-pointer-events-none',
            '[&_input]:tw-text-text-disabled',
          ],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="tw-mr-2 tw-size-4 tw-animate-spin tw-text-icon-default" />}
      </ShadcnComboboxInput>
    </div>
  );
});
ComboboxInput.displayName = 'ComboboxInput';
ComboboxInput.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  className: PropTypes.string,
};

// ── ComboboxContent ───────────────────────────────────────────────────────

const ComboboxContent = forwardRef(function ComboboxContent({ className, ...props }, ref) {
  const anchorRef = useContext(ComboboxAnchorContext);
  return (
    <ShadcnComboboxContent
      ref={ref}
      anchor={anchorRef}
      className={cn(
        'tw-ring-interactive-weak tw-bg-background-surface-layer-01 tw-rounded-[10px] tw-shadow-elevation-300 tw-p-2',
        className
      )}
      {...props}
    />
  );
});
ComboboxContent.displayName = 'ComboboxContent';

// ── ComboboxList ──────────────────────────────────────────────────────────

const ComboboxList = forwardRef(function ComboboxList({ className, ...props }, ref) {
  return <ShadcnComboboxList ref={ref} className={cn('tw-peer tw-p-0', className)} {...props} />;
});
ComboboxList.displayName = 'ComboboxList';

// ── ComboboxItem ──────────────────────────────────────────────────────────

const ComboboxItem = forwardRef(function ComboboxItem({ className, ...props }, ref) {
  return (
    <ShadcnComboboxItem
      ref={ref}
      className={cn(
        'tw-h-8 tw-text-base tw-text-text-default tw-rounded-md tw-pl-[30px] tw-pr-2 tw-py-1.5',
        'data-[highlighted]:tw-bg-interactive-hover data-[highlighted]:tw-text-text-default',
        // Move check indicator from right → left (match Select pattern)
        '[&_[data-slot=combobox-item-indicator]]:tw-left-2 [&_[data-slot=combobox-item-indicator]]:tw-right-auto',
        '[&_[data-slot=combobox-item-indicator]_svg]:tw-text-text-brand',
        className
      )}
      {...props}
    />
  );
});
ComboboxItem.displayName = 'ComboboxItem';

// ── ComboboxEmpty ─────────────────────────────────────────────────────────

const ComboboxEmpty = forwardRef(function ComboboxEmpty({ className, ...props }, ref) {
  // Base UI's ComboboxPrimitive.Empty relies on the `items` collection API to detect empty state.
  // In composition mode (items rendered as children, no `items` prop), `filteredItems` is always [],
  // so `data-empty` is always set on the Popup and Empty always renders its children.
  // Fix: plain div, default visible. ComboboxList has `peer` class — we use peer-has-[...] to
  // hide Empty when the preceding list contains any non-hidden items.
  return (
    <div
      ref={ref}
      data-slot="combobox-empty"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'tw-flex tw-w-full tw-justify-center tw-text-text-placeholder tw-py-6 tw-text-center tw-text-sm',
        // Hide when sibling peer (ComboboxList) has visible items
        'peer-has-[[data-slot=combobox-item]:not([hidden])]:tw-hidden',
        className
      )}
      {...props}
    />
  );
});
ComboboxEmpty.displayName = 'ComboboxEmpty';

// ── ComboboxTrigger ──────────────────────────────────────────────────────

const ComboboxTrigger = forwardRef(function ComboboxTrigger({ className, ...props }, ref) {
  return (
    <ShadcnComboboxTrigger
      ref={ref}
      className={cn(
        // Icon colour override (also set from InputGroup CVA, but needed for standalone use)
        '[&_[data-slot=combobox-trigger-icon]]:tw-text-icon-default',
        className
      )}
      {...props}
    />
  );
});
ComboboxTrigger.displayName = 'ComboboxTrigger';

// ── ComboboxLabel ────────────────────────────────────────────────────────

const ComboboxLabel = forwardRef(function ComboboxLabel({ className, ...props }, ref) {
  return (
    <ShadcnComboboxLabel
      ref={ref}
      className={cn(
        'tw-text-text-placeholder tw-text-xs tw-font-semibold',
        className
      )}
      {...props}
    />
  );
});
ComboboxLabel.displayName = 'ComboboxLabel';

// ── ComboboxSeparator ────────────────────────────────────────────────────

const ComboboxSeparator = forwardRef(function ComboboxSeparator({ className, ...props }, ref) {
  return (
    <ShadcnComboboxSeparator
      ref={ref}
      className={cn('tw-bg-border-weak', className)}
      {...props}
    />
  );
});
ComboboxSeparator.displayName = 'ComboboxSeparator';

// ── Combobox (root pass-through) ──────────────────────────────────────────

function Combobox(props) {
  const anchorRef = useRef(null);
  return (
    <ComboboxAnchorContext.Provider value={anchorRef}>
      <ShadcnCombobox {...props} />
    </ComboboxAnchorContext.Provider>
  );
}
Combobox.displayName = 'Combobox';

// ── Exports ───────────────────────────────────────────────────────────────

export {
  Combobox,
  ComboboxInput,
  comboboxInputVariants,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  // Styled wrappers
  ComboboxTrigger,
  ComboboxLabel,
  ComboboxSeparator,
  // Re-exports from shadcn (no visual tokens to override)
  ComboboxValue,
  ComboboxGroup,
  ComboboxCollection,
};
