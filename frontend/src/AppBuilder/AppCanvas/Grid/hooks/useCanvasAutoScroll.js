import { useRef, useCallback, useEffect } from 'react';
import { positionGhostElement } from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useGridStore } from '@/_stores/gridStore';

const DEFAULT_CONFIG = {
  threshold: 50, // Distance from edge to trigger scrolling (px)
  scrollSpeed: 10, // Scroll speed per frame (px)
  verticalContainerSelector: '.canvas-content',
  horizontalContainerSelector: '.canvas-container',
  canvasHeightIncrement: 50, // Pixels to increase canvas height when at bottom
};

const RIGHT_SIDEBAR_WIDTH = 300; // Width of the right sidebar when open
const LEFT_SIDEBAR_WIDTH_DEFAULT = 350; // Default width of the left sidebar when open

/**
 * Parse transform translate values from an element's transform style
 */
const parseTransform = (element) => {
  if (!element) return { x: 0, y: 0 };
  const transform = element.style.transform;
  const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
  if (match) {
    return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
  }
  return { x: 0, y: 0 };
};

/**
 * Custom hook for auto-scrolling the canvas when dragging or resizing widgets near edges
 * Supports two modes:
 * - 'drag': Updates element position as canvas scrolls (for drag operations)
 * - 'resize': Only scrolls container, lets Moveable handle position/size (for resize operations)
 *
 * @param {Object} config - Configuration options
 * @param {number} config.threshold - Distance from edge to trigger scrolling
 * @param {number} config.scrollSpeed - Pixels to scroll per animation frame
 * @param {string} config.verticalContainerSelector - CSS selector for vertical scroll container
 * @param {string} config.horizontalContainerSelector - CSS selector for horizontal scroll container
 * @param {number} config.canvasHeightIncrement - Pixels to increase canvas height when at bottom
 * @param {Array} boxList - List of widget boxes for height calculations
 * @param {HTMLElement} virtualTarget - Virtual target element (if any)
 * @param {React.RefObject} moveableRef - Reference to the Moveable instance
 * @returns {Object} - { startAutoScroll, stopAutoScroll, updateMousePosition, getScrollDelta }
 */
