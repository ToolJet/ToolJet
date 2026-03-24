import React, { forwardRef, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  Pagination as ShadcnPagination,
  PaginationContent as ShadcnPaginationContent,
  PaginationItem as ShadcnPaginationItem,
  PaginationLink as ShadcnPaginationLink,
  PaginationPrevious as ShadcnPaginationPrevious,
  PaginationNext as ShadcnPaginationNext,
  PaginationEllipsis as ShadcnPaginationEllipsis,
} from '@/components/ui/Rocket/shadcn/pagination';

const PaginationContext = createContext({ size: 'default' });

// ── Size-aware classes for page link items ─────────────────────────────────
const paginationLinkVariants = cva(
  [
    'tw-inline-flex tw-items-center tw-justify-center tw-no-underline',
    'tw-rounded-md tw-transition-colors tw-cursor-pointer',
    'tw-border-0 tw-border-solid tw-appearance-none tw-outline-none',
    'tw-text-text-default tw-font-normal tw-text-sm',
    'hover:tw-bg-interactive-hover hover:tw-no-underline hover:tw-text-text-default',
    'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-1',
  ],
  {
    variants: {
      size: {
        large: 'tw-size-8',
        default: 'tw-size-7',
        small: 'tw-size-6',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const activeClasses = 'tw-bg-background-surface-layer-01 tw-border tw-border-border-weak tw-font-medium';

// ── Size-aware classes for prev/next buttons ───────────────────────────────
const paginationNavVariants = cva(
  [
    'tw-inline-flex tw-items-center tw-gap-1.5 tw-no-underline',
    'tw-rounded-md tw-transition-colors tw-cursor-pointer',
    'tw-border-0 tw-border-solid tw-appearance-none tw-outline-none',
    'tw-text-text-default tw-text-sm tw-font-medium',
    'hover:tw-bg-interactive-hover hover:tw-no-underline hover:tw-text-text-default',
    'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline focus-visible:tw-ring-offset-1',
    '[&_svg]:tw-text-icon-weak',
  ],
  {
    variants: {
      size: {
        large: 'tw-h-8 tw-px-3 tw-py-1',
        default: 'tw-h-7 tw-px-2.5 tw-py-1',
        small: 'tw-h-6 tw-px-2 tw-py-0.5',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

// ── Size-aware classes for ellipsis ────────────────────────────────────────
const paginationEllipsisVariants = cva(['tw-inline-flex tw-items-center tw-justify-center', 'tw-text-icon-default'], {
  variants: {
    size: {
      large: 'tw-size-8',
      default: 'tw-size-7',
      small: 'tw-size-6',
    },
  },
  defaultVariants: { size: 'default' },
});

// ── Pagination (root nav) ──────────────────────────────────────────────────
const Pagination = forwardRef(function Pagination({ className, size = 'default', ...props }, ref) {
  return (
    <PaginationContext.Provider value={{ size }}>
      <ShadcnPagination
        ref={ref}
        className={cn('tw-mx-auto tw-flex tw-w-full tw-justify-center', className)}
        {...props}
      />
    </PaginationContext.Provider>
  );
});

Pagination.displayName = 'Pagination';

Pagination.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  className: PropTypes.string,
};

// ── PaginationContent (ul) ─────────────────────────────────────────────────
const PaginationContent = forwardRef(function PaginationContent({ className, ...props }, ref) {
  return (
    <ShadcnPaginationContent
      ref={ref}
      className={cn('tw-flex tw-flex-row tw-items-center tw-gap-1 tw-list-none', className)}
      {...props}
    />
  );
});

PaginationContent.displayName = 'PaginationContent';

PaginationContent.propTypes = {
  className: PropTypes.string,
};

// ── PaginationItem (li) ────────────────────────────────────────────────────
const PaginationItem = forwardRef(function PaginationItem({ className, ...props }, ref) {
  return <ShadcnPaginationItem ref={ref} className={className} {...props} />;
});

PaginationItem.displayName = 'PaginationItem';

PaginationItem.propTypes = {
  className: PropTypes.string,
};

// ── PaginationLink (page number) ───────────────────────────────────────────
function PaginationLink({ className, isActive, size, ...props }) {
  const context = useContext(PaginationContext);
  const resolvedSize = size || context.size;

  return (
    <ShadcnPaginationLink
      isActive={isActive}
      className={cn(paginationLinkVariants({ size: resolvedSize }), isActive && activeClasses, className)}
      {...props}
    />
  );
}

PaginationLink.displayName = 'PaginationLink';

PaginationLink.propTypes = {
  isActive: PropTypes.bool,
  size: PropTypes.oneOf(['large', 'default', 'small']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

// ── PaginationPrevious ─────────────────────────────────────────────────────
function PaginationPrevious({ className, size, ...props }) {
  const context = useContext(PaginationContext);
  const resolvedSize = size || context.size;

  return (
    <ShadcnPaginationPrevious className={cn(paginationNavVariants({ size: resolvedSize }), className)} {...props} />
  );
}

PaginationPrevious.displayName = 'PaginationPrevious';

PaginationPrevious.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

// ── PaginationNext ─────────────────────────────────────────────────────────
function PaginationNext({ className, size, ...props }) {
  const context = useContext(PaginationContext);
  const resolvedSize = size || context.size;

  return <ShadcnPaginationNext className={cn(paginationNavVariants({ size: resolvedSize }), className)} {...props} />;
}

PaginationNext.displayName = 'PaginationNext';

PaginationNext.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

// ── PaginationEllipsis ─────────────────────────────────────────────────────
function PaginationEllipsis({ className, size, ...props }) {
  const context = useContext(PaginationContext);
  const resolvedSize = size || context.size;

  return (
    <ShadcnPaginationEllipsis
      className={cn(paginationEllipsisVariants({ size: resolvedSize }), className)}
      {...props}
    />
  );
}

PaginationEllipsis.displayName = 'PaginationEllipsis';

PaginationEllipsis.propTypes = {
  size: PropTypes.oneOf(['large', 'default', 'small']),
  className: PropTypes.string,
};

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  paginationLinkVariants,
  paginationNavVariants,
  paginationEllipsisVariants,
};
