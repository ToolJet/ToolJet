import { useState, useEffect, useCallback, useMemo } from 'react';

const SCROLL_THRESHOLD = 1;

export function useTabsNavScrollArrows({ tabsRef, tabWidth, tabItems }) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const canScroll = useMemo(() => canScrollLeft || canScrollRight, [canScrollLeft, canScrollRight]);

  const checkScroll = useCallback(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;

    const { scrollLeft, scrollWidth, clientWidth } = tabs;
    const maxScrollLeft = scrollWidth - clientWidth;
    const scrollableLeft = scrollLeft > SCROLL_THRESHOLD;
    const scrollableRight = maxScrollLeft - scrollLeft > SCROLL_THRESHOLD;

    setCanScrollLeft(scrollableLeft);
    setCanScrollRight(scrollableRight);
  }, []);

  const scrollTabs = useCallback((direction) => {
    if (!tabsRef.current) return;

    const scrollAmount = tabsRef.current.clientWidth / 2;
    tabsRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;

    checkScroll();

    const onScroll = () => checkScroll();
    tabs.addEventListener('scroll', onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => checkScroll());
    resizeObserver.observe(tabs);

    return () => {
      tabs.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
    };
  }, [tabWidth, tabItems, checkScroll]);

  return {
    tabsRef,
    canScroll,
    canScrollLeft,
    canScrollRight,
    scrollTabs,
  };
}
