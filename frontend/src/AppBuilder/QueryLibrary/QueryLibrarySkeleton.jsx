import React from 'react';
import Skeleton from 'react-loading-skeleton';
import FolderSkeleton from '@/_ui/FolderSkeleton/FolderSkeleton';

export default function QueryLibrarySkeleton() {
  return (
    <div role="status" className="tw-flex tw-w-full tw-flex-1 tw-min-h-0">
      <span className="tw-sr-only">Loading query library…</span>
      <div className="tw-w-60 tw-shrink-0 tw-border-r tw-border-solid tw-border-border-weak tw-p-4">
        <Skeleton height={20} width={100} className="tw-mb-4" />
        <FolderSkeleton />
      </div>
      <div className="tw-flex-1 tw-p-4">
        <Skeleton height={20} width={160} className="tw-mb-4" />
        <Skeleton height={36} className="tw-mb-4" />
        <Skeleton height={120} />
      </div>
      <div className="tw-w-60 tw-shrink-0 tw-border-l tw-border-solid tw-border-border-weak tw-p-4">
        <Skeleton height={20} width={80} className="tw-mb-4" />
        <Skeleton height={20} width={120} />
      </div>
    </div>
  );
}
