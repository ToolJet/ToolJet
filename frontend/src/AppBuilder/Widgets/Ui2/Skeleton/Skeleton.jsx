import React from 'react';
import { useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

export const SKELETON = 'bg-[color:var(--lk-bg,color-mix(in_srgb,var(--sc-primary)_10%,transparent))]';

export const ShadSkeleton = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const lines = Math.max(1, Math.min(50, Math.floor(Number(properties.lines)) || 3));
  return (
    <Shell {...props}>
      <div className="flex items-start gap-4">
        {properties.avatar ? <Skeleton className={cn('h-12 w-12 shrink-0 rounded-full', SKELETON)} /> : null}
        <div className="flex flex-1 flex-col gap-2">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton key={i} className={cn('h-4', SKELETON, i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')} />
          ))}
        </div>
      </div>
    </Shell>
  );
};
