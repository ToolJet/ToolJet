import React, { useEffect } from 'react';
import { WidgetBox } from '../WidgetBox';
import { useDrag, useDragLayer } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { snapToGrid } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';

export const DragLayer = ({ index, component }) => {
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'box',
      item: { componentType: component.component, component },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [component.component]
  );

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, []);

  const size = component.defaultSize || { width: 30, height: 40 };
  return (
    <>
      {isDragging && <CustomDragLayer size={size} />}
      <div ref={drag} className="draggable-box" style={{ height: '100%' }}>
        <WidgetBox index={index} component={component} />
      </div>
    </>
  );
};

const CustomDragLayer = ({ size }) => {
  const { currentOffset, item } = useDragLayer((monitor) => ({
    currentOffset: monitor.getSourceClientOffset(),
    item: monitor.getItem(),
  }));
  if (!currentOffset) return null;

  const canvasWidth = item?.canvasWidth;
  const canvasBounds = item?.canvasRef?.getBoundingClientRect();
  const height = size.height;

  const appCanvasWidth = document.getElementById('real-canvas')?.offsetWidth || 0;

  // Calculate width based on the app canvas's grid
  let width = (appCanvasWidth * size.width) / NO_OF_GRIDS;

  // Calculate position relative to the current canvas (parent or child)
  const left = currentOffset.x - (canvasBounds?.left || 0);
  const top = currentOffset.y - (canvasBounds?.top || 0);

  // Ensure width doesn't exceed the current container's width
  if (width > canvasWidth) {
    width = canvasWidth;
  }

  // Snap width to grid (round to nearest grid unit)
  const gridUnitWidth = canvasWidth / NO_OF_GRIDS;
  const gridUnits = Math.round(width / gridUnitWidth);
  width = gridUnits * gridUnitWidth;

  const [x, y] = snapToGrid(canvasWidth, left, top);
  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        left: canvasBounds?.left || 0,
        top: canvasBounds?.top || 0,
        height: `${height}px`,
        width: `${width}px`,
        zIndex: -1,
      }}
    >
      <div
        style={{
          transform: `translate(${x}px, ${y}px)`,
          background: '#D9E2FC',
          opacity: '0.7',
          height: '100%',
          width: '100%',
          outline: '1px solid #4af',
        }}
      ></div>
    </div>
  );
};
