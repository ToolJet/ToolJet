// useDndMoveableGuidelines.js
import { useEffect, useRef } from 'react';
import { useDragLayer } from 'react-dnd';
import useDndMoveable from './useDndMoveable';
import { set } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';

export function useDndMoveableGuidelines(moveableRef) {
  const virtualTargetRef = useRef(null);
  const isDraggingRef = useRef(false);
  const setTargets = useStore((state) => state.setTargets);
  const { isDragging, currentOffset, item } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset(),
    item: monitor.getItem(),
  }));
  const { startDrag, dragTo, endDrag, instantDrag } = useDndMoveable(moveableRef);

  useEffect(() => {
    // Only proceed if react-dnd reports dragging and we have offset/moveable
    if (isDragging && currentOffset) {
      let targetElement = virtualTargetRef.current;

      // Create virtual target ONLY if it doesn't exist yet for this drag sequence
      if (!targetElement) {
        const virtualTarget = document.createElement('div');
        virtualTarget.className = 'virtual-moveable-target moveable-box target widget-target';
        virtualTarget.id = 'virtual-moveable-target';
        virtualTarget.style.position = 'absolute';
        virtualTarget.style.pointerEvents = 'none';
        virtualTarget.style.border = '1px dashed #9747FF';
        virtualTarget.style.backgroundColor = 'rgba(151, 71, 255, 0.1)';
        virtualTarget.style.zIndex = '9999';
        // Add to DOM
        const realCanvas = document.getElementById('rm-container');
        if (realCanvas) {
          realCanvas.appendChild(virtualTarget);
        } else {
          document.body.appendChild(virtualTarget);
        }

        virtualTargetRef.current = virtualTarget;
        targetElement = virtualTarget; // Use the newly created element

        // Set initial size based on component defaults
        const size = item?.component?.defaultSize || { width: 100, height: 100 };
        const width = item?.canvasWidth ? (item.canvasWidth * size.width) / 43 : size.width;
        const height = size.height;

        targetElement.style.width = `${width}px`;
        targetElement.style.height = `${height}px`;

        const canvasElement = item?.canvasRef?.current || document.getElementById('rm-container');
        const canvasBounds = canvasElement?.getBoundingClientRect();

        if (canvasBounds) {
          // Calculate position relative to the canvas/container
          const x = currentOffset.x - canvasBounds.left;
          const y = currentOffset.y - canvasBounds.top;
          // console.log('x', x, 'y', y);
          moveableRef.current.target = targetElement;
          targetElement.style.transform = `translate(${x}px, ${y}px)`;
          moveableRef.current.updateTarget();
          moveableRef.current.updateRect();
          const moveableInstance = moveableRef.current.getManager();
          setTimeout(() => {
            moveableInstance.dragStart();
          }, 100);

          // console.log('targetElement', targetElement);
          // startDrag(targetElement);
          // instantDrag(targetElement, { x, y });
          // moveableRef.current.waitToChangeTarget().then(() => {
          //   // Only trigger dragStart and let Moveable handle the rest
          //   console.log('waitToChangeTarget', moveableRef.current);
          //   moveableRef.current.dragStart();
          // });

          if (x === 0 || y === 0) {
            debugger;
          }
        }

        // const startEvent = new MouseEvent('mousedown', {
        //   bubbles: true,
        //   cancelable: true,
        //   clientX: currentOffset.x,
        //   clientY: currentOffset.y,
        // });
        // console.log('moveableRef.current', moveableRef.current?._elementTargets);
        // We need to call dragStart directly on the Moveable instance
        // not using the helper which expects different event properties
        // Object.defineProperty(startEvent, 'target', {
        //   value: virtualTarget,
        //   writable: false,
        // });
        // moveableRef.current.updateRect();
        // moveableRef.current._elementTargets = [...moveableRef.current._elementTargets, virtualTarget];
        // moveableRef.current.setState(
        //   {
        //     target: virtualTarget,
        //     hideDefaultLines: true,
        //     resizable: false,
        //     origin: false,
        //     snappable: true,
        //   },
        //   () => {
        //     moveableRef.current.moveable.updateTarget();
        //     moveableRef.current.dragStart(startEvent, virtualTarget);
        //   }
        // );
        // moveableRef.current.dragStart(startEvent, virtualTarget);

        // moveableRef.current.moveable.dragStart(startEvent, virtualTarget);

        isDraggingRef.current = true;
      }

      // if (isDraggingRef.current && targetElement) {
      //   const canvasElement = item?.canvasRef?.current || document.getElementById('rm-container');
      //   const canvasBounds = canvasElement?.getBoundingClientRect();

      //   if (canvasBounds) {
      //     // Calculate position relative to the canvas/container
      //     const x = currentOffset.x - canvasBounds.left;
      //     const y = currentOffset.y - canvasBounds.top;
      //     // console.log('x', x, 'y', y);
      //     moveableRef.current.target = targetElement;

      //     moveableRef.current.waitToChangeTarget().then(() => {
      //       // Only trigger dragStart and let Moveable handle the rest
      //       console.log('waitToChangeTarget', moveableRef.current);
      //       moveableRef.current.dragStart();
      //     });
      //     targetElement.style.transform = `translate(${x}px, ${y}px)`;

      //     if (x === 0 || y === 0) {
      //       debugger;
      //     }
      //   } else {
      //     console.warn('useDndMoveableGuidelines: Could not find canvas bounds for dragTo.');
      //     // Fallback: Manually update position if bounds aren't available
      //     // Note: This won't trigger Moveable's internal drag/snap events
      //     const fallbackX = currentOffset.x; // Or adjust as needed
      //     const fallbackY = currentOffset.y; // Or adjust as needed
      //     targetElement.style.transform = `translate(${fallbackX}px, ${fallbackY}px)`;
      //   }
      // }
    } else {
      // This block executes when isDragging becomes false or other conditions fail

      // If *we* had an active drag, end it and clean up
      if (isDraggingRef.current) {
        // endDrag(); // End the programmatic drag
        // moveableRef.current.dragEnd();
        isDraggingRef.current = false; // Mark drag as ended

        // Remove virtual target from DOM and clear ref
        if (virtualTargetRef.current) {
          const realCanvas = document.getElementById('rm-container');
          if (realCanvas?.contains(virtualTargetRef.current)) {
            realCanvas.removeChild(virtualTargetRef.current);
          } else if (document.body.contains(virtualTargetRef.current)) {
            document.body.removeChild(virtualTargetRef.current);
          }
          virtualTargetRef.current = null;
        }

        // if (moveableRef.current?.moveable) {
        //   moveableRef.current.moveable.updateRect();
        // }
      }
    }

    return () => {
      if (isDraggingRef.current) {
        // moveableRef.current.dragEnd();
        isDraggingRef.current = false;

        if (virtualTargetRef.current) {
          const realCanvas = document.getElementById('rm-container');
          if (realCanvas?.contains(virtualTargetRef.current)) {
            realCanvas.removeChild(virtualTargetRef.current);
          } else if (document.body.contains(virtualTargetRef.current)) {
            document.body.removeChild(virtualTargetRef.current);
          }
          virtualTargetRef.current = null;
        }
      }
    };
  }, [isDragging, currentOffset, item, moveableRef]);
}
