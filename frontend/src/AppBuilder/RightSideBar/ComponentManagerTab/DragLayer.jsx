import React, { useEffect } from 'react';
import { WidgetBox } from '../WidgetBox';
import { ModuleWidgetBox } from '@/modules/Modules/components';
import { useDrag, useDragLayer } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { snapToGrid } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { noop } from 'lodash';

export const DragLayer = ({ index, component, isModuleTab = false }) => {
  const { isModuleEditor } = useModuleContext();
  const setShowModuleBorder = useStore((state) => state.setShowModuleBorder, shallow) || noop;
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
    if (isDragging && !isModuleEditor) {
      setShowModuleBorder(true);
    } else {
      setShowModuleBorder(false);
    }
  }, [isDragging, setShowModuleBorder, isModuleEditor]);

  // const size = isModuleTab
  //   ? component.module_container.layouts[currentLayout]
  //   : component.defaultSize || { width: 30, height: 40 };

  const size = component.defaultSize || { width: 30, height: 40 };

  return (
    <>
      {isDragging && <CustomDragLayer size={size} />}
      <div ref={drag} className="draggable-box" style={{ height: '100%', width: isModuleTab && '100%' }}>
        {isModuleTab ? <ModuleWidgetBox module={component} /> : <WidgetBox index={index} component={component} />}
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

  const mainCanvasWidth = document.getElementById('real-canvas')?.offsetWidth || 0;

  let width = (mainCanvasWidth * size.width) / NO_OF_GRIDS;
  // Calculate position relative to the current canvas (parent or child)
  const left = currentOffset.x - (canvasBounds?.left || 0);
  const top = currentOffset.y - (canvasBounds?.top || 0);

  // Adjust position and width if exceeding grid bounds
  if (width >= canvasWidth) {
    width = canvasWidth;
  }

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
