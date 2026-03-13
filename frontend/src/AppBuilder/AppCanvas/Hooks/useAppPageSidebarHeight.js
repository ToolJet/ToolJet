import { useState, useEffect } from 'react';

export default function useAppPageSidebarHeight(
  canvasContentRef,
  showCanvasHeader,
  showCanvasFooter,
  appType,
  pageCanvasHeaderHeight,
  pageCanvasFooterHeight,
  navigationType
) {
  const [height, setHeight] = useState('100dvh');

  useEffect(() => {
    if (!canvasContentRef || !canvasContentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(`${entry.contentRect.height}px`);
      }
    });

    observer.observe(canvasContentRef.current);
    return () => observer.disconnect();
  }, [canvasContentRef]);

  if (navigationType === 'top') return undefined;

  if (appType !== 'module') {
    const headerHeight = showCanvasHeader ? pageCanvasHeaderHeight : 0;
    const footerHeight = showCanvasFooter ? pageCanvasFooterHeight : 0;
    return `calc(${height} - ${headerHeight + footerHeight}px)`;
  }

  return height;
}
