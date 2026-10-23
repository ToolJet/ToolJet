import React, { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

// Shared with the grid loading state so skeleton cards wrap at the same breakpoints.
export const GRID_CLASS = 'tw-grid tw-grid-cols-[repeat(auto-fill,minmax(240px,1fr))] tw-gap-6';

interface GridSectionProps<T> {
  title: string;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

export default function GridSection<T>({ title, items, getKey, renderItem }: GridSectionProps<T>) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="grid-section-heading" className="tw-flex tw-flex-col tw-gap-2">
      <h2 id="grid-section-heading" className="tw-m-0 tw-font-title-default tw-text-text-default">
        {title} ({items.length})
      </h2>
      <ul className={cn(GRID_CLASS, 'tw-m-0 tw-list-none tw-p-0')}>
        {items.map((item) => (
          <li key={getKey(item)} className="tw-min-w-0">
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </section>
  );
}
