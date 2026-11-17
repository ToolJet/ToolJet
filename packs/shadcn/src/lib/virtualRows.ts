import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';

// Long lists draw only the rows in view, as ToolJet 1.0's Table does (NewTable TableData: @tanstack/react-virtual,
// measured rows, overscan 5). Only above VIRTUAL_MIN_ROWS rows and only in a box with a height of its own: under
// Dynamic height (the host's tj-cc-fit) the page scrolls, not the widget, and with no layout (jsdom, a hidden widget)
// there is no viewport, so every row is drawn as before.
export const VIRTUAL_MIN_ROWS = 100;
export const VIRTUAL_OVERSCAN = 5;

export type VirtualRows = {
  /** Windowing is on: draw `items` only, with `padTop` / `padBottom` of blank space around them. */
  on: boolean;
  items: VirtualItem[];
  padTop: number;
  padBottom: number;
  /** The scroll box's ref (a stable callback ref). */
  setScrollEl: (el: HTMLElement | null) => void;
  /** Each drawn row's ref, so its real height is measured. Rows also need data-index={index}. */
  measure: (el: Element | null) => void;
  /** Scrolls the row at `index` into view (no-op when off). */
  scrollToIndex: (index: number) => void;
};

export const useVirtualRows = ({
  count,
  estimate,
  getKey,
  gap = 0,
}: {
  count: number;
  estimate: number;
  /** A stable (useCallback) key per index, so measured heights follow their rows across reorders. */
  getKey: (index: number) => string | number;
  gap?: number;
}): VirtualRows => {
  const [el, setScrollEl] = useState<HTMLElement | null>(null);
  const wanted = count > VIRTUAL_MIN_ROWS;
  // null: not measured yet (draw the cheap windowed pass); true: a bounded box; false: no viewport (fit, no layout).
  const [bounded, setBounded] = useState<boolean | null>(null);
  useLayoutEffect(() => {
    if (!wanted || !el) return undefined;
    const measure = () => {
      const next = el.clientHeight > 0 && !el.closest('.tj-cc-fit');
      setBounded((b) => (b === next ? b : next));
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [el, wanted]);
  const on = wanted && bounded !== false;
  const estimateSize = useCallback(() => estimate, [estimate]);
  const virtualizer = useVirtualizer<HTMLElement, Element>({
    count: on ? count : 0,
    getScrollElement: () => el,
    estimateSize,
    getItemKey: getKey,
    overscan: VIRTUAL_OVERSCAN,
    gap,
  });
  const onRef = useRef(on);
  onRef.current = on;
  const scrollToIndex = useCallback(
    (index: number) => {
      if (onRef.current && index >= 0) virtualizer.scrollToIndex(index, { align: 'auto' });
    },
    [virtualizer]
  );
  const items = on ? virtualizer.getVirtualItems() : [];
  const last = items[items.length - 1];
  return {
    on,
    items,
    padTop: items[0]?.start ?? 0,
    padBottom: last ? Math.max(0, virtualizer.getTotalSize() - last.end) : 0,
    setScrollEl,
    measure: virtualizer.measureElement,
    scrollToIndex,
  };
};
