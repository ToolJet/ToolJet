import React, { forwardRef, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  Empty as ShadcnEmpty,
  EmptyHeader as ShadcnEmptyHeader,
  EmptyMedia as ShadcnEmptyMedia,
  EmptyTitle as ShadcnEmptyTitle,
  EmptyDescription as ShadcnEmptyDescription,
  EmptyContent as ShadcnEmptyContent,
} from '@/components/ui/Rocket/shadcn/empty';

// ── Size context ──────────────────────────────────────────────────────────
const EmptySizeContext = createContext('default');

// ── Root ──────────────────────────────────────────────────────────────────
const emptyVariants = cva(
  [
    'tw-flex tw-w-full tw-min-w-0 tw-flex-1 tw-flex-col tw-items-center tw-justify-center',
    'tw-rounded-lg tw-border-transparent tw-border tw-border-dashed',
    'tw-text-center tw-text-balance',
  ],
  {
    variants: {
      size: {
        large: 'tw-gap-3 tw-p-8',
        default: 'tw-gap-3 tw-p-6',
        small: 'tw-gap-2 tw-p-4',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const Empty = forwardRef(function Empty({ className, size = 'default', ...props }, ref) {
  return (
    <EmptySizeContext.Provider value={size}>
      <ShadcnEmpty ref={ref} className={cn(emptyVariants({ size }), className)} {...props} />
    </EmptySizeContext.Provider>
  );
});
Empty.displayName = 'Empty';

Empty.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  className: PropTypes.string,
};

// ── Header ────────────────────────────────────────────────────────────────
const EmptyHeader = forwardRef(function EmptyHeader({ className, ...props }, ref) {
  return <ShadcnEmptyHeader ref={ref} className={cn('tw-max-w-sm tw-gap-1', className)} {...props} />;
});
EmptyHeader.displayName = 'EmptyHeader';

// ── Media ─────────────────────────────────────────────────────────────────
const emptyMediaVariants = cva(
  [
    'tw-mb-2 tw-flex tw-shrink-0 tw-items-center tw-justify-center',
    '[&_svg]:tw-pointer-events-none [&_svg]:tw-shrink-0',
  ],
  {
    variants: {
      variant: {
        default: 'tw-bg-transparent',
        icon: [
          'tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg',
          'tw-bg-background-surface-layer-02 tw-text-icon-default',
        ],
      },
      size: {
        large: '',
        default: '',
        small: '',
      },
    },
    compoundVariants: [
      { variant: 'icon', size: 'small', className: 'tw-size-8 [&_svg:not([class*=size-])]:tw-size-3.5' },
      { variant: 'icon', size: 'default', className: 'tw-size-10 [&_svg:not([class*=size-])]:tw-size-4' },
      { variant: 'icon', size: 'large', className: 'tw-size-12 [&_svg:not([class*=size-])]:tw-size-5' },
    ],
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const EmptyMedia = forwardRef(function EmptyMedia({ className, variant = 'default', ...props }, ref) {
  const size = useContext(EmptySizeContext);
  return (
    <ShadcnEmptyMedia
      ref={ref}
      variant={variant}
      className={cn(emptyMediaVariants({ variant, size }), className)}
      {...props}
    />
  );
});
EmptyMedia.displayName = 'EmptyMedia';

EmptyMedia.propTypes = {
  variant: PropTypes.oneOf(['default', 'icon']),
  className: PropTypes.string,
};

// ── Title ─────────────────────────────────────────────────────────────────
const emptyTitleVariants = cva('tw-text-text-default', {
  variants: {
    size: {
      large: 'tw-font-title-x-large',
      default: 'tw-font-title-large',
      small: 'tw-font-title-default',
    },
  },
  defaultVariants: { size: 'default' },
});

const EmptyTitle = forwardRef(function EmptyTitle({ className, ...props }, ref) {
  const size = useContext(EmptySizeContext);
  return <ShadcnEmptyTitle ref={ref} className={cn(emptyTitleVariants({ size }), className)} {...props} />;
});
EmptyTitle.displayName = 'EmptyTitle';

// ── Description ───────────────────────────────────────────────────────────
const emptyDescriptionVariants = cva(
  [
    'tw-text-text-placeholder tw-font-body-default',
    '[&>a]:tw-underline [&>a]:tw-underline-offset-4 [&>a:hover]:tw-text-text-brand',
  ],
  {
    variants: {
      size: {
        large: 'tw-text-sm',
        default: 'tw-text-sm',
        small: 'tw-text-xs',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const EmptyDescription = forwardRef(function EmptyDescription({ className, ...props }, ref) {
  const size = useContext(EmptySizeContext);
  return <ShadcnEmptyDescription ref={ref} className={cn(emptyDescriptionVariants({ size }), className)} {...props} />;
});
EmptyDescription.displayName = 'EmptyDescription';

// ── Content (action area) ─────────────────────────────────────────────────
const EmptyContent = forwardRef(function EmptyContent({ className, ...props }, ref) {
  return (
    <ShadcnEmptyContent
      ref={ref}
      className={cn('tw-flex tw-w-full tw-max-w-sm tw-min-w-0 tw-flex-col tw-items-center tw-text-balance', className)}
      {...props}
    />
  );
});
EmptyContent.displayName = 'EmptyContent';

// ── Exports ───────────────────────────────────────────────────────────────
export {
  Empty,
  emptyVariants,
  EmptyHeader,
  EmptyMedia,
  emptyMediaVariants,
  EmptyTitle,
  emptyTitleVariants,
  EmptyDescription,
  emptyDescriptionVariants,
  EmptyContent,
};
