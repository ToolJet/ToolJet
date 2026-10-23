import React from 'react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Rocket/Skeleton/Skeleton';
import { GRID_TEMPLATE_COLUMNS } from '@/HomePage/ItemsList/columns';
import { INFO_SKELETON_WIDTHS, SKELETON_BAR_CLASS } from '@/HomePage/ItemsList/FolderStatusRow';
import { FOOTER_CLASS } from '@/HomePage/ItemsList/ListFooter';
import { GRID_CLASS } from './GridSection';

const SKELETON_CLASS = 'tw-rounded tw-bg-interactive-default';
const LIST_ROW_COUNT = 8;
// Figma 2149-158893: a pinned section of 4 cards, then a folders section of 8.
const GRID_SECTIONS = [
  { id: 'pinned', cardCount: 4, isPinned: true },
  { id: 'folders', cardCount: 8, isPinned: false },
];

const range = (count: number) => Array.from({ length: count }, (_, index) => index);

// Rows under the real column header (Figma 1154-87739). The square sits in the chevron slot and the bar
// starts at the name label, past the two 20px icon slots.
export function ListViewLoading() {
  return range(LIST_ROW_COUNT).map((index) => (
    <div
      key={index}
      role="row"
      aria-hidden
      className="tw-grid tw-h-10 tw-items-center tw-px-2"
      style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
    >
      <div className="tw-flex tw-items-center tw-gap-[26px]">
        <Skeleton className={cn(SKELETON_BAR_CLASS, 'tw-w-3.5')} />
        <Skeleton className={cn(SKELETON_BAR_CLASS, 'tw-w-[280px]')} />
      </div>
      {INFO_SKELETON_WIDTHS.map((widthClass) => (
        <Skeleton key={widthClass} className={cn(SKELETON_BAR_CLASS, widthClass)} />
      ))}
    </div>
  ));
}

function CardSkeleton({ isPinned }: { isPinned: boolean }) {
  return (
    <div className="tw-flex tw-h-[104px] tw-flex-col tw-justify-between tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-p-4">
      {/* h-5 matches the loaded card's 20px icon slots. */}
      <div className="tw-flex tw-h-5 tw-items-center tw-justify-between">
        <Skeleton className={cn(SKELETON_CLASS, 'tw-h-4 tw-w-[18px]')} />
        {isPinned && <Skeleton className={cn(SKELETON_CLASS, 'tw-size-4')} />}
      </div>
      <div className="tw-flex tw-flex-col tw-gap-0.5">
        <Skeleton className={cn(SKELETON_CLASS, 'tw-h-4 tw-w-[180px]')} />
        <Skeleton className={cn(SKELETON_CLASS, 'tw-h-3 tw-w-[140px]')} />
      </div>
    </div>
  );
}

export function GridViewLoading() {
  return (
    <div aria-hidden className="tw-flex tw-flex-col tw-gap-6">
      {GRID_SECTIONS.map(({ id, cardCount, isPinned }) => (
        <div key={id} className="tw-flex tw-flex-col tw-gap-2">
          <Skeleton className={cn(SKELETON_CLASS, 'tw-h-4 tw-w-[120px]')} />
          <div className={GRID_CLASS}>
            {range(cardCount).map((index) => (
              <CardSkeleton key={index} isPinned={isPinned} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Stands in for the item count and pagination in both views.
export function FooterLoading() {
  return (
    <div aria-hidden className={FOOTER_CLASS}>
      <Skeleton className={cn(SKELETON_CLASS, 'tw-h-[18px] tw-w-[120px]')} />
      <Skeleton className={cn(SKELETON_CLASS, 'tw-h-[18px] tw-w-[120px]')} />
    </div>
  );
}