export const useCanvasAutoScroll = (config = {}, boxList = [], virtualTarget = null, moveableRef = null) => {
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const isLeftSidebarOpen = useStore((state) => state.isSidebarOpen, shallow);

  const { threshold, scrollSpeed, verticalContainerSelector, horizontalContainerSelector, canvasHeightIncrement } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const rafIdRef = useRef(null);
  const isScrollingRef = useRef(false);
  const mousePositionRef = useRef({ clientX: 0, clientY: 0 });
  const canvasHeightRef = useRef(null);
  const scrollDeltaRef = useRef({ x: 0, y: 0 }); // Cumulative scroll delta
  const targetElementRef = useRef(null); // Track the dragged/resized element
  const modeRef = useRef('drag'); // 'drag' or 'resize' - controls whether to update element position on scroll
  const resizeDirectionRef = useRef([0, 0]); // [horizontal, vertical] resize direction: -1 = left/top, 1 = right/bottom, 0 = none

  /**
   * Check if widget is near the bottom of canvas and need to extend it
   */
  const extendCanvasIfNeeded = useCallback(
    (container, scrollY) => {
      if (scrollY <= 0) return; // Only extend when scrolling down

      const realCanvas = document.getElementById('real-canvas');
      if (!realCanvas) return;

      // Check for both dragging and resizing component IDs
      const currentDraggingId = useStore.getState().draggingComponentId;
      const currentResizingId = useStore.getState().resizingComponentId;
      const activeComponentId = currentDraggingId || currentResizingId;
      const componentHeight = boxList.find((box) => box.id === activeComponentId)?.height || 0;

      // Get the widget's actual position on the canvas
      const element = targetElementRef.current;
      const elementRect = element?.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (!elementRect) return;

      // Widget's bottom position relative to the canvas (accounting for scroll)
      const widgetBottomOnCanvas = container.scrollTop + (elementRect.bottom - containerRect.top);
      const canvasHeight = realCanvas.offsetHeight;

      // Check if widget's bottom is approaching the canvas bottom
      const isNearBottom = widgetBottomOnCanvas >= canvasHeight - threshold;
      // console.log('isNearBottom', isNearBottom);
      if (isNearBottom) {
        // Get current canvas height and increase it
        const currentHeight = realCanvas.offsetHeight;
        const newHeight = currentHeight + componentHeight + canvasHeightIncrement;

        // Store the increased height
        if (!canvasHeightRef.current) {
          canvasHeightRef.current = currentHeight;
        }

        // Directly set the height on the canvas element for immediate effect
        realCanvas.style.height = `${newHeight}px`;
      }
    },
    [threshold, canvasHeightIncrement, boxList]
  );

  /**
   * Immediately update the dragged element's position when scrolling
   * This provides smooth UX even when mouse is stationary
   */
  const updateElementPositionOnScroll = useCallback((scrollX, scrollY) => {
    const element = targetElementRef.current;
    if (!element) return;

    // Get canvas bounds for clamping
    const realCanvas = document.getElementById('real-canvas');
    if (!realCanvas) return;

    const canvasWidth = realCanvas.clientWidth;
    const elementWidth = element.clientWidth;
    const _gridWidth = useGridStore.getState().subContainerWidths['canvas'];
    // Get current transform and add scroll delta
    const currentPos = parseTransform(element);
    let newX = currentPos.x;
    let newY = currentPos.y;
    newX = Math.round(newX / _gridWidth) * _gridWidth + scrollX;
    newY = Math.round(newY / 10) * 10 + scrollY;

    // Clamp position to stay within canvas bounds
    // Left bound: newX >= 0
    // Top bound: newY >= 0
    // Right bound: newX <= canvasWidth - elementWidth
    newX = Math.max(0, Math.min(newX, canvasWidth - elementWidth));
    newY = Math.max(0, newY);

    // Update element transform immediately
    element.style.transform = `translate(${newX}px, ${newY}px)`;
    positionGhostElement(element, 'moveable-ghost-widget');
  }, []);

  /**
   * Core scroll logic - checks WIDGET EDGES and scrolls if near viewport edges
   * Note: Vertical scroll is on .canvas-content, horizontal scroll is on .canvas-container
   */
  const scrollIfNeeded = useCallback(() => {
    const verticalContainer = document.querySelector(verticalContainerSelector);
    const horizontalContainer = document.querySelector(horizontalContainerSelector);
    if ((!verticalContainer && !horizontalContainer) || !isScrollingRef.current) return;

    // Early return if target element is no longer available (drag ended)
    const element = targetElementRef.current;
    if (!element) return;

    // const { clientX, clientY } = mousePositionRef.current;
    const verticalRect = verticalContainer?.getBoundingClientRect();
    const horizontalRect = horizontalContainer?.getBoundingClientRect();

    // Get the actual widget bounding rect from the dragged element
    const elementRect = element.getBoundingClientRect();

    // Use widget edges (no fallback needed since we checked element above)
    const widgetTop = elementRect.top;
    const widgetBottom = elementRect.bottom;
    const widgetLeft = elementRect.left;
    const widgetRight = elementRect.right;

    let scrollX = 0;
    let scrollY = 0;

    // Get resize direction for filtering (only applies in resize mode)
    const isResizeMode = modeRef.current === 'resize';
    const [horizontalDir, verticalDir] = resizeDirectionRef.current;

    // Check vertical boundaries using WIDGET EDGES (on .canvas-content)
    // In resize mode, only check top boundary if resizing upward (direction = -1)
    const shouldCheckTop = !isResizeMode || verticalDir === -1;
    // In resize mode, only check bottom boundary if resizing downward (direction = 1)
    const shouldCheckBottom = !isResizeMode || verticalDir === 1;

    if (verticalContainer && shouldCheckTop && widgetTop < verticalRect.top + threshold) {
      // Widget's TOP edge is near viewport top - scroll up
      const remainingTopScroll = Math.floor(verticalContainer.scrollTop);
      if (remainingTopScroll > 1) {
        const distance = verticalRect.top + threshold - widgetTop;
        scrollY = -Math.min(scrollSpeed, distance, remainingTopScroll);
      }
    } else if (verticalContainer && shouldCheckBottom && widgetBottom > verticalRect.bottom - threshold) {
      // Widget's BOTTOM edge is near viewport bottom - scroll down
      const distance = widgetBottom - (verticalRect.bottom - threshold);
      scrollY = Math.min(scrollSpeed, distance);
    }

    // Check horizontal boundaries using WIDGET EDGES (on .canvas-container)
    // In resize mode, only check left boundary if resizing leftward (direction = -1)
    const shouldCheckLeft = !isResizeMode || horizontalDir === -1;
    // In resize mode, only check right boundary if resizing rightward (direction = 1)
    const shouldCheckRight = !isResizeMode || horizontalDir === 1;

    if (horizontalContainer && shouldCheckLeft) {
      let leftBoundary = horizontalRect.left + threshold;
      if (isLeftSidebarOpen) {
        const leftSidebar = document.querySelector('.left-sidebar-scrollbar');
        if (leftSidebar) {
          const leftSidebarRect = leftSidebar.getBoundingClientRect();
          leftBoundary = Math.max(leftSidebarRect.right + threshold, leftBoundary);
        } else {
          leftBoundary = Math.max(LEFT_SIDEBAR_WIDTH_DEFAULT + threshold, leftBoundary);
        }
      }

      if (widgetLeft < leftBoundary) {
        // Widget's LEFT edge is near left boundary - scroll left
        const remainingLeftScroll = Math.floor(horizontalContainer.scrollLeft);
        if (remainingLeftScroll > 1) {
          const distance = leftBoundary - widgetLeft;
          scrollX = -Math.min(scrollSpeed, distance, remainingLeftScroll);
        }
      }
    }

    if (horizontalContainer && shouldCheckRight && scrollX === 0) {
      let rightThreshold = threshold;

      if (isRightSidebarOpen) {
        const sidebar = document.querySelector('.editor-sidebar');
        if (sidebar) {
          const sidebarRect = sidebar.getBoundingClientRect();
          rightThreshold = horizontalRect.right - sidebarRect.left + threshold;
        } else {
          rightThreshold = RIGHT_SIDEBAR_WIDTH + threshold;
        }
      }

      if (widgetRight > horizontalRect.right - rightThreshold) {
        // Widget's RIGHT edge is near right boundary - scroll right
        const maxScrollLeft = horizontalContainer.scrollWidth - horizontalContainer.clientWidth;
        const remainingScroll = Math.floor(maxScrollLeft - horizontalContainer.scrollLeft);
        if (remainingScroll > 1) {
          const distance = widgetRight - (horizontalRect.right - rightThreshold);
          scrollX = Math.min(scrollSpeed, distance, remainingScroll);
        }
      }
    }

    // Perform vertical scroll if needed
    if (scrollY !== 0 && verticalContainer) {
      extendCanvasIfNeeded(verticalContainer, scrollY);

      const scrollTopBefore = verticalContainer.scrollTop;
      verticalContainer.scrollBy({ top: scrollY });
      const actualScrollY = verticalContainer.scrollTop - scrollTopBefore;

      if (actualScrollY !== 0) {
        scrollDeltaRef.current.y += actualScrollY;
        // Only update element position in drag mode; for resize, Moveable handles position/size
        if (modeRef.current === 'drag') {
          updateElementPositionOnScroll(0, actualScrollY);
        }
      }
    }

    // Perform horizontal scroll if needed
    if (scrollX !== 0 && horizontalContainer) {
      const scrollLeftBefore = horizontalContainer.scrollLeft;
      horizontalContainer.scrollBy({ left: scrollX });
      const actualScrollX = horizontalContainer.scrollLeft - scrollLeftBefore;

      if (actualScrollX !== 0) {
        scrollDeltaRef.current.x += actualScrollX;
        // Only update element position in drag mode; for resize, Moveable handles position/size
        if (modeRef.current === 'drag') {
          updateElementPositionOnScroll(actualScrollX, 0);
        }
      }
    }

    // Update Moveable rect if any scrolling occurred
    if ((scrollX !== 0 || scrollY !== 0) && moveableRef?.current) {
      moveableRef.current.updateRect();
    }

    // Continue animation loop while dragging
    if (isScrollingRef.current) {
      rafIdRef.current = requestAnimationFrame(scrollIfNeeded);
    }
  }, [
    verticalContainerSelector,
    threshold,
    scrollSpeed,
    moveableRef,
    extendCanvasIfNeeded,
    updateElementPositionOnScroll,
    isRightSidebarOpen,
    isLeftSidebarOpen,
    horizontalContainerSelector,
  ]);

  /**
   * Update mouse position and target element
   * Call this from onDrag/onResize handlers
   * @param {number} clientX - Mouse X position
   * @param {number} clientY - Mouse Y position
   * @param {HTMLElement} target - The element being dragged/resized
   * @param {Array} direction - Optional [horizontal, vertical] resize direction for resize mode
   */
  const updateMousePosition = useCallback(
    (clientX, clientY, target = null, direction = null) => {
      mousePositionRef.current = { clientX, clientY };

      // Update target if provided
      if (target) {
        targetElementRef.current = target;
      }

      // Update direction if provided (for resize mode)
      if (direction) {
        resizeDirectionRef.current = direction;
      }

      // Start scroll loop if not already running
      if (isScrollingRef.current && !rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(scrollIfNeeded);
      }
    },
    [scrollIfNeeded]
  );

  /**
   * Start auto-scroll monitoring
   * Call this from onDragStart or onResizeStart handlers
   * @param {number} clientX - Mouse X position
   * @param {number} clientY - Mouse Y position
   * @param {HTMLElement} target - The element being dragged/resized
   * @param {string} mode - 'drag' or 'resize' - controls position update behavior
   * @param {Array} direction - [horizontal, vertical] resize direction: -1 = left/top, 1 = right/bottom, 0 = none
   */
  const startAutoScroll = useCallback(
    (clientX, clientY, target = null, mode = 'drag', direction = [0, 0]) => {
      isScrollingRef.current = true;
      mousePositionRef.current = { clientX, clientY };
      scrollDeltaRef.current = { x: 0, y: 0 }; // Reset delta on start
      modeRef.current = mode; // Set the mode for this scroll session
      resizeDirectionRef.current = direction; // Store resize direction

      // Store the target element
      if (target) {
        targetElementRef.current = target;
      }

      rafIdRef.current = requestAnimationFrame(scrollIfNeeded);
    },
    [scrollIfNeeded]
  );

  /**
   * Stop auto-scroll monitoring
   * Call this from onDragEnd handlers
   */
  const stopAutoScroll = useCallback(() => {
    isScrollingRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Reset the inline canvas height style - the actual height will be
    // recalculated by updateCanvasBottomHeight via toggleCanvasUpdater
    const realCanvas = document.getElementById('real-canvas');
    if (realCanvas && canvasHeightRef.current) {
      canvasHeightRef.current = null;
    }

    // Reset refs
    scrollDeltaRef.current = { x: 0, y: 0 };
    targetElementRef.current = null;
    modeRef.current = 'drag'; // Reset mode to default
    resizeDirectionRef.current = [0, 0]; // Reset resize direction
  }, []);

  useEffect(() => {
    if (!virtualTarget) {
      stopAutoScroll();
    }
  }, [virtualTarget, stopAutoScroll]);

  /**
   * Get current accumulated scroll delta
   * Use this in onDrag to adjust widget position
   */
  const getScrollDelta = useCallback(() => {
    return { ...scrollDeltaRef.current };
  }, []);

  return {
    startAutoScroll,
    stopAutoScroll,
    updateMousePosition,
    getScrollDelta,
  };
};
