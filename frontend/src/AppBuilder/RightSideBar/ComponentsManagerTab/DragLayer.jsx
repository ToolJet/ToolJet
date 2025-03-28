import React, { useEffect } from 'react';
import { WidgetBox } from '../WidgetBox';
import { useDrag, useDragLayer } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { snapToGrid } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
export const DragLayer = ({ index, component }) => {
  const [isRightSidebarOpen, toggleRightSidebar] = useStore(
    (state) => [state.isRightSidebarOpen, state.toggleRightSidebar],
    shallow
  );
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
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

  useEffect(() => {
    if (isDragging) {
      if (!isRightSidebarPinned) {
        toggleRightSidebar(!isRightSidebarOpen);
      }
    }
  }, [isDragging]);

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
  console.log(currentOffset, 'currentOffset');
  if (!currentOffset) return null;

  const canvasWidth = item?.canvasWidth;
  const canvasBounds = item?.canvasRef?.getBoundingClientRect();
  const height = size.height;

  const width = (canvasWidth * size.width) / NO_OF_GRIDS;

  // Calculate position relative to the current canvas (parent or child)
  const left = currentOffset.x - (canvasBounds?.left || 0);
  const top = currentOffset.y - (canvasBounds?.top || 0);

  const [x, y] = snapToGrid(canvasWidth, left, top);
  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 1000,
        left: canvasBounds?.left || 0,
        top: canvasBounds?.top || 0,
        height: `${height}px`,
        width: `${width}px`,
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
