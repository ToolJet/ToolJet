// useDndMoveableGuidelines.js
import { useEffect, useRef } from 'react';
import { useDragLayer } from 'react-dnd';
import useDndMoveable from './useDndMoveable';

// Create a synthetic mousedown event object
const createMouseDownEvent = (element, position) => {
  return {
    type: 'mousedown',
    target: element,
    currentTarget: element,
    clientX: position.x,
    clientY: position.y,
    screenX: position.x,
    screenY: position.y,
    pageX: position.x,
    pageY: position.y,
    button: 0, // Primary button (left click)
    buttons: 1, // Primary button pressed
    bubbles: true,
    cancelable: true,
    view: window,
    detail: 1, // Single click
    preventDefault: () => {},
    stopPropagation: () => {},
  };
};

// Example usage
const element = document.getElementById('virtual-moveable-target');
const position = { x: 100, y: 200 };
const syntheticEvent = createMouseDownEvent(element, position);

export function useDndMoveableGuidelines(moveableRef) {
  const virtualTargetRef = useRef(null);
  const isDraggingRef = useRef(false);
  const requesterRef = useRef(null);
  const { isDragging, currentOffset, item } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset(),
    item: monitor.getItem(),
  }));

  // Get the useDndMoveable hook functionality
  const { startDrag, endDrag, dragBy, instantDrag } = useDndMoveable(moveableRef);
  // Add this method to your component
  const triggerDragOperation = (elementId, startPos, endPos) => {
    console.log('triggerDragOperation', elementId, startPos, endPos);
    // Get the able from the Moveable instance
    const programmaticDragAble = moveableRef.current?.moveable?.getAble('programmaticDrag');
    if (!programmaticDragAble) return;

    // Start the drag
    programmaticDragAble.startDrag(elementId, startPos);

    // You could use setTimeout to simulate movement
    // Or call updateDrag directly if you have interim positions

    // End the drag
    // programmaticDragAble.endDrag(elementId, endPos);
  };
  useEffect(() => {
    // Only proceed if we're actually dragging and have valid data
    if (!isDragging || !currentOffset || !moveableRef.current) return;
    let requester = null;

    // Create virtual target if it doesn't exist
    if (!virtualTargetRef.current) {
      // Save previous target(s) to restore later
      const previousTargets = moveableRef.current.getTargets();

      const virtualTarget = document.createElement('div');
      virtualTarget.className = 'virtual-moveable-target moveable-box target widget-target';
      virtualTarget.id = 'virtual-moveable-target';
      virtualTarget.style.position = 'absolute';
      virtualTarget.style.pointerEvents = 'none'; // Don't interfere with other interactions
      virtualTarget.style.border = '1px dashed #9747FF'; // Visual indicator
      virtualTarget.style.backgroundColor = 'red'; // Semi-transparent fill
      // virtualTarget.style.zIndex = '9999'; // Make sure it's visible
      const realCanvas = document.getElementById('rm-container');
      if (realCanvas) {
        realCanvas.appendChild(virtualTarget);
      } else {
        // Fallback to body if real-canvas not found
        document.body.appendChild(virtualTarget);
      }

      virtualTargetRef.current = virtualTarget;

      // Explicitly set this single virtual target as the current target
      moveableRef.current.target = virtualTarget;

      // Force Moveable to recognize this as a valid target and initialize
      moveableRef.current.updateRect();

      // Important: Force guidelines to be recalculated
      if (typeof moveableRef.current.updateGuidelines === 'function') {
        moveableRef.current.updateGuidelines();
      }

      // Set as dragging
      isDraggingRef.current = true;
      const syntheticEvent = {
        target: virtualTarget,
        currentTarget: virtualTarget,
        clientX: currentOffset.x,
        clientY: currentOffset.y,
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      // startDrag(virtualTarget);
      // instantDrag(virtualTarget);
      // startDrag(virtualTarget);
      // Initialize the drag state for the virtual element
      // console.log(
      //   'qa',
      //   moveableRef.current?.drag,
      //   moveableRef.current.moveable,
      //   moveableRef.current.moveable?.dragStart
      // );
      // triggerDragOperation(virtualTarget.id, { x: 0, y: 0 }, { x: 100, y: 100 });
      // moveableRef.current?.waitToChangeTarget().then(() => {
      //   console.log('waitToChangeTarget');
      //   moveableRef.current?.dragStart(syntheticEvent, virtualTarget);
      // });
      moveableRef.current?.setState(
        {
          target: [virtualTarget],
        },
        () => {
          moveableRef.current?.dragStart(syntheticEvent);
        }
      );
      // moveableRef.current?.dragStart(syntheticEvent, virtualTarget);

      // moveableRef.current?.trigger('snap', { target: virtualTarget });
      // requesterRef.current = moveableRef.current.moveable?.request('draggable');
    }

    // Update virtual target position based on current drag position
    const size = item?.component?.defaultSize || { width: 100, height: 100 };
    const canvasBounds = item?.canvasRef?.getBoundingClientRect();

    if (canvasBounds && virtualTargetRef.current) {
      // Calculate position relative to canvas
      const left = currentOffset.x - canvasBounds.left - size.width / 2;
      const top = currentOffset.y - canvasBounds.top - size.height / 2;

      // Get width based on canvas grid if available
      const width = item?.canvasWidth ? (item.canvasWidth * size.width) / 43 : size.width;
      const height = size.height;

      // Store previous position to calculate delta
      const prevLeft = parseFloat(virtualTargetRef.current.style.left) || 0;
      const prevTop = parseFloat(virtualTargetRef.current.style.top) || 0;

      // Update the virtual element position
      virtualTargetRef.current.style.transform = `translate(${left}px, ${top}px)`;
      virtualTargetRef.current.style.width = `${width}px`;
      virtualTargetRef.current.style.height = `${height}px`;
      if (left === 0 || top === 0) {
        console.log('Long');
        debugger;
      }
      // Calculate delta for drag event
      const deltaX = left - prevLeft;
      const deltaY = top - prevTop;

      // Only trigger drag events if we have real movement
      if (isDraggingRef.current && (deltaX !== 0 || deltaY !== 0)) {
        // Simulate continuous drag for guideline detection
        moveableRef.current.drag?.({
          target: virtualTargetRef.current,
          beforeTranslate: [left, top],
          delta: [deltaX, deltaY],
        });

        // requesterRef.current.request({ x: left, y: top });

        // Update Moveable's internal state
        moveableRef.current.updateRect();

        // Force guidelines update
        if (typeof moveableRef.current.updateGuidelines === 'function') {
          moveableRef.current.updateGuidelines();
        }
        // console.log('moveableRef.current.state.guidelines', moveableRef.current?.state);
      }
    }

    // Cleanup function
    return () => {
      if (isDraggingRef.current) {
        // End drag operation on the virtual element
        moveableRef.current.dragEnd?.({ target: virtualTargetRef.current });
        // requesterRef.current?.requestEnd();
        isDraggingRef.current = false;
      }

      if (virtualTargetRef.current) {
        const realCanvas = document.getElementById('rm-container');
        if (realCanvas && realCanvas.contains(virtualTargetRef.current)) {
          realCanvas.removeChild(virtualTargetRef.current);
        } else if (document.body.contains(virtualTargetRef.current)) {
          document.body.removeChild(virtualTargetRef.current);
        }

        // Reset Moveable's target
        if (moveableRef.current) {
          moveableRef.current.target = null;
          moveableRef.current.updateRect();
        }

        virtualTargetRef.current = null;
      }
    };
  }, [isDragging, currentOffset, item, moveableRef, startDrag, endDrag, dragBy]);
}
