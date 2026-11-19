import React from 'react';

interface ListSentinelProps {
  sentinelRef: React.Ref<HTMLDivElement>;
  hasNextPage: boolean;
}

// Zero-height marker whose visibility loads the next page. It is a flex item of a `gap-4` column, so -mt-4 cancels the gap it would add.
export function ListSentinel({ sentinelRef, hasNextPage }: ListSentinelProps) {
  if (!hasNextPage) return null;
  return <div ref={sentinelRef} aria-hidden className="tw-h-0 -tw-mt-4" />;
}
