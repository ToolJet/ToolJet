import React, { useEffect } from 'react';
import { WidgetBox } from '../WidgetBox';
import { useDrag, useDragLayer } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

export const DragLayer = ({ index, component }) => {
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'box',
      item: { componentType: component.component },
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
  const { currentOffset } = useDragLayer((monitor) => ({
    currentOffset: monitor.getSourceClientOffset(),
  }));

  if (!currentOffset) return null;

  const canvasWidth = document.getElementsByClassName('real-canvas')[0]?.getBoundingClientRect()?.width;

  const height = size.height;
  const width = (canvasWidth * size.width) / 43;

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: -1,
        left: 0,
        top: 0,
        height: `${height}px`,
        width: `${width}px`,
      }}
    >
      <div
        style={{
          transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
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
