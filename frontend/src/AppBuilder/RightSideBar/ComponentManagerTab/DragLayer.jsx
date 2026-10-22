import React, { useEffect, useRef } from 'react';
import { WidgetBox } from '../WidgetBox';
import { ModuleWidgetBox } from '@/modules/Modules/components';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { noop } from 'lodash';
import { useGridStore } from '@/_stores/gridStore';
import { useCanvasDropHandler } from '@/AppBuilder/AppCanvas/Hooks/useCanvasDropHandler';
import {
  findNewParentIdFromMousePosition,
  handleDeactivateTargets,
  hideGridLines,
} from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import toast from 'react-hot-toast';

export const DragLayer = ({ index, component, isModuleTab = false, disabled = false }) => {
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const { isModuleEditor } = useModuleContext();
  const setShowModuleBorder = useStore((state) => state.setShowModuleBorder, shallow) || noop;
  const { handleDrop } = useCanvasDropHandler() || noop;

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'box',
      item: { componentType: component.component, component },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      end: (item, monitor) => {
        // Released over the component panel: the drag is cancelled. The panel stays open during a drag
        // (closing it unmounts this drag source and the drop never lands) and it overlays the canvas,
        // so the position lookup below would find the canvas underneath and add the component.
        const releasedAt = monitor.getClientOffset();
        if (releasedAt && document.elementFromPoint(releasedAt.x, releasedAt.y)?.closest('.editor-sidebar')) {
          handleDeactivateTargets();
          hideGridLines();
          setShowModuleBorder(false);
          return;
        }
        const { isHoveringRestrictedDropTarget, actions } = useGridStore.getState();
        if (isHoveringRestrictedDropTarget) {
          actions.setIsHoveringRestrictedDropTarget(false);
          toast.error('Components can only be added to the first expanded row');
          return;
        }
        // hover on the target sets currentDragCanvasId, but hover only fires on a
        // dragover - if the drop happens before one ever fires (e.g. release right
        // after entering the canvas with no further movement), that state is stale
        // or null. Recompute from the actual drop position as the source of truth.
        const clientOffset = monitor.getClientOffset();
        const canvasId = clientOffset
          ? findNewParentIdFromMousePosition(clientOffset.x, clientOffset.y)
          : useGridStore.getState().currentDragCanvasId;
        handleDrop(item, canvasId ?? useGridStore.getState().currentDragCanvasId);
      },
    }),
    [component.component, component.moduleId]
  );

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, []);

  useEffect(() => {
    if (isDragging && !isModuleEditor) {
      if (!isRightSidebarPinned) {
        setRightSidebarOpen(true);
      }
      setShowModuleBorder(true);
    }
  }, [isDragging, setShowModuleBorder, isModuleEditor, setRightSidebarOpen]);

  return (
    <>
      <div
        ref={disabled ? undefined : drag}
        className={`draggable-box${disabled ? ' disabled' : ''}`}
        style={{ height: '100%', width: isModuleTab && '100%' }}
      >
        {isModuleTab ? (
          <ModuleWidgetBox index={index} module={component} />
        ) : (
          <WidgetBox index={index} component={component} />
        )}
      </div>
    </>
  );
};
