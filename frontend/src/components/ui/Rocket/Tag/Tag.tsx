import React, { type HTMLAttributes, type MouseEventHandler, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, X } from 'lucide-react';

import { cn } from '@/lib/utils';

// Hover and pressed on Warning and Neutral stack the interactive wash over their own fill.
const WASH_HOVER = 'hover:tw-bg-[linear-gradient(var(--interactive-hover),var(--interactive-hover))]';
const WASH_PRESSED = 'active:tw-bg-[linear-gradient(var(--interactive-selected),var(--interactive-selected))]';

const tagVariants = cva(
  [
    'tw-box-border tw-inline-flex tw-h-5 tw-max-w-full tw-shrink-0 tw-items-center tw-gap-0.5 tw-rounded-full tw-px-2',
    'tw-align-middle tw-font-title-small tw-whitespace-nowrap [&_svg]:tw-size-3 [&_svg]:tw-shrink-0',
    'has-[button:focus-visible]:tw-ring-2 has-[button:focus-visible]:tw-ring-interactive-focus-outline',
  ],
  {
    variants: {
      variant: {
        solid: 'tw-bg-button-primary tw-text-text-on-solid',
        background: 'tw-bg-tag-weak tw-text-text-accent',
        outline: 'tw-border tw-border-solid tw-border-border-weak tw-bg-button-secondary tw-text-text-default',
        warning: 'tw-bg-background-warning-weak tw-text-text-warning',
        neutral: 'tw-bg-interactive-default tw-text-text-disabled',
      },
      // Static chips carry no hover or pressed look; only clickable ones do.
      interactive: { true: '', false: '' },
      disabled: { true: '', false: '' },
    },
    compoundVariants: [
      {
        variant: 'solid',
        interactive: true,
        className: 'hover:tw-bg-button-primary-hover active:tw-bg-button-primary-pressed',
      },
      {
        variant: 'background',
        interactive: true,
        className: 'hover:tw-bg-tag-weak-hover active:tw-bg-tag-weak-pressed',
      },
      {
        variant: 'outline',
        interactive: true,
        className:
          'hover:tw-border-border-default hover:tw-bg-button-outline-hover active:tw-bg-button-outline-pressed',
      },
      { variant: 'warning', interactive: true, className: `${WASH_HOVER} ${WASH_PRESSED}` },
      { variant: 'neutral', interactive: true, className: `${WASH_HOVER} ${WASH_PRESSED}` },
      {
        variant: ['solid', 'background'],
        disabled: true,
        className: 'tw-bg-button-primary-disabled tw-text-text-on-solid',
      },
      {
        variant: ['outline', 'warning', 'neutral'],
        disabled: true,
        className:
          'tw-border tw-border-solid tw-border-border-weak tw-bg-button-outline-disabled tw-text-text-disabled',
      },
    ],
    defaultVariants: { variant: 'solid', interactive: false, disabled: false },
  }
);

// The prefix and the remove glyph have their own colours per variant.
const PREFIX_CLASS = {
  solid: 'tw-text-text-disabled-on-solid',
  background: 'tw-text-text-placeholder',
  outline: 'tw-text-text-placeholder',
  warning: 'tw-text-text-placeholder',
  neutral: 'tw-text-text-disabled',
} as const;

const REMOVE_CLASS = {
  solid: 'tw-text-icon-on-solid',
  background: 'tw-text-icon-brand',
  outline: 'tw-text-icon-default',
  warning: 'tw-text-icon-warning',
  neutral: 'tw-text-icon-default',
} as const;

export type TagVariant = NonNullable<VariantProps<typeof tagVariants>['variant']>;

export interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'prefix' | 'onClick'> {
  variant?: TagVariant;
  /** Muted text before the label, as in "On update RESTRICT". */
  prefix?: ReactNode;
  leadingVisual?: ReactNode;
  trailingVisual?: ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  /** Accessible name of the remove button. Defaults to "Remove <label>" for a text label. */
  removeLabel?: string;
  /** Makes the tag clickable. Without it the tag is a static chip. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
}

// A pill for filters, labels and status. The remove button is a sibling of the clickable part, never nested in it.
function Tag({
  variant = 'solid',
  prefix,
  leadingVisual,
  trailingVisual,
  removable = false,
  onRemove,
  removeLabel,
  onClick,
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}: TagProps) {
  const inactive = disabled || loading;
  const interactive = !!onClick && !inactive;

  const content = (
    <>
      {loading && <Loader2 role="status" aria-label="Loading" className="tw-animate-spin" />}
      {leadingVisual}
      <span className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-1">
        {prefix && <span className={cn(inactive ? undefined : PREFIX_CLASS[variant])}>{prefix}</span>}
        <span className="tw-truncate">{children}</span>
      </span>
      {trailingVisual}
    </>
  );

  return (
    <span className={cn(tagVariants({ variant, interactive, disabled }), className)} {...props}>
      {onClick ? (
        <button
          type="button"
          disabled={inactive}
          aria-busy={loading || undefined}
          onClick={onClick}
          className="tw-inline-flex tw-min-w-0 tw-cursor-pointer tw-items-center tw-gap-0.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit tw-outline-none tw-font-[inherit] disabled:tw-cursor-not-allowed"
        >
          {content}
        </button>
      ) : (
        <span className="tw-inline-flex tw-min-w-0 tw-items-center tw-gap-0.5">{content}</span>
      )}
      {removable && (
        <button
          type="button"
          disabled={inactive}
          aria-label={removeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove')}
          onClick={onRemove}
          className={cn(
            'tw-inline-flex tw-size-3 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-outline-none',
            'disabled:tw-cursor-not-allowed',
            inactive ? 'tw-text-icon-disabled' : REMOVE_CLASS[variant]
          )}
        >
          <X aria-hidden />
        </button>
      )}
    </span>
  );
}

export { Tag, tagVariants };
