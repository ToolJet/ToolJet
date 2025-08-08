import { useRef } from 'react';
import { useGridStore } from '@/_stores/gridStore';
import useStore from '@/AppBuilder/_stores/store';
import { clearActiveTargetClassNamesAfterSnapping } from '@/AppBuilder/AppCanvas/Grid/gridUtils';

export const useDropVirtualMoveableGhost = () => {
  const ghostElementRef = useRef(null);
  const isActiveRef = useRef(false);

  const getMoveableRef = useGridStore((state) => state.moveableRef);
  const setVirtualTarget = useGridStore((state) => state.actions.setVirtualTarget);

  const createGhostMoveElement = (componentSize) => {
    if (ghostElementRef.current) return;
    const mainEditorCanvas = document.getElementById('main-editor-canvas');
    mainEditorCanvas.classList.add('disable-moveable-line');
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
      border: 1px solid #4af;
    `;
    const container = document.getElementById('real-canvas');
    container.appendChild(ghost);
    ghostElementRef.current = ghost;
    return ghost;
  };

  const updateMoveableGhostPosition = (mousePosition, canvasRef) => {
    if (!ghostElementRef.current || !canvasRef?.current || !mousePosition) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const relativeX = mousePosition.x - canvasRect.left;
    const relativeY = mousePosition.y - canvasRect.top;

    ghostElementRef.current.style.transform = `translate(${relativeX}px, ${relativeY}px)`;
  };

  const activateMoveableGhost = (componentSize, mousePosition, canvasRef) => {
    if (isActiveRef.current) return;

    isActiveRef.current = true;

    const ghost = createGhostMoveElement(componentSize, canvasRef);
    if (ghost && mousePosition) {
      updateMoveableGhostPosition(mousePosition, canvasRef);

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

  const deactivateMoveableGhost = () => {
    if (!isActiveRef.current) return;

    isActiveRef.current = false;

    const moveableInstance = getMoveableRef;
    if (moveableInstance && ghostElementRef.current) {
      try {
        setVirtualTarget(null);
        ghostElementRef.current.remove();
        ghostElementRef.current = null;
        const mainEditorCanvas = document.getElementById('main-editor-canvas');
        mainEditorCanvas.classList.remove('disable-moveable-line');
        const selectedComponents = useStore.getState().selectedComponents;
        clearActiveTargetClassNamesAfterSnapping(selectedComponents);
      } catch (error) {
        console.warn('Failed to trigger moveable dragEnd:', error);
      }
    }
  };

  return {
    activateMoveableGhost,
    deactivateMoveableGhost,
  };
};
