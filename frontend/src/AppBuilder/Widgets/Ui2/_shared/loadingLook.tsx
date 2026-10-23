import React from 'react';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// ToolJet UI 2.0: the loading look a widget picks with its "Loading look" property. Spinner (the
// default) shows the circle in the widget's own box, so the layout does not move; Skeleton draws the widget's
// shape in grey blocks. Controls (inputs, pickers, buttons) always show a spinner in place and have no choice.

export const Spinner = ({ className }: { className?: string }) => (
  <span
    role="status"
    aria-label="Loading"
    className={cn(
      'tw-inline-block tw-h-4 tw-w-4 tw-shrink-0 tw-animate-spin tw-rounded-full tw-border-2 tw-border-[color:var(--sc-muted-foreground)] tw-border-t-transparent',
      className
    )}
  />
);

/** True when the widget asked for skeletons; anything else (unset, junk) reads as the spinner. */
export const wantsSkeleton = (properties: Resolved | undefined): boolean => properties?.loadingIndicator === 'skeleton';

/** A widget-sized look's height: the height its content last had while a fitted widget loads (useSkeletonHold sets
 *  --ui2-held-height on its root), else `px`, its box. */
export const heldHeight = (px: number): string => `var(--ui2-held-height, ${px}px)`;

/** A spinner centred in a box of the widget's height (at least 24px), larger in a large box. `fill`: the box is the
 *  whole widget, so it takes the held height while a fitted widget loads (a part of one, a Table's rows, does not). */
export const LoadingBox = ({
  height,
  className,
  fill = true,
}: {
  height?: number;
  className?: string;
  fill?: boolean;
}) => {
  const h = Math.max(24, Math.min(4000, Number(height) || 40));
  return (
    <div
      className={cn('tw-flex tw-w-full tw-items-center tw-justify-center', className)}
      style={{ height: fill ? heldHeight(h) : h }}
    >
      <Spinner className={h >= 80 ? 'tw-h-6 tw-w-6' : undefined} />
    </div>
  );
};
