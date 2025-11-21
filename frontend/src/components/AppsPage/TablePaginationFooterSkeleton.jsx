import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function TablePaginationFooterSkeleton() {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-h-12">
      {/* Left: Record count skeleton */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-grow">
        <Skeleton className="tw-h-4 tw-w-24" />
      </div>

      {/* Right: Pagination skeleton */}
      <div className="tw-flex tw-items-center tw-gap-1">
        {/* Previous button skeleton */}
        <Skeleton className="tw-h-7 tw-w-16" />

        {/* Page number button skeletons */}
        <Skeleton className="tw-h-7 tw-w-7" />
        <Skeleton className="tw-h-7 tw-w-7" />
        <Skeleton className="tw-h-7 tw-w-7" />

        {/* Next button skeleton */}
        <Skeleton className="tw-h-7 tw-w-16" />
      </div>
    </div>
  );
}
