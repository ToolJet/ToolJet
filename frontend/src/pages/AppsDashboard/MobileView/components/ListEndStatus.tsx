import React from 'react';

import { Spinner } from '@/components/ui/Rocket/Spinner/Spinner';

interface ListEndStatusProps {
  isFetchingNextPage: boolean;
  /** Set once every page has loaded and there was more than one. */
  loadedAllCount?: number;
}

// Figma 1849-153630 (next page) and 1849-153792 (end of list).
export function ListEndStatus({ isFetchingNextPage, loadedAllCount }: ListEndStatusProps) {
  if (isFetchingNextPage) {
    return (
      <p
        aria-live="polite"
        className="tw-m-0 tw-flex tw-items-center tw-justify-center tw-gap-1.5 tw-py-3 tw-font-title-default tw-text-text-accent"
      >
        <Spinner aria-hidden className="tw-size-3.5 tw-text-icon-accent" />
        Loading..
      </p>
    );
  }

  if (loadedAllCount === undefined) return null;

  return (
    <p className="tw-m-0 tw-p-0 tw-text-center tw-font-body-large tw-text-text-placeholder">
      All {loadedAllCount} items loaded
    </p>
  );
}
