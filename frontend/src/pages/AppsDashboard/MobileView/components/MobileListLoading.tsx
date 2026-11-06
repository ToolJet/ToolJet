import React from 'react';

import { Skeleton } from '@/components/ui/Rocket/Skeleton/Skeleton';

// Same fill as the desktop skeletons (LoadingStates.tsx keeps its constant private).
export const SKELETON_CLASS = 'tw-rounded tw-bg-interactive-default';

// Figma 1849-153490 (root) and 1849-153978 (folder).
export function MobileListLoading({ rowCount = 8 }) {
  return (
    <ul
      aria-hidden
      className="tw-m-0 tw-list-none tw-overflow-hidden tw-rounded-lg tw-bg-background-surface-layer-01 tw-p-0 tw-shadow-elevation-100"
    >
      {Array.from({ length: rowCount }, (_, index) => (
        <li
          key={index}
          className="tw-flex tw-h-[51px] tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4 last:tw-border-b-0"
        >
          <div className="tw-flex tw-gap-3">
            <Skeleton className={`${SKELETON_CLASS} tw-size-4`} />
            <Skeleton className={`${SKELETON_CLASS} tw-h-4 tw-w-40`} />
          </div>

          {index < 4 && <Skeleton className={`${SKELETON_CLASS} tw-size-4`} />}
        </li>
      ))}
    </ul>
  );
}
