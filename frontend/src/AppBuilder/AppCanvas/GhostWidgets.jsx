import React from 'react';

export const DragGhostWidget = ({ isDragging }) => {
  if (!isDragging) return '';
  return (
    <div
      id={'moveable-drag-ghost'}
      style={{
        zIndex: 4,
        position: 'absolute',
        background: '#D9E2FC',
        opacity: '0.7',
      }}
    ></div>
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
