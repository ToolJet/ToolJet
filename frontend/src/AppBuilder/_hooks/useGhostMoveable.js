import { useRef } from 'react';
import { useGridStore } from '@/_stores/gridStore';
import { NO_OF_GRIDS, GRID_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { snapToGrid } from '@/AppBuilder/AppCanvas/appCanvasUtils';

export const useGhostMoveable = () => {
  const ghostElementRef = useRef(null);
  const isActiveRef = useRef(false);

  const getMoveableRef = useGridStore((state) => state.moveableRef);
  const setVirtualTarget = useGridStore((state) => state.actions.setVirtualTarget);

  const createGhostElement = (componentSize) => {
    if (ghostElementRef.current) return;

    const ghost = document.createElement('div');
    ghost.id = 'moveable-virtual-ghost-element';
    ghost.className = 'moveable-ghost target';
    ghost.style.cssText = `
      position: absolute;
      width: ${componentSize.width || 100}px;
      height: ${componentSize.height || 40}px;
      background: #D9E2FC;
      opacity: 0.7;
      pointer-events: none;
      z-index: 9998;
      box-sizing: border-box;
      top: 0;
      left: 0;
    `;

    const container = document.getElementById('real-canvas');
    container.appendChild(ghost);
    ghostElementRef.current = ghost;

    return ghost;
  };

  const updateGhostPosition = (mousePosition, canvasRef) => {
    if (!ghostElementRef.current || !canvasRef?.current || !mousePosition) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const relativeX = mousePosition.x - canvasRect.left;
    const relativeY = mousePosition.y - canvasRect.top;

    // Apply grid snapping
    // const gridWidth = canvasRef.current.offsetWidth / NO_OF_GRIDS;
    // const snappedX = Math.round(relativeX / gridWidth) * gridWidth;
    // const snappedY = Math.round(relativeY / GRID_HEIGHT) * GRID_HEIGHT;
    ghostElementRef.current.style.transform = `translate(${relativeX}px, ${relativeY}px)`;
  };

  const activateGhost = (componentSize, mousePosition, canvasRef) => {
    if (isActiveRef.current) return;

    isActiveRef.current = true;

    const ghost = createGhostElement(componentSize, canvasRef);
    if (ghost && mousePosition) {
      updateGhostPosition(mousePosition, canvasRef);

      // Trigger moveable drag on the ghost element to show guidelines
      const moveableInstance = getMoveableRef;
      if (moveableInstance && ghost) {
        try {
          const fakeEvent = new MouseEvent('mousedown', {
            clientX: mousePosition.x,
            clientY: mousePosition.y,
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            buttons: 1,
          });
          moveableInstance.waitToChangeTarget().then((e) => {
            moveableInstance.dragStart(fakeEvent, ghost);
          });
          setVirtualTarget(ghost);
        } catch (error) {
          console.warn('Failed to trigger moveable dragStart:', error);
        }
      }
    }
  };

  const deactivateGhost = () => {
    if (!isActiveRef.current) return;

    isActiveRef.current = false;

    const moveableInstance = getMoveableRef;
    if (moveableInstance && ghostElementRef.current) {
      try {
        setVirtualTarget(null);
        ghostElementRef.current.remove();
        ghostElementRef.current = null;
      } catch (error) {
        console.warn('Failed to trigger moveable dragEnd:', error);
      }
    }
  };

  return {
    activateGhost,
    deactivateGhost,
  };
};
