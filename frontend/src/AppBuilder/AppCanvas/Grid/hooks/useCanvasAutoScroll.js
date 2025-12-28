import { useRef, useCallback, useEffect } from 'react';
import { positionGhostElement } from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useGridStore } from '@/_stores/gridStore';
import { GRID_HEIGHT } from '../../appCanvasConstants';

const DEFAULT_CONFIG = {
  threshold: 30, // Distance from edge to trigger scrolling (px)
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
 * Supports two modes:
 * - 'drag': Updates element position as canvas scrolls (for single widget drag operations)
 * - 'groupDrag': Updates multiple elements' positions as canvas scrolls (for group drag operations)
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
  const targetElementRef = useRef(null); // Track the dragged element (single)
  const targetElementsRef = useRef([]); // Track multiple dragged elements (for group drag)
  const modeRef = useRef('drag'); // 'drag' or 'groupDrag' - controls position update behavior

  /**
   * Check if widget(s) are near the bottom of canvas and need to extend it
   * Supports both single element and group drag modes
   */
  const extendCanvasIfNeeded = useCallback(
    (container, scrollY) => {
      if (scrollY <= 0) return; // Only extend when scrolling down

      const realCanvas = document.getElementById('real-canvas');
      if (!realCanvas) return;

      const isGroupDragMode = modeRef.current === 'groupDrag';
      const containerRect = container.getBoundingClientRect();
      const canvasHeight = realCanvas.offsetHeight;

      let maxWidgetBottomOnCanvas = 0;
      let maxComponentHeight = 0;

      if (isGroupDragMode) {
        // For group drag, find the maximum bottom position across all elements
        const elements = targetElementsRef.current;
        if (!elements || elements.length === 0) return;

        elements.forEach((element) => {
          if (!element) return;
          const elementRect = element.getBoundingClientRect();
          const widgetBottomOnCanvas = container.scrollTop + (elementRect.bottom - containerRect.top);
          maxWidgetBottomOnCanvas = Math.max(maxWidgetBottomOnCanvas, widgetBottomOnCanvas);

          // Get the height of this component for extension calculation
          const componentHeight = boxList.find((box) => box.id === element.id)?.height || 0;
          maxComponentHeight = Math.max(maxComponentHeight, componentHeight);
        });
      } else {
        // Single element mode
        const element = targetElementRef.current;
        const elementRect = element?.getBoundingClientRect();

        if (!elementRect) return;

        maxComponentHeight = boxList.find((box) => box.id === element?.id)?.height || 0;
        maxWidgetBottomOnCanvas = container.scrollTop + (elementRect.bottom - containerRect.top);
      }

      // Check if widget's (or group's) bottom is approaching the canvas bottom
      const isNearBottom = maxWidgetBottomOnCanvas >= canvasHeight - threshold;

      if (isNearBottom) {
        // Get current canvas height and increase it
        const currentHeight = realCanvas.offsetHeight;
        const newHeight = currentHeight + maxComponentHeight + canvasHeightIncrement;

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
    newY = Math.round(newY / GRID_HEIGHT) * GRID_HEIGHT + scrollY;

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
   * Core scroll logic - checks MOUSE POSITION and scrolls if near viewport edges
   * Note: Vertical scroll is on .canvas-content, horizontal scroll is on .canvas-container
   * Supports drag and groupDrag modes
   */
  const scrollIfNeeded = useCallback(() => {
    const verticalContainer = document.querySelector(verticalContainerSelector);
    const horizontalContainer = document.querySelector(horizontalContainerSelector);
    if ((!verticalContainer && !horizontalContainer) || !isScrollingRef.current) return;

    const { clientX, clientY } = mousePositionRef.current;

    const verticalRect = verticalContainer?.getBoundingClientRect();
    const horizontalRect = horizontalContainer?.getBoundingClientRect();

    let scrollX = 0;
    let scrollY = 0;

    // Check vertical boundaries using MOUSE POSITION (on .canvas-content)
    if (verticalContainer && clientY <= verticalRect.top + threshold) {
      // Mouse within threshold of top edge - scroll up
      const remainingTopScroll = Math.floor(verticalContainer.scrollTop);
      if (remainingTopScroll > 1) {
        scrollY = -Math.min(scrollSpeed, remainingTopScroll);
      }
    } else if (verticalContainer && clientY >= verticalRect.bottom - threshold) {
      // Mouse within threshold of bottom edge - scroll down
      scrollY = scrollSpeed;
    }

    // Check horizontal boundaries using MOUSE POSITION (on .canvas-container)
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

      if (clientX <= leftBoundary) {
        // Mouse within threshold of left boundary - scroll left
        const remainingLeftScroll = Math.floor(horizontalContainer.scrollLeft);
        if (remainingLeftScroll > 1) {
          scrollX = -Math.min(scrollSpeed, remainingLeftScroll);
        }
      }
    }

    if (horizontalContainer && scrollX === 0) {
      let rightBoundary = horizontalRect.right - threshold;

      if (isRightSidebarOpen) {
        const sidebar = document.querySelector('.editor-sidebar');
        if (sidebar) {
          const sidebarRect = sidebar.getBoundingClientRect();
          rightBoundary = sidebarRect.left - threshold;
        } else {
          rightBoundary = horizontalRect.right - RIGHT_SIDEBAR_WIDTH - threshold;
        }
      }

      if (clientX >= rightBoundary) {
        // Mouse within threshold of right boundary - scroll right
        const maxScrollLeft = horizontalContainer.scrollWidth - horizontalContainer.clientWidth;
        const remainingScroll = Math.floor(maxScrollLeft - horizontalContainer.scrollLeft);
        if (remainingScroll > 1) {
          scrollX = Math.min(scrollSpeed, remainingScroll);
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
        // Update element position(s) based on mode
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
        // Update element position(s) based on mode
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
   * Update mouse position and target element(s)
   * Call this from onDrag/onDragGroup handlers
   * @param {number} clientX - Mouse X position
   * @param {number} clientY - Mouse Y position
   * @param {HTMLElement|HTMLElement[]} target - The element(s) being dragged (single or array for group)
   */
  const updateMousePosition = useCallback(
    (clientX, clientY, target = null) => {
      mousePositionRef.current = { clientX, clientY };

      // Update target(s) if provided
      if (target) {
        if (Array.isArray(target)) {
          // Group mode - update all targets
          targetElementsRef.current = target;
          targetElementRef.current = target[0] || null;
        } else {
          // Single element mode
          targetElementRef.current = target;
        }
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
   * Call this from onDragStart or onDragGroupStart handlers
   * @param {number} clientX - Mouse X position
   * @param {number} clientY - Mouse Y position
   * @param {HTMLElement|HTMLElement[]} target - The element(s) being dragged (single element or array for group)
   * @param {string} mode - 'drag' or 'groupDrag' - controls position update behavior
   */
  const startAutoScroll = useCallback(
    (clientX, clientY, target = null, mode = 'drag') => {
      isScrollingRef.current = true;
      mousePositionRef.current = { clientX, clientY };
      scrollDeltaRef.current = { x: 0, y: 0 }; // Reset delta on start
      modeRef.current = mode === 'groupDrag' ? 'groupDrag' : 'drag'; // Normalize mode for this scroll session

      // Store the target element(s)
      if (target) {
        if (Array.isArray(target)) {
          // Group drag mode - store all targets
          targetElementsRef.current = target;
          // Also set first element as primary target for compatibility
          targetElementRef.current = target[0] || null;
        } else {
          // Single element mode
          targetElementRef.current = target;
          targetElementsRef.current = [];
        }
      }

      rafIdRef.current = requestAnimationFrame(scrollIfNeeded);
    },
    [scrollIfNeeded]
  );

  /**
   * Stop auto-scroll monitoring
   * Call this from onDragEnd/onDragGroupEnd handlers
   */
  const stopAutoScroll = useCallback(() => {
    isScrollingRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Reset the inline canvas height style - the actual height will be
    // recalculated by updateCanvasBottomHeight via incrementCanvasUpdater
    const realCanvas = document.getElementById('real-canvas');
    if (realCanvas && canvasHeightRef.current) {
      canvasHeightRef.current = null;
    }

    // Reset refs
    scrollDeltaRef.current = { x: 0, y: 0 };
    targetElementRef.current = null;
    targetElementsRef.current = []; // Reset group targets
    modeRef.current = 'drag'; // Reset mode to default
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
