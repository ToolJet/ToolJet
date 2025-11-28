import React from 'react';
import { Skeleton } from '@/components/ui/Rocket/skeleton';

export function PaginationFooterSkeleton() {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-h-12">
      <Skeleton className="tw-h-5 tw-w-20" />
      <div className="tw-flex tw-items-center tw-gap-2">
        <Skeleton className="tw-h-8 tw-w-8" />
        <Skeleton className="tw-h-8 tw-w-8" />
        <Skeleton className="tw-h-8 tw-w-8" />
        <Skeleton className="tw-h-8 tw-w-8" />
      </div>
    </div>
  );
}
