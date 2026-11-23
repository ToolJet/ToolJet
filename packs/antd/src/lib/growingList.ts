import { useEffect, useState } from 'react';

/** Items drawn first, and added each time the end comes into view. */
export const GROW_STEP = 48;

/**
 * How many of `count` items to draw: the first GROW_STEP, then GROW_STEP more each time the returned sentinel (an
 * element after the last drawn item) comes into view, until all are drawn. A grid of 2,000 Ant Cards drawn at once
 * blocked the page for about 4 s. The number drawn never shrinks while the data refreshes (a shorter list draws what it
 * has), so a scrolled grid keeps its place. Without IntersectionObserver (jsdom, an old browser) every item is drawn.
 */
export const useGrowingCount = (count: number) => {
  const canObserve = typeof IntersectionObserver !== 'undefined';
  const [limit, setLimit] = useState(GROW_STEP);
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  const shown = canObserve ? Math.min(count, limit) : count;
  const more = shown < count;
  useEffect(() => {
    if (!sentinel || !more || !canObserve) return undefined;
    // Observed again after each step: a fresh observe reports at once, so a box still showing the end grows again.
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setLimit((n) => Math.max(n, shown) + GROW_STEP);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, more, shown, canObserve]);
  return { shown, more, sentinelRef: setSentinel };
};
