import React from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

export const SKELETON = 'tw-bg-[color:var(--lk-bg,color-mix(in_srgb,var(--sc-primary)_10%,transparent))]';

export const ShadSkeleton = (props: WidgetProps) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const lines = Math.max(1, Math.min(50, Math.floor(Number(properties.lines)) || 3));
  return (
    <Shell {...props}>
      <div className="tw-flex tw-items-start tw-gap-4">
        {properties.avatar ? (
          <Skeleton className={cn('tw-h-12 tw-w-12 tw-shrink-0 tw-rounded-full', SKELETON)} />
        ) : null}
        <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton
              key={i}
              className={cn('tw-h-4', SKELETON, i === lines - 1 && lines > 1 ? 'tw-w-3/5' : 'tw-w-full')}
            />
          ))}
        </div>
      </div>
    </Shell>
  );
};

export default withControlState(ShadSkeleton);
