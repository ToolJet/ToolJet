import { useRef } from 'react';
import { useGridStore } from '@/_stores/gridStore';
import useStore from '@/AppBuilder/_stores/store';
import { clearActiveTargetClassNamesAfterSnapping } from '@/AppBuilder/AppCanvas/Grid/gridUtils';

export const useDropVirtualMoveableGhost = () => {
  const ghostElementRef = useRef(null);
  const ghostSizeRef = useRef({ width: 100, height: 40 });
  const isActiveRef = useRef(false);
  const moveableGhostClass = 'disable-moveable-line';

  const getMoveableRef = useGridStore((state) => state.moveableRef);
  const setVirtualTarget = useGridStore((state) => state.actions.setVirtualTarget);

  const toggleMoveableGhostClass = (shouldEnable) => {
    const mainEditorCanvas = document.getElementById('main-editor-canvas');
    if (!mainEditorCanvas) return;
    mainEditorCanvas.classList.toggle(moveableGhostClass, shouldEnable);
  };

  const applyGhostElementStyles = (ghost, componentSize) => {
    toggleMoveableGhostClass(true);
    const width = componentSize.width || 100;
    const height = componentSize.height || 40;
    ghostSizeRef.current = { width, height };
    ghost.className = 'moveable-ghost target';
    ghost.style.cssText = `
      position: absolute;
      width: ${width}px;
      height: ${height}px;
      background: #D9E2FC;
      opacity: 0.7;
      pointer-events: none;
      z-index: 9998;
      box-sizing: border-box;
      top: 0;
      left: 0;
      border: 1px solid #4af;
    `;
  };

  const updateGhostSize = (componentSize) => {
    const ghost = ghostElementRef.current;
    if (!ghost || !componentSize) return;
    const width = componentSize.width || ghostSizeRef.current.width;
    const height = componentSize.height || ghostSizeRef.current.height;
    if (width === ghostSizeRef.current.width && height === ghostSizeRef.current.height) return;
    ghostSizeRef.current = { width, height };
    ghost.style.width = `${width}px`;
    ghost.style.height = `${height}px`;
  };

  const createGhostMoveElement = (componentSize) => {
    if (ghostElementRef.current) return ghostElementRef.current;
    const existingGhost = document.getElementById('moveable-virtual-ghost-element');
    if (existingGhost) {
      applyGhostElementStyles(existingGhost, componentSize);
      ghostElementRef.current = existingGhost;
      return existingGhost;
    }
    const ghost = document.createElement('div');
    ghost.id = 'moveable-virtual-ghost-element';
    applyGhostElementStyles(ghost, componentSize);
    const container = document.getElementById('real-canvas');

    if (!container) {
      toggleMoveableGhostClass(false);
      return null;
    }
    container.appendChild(ghost);
    ghostElementRef.current = ghost;
    return ghost;
  };

  const updateMoveableGhostPosition = (mousePosition) => {
    if (!ghostElementRef.current || !mousePosition) return;

    // The ghost is always appended to #real-canvas, so its translate must be
    // relative to that element - not to whichever container's hover activated
    // the ghost (a modal/subcontainer hover can fire first, and its rect also
    // drifts from the main canvas rect by the horizontal scroll amount).
    const container = ghostElementRef.current.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const relativeX = mousePosition.x - containerRect.left;
    const relativeY = mousePosition.y - containerRect.top;

    ghostElementRef.current.style.transform = `translate(${relativeX}px, ${relativeY}px)`;
  };

  const activateMoveableGhost = (componentSize, mousePosition) => {
    if (isActiveRef.current) return;
    const ghost = createGhostMoveElement(componentSize);
    if (!ghost) return;

    isActiveRef.current = true;
    if (ghost && mousePosition) {
      updateMoveableGhostPosition(mousePosition);

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
          moveableInstance.waitToChangeTarget().then(() => {
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
    if (!isActiveRef.current && !ghostElementRef.current) {
      toggleMoveableGhostClass(false);
      return;
    }

    isActiveRef.current = false;

    try {
      setVirtualTarget(null);
      if (ghostElementRef.current) {
        ghostElementRef.current.remove();
        ghostElementRef.current = null;
      }
      const selectedComponents = useStore.getState().selectedComponents;
      clearActiveTargetClassNamesAfterSnapping(selectedComponents);
    } catch (error) {
      console.warn('Failed to trigger moveable dragEnd:', error);
    } finally {
      toggleMoveableGhostClass(false);
    }
  };

  return {
    activateMoveableGhost,
    deactivateMoveableGhost,
    updateGhostSize,
    updateMoveableGhostPosition,
  };
};
