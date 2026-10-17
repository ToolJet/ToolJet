import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** The board's size: whether columns run past its right edge, its width, and (for custom cards) a card's width. */
export const useBoardSize = (custom: boolean, columnCount: number, collapsedColumns: Set<string>) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  // Columns that run past the board's right edge fade out there, so the board reads as scrolling sideways (macOS hides
  // the scrollbar, and a column cut at the edge looks broken).
  const [moreRight, setMoreRight] = useState(false);
  const [boardWidth, setBoardWidth] = useState(0);
  // The board can first draw after a loading state, so the measuring follows the element itself: with an empty
  // dependency list it never attached then, and neither the fade nor the column minimum followed the board.
  const [boardEl, setBoardEl] = useState<HTMLDivElement | null>(null);
  const boardNode = useCallback((el: HTMLDivElement | null) => {
    boardRef.current = el;
    setBoardEl(el);
  }, []);
  useEffect(() => {
    const el = boardEl;
    if (!el) return undefined;
    const check = () => {
      setMoreRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
      setBoardWidth(el.clientWidth);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [boardEl]);
  const [cardWidth, setCardWidth] = useState(0);
  useLayoutEffect(() => {
    if (!custom || !boardRef.current) return undefined;
    // A column's content box less the card's 1px borders; every column has the same width.
    const measure = () => {
      const column = boardRef.current?.querySelector(':scope > [data-collapsed="false"]');
      if (column) setCardWidth(Math.max(0, column.clientWidth - 24 - 2));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, [custom, columnCount, collapsedColumns]);
  return { boardNode, moreRight, boardWidth, cardWidth };
};
