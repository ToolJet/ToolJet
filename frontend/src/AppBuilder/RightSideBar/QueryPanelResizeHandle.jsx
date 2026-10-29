import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { useEventListener } from '@/_hooks/use-event-listener';
import { QUERY_PANEL_RESIZE, clampQueryPanelWidth } from '@/AppBuilder/panelLayout';

// Sits on the left edge of the panel it resizes and measures that panel when a drag starts.
// onResize fires on every drag frame; onResizeEnd fires once with the width the drag settled on.
export const QueryPanelResizeHandle = ({ onResize, onResizeEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  // Drag state lives in refs: a quick drag can deliver mousedown, mousemove and mouseup before React
  // re-renders, and the window listeners only pick up a new handler after a render.
  const dragStartRef = useRef(null);
  const widthRef = useRef(null);

  const getPanelWidth = (handle) => handle.parentElement.getBoundingClientRect().width;

  const onMouseDown = (e) => {
    e.preventDefault(); // no text selection while dragging
    const width = getPanelWidth(e.currentTarget);
    dragStartRef.current = { x: e.clientX, width };
    widthRef.current = width;
    setIsDragging(true);
  };

  const onMouseMove = (e) => {
    const dragStart = dragStartRef.current;
    if (!dragStart) return;
    widthRef.current = clampQueryPanelWidth(dragStart.width + (dragStart.x - e.clientX), window.innerWidth);
    onResize(widthRef.current);
  };

  const onMouseUp = () => {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    setIsDragging(false);
    onResizeEnd(widthRef.current);
  };

  const onKeyDown = (e) => {
    const direction = { ArrowLeft: 1, ArrowRight: -1 }[e.key];
    if (!direction) return;
    e.preventDefault();
    const width = getPanelWidth(e.currentTarget) + direction * QUERY_PANEL_RESIZE.keyboardStepPx;
    onResizeEnd(clampQueryPanelWidth(width, window.innerWidth));
  };

  // The pointer leaves the thin handle mid-drag, so the resize cursor is held on the whole page.
  useEffect(() => {
    if (!isDragging) return undefined;
    document.body.classList.add('query-panel-resizing');
    return () => document.body.classList.remove('query-panel-resizing');
  }, [isDragging]);

  useEventListener('mousemove', onMouseMove);
  useEventListener('mouseup', onMouseUp);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize query panel"
      tabIndex={0}
      className={cx('query-panel-resize-handle', { 'is-dragging': isDragging })}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
    />
  );
};
