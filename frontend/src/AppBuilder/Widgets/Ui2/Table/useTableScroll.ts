import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Virtualizer } from '@tanstack/react-virtual';
import type { Entry } from './types';

interface UseTableScrollArgs {
  fixedHeight: boolean;
  virtual: boolean;
  visibleRows: Entry[];
  rowHeight: number;
}

/** virtual-core's element offset observer, with its isScrolling reset timer cleared on cleanup: the library's own
 *  starts that 150 ms timer on its first read and its cleanup removes the scroll listener but not the timer, so every
 *  unmounted Table left one behind. */
const observeOffset = (
  instance: Virtualizer<HTMLDivElement, Element>,
  cb: (offset: number, isScrolling: boolean) => void
) => {
  const el = instance.scrollElement;
  if (!el) return undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const onScroll = () => {
    clearTimeout(timer);
    timer = setTimeout(() => cb(el.scrollTop, false), instance.options.isScrollingResetDelay);
    cb(el.scrollTop, true);
  };
  cb(el.scrollTop, false);
  el.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    clearTimeout(timer);
    el.removeEventListener('scroll', onScroll);
  };
};

/** The scroll box: the fades that show more rows below or columns to the right, and virtualised rows. */
export const useTableScroll = ({ fixedHeight, virtual, visibleRows, rowHeight }: UseTableScrollArgs) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  // A fixed-height table that has more rows below its edge fades them out, so it reads as scrollable (macOS hides
  // scrollbars, and a row cut off at the edge looks broken).
  // Columns wider than the table do the same at its right edge (a narrow card cut its last column).
  const [moreBelow, setMoreBelow] = useState(false);
  const [moreRight, setMoreRight] = useState(false);
  const [boxWidth, setBoxWidth] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const check = () => {
      setMoreBelow(fixedHeight && el.scrollHeight - el.scrollTop - el.clientHeight > 4);
      setMoreRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
      setBoxWidth(el.clientWidth);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [fixedHeight]);
  const virtualizer = useVirtualizer({
    count: virtual ? visibleRows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
    observeElementOffset: observeOffset,
  });
  const virtualItems = virtual ? virtualizer.getVirtualItems() : [];
  const padTop = virtual && virtualItems.length ? virtualItems[0].start : 0;
  const padBottom =
    virtual && virtualItems.length ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0;
  const rendered = virtual ? virtualItems.map((item) => visibleRows[item.index]).filter(Boolean) : visibleRows;
  return { scrollRef, moreBelow, moreRight, boxWidth, virtualItems, padTop, padBottom, rendered };
};
