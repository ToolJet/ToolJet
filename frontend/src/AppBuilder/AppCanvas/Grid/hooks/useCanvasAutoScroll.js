import { useRef, useCallback, useEffect } from 'react';
import { positionGhostElement } from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

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
 * Custom hook for auto-scrolling the canvas when dragging widgets near edges
 * @param {Object} config - Configuration options
 * @param {number} config.threshold - Distance from edge to trigger scrolling
 * @param {number} config.scrollSpeed - Pixels to scroll per animation frame
 * @param {string} config.verticalContainerSelector - CSS selector for scroll container
 * @param {number} config.canvasHeightIncrement - Pixels to increase canvas height when at bottom
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
  const targetElementRef = useRef(null); // Track the dragged element

  /**
   * Check if widget is near the bottom of canvas and need to extend it
   */
  const extendCanvasIfNeeded = useCallback(
    (container, scrollY) => {
      if (scrollY <= 0) return; // Only extend when scrolling down

      const realCanvas = document.getElementById('real-canvas');
      if (!realCanvas) return;

      const currentDraggingId = useStore.getState().draggingComponentId;
      const draggingComponentHeight = boxList.find((box) => box.id === currentDraggingId)?.height || 0;

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
        const newHeight = currentHeight + draggingComponentHeight + canvasHeightIncrement;

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

    // Get current transform and add scroll delta
    const currentPos = parseTransform(element);
    const newX = currentPos.x + scrollX;
    const newY = currentPos.y + scrollY;

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

    // Check vertical boundaries using WIDGET EDGES (on .canvas-content)
    if (verticalContainer && widgetTop < verticalRect.top + threshold) {
      // Widget's TOP edge is near viewport top - scroll up
      const remainingTopScroll = Math.floor(verticalContainer.scrollTop);
      if (remainingTopScroll > 1) {
        const distance = verticalRect.top + threshold - widgetTop;
        scrollY = -Math.min(scrollSpeed, distance, remainingTopScroll);
      }
    } else if (verticalContainer && widgetBottom > verticalRect.bottom - threshold) {
      // Widget's BOTTOM edge is near viewport bottom - scroll down
      const distance = widgetBottom - (verticalRect.bottom - threshold);
      scrollY = Math.min(scrollSpeed, distance);
    }

    // Check horizontal boundaries using WIDGET EDGES (on .canvas-container)
    if (horizontalContainer) {
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

    if (horizontalContainer && scrollX === 0) {
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
        updateElementPositionOnScroll(0, actualScrollY);
      }
    }

    // Perform horizontal scroll if needed
    if (scrollX !== 0 && horizontalContainer) {
      const scrollLeftBefore = horizontalContainer.scrollLeft;
      horizontalContainer.scrollBy({ left: scrollX });
      const actualScrollX = horizontalContainer.scrollLeft - scrollLeftBefore;

      if (actualScrollX !== 0) {
        scrollDeltaRef.current.x += actualScrollX;
        updateElementPositionOnScroll(actualScrollX, 0);
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
   * Call this from onDrag handlers
   */
  const updateMousePosition = useCallback(
    (clientX, clientY, target = null) => {
      mousePositionRef.current = { clientX, clientY };

      // Update target if provided
      if (target) {
        targetElementRef.current = target;
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
   * Call this from onDragStart handlers
   */
  const startAutoScroll = useCallback(
    (clientX, clientY, target = null) => {
      isScrollingRef.current = true;
      mousePositionRef.current = { clientX, clientY };
      scrollDeltaRef.current = { x: 0, y: 0 }; // Reset delta on start

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
