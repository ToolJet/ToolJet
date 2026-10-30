import React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Rocket/Skeleton/Skeleton';
import { Spinner } from '@/components/ui/Rocket/Spinner/Spinner';
import { GRID_TEMPLATE_COLUMNS, columns } from './columns';

export const SKELETON_BAR_CLASS = 'tw-h-3.5 tw-rounded tw-bg-interactive-default';
// Figma 1407-52207 varies the bar widths per info column so the placeholder doesn't look tiled.
export const INFO_SKELETON_WIDTHS = ['tw-w-[105px]', 'tw-w-[110px]', 'tw-w-[63px]', 'tw-w-[106px]'];

export function FolderSkeletonRow() {
  return (
    <div
      role="row"
      aria-hidden
      className="tw-grid tw-h-10 tw-items-center tw-px-2"
      style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
    >
      <div className="tw-flex tw-items-center tw-gap-2 tw-pl-11">
        <Skeleton className={cn(SKELETON_BAR_CLASS, 'tw-w-3.5')} />
        <Skeleton className={cn(SKELETON_BAR_CLASS, 'tw-w-[280px]')} />
      </div>
      {INFO_SKELETON_WIDTHS.map((widthClass) => (
        <Skeleton key={widthClass} className={cn(SKELETON_BAR_CLASS, widthClass)} />
      ))}
    </div>
  );
}

const MESSAGES = {
  loading: 'Loading..',
  empty: 'No apps in this folder',
  error: "Couldn't load apps.",
};

// One full-width row for a folder's loading / empty / error state; `className`/`style` position it when virtualized.
export function FolderStatusRow({ variant, onRetry, className, style }) {
  return (
    <div role="row" className={cn('tw-flex tw-h-7 tw-items-center tw-px-[58px]', className)} style={style}>
      <div
        role="gridcell"
        aria-colspan={columns.length}
        aria-live="polite"
        className={cn(
          'tw-flex tw-items-center tw-gap-1.5',
          variant === 'loading'
            ? 'tw-font-title-default tw-text-text-accent'
            : 'tw-font-body-default tw-text-text-placeholder'
        )}
      >
        {variant === 'loading' && <Spinner aria-hidden className="tw-size-3.5 tw-text-icon-accent" />}
        {MESSAGES[variant]}
        {variant === 'error' && (
          <Button variant="ghostBrand" size="small" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
