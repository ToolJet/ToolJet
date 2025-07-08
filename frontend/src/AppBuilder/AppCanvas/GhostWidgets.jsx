import React from 'react';
import useStore from '@/AppBuilder/_stores/store';

export const DragGhostWidget = () => {
  const draggingComponentId = useStore((state) => state.draggingComponentId);

  if (!draggingComponentId) return null;

  return (
    <div
      id="moveable-drag-ghost"
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

export const ResizeGhostWidget = ({ isResizing }) => {
  if (!isResizing) {
    return '';
  }

  return (
    <div
      id="resize-ghost-widget"
      style={{
        zIndex: 4,
        position: 'absolute',
        background: '#D9E2FC',
        opacity: '0.7',
      }}
    ></div>
  );
};
