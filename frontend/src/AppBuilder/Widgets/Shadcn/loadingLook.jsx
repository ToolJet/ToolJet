import React from 'react';
import { cn } from './ui';

// shadcn/ui pack (experiment): the loading look a widget picks with its "Loading look" property. Spinner (the
// default) shows the circle in the widget's own box, so the layout does not move; Skeleton draws the widget's
// shape in grey blocks. Controls (inputs, pickers, buttons) always show a spinner in place and have no choice.

export const Spinner = ({ className }) => (
  <span
    role="status"
    aria-label="Loading"
    className={cn(
      'inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[color:var(--sc-muted-foreground)] border-t-transparent',
      className
    )}
  />
);

/** True when the widget asked for skeletons; anything else (unset, junk) reads as the spinner. */
export const wantsSkeleton = (properties) => properties?.loadingIndicator === 'skeleton';

/** A spinner centred in a box of the widget's height (at least 24px), larger in a large box. */
export const LoadingBox = ({ height, className }) => {
  const h = Math.max(24, Math.min(4000, Number(height) || 40));
  return (
    <div className={cn('flex w-full items-center justify-center', className)} style={{ height: h }}>
      <Spinner className={h >= 80 ? 'h-6 w-6' : undefined} />
    </div>
  );
};
