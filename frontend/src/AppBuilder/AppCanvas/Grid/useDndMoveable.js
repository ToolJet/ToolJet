import { useRef, useCallback } from 'react';

/**
 * A hook that provides utilities to work with Moveable's drag functionality.
 *
 * @param {Object} options - Configuration options
 * @param {Boolean} options.draggable - Whether the target should be draggable
 * @param {Function} options.onDragStart - Callback for drag start event
 * @param {Function} options.onDrag - Callback for drag event
 * @param {Function} options.onDragEnd - Callback for drag end event
 * @returns {Object} Utilities for controlling Moveable
 */
const useDndMoveable = (moveableRef) => {
  const requesterRef = useRef(null);

  // Function to manually start a drag operation
  const startDrag = useCallback((specificTarget) => {
    if (!moveableRef?.current) return null;

    // Initialize a drag request without moving yet
    // Set specific target
    moveableRef.current.target = specificTarget;
    moveableRef.current.updateTarget();
    moveableRef.current.updateRect();
    requesterRef.current = moveableRef?.current.request('draggable');
    return requesterRef.current;
  }, []);

  // Function to perform a drag movement with relative coordinates
  const dragBy = useCallback(
    (deltaX, deltaY) => {
      if (!requesterRef.current) {
        // If no active requester, start one and immediately move
        const requester = startDrag();
        if (!requester) return;
        requester.request({ deltaX, deltaY });
        return;
      }

      // Use existing requester to move by delta
      requesterRef.current.request({ deltaX, deltaY });
    },
    [startDrag]
  );

  // Function to perform a drag movement with absolute coordinates
  const dragTo = useCallback(
    (x, y) => {
      if (!moveableRef.current) return;

      if (!requesterRef.current) {
        // If no active requester, start one and immediately move
        const requester = startDrag();
        if (!requester) return;
        requester.request({ x, y });
        return;
      }

      // Use existing requester to move to absolute position
      requesterRef.current.request({ x, y });
    },
    [startDrag]
  );

  // Function to end the current drag operation
  const endDrag = useCallback(() => {
    if (!requesterRef.current) return;

    requesterRef.current.requestEnd();
    requesterRef.current = null;
  }, []);

  // Function to instantly drag (start-drag-end in one call)
  const instantDrag = useCallback((specificTarget, params, isAbsolute = false) => {
    if (!moveableRef.current) return;
    moveableRef.current.target = specificTarget;
    moveableRef.current.updateTarget();
    moveableRef.current.updateRect();
    // For absolute positioning: {x, y}
    // For relative movement: {deltaX, deltaY}
    moveableRef.current.request('draggable', params, true);
  }, []);

  return {
    startDrag,
    dragBy,
    dragTo,
    endDrag,
    instantDrag,
  };
};

export default useDndMoveable;
