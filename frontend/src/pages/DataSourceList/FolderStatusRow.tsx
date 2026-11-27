import React from 'react';
import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Rocket/Spinner/Spinner';
import { useDataTableContext } from '@/pages/components/DataTable/DataTableContext';

export type FolderStatusVariant = 'loading' | 'empty' | 'error';

const MESSAGES: Record<FolderStatusVariant, string> = {
  loading: 'Loading..',
  empty: 'No data sources in this folder',
  error: "Couldn't load data sources.",
};

interface FolderStatusRowProps {
  variant: FolderStatusVariant;
  onRetry?: () => void;
  /** Position the row when it sits inside a virtualized list. */
  className?: string;
  style?: CSSProperties;
}

// One full-width row for a folder's loading / empty / error state.
export default function FolderStatusRow({ variant, onRetry, className, style }: FolderStatusRowProps) {
  const { columnCount } = useDataTableContext();

  return (
    <div role="row" className={cn('tw-flex tw-h-7 tw-items-center tw-px-[58px]', className)} style={style}>
      <div
        role="gridcell"
        aria-colspan={columnCount}
        aria-live="polite"
        className={cn(
          'tw-flex tw-items-center tw-gap-1.5',
          variant === 'loading'
            ? 'tw-font-title-default tw-text-text-accent'
            : 'tw-font-body-default tw-text-text-placeholder tw-italic'
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
