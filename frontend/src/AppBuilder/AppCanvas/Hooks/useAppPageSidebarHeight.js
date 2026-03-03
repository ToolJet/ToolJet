import { useState, useEffect } from 'react';

export default function useAppPageSidebarHeight(canvasContentRef) {
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

  return height;
}
