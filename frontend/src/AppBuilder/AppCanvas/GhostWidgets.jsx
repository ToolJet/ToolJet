import React from 'react';
import useStore from '@/AppBuilder/_stores/store';

export const DragResizeGhostWidget = () => {
  const draggingComponentId = useStore((state) => state.draggingComponentId);
  const isGroupDragging = useStore((state) => state.isGroupDragging);
  const isGroupResizing = useStore((state) => state.isGroupResizing);
  const resizingComponentId = useStore((state) => state.resizingComponentId);

  if (!draggingComponentId && !resizingComponentId && !isGroupDragging && !isGroupResizing) return null;

  return (
    <div
      id="moveable-ghost-widget"
      style={{
        zIndex: 4,
        position: 'absolute',
        background: '#D9E2FC',
        opacity: '0.7',
        pointerEvents: 'none',
        left: 0,
        top: 0,
      }}
    />
  );
};
