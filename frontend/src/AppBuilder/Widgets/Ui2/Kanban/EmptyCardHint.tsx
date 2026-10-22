import React from 'react';
import useStore from '@/AppBuilder/_stores/store';

type ChildrenState = { containerChildrenMapping?: Record<string, string[] | undefined> };

/** In the editor, a custom card with no components says what to put on it: nothing told a builder that a card's
 *  components read their card's data as {{cardData.<field>}}. It lets drops through, and goes once a component is on
 *  the card. Not drawn in the viewer. */
export const EmptyCardHint = ({ id }: { id: string }) => {
  const empty = useStore((state: ChildrenState) => !(state.containerChildrenMapping?.[id]?.length ?? 0));
  if (!empty) return null;
  return (
    <div
      data-empty-card-hint=""
      className="tw-pointer-events-none tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-p-3 tw-text-center tw-text-xs tw-text-[color:var(--sc-muted-foreground)]"
    >
      <span className="tw-font-medium tw-text-[color:var(--sc-foreground)]">Drop components on the card</span>
      <span>
        Bind them to this card&apos;s data, e.g. <code className="tw-font-mono">{'{{cardData.title}}'}</code>
      </span>
    </div>
  );
};
