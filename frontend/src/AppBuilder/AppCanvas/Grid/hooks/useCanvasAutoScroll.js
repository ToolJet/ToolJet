import { useRef, useCallback, useEffect } from 'react';
import { positionGhostElement, positionGroupGhostElement } from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useGridStore } from '@/_stores/gridStore';

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
 * Custom hook for auto-scrolling the canvas when dragging or resizing widgets near edges
 * Supports three modes:
 * - 'drag': Updates element position as canvas scrolls (for single widget drag operations)
 * - 'resize': Only scrolls container, lets Moveable handle position/size (for resize operations)
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
  const targetElementRef = useRef(null); // Track the dragged/resized element (single)
  const targetElementsRef = useRef([]); // Track multiple dragged elements (for group drag)
  const modeRef = useRef('drag'); // 'drag', 'resize', or 'groupDrag' - controls position update behavior
  const resizeDirectionRef = useRef([0, 0]); // [horizontal, vertical] resize direction: -1 = left/top, 1 = right/bottom, 0 = none

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
        const currentDraggingId = useStore.getState().draggingComponentId;
        const currentResizingId = useStore.getState().resizingComponentId;
        const activeComponentId = currentDraggingId || currentResizingId;
        maxComponentHeight = boxList.find((box) => box.id === activeComponentId)?.height || 0;

        const element = targetElementRef.current;
        const elementRect = element?.getBoundingClientRect();

        if (!elementRect) return;

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
   * Immediately update all group elements' positions when scrolling
   * This provides smooth UX for group drag even when mouse is stationary
   */
  const updateGroupElementsPositionOnScroll = useCallback((scrollX, scrollY) => {
    const elements = targetElementsRef.current;
    if (!elements || elements.length === 0) return;

    // Get canvas bounds for clamping
    const realCanvas = document.getElementById('real-canvas');
    if (!realCanvas) return;

    const canvasWidth = realCanvas.clientWidth;

    // Calculate group bounds before updating to check canvas constraints
    let groupMinX = Infinity;
    let groupMaxRight = -Infinity;
    let groupMinY = Infinity;

    // First pass: calculate current group bounds
    elements.forEach((element) => {
      if (!element) return;
      const currentPos = parseTransform(element);
      groupMinX = Math.min(groupMinX, currentPos.x);
      groupMaxRight = Math.max(groupMaxRight, currentPos.x + element.clientWidth);
      groupMinY = Math.min(groupMinY, currentPos.y);
    });

    // Calculate proposed new bounds
    const proposedGroupMinX = groupMinX + scrollX;
    const proposedGroupMaxRight = groupMaxRight + scrollX;
    const proposedGroupMinY = groupMinY + scrollY;

    // Clamp scroll deltas to respect canvas bounds for the entire group
    let clampedScrollX = scrollX;
    let clampedScrollY = scrollY;

    // Left bound: group's leftmost edge should not go below 0
    if (proposedGroupMinX < 0) {
      clampedScrollX = scrollX - proposedGroupMinX;
    }
    // Right bound: group's rightmost edge should not exceed canvas width
    if (proposedGroupMaxRight > canvasWidth) {
      clampedScrollX = scrollX - (proposedGroupMaxRight - canvasWidth);
    }
    // Top bound: group's topmost edge should not go below 0
    if (proposedGroupMinY < 0) {
      clampedScrollY = scrollY - proposedGroupMinY;
    }
    // Bottom: unlimited (no clamping needed)

    // Second pass: update all elements with clamped scroll delta
    // Note: We don't apply individual bounds here as it would break relative positioning within the group
    // The group-level clamping above ensures the entire group stays within canvas bounds
    elements.forEach((element) => {
      if (!element) return;

      const parent = element.closest('.real-canvas');
      const parentId = parent?.getAttribute('data-parentId') || 'canvas';
      const _gridWidth =
        useGridStore.getState().subContainerWidths[parentId] || useGridStore.getState().subContainerWidths['canvas'];

      // Get current transform and add scroll delta
      const currentPos = parseTransform(element);
      const newX = Math.round(currentPos.x / _gridWidth) * _gridWidth + clampedScrollX;
      const newY = Math.round(currentPos.y / 10) * 10 + clampedScrollY;

      // Update element transform immediately
      element.style.transform = `translate(${newX}px, ${newY}px)`;
    });

    // Update ghost element for the group
    const groupEvents = elements.map((target) => ({ target }));
    positionGroupGhostElement(groupEvents, 'moveable-ghost-widget');
  }, []);

  /**
   * Calculate combined bounding box for group of elements (screen coordinates)
   * @param {HTMLElement[]} elements - Array of elements
   * @returns {Object} - Combined bounding box { top, bottom, left, right }
   */
  const calculateGroupBounds = useCallback((elements) => {
    if (!elements || elements.length === 0) return null;

    let minTop = Infinity;
    let maxBottom = -Infinity;
    let minLeft = Infinity;
    let maxRight = -Infinity;

    elements.forEach((element) => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      minTop = Math.min(minTop, rect.top);
      maxBottom = Math.max(maxBottom, rect.bottom);
      minLeft = Math.min(minLeft, rect.left);
      maxRight = Math.max(maxRight, rect.right);
    });

    return {
      top: minTop,
      bottom: maxBottom,
      left: minLeft,
      right: maxRight,
    };
  }, []);

  /**
   * Core scroll logic - checks MOUSE POSITION and scrolls if near viewport edges
   * Note: Vertical scroll is on .canvas-content, horizontal scroll is on .canvas-container
   * Supports drag, resize, and groupDrag modes
   */
  const scrollIfNeeded = useCallback(() => {
    const verticalContainer = document.querySelector(verticalContainerSelector);
    const horizontalContainer = document.querySelector(horizontalContainerSelector);
    if ((!verticalContainer && !horizontalContainer) || !isScrollingRef.current) return;

    // Use mouse position instead of widget bounds
    const { clientX, clientY } = mousePositionRef.current;

    const verticalRect = verticalContainer?.getBoundingClientRect();
    const horizontalRect = horizontalContainer?.getBoundingClientRect();

    let scrollX = 0;
    let scrollY = 0;

    // Get resize direction for filtering (applies in resize mode)
    const isResizeMode = modeRef.current === 'resize';
    const [horizontalDir, verticalDir] = resizeDirectionRef.current;

    // Check vertical boundaries using MOUSE POSITION (on .canvas-content)
    // In resize mode, only check top boundary if resizing upward (direction = -1)
    const shouldCheckTop = !isResizeMode || verticalDir === -1;
    // In resize mode, only check bottom boundary if resizing downward (direction = 1)
    const shouldCheckBottom = !isResizeMode || verticalDir === 1;

    if (verticalContainer && shouldCheckTop && clientY <= verticalRect.top + threshold) {
      // Mouse within threshold of top edge - scroll up
      const remainingTopScroll = Math.floor(verticalContainer.scrollTop);
      if (remainingTopScroll > 1) {
        scrollY = -Math.min(scrollSpeed, remainingTopScroll);
      }
    } else if (verticalContainer && shouldCheckBottom && clientY >= verticalRect.bottom - threshold) {
      // Mouse within threshold of bottom edge - scroll down
      scrollY = scrollSpeed;
    }

    // Check horizontal boundaries using MOUSE POSITION (on .canvas-container)
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

      if (clientX <= leftBoundary) {
        // Mouse within threshold of left boundary - scroll left
        const remainingLeftScroll = Math.floor(horizontalContainer.scrollLeft);
        if (remainingLeftScroll > 1) {
          scrollX = -Math.min(scrollSpeed, remainingLeftScroll);
        }
      }
    }

    if (horizontalContainer && shouldCheckRight && scrollX === 0) {
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
        // For 'groupDrag' mode, don't update positions here - let onDragGroup handle it
        // This prevents conflicts with Moveable's event handling
        // For 'resize' mode, Moveable handles position/size
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
        // For 'groupDrag' mode, don't update positions here - let onDragGroup handle it
        // This prevents conflicts with Moveable's event handling
        // For 'resize' mode, Moveable handles position/size
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

  // const scrollIfNeeded = useCallback(() => {
  //   const verticalContainer = document.querySelector(verticalContainerSelector);
  //   const horizontalContainer = document.querySelector(horizontalContainerSelector);
  //   if ((!verticalContainer && !horizontalContainer) || !isScrollingRef.current) return;

  //   const element = targetElementRef.current;
  //   if (!element) return;

  //   // Use mouse position instead of widget bounds
  //   const { clientX, clientY } = mousePositionRef.current;

  //   const verticalRect = verticalContainer?.getBoundingClientRect();
  //   const horizontalRect = horizontalContainer?.getBoundingClientRect();

  //   let scrollX = 0;
  //   let scrollY = 0;

  //   // Get resize direction for filtering (applies in resize and groupResize modes)
  //   const isResizeMode = modeRef.current === 'resize' || modeRef.current === 'groupResize';
  //   const [horizontalDir, verticalDir] = resizeDirectionRef.current;

  //   // Check vertical boundaries using MOUSE POSITION (on .canvas-content)
  //   // In resize mode, only check top boundary if resizing upward (direction = -1)
  //   const shouldCheckTop = !isResizeMode || verticalDir === -1;
  //   // In resize mode, only check bottom boundary if resizing downward (direction = 1)
  //   const shouldCheckBottom = !isResizeMode || verticalDir === 1;

  //   if (verticalContainer && shouldCheckTop && clientY <= verticalRect.top + threshold) {
  //     // Mouse within threshold of top edge - scroll up
  //     const remainingTopScroll = Math.floor(verticalContainer.scrollTop);
  //     if (remainingTopScroll > 1) {
  //       scrollY = -Math.min(scrollSpeed, remainingTopScroll);
  //     }
  //   } else if (verticalContainer && shouldCheckBottom && clientY >= verticalRect.bottom - threshold) {
  //     // Mouse within threshold of bottom edge - scroll down
  //     scrollY = scrollSpeed;
  //   }

  //   // Check horizontal boundaries using MOUSE POSITION (on .canvas-container)
  //   // In resize mode, only check left boundary if resizing leftward (direction = -1)
  //   const shouldCheckLeft = !isResizeMode || horizontalDir === -1;
  //   // In resize mode, only check right boundary if resizing rightward (direction = 1)
  //   const shouldCheckRight = !isResizeMode || horizontalDir === 1;

  //   if (horizontalContainer && shouldCheckLeft) {
  //     let leftBoundary = horizontalRect.left + threshold;
  //     if (isLeftSidebarOpen) {
  //       const leftSidebar = document.querySelector('.left-sidebar-scrollbar');
  //       if (leftSidebar) {
  //         const leftSidebarRect = leftSidebar.getBoundingClientRect();
  //         leftBoundary = Math.max(leftSidebarRect.right + threshold, leftBoundary);
  //       } else {
  //         leftBoundary = Math.max(LEFT_SIDEBAR_WIDTH_DEFAULT + threshold, leftBoundary);
  //       }
  //     }

  //     if (clientX <= leftBoundary) {
  //       // Mouse within threshold of left boundary - scroll left
  //       const remainingLeftScroll = Math.floor(horizontalContainer.scrollLeft);
  //       if (remainingLeftScroll > 1) {
  //         scrollX = -Math.min(scrollSpeed, remainingLeftScroll);
  //         if (modeRef.current === 'drag') {
  //           updateElementPositionOnScroll(scrollX, 0);
  //         }
  //       }
  //     }
  //   }

  //   if (horizontalContainer && shouldCheckRight && scrollX === 0) {
  //     let rightBoundary = horizontalRect.right - threshold;

  //     if (isRightSidebarOpen) {
  //       const sidebar = document.querySelector('.editor-sidebar');
  //       if (sidebar) {
  //         const sidebarRect = sidebar.getBoundingClientRect();
  //         rightBoundary = sidebarRect.left - threshold;
  //       } else {
  //         rightBoundary = horizontalRect.right - RIGHT_SIDEBAR_WIDTH - threshold;
  //       }
  //     }

  //     if (clientX >= rightBoundary) {
  //       // Mouse within threshold of right boundary - scroll right
  //       const maxScrollLeft = horizontalContainer.scrollWidth - horizontalContainer.clientWidth;
  //       const remainingScroll = Math.floor(maxScrollLeft - horizontalContainer.scrollLeft);
  //       if (remainingScroll > 1) {
  //         scrollX = Math.min(scrollSpeed, remainingScroll);
  //         if (modeRef.current === 'drag') {
  //           updateElementPositionOnScroll(scrollX, 0);
  //         }
  //       }
  //     }
  //   }

  //   // Perform vertical scroll if needed
  //   if (scrollY !== 0 && verticalContainer) {
  //     extendCanvasIfNeeded(verticalContainer, scrollY);

  //     const scrollTopBefore = verticalContainer.scrollTop;
  //     verticalContainer.scrollBy({ top: scrollY });
  //     const actualScrollY = verticalContainer.scrollTop - scrollTopBefore;

  //     if (actualScrollY !== 0) {
  //       scrollDeltaRef.current.y += actualScrollY;
  //       // Only update element position in drag mode; for resize, Moveable handles position/size
  //       if (modeRef.current === 'drag') {
  //         updateElementPositionOnScroll(0, actualScrollY);
  //       }
  //     }
  //   }

  //   // Perform horizontal scroll if needed
  //   if (scrollX !== 0 && horizontalContainer) {
  //     const scrollLeftBefore = horizontalContainer.scrollLeft;
  //     horizontalContainer.scrollBy({ left: scrollX });
  //     const actualScrollX = horizontalContainer.scrollLeft - scrollLeftBefore;

  //     if (actualScrollX !== 0) {
  //       scrollDeltaRef.current.x += actualScrollX;
  //       console.log('actualScrollX', actualScrollX);
  //       // Only update element position in drag mode; for resize, Moveable handles position/size
  //       // if (modeRef.current === 'drag') {
  //       updateElementPositionOnScroll(actualScrollX, 0);
  //       // }
  //     }
  //   }

  //   // Update Moveable rect if any scrolling occurred
  //   if ((scrollX !== 0 || scrollY !== 0) && moveableRef?.current) {
  //     moveableRef.current.updateRect();
  //   }

  //   // Continue animation loop while dragging
  //   if (isScrollingRef.current) {
  //     rafIdRef.current = requestAnimationFrame(scrollIfNeeded);
  //   }
  // }, [
  //   verticalContainerSelector,
  //   threshold,
  //   scrollSpeed,
  //   moveableRef,
  //   extendCanvasIfNeeded,
  //   isRightSidebarOpen,
  //   isLeftSidebarOpen,
  //   horizontalContainerSelector,
  //   updateElementPositionOnScroll,
  // ]);

  /**
   * Update mouse position and target element(s)
   * Call this from onDrag/onResize/onDragGroup handlers
   * @param {number} clientX - Mouse X position
   * @param {number} clientY - Mouse Y position
   * @param {HTMLElement|HTMLElement[]} target - The element(s) being dragged/resized (single or array for group)
   * @param {Array} direction - Optional [horizontal, vertical] resize direction for resize mode
   */
  const updateMousePosition = useCallback(
    (clientX, clientY, target = null, direction = null) => {
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
   * Call this from onDragStart, onResizeStart, or onDragGroupStart handlers
   * @param {number} clientX - Mouse X position
   * @param {number} clientY - Mouse Y position
   * @param {HTMLElement|HTMLElement[]} target - The element(s) being dragged/resized (single element or array for group)
   * @param {string} mode - 'drag', 'resize', or 'groupDrag' - controls position update behavior
   * @param {Array} direction - [horizontal, vertical] resize direction: -1 = left/top, 1 = right/bottom, 0 = none
   */
  const startAutoScroll = useCallback(
    (clientX, clientY, target = null, mode = 'drag', direction = [0, 0]) => {
      isScrollingRef.current = true;
      mousePositionRef.current = { clientX, clientY };
      scrollDeltaRef.current = { x: 0, y: 0 }; // Reset delta on start
      modeRef.current = mode; // Set the mode for this scroll session
      resizeDirectionRef.current = direction; // Store resize direction

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
    // recalculated by updateCanvasBottomHeight via toggleCanvasUpdater
    const realCanvas = document.getElementById('real-canvas');
    if (realCanvas && canvasHeightRef.current) {
      canvasHeightRef.current = null;
    }

    // Reset refs
    scrollDeltaRef.current = { x: 0, y: 0 };
    targetElementRef.current = null;
    targetElementsRef.current = []; // Reset group targets
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
