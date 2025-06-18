import { useRef, useCallback, useEffect } from 'react';
import { useGridStore } from '@/_stores/gridStore';
import { NO_OF_GRIDS, GRID_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';

export const useGhostMoveable = () => {
  const ghostElementRef = useRef(null);
  const isActiveRef = useRef(false);
  const cleanupTimeoutRef = useRef(null);

  // Get access to grid store methods
  const addToElementGuidelines = useGridStore((state) => state.addToElementGuidelines);
  const removeFromElementGuidelines = useGridStore((state) => state.removeFromElementGuidelines);
  const getMoveableRef = useGridStore((state) => state.moveableRef);
  const setVirtualTarget = useGridStore((state) => state.actions.setVirtualTarget);

  const createGhostElement = useCallback(
    (componentSize, canvasRef) => {
      if (!canvasRef?.current || ghostElementRef.current) return;

      const ghost = document.createElement('div');
      ghost.id = 'moveable-ghost-element';
      ghost.className = 'moveable-ghost target';
      ghost.style.cssText = `
      position: absolute;
      width: ${componentSize.width || 100}px;
      height: ${componentSize.height || 40}px;
      background: rgba(68, 170, 255, 0.1);
      border: 1px dashed #4af;
      opacity: 0.7;
      pointer-events: none;
      z-index: 9998;
      box-sizing: border-box;
      top: 0;
      left: 0;
    `;

      const container = document.getElementById('rm-container');

      container.appendChild(ghost);
      ghostElementRef.current = ghost;

      // Add ghost element to guidelines
      if (addToElementGuidelines) {
        addToElementGuidelines('#moveable-ghost-element');
      }

      return ghost;
    },
    [addToElementGuidelines]
  );

  const updateGhostPosition = useCallback((x, y, canvasRef) => {
    if (!ghostElementRef.current || !canvasRef?.current) return;
    // debugger;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const relativeX = x - canvasRect.left;
    const relativeY = y - canvasRect.top;

    // Apply grid snapping similar to existing logic
    const gridWidth = canvasRef.current.offsetWidth / NO_OF_GRIDS;
    const snappedX = Math.round(relativeX / gridWidth) * gridWidth;
    const snappedY = Math.round(relativeY / GRID_HEIGHT) * GRID_HEIGHT;

    ghostElementRef.current.style.transform = `translate(${snappedX}px, ${snappedY}px)`;
  }, []);

  const activateGhost = useCallback(
    (componentSize, mousePosition, canvasRef) => {
      if (isActiveRef.current) return;

      isActiveRef.current = true;

      // Clear any pending cleanup
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }

      const ghost = createGhostElement(componentSize, canvasRef);
      if (ghost && mousePosition) {
        updateGhostPosition(mousePosition.x, mousePosition.y, canvasRef);

        // Trigger moveable drag on the ghost element to show guidelines
        // setTimeout(() => {
        const moveableInstance = getMoveableRef;
        if (moveableInstance && ghost) {
          try {
            // Update moveable target to include the ghost

            // Create a proper mouse event for dragStart
            const fakeEvent = new MouseEvent('mousedown', {
              clientX: mousePosition.x,
              clientY: mousePosition.y,
              bubbles: true,
              cancelable: true,
              view: window,
              button: 0,
              buttons: 1,
            });
            console.log('moveableInstance', moveableInstance);
            moveableInstance.moveable.waitToChangeTarget().then(() => {
              console.log('DRAGSTART');
              moveableInstance.moveable.dragStart(fakeEvent, ghost);
            });
            setVirtualTarget(ghost);
            moveableInstance.updateTarget();
            moveableInstance.updateRect();
          } catch (error) {
            console.warn('Failed to trigger moveable dragStart:', error);
          }
        }
        // }, 10); // Small delay to ensure DOM is updated
      }
    },
    [createGhostElement, updateGhostPosition, getMoveableRef]
  );

  const updateGhost = useCallback(
    (mousePosition, canvasRef) => {
      if (!isActiveRef.current || !mousePosition) return;
      updateGhostPosition(mousePosition.x, mousePosition.y, canvasRef);

      // Trigger moveable drag event to update guidelines
      const moveableInstance = getMoveableRef;
      if (moveableInstance && ghostElementRef.current) {
        try {
          // Once dragStart is called, moveable automatically handles
          // drag events, so we just need to update position
          // The guidelines will update automatically
        } catch (error) {
          // Silently fail for mousemove events to avoid spam
        }
      }
    },
    [updateGhostPosition, getMoveableRef]
  );

  const deactivateGhost = useCallback(() => {
    if (!isActiveRef.current) return;

    isActiveRef.current = false;

    // End moveable drag if it's active
    const moveableInstance = getMoveableRef;
    if (moveableInstance && ghostElementRef.current) {
      try {
        // Stop any ongoing drag
        // moveableInstance.stopDrag();
        setVirtualTarget(null);
      } catch (error) {
        console.warn('Failed to trigger moveable dragEnd:', error);
      }
    }

    // Remove from guidelines immediately
    if (removeFromElementGuidelines) {
      removeFromElementGuidelines('#moveable-ghost-element');
    }

    // Delay cleanup to avoid flickering
    cleanupTimeoutRef.current = setTimeout(() => {
      if (ghostElementRef.current) {
        ghostElementRef.current.remove();
        ghostElementRef.current = null;
      }
    }, 100);
  }, [removeFromElementGuidelines, getMoveableRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      if (ghostElementRef.current) {
        ghostElementRef.current.remove();
      }
      if (removeFromElementGuidelines) {
        removeFromElementGuidelines('#moveable-ghost-element');
      }
    };
  }, [removeFromElementGuidelines]);

  return {
    activateGhost,
    updateGhost,
    deactivateGhost,
    isActive: isActiveRef.current,
  };
};
