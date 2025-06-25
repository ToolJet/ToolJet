import React, { useEffect, useRef } from 'react';
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
import { useGridStore } from '@/_stores/gridStore';
import { useCanvasDropHandler } from '@/AppBuilder/AppCanvas/useCanvasDropHandler';

export const DragLayer = ({ index, component, isModuleTab = false }) => {
  const { isModuleEditor } = useModuleContext();
  const setShowModuleBorder = useStore((state) => state.setShowModuleBorder, shallow) || noop;
  const handleDrop = useCanvasDropHandler({ appType: isModuleTab ? 'module' : 'app' }) || noop;
  const currentDragCanvasId = useGridStore((state) => state.currentDragCanvasId, shallow);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'box',
      item: { componentType: component.component, component },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      end: (item, monitor) => {
        const clientOffset = monitor.getClientOffset();
        console.log('end', item, monitor.getDropResult(), monitor.getClientOffset());
        console.log('currentDragCanvasId', currentDragCanvasId);
        if (clientOffset) {
          // const canvas = document.getElementById(`canvas-${currentDragCanvasId}`);
          const realCanvas = document.getElementById(`real-canvas`);
          handleDrop(item, monitor, realCanvas, currentDragCanvasId);
        }
        // if (didDrop) {
        //   handleDrop(item, monitor);
        // }
      },
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

  return (
    <>
      {/* {isDragging && <CustomDragLayer size={size} />} */}
      <div
        ref={drag}
        className="draggable-box"
        style={{ height: '100%', width: isModuleTab && '100%' }}
        // onDragEnd={(e) => {
        //   const realCanvas = document.getElementById(`real-canvas`);
        //   handleDrop(e, realCanvas, currentDragCanvasId);
        // }}
      >
        {isModuleTab ? <ModuleWidgetBox module={component} /> : <WidgetBox index={index} component={component} />}
      </div>
    </>
  );
};
