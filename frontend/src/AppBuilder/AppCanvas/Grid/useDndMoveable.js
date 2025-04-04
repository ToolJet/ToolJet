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
  const startDrag = useCallback(
    (specificTarget) => {
      if (!moveableRef?.current) return null;

      // Ensure any previous drag request is ended
      if (requesterRef.current) {
        requesterRef.current.requestEnd();
        requesterRef.current = null;
      }

      // Set Moveable state (including target and visual options)
      moveableRef.current.setState(
        {
          target: specificTarget,
          hideDefaultLines: true,
          resizable: false,
          origin: false,
          snappable: true,
        },
        () => {
          // Callback after state is set: Start the drag request and store the requester
          // See: https://daybrush.com/moveable/release/latest/doc/Moveable.Draggable.html#request
          requesterRef.current = moveableRef.current.request('draggable');

          // Perform an initial zero-movement drag.
          // This helps ensure the drag state is fully active and may trigger
          // the initial 'drag' and subsequent 'snap' events immediately
          // and prepare for subsequent dragBy/dragTo calls.
          // if (requesterRef.current) {
          //   requesterRef.current.request({ deltaX: 0, deltaY: 0 });
          // }
        }
      );
      // Note: We don't return the requester here as it's managed internally by the hook via requesterRef.
    },
    [moveableRef] // Added moveableRef dependency
  );

  // Function to perform a drag movement with relative coordinates
  const dragBy = useCallback(
    (deltaX, deltaY) => {
      // A drag must be active (requesterRef must be set)
      if (!requesterRef.current) {
        console.warn('useDndMoveable: Drag not started. Call startDrag before dragBy.');
        return;
      }

      // Use existing requester to move by delta
      // This triggers the 'drag' event. See: https://daybrush.com/moveable/release/latest/doc/Moveable.Draggable.html#drag
      requesterRef.current.request({ deltaX, deltaY });
    },
    [] // No dependencies needed, relies on requesterRef.current
  );

  // Function to perform a drag movement with absolute coordinates
  const dragTo = useCallback(
    (x, y) => {
      // Moveable instance must exist
      if (!moveableRef.current) return;

      console.log('requesterRef', requesterRef);

      // A drag must be active (requesterRef must be set)
      // if (!requesterRef.current) {
      //   console.warn('useDndMoveable: Drag not started. Call startDrag before dragTo.');
      //   return;
      // }
      moveableRef.current.request('draggable').request({ deltaX: x, deltaY: y });
      // Use existing requester to move to absolute position
      // This triggers the 'drag' event.
      // requesterRef.current.request({ x, y });
    },
    [moveableRef] // Depends on moveableRef only to check existence
  );

  // Function to end the current drag operation
  const endDrag = useCallback(() => {
    if (!requesterRef.current) return; // No active drag to end

    // End the request sequence. See: https://daybrush.com/moveable/release/latest/doc/Moveable.Draggable.html#request
    requesterRef.current.requestEnd();
    requesterRef.current = null; // Clear the ref
  }, []); // No dependencies needed

  // Function to instantly drag (start-drag-end in one call)
  const instantDrag = useCallback(
    (specificTarget, params, isAbsolute = false) => {
      if (!moveableRef.current) return;

      // Ensure any previous drag request is ended
      if (requesterRef.current) {
        requesterRef.current.requestEnd();
        requesterRef.current = null;
      }

      // Set target directly for instant request
      moveableRef.current.target = specificTarget;
      moveableRef.current.updateTarget();
      moveableRef.current.updateRect();

      // Use the instant request feature (3rd parameter = true)
      // This triggers start, drag(s), and end sequentially.
      // See: https://daybrush.com/moveable/release/latest/doc/Moveable.Draggable.html#request
      const requestParams = isAbsolute
        ? { x: params.x, y: params.y }
        : { deltaX: params.deltaX, deltaY: params.deltaY };
      moveableRef.current.request('draggable', requestParams, true);
    },
    [moveableRef] // Added moveableRef dependency
  );

  return {
    startDrag,
    dragBy,
    dragTo,
    endDrag,
    instantDrag,
  };
};

export default useDndMoveable;
