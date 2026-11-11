import { useCallback, useEffect, useRef, type RefObject } from 'react';

// What onReady hands over: @ant-design/plots' plot, which holds the G2 chart.
type FitChart = { chart?: { forceFit?: () => unknown } };

/**
 * An `onReady` for a G2 chart (@ant-design/plots) that re-fits it when `boxRef` changes size. G2 re-fits only on a
 * window resize, so a chart mounted in a hidden pane (a Tabs pane is display:none) measured 0 and drew 640 x 480.
 */
export const useChartFit = (boxRef: RefObject<HTMLElement>) => {
  const chart = useRef<FitChart | null>(null);
  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return undefined;
    let width = box.clientWidth;
    let height = box.clientHeight;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (box.clientWidth === width && box.clientHeight === height) return;
      width = box.clientWidth;
      height = box.clientHeight;
      if (!width || !height || !chart.current || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const g2 = chart.current?.chart;
        if (typeof g2?.forceFit !== 'function') return;
        // A re-fit that G2 aborts (its own next render) rejects: nothing to do about it.
        Promise.resolve(g2.forceFit()).catch(() => {});
      });
    });
    observer.observe(box);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      chart.current = null;
    };
  }, [boxRef]);
  return useCallback((c: FitChart) => {
    chart.current = c;
  }, []);
};
