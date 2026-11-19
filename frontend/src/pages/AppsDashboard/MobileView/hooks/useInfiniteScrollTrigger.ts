import { useEffect, useRef } from 'react';

interface InfiniteScrollTriggerInput {
  hasNextPage: boolean;
  isFetching: boolean;
  fetchNextPage: () => unknown;
}

// Returns a ref for a sentinel element placed after the list; the next page loads when it scrolls into view.
export function useInfiniteScrollTrigger({ hasNextPage, isFetching, fetchNextPage }: InfiniteScrollTriggerInput) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchNextPageRef = useRef(fetchNextPage);
  fetchNextPageRef.current = fetchNextPage;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetching) return;

    // Rootless observer: the page itself scrolls. The margin starts loading before the sentinel is on screen.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) fetchNextPageRef.current();
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching]);

  return sentinelRef;
}
