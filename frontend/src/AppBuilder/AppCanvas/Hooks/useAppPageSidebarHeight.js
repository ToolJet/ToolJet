import { useState, useEffect } from 'react';

export default function useAppPageSidebarHeight(
  canvasContentRef,
  showCanvasHeader,
  appType,
  pageCanvasHeight,
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

  if (showCanvasHeader && appType !== 'module') return `calc(${height} - ${pageCanvasHeight}px)`;

  return height;
}
