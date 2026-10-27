import React, { useEffect, useRef } from 'react';
import { useWindow } from './useWindow';

const itemKey = (index) => index;

/**
 * A list that renders only the items in view (see useWindow), inside the scroll element `scrollRef` points at: the
 * list is as tall as all its items, so the scrollbar spans them all. Each item is `renderItem(index)` in a wrapper
 * placed at its offset (with `data-index`, measured when `measure`).
 *
 * - `stickyIndex`: an item always rendered and stuck to the top of the scroll element (a "Select all" row).
 * - `focusedIndex`: brought into view when it moves out of view (keyboard navigation in a menu; an item focused by
 *   hovering it is already in view).
 * - `initialIndex`: centered when the list first shows (the selected option of a menu that opens).
 * - `itemProps(index)`: extra props for an item's wrapper.
 */
export function WindowedList({
  count,
  scrollRef,
  itemHeight,
  measure = false,
  overscan,
  renderItem,
  getItemKey = itemKey,
  stickyIndex = null,
  focusedIndex = -1,
  initialIndex = -1,
  itemProps,
  className,
  style,
}) {
  const list = useWindow({
    count,
    scrollRef,
    estimateSize: itemHeight,
    getItemKey,
    overscan: overscan ?? 5 * itemHeight,
    measure,
  });

  const centered = useRef(false);
  useEffect(() => {
    if (centered.current || initialIndex < 0 || initialIndex >= count) return;
    centered.current = true;
    list.scrollToIndex(initialIndex, { align: 'center' });
  });

  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < count && !list.inView(focusedIndex)) {
      list.scrollToIndex(focusedIndex, { align: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedIndex]);

  const item = (index, wrapperStyle) => {
    const extra = itemProps?.(index);
    return (
      <div
        key={getItemKey(index)}
        data-index={index}
        ref={list.measureElement}
        {...extra}
        style={{ width: '100%', ...wrapperStyle, ...extra?.style }}
      >
        {renderItem(index)}
      </div>
    );
  };

  const sticky = stickyIndex !== null && stickyIndex >= 0 && stickyIndex < count;
  return (
    <div className={className} style={{ position: 'relative', height: list.height, flex: 'none', ...style }}>
      {sticky && item(stickyIndex, { position: 'sticky', top: 0, zIndex: 10 })}
      {list.items.map(({ index, start }) =>
        sticky && index === stickyIndex
          ? null
          : item(index, { position: 'absolute', top: list.itemTop(start), left: 0 })
      )}
    </div>
  );
}
