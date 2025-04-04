import React, { useEffect } from 'react';
import { WidgetBox } from '../WidgetBox';
import { useDrag, useDragLayer } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { snapToGrid } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export const DragLayer = ({ index, component, moveableRef }) => {
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
  // console.log('moveableRef', moveableRef);
  const size = component.defaultSize || { width: 30, height: 40 };
  return (
    <>
      {isDragging && <CustomDragLayer size={size} />}
      <div
        ref={drag}
        className="draggable-box"
        style={{ height: '100%' }}
        onDragStart={(e) => {
          console.log('drsddsdsdagStart', e, moveableRef);
          const virtualTarget = document.createElement('div');
          virtualTarget.className = 'virtual-moveable-target moveable-box target widget-target';
          virtualTarget.id = 'virtual-moveable-target';
          virtualTarget.style.position = 'absolute';
          virtualTarget.style.pointerEvents = 'none';
          virtualTarget.style.border = '1px dashed #9747FF';
          virtualTarget.style.backgroundColor = 'rgba(151, 71, 255, 0.1)';
          virtualTarget.style.zIndex = '9999';
          // Add to DOM
          const realCanvas = document.getElementById('rm-container');
          if (realCanvas) {
            realCanvas.appendChild(virtualTarget);
          } else {
            document.body.appendChild(virtualTarget);
          }
          moveableRef.current.setState(
            {
              target: virtualTarget,
              hideDefaultLines: true,
              resizable: false,
              origin: false,
            },
            () => {
              moveableRef.current.dragStart(e);
            }
          );
        }}
      >
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
