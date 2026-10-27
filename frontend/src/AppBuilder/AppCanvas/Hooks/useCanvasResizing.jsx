import { debounce } from 'lodash';
import { useEffect, useLayoutEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import {
  getHorizontalInsets,
  getPagesSidebarSlotWidth,
  keepWidthIfUnchanged,
  measureCanvasContentWidth,
} from '../canvasGeometry';
import { SCROLLBAR_HIDE_DELAY_MS } from './useEnableMainCanvasScroll';

const MAIN_CANVAS_ELEMENT_ID = 'real-canvas';
// Continuous size changes (window resize, sidebar transitions) are committed once they settle, so the
// widget tree is not re-laid-out on every frame.
const RESIZE_SETTLE_MS = 100;
// Width transition of the page-navigation sidebar (shadcn Sidebar: `transition-[width] duration-200`).
const PAGES_SIDEBAR_TRANSITION_MS = 200;
// Grace period after the scroller hides its scrollbar again, before its width counts as settled.
const SCROLLBAR_SETTLE_MS = 100;

/*
 * Keeps `canvasWidth` (the width the 43-column grid is laid out over) equal to the rendered canvas.
 *
 * Main canvas: the rendered content width of #real-canvas is the single source of truth. Deriving it
 * from sidebar widths, editor padding and the max-width setting drifted from the DOM (the max width caps
 * the page sidebar AND the canvas together), leaving the grid wider than the canvas.
 */
const useCanvasResizing = ({
  setCanvasWidth,
  moduleId,
  currentLayout,
  canvasMaxWidth,
  isRightSidebarOpen,
  isViewerSidebarPinned,
  position,
}) => {
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility(moduleId), shallow);
  const isMainCanvas = moduleId === 'canvas';

  const observedRef = useRef({ element: null, observer: null, timer: null });
  // While the page sidebar animates, observed widths are intermediate: only the settled one is committed.
  const holdUntilRef = useRef(0);

  const stopObserving = () => {
    const observed = observedRef.current;
    observed.observer?.disconnect();
    clearTimeout(observed.timer);
    if (observed.onScroll) observed.scroller?.removeEventListener('scroll', observed.onScroll);
    observedRef.current = { element: null, observer: null, timer: null };
  };

  // The canvas element is replaced on page switches, canvas reloads and layout changes; re-attach after
  // every commit in which it changed.
  useLayoutEffect(() => {
    if (!isMainCanvas) return;
    const element = document.getElementById(MAIN_CANVAS_ELEMENT_ID);
    if (element === observedRef.current.element) return;

    stopObserving();
    if (!element) return;

    const observed = { element, observer: null, timer: null, scroller: null, onScroll: null, lastScrollAt: -Infinity };
    const schedule = (delay) => {
      clearTimeout(observed.timer);
      observed.timer = setTimeout(() => {
        observed.timer = null;
        commit();
      }, delay);
    };
    // The canvas scroller shows its scrollbar only while scrolling (useEnableMainCanvasScroll). Where that
    // scrollbar takes layout space it narrows the canvas for a moment; following it would re-lay out every
    // widget when scrolling starts and again when it stops, so wait until the scrollbar is hidden again.
    function commit() {
      const revealedFor = observed.lastScrollAt + SCROLLBAR_HIDE_DELAY_MS + SCROLLBAR_SETTLE_MS - performance.now();
      if (revealedFor > 0) return schedule(revealedFor);
      const width = measureCanvasContentWidth(element);
      if (width > 0) setCanvasWidth(keepWidthIfUnchanged(width));
    }
    commit();

    const onResize = () => {
      const heldFor = holdUntilRef.current - performance.now();
      if (!observed.timer && heldFor <= 0) commit(); // leading edge: one-off changes apply at once
      schedule(Math.max(RESIZE_SETTLE_MS, heldFor));
    };
    if (typeof ResizeObserver !== 'undefined') {
      observed.observer = new ResizeObserver(onResize);
      observed.observer.observe(element);
    }
    observed.scroller = element.closest('.canvas-content');
    if (observed.scroller) {
      observed.onScroll = () => {
        observed.lastScrollAt = performance.now();
      };
      observed.scroller.addEventListener('scroll', observed.onScroll, { passive: true });
    }
    observedRef.current = observed;
  });

  useEffect(() => stopObserving, []);

  // A page-sidebar pin/style change animates the sidebar's width. The row holding sidebar + canvas keeps
  // its width meanwhile, so lay the grid out for the final canvas width right away instead of following
  // (or lagging behind) the animation.
  const sidebarSlotWidth = getPagesSidebarSlotWidth({
    position,
    isHidden: isPagesSidebarHidden,
    isPinned: isViewerSidebarPinned,
  });
  const previousSidebarSlotWidthRef = useRef(sidebarSlotWidth);
  useLayoutEffect(() => {
    if (previousSidebarSlotWidthRef.current === sidebarSlotWidth) return;
    previousSidebarSlotWidthRef.current = sidebarSlotWidth;

    const canvas = observedRef.current.element;
    const row = canvas?.closest('.canvas-wrapper');
    if (!isMainCanvas || currentLayout !== 'desktop' || !row) return;

    holdUntilRef.current = performance.now() + PAGES_SIDEBAR_TRANSITION_MS + RESIZE_SETTLE_MS;
    const finalWidth = row.getBoundingClientRect().width - sidebarSlotWidth - getHorizontalInsets(canvas);
    if (finalWidth > 0) setCanvasWidth(keepWidthIfUnchanged(finalWidth));
  }, [sidebarSlotWidth, isMainCanvas, currentLayout, setCanvasWidth]);

  useEffect(() => {
    localStorage.setItem('isPagesSidebarPinned', isViewerSidebarPinned);
  }, [isViewerSidebarPinned]);

  // Embedded modules size their canvas from the host widget that renders them.
  useEffect(() => {
    if (isMainCanvas) return;
    const handleResize = debounce(() => {
      const width = document.getElementById(moduleId)?.getBoundingClientRect()?.width;
      if (width !== 0) setCanvasWidth(width);
    }, 300);
    const element = document.getElementById(moduleId);
    const resizeObserver = new ResizeObserver(handleResize);
    if (element) resizeObserver.observe(element);

    return () => {
      if (element) resizeObserver.unobserve(element);
      resizeObserver.disconnect();
      handleResize.cancel();
    };
  }, [isMainCanvas, moduleId, setCanvasWidth, currentLayout, canvasMaxWidth, isRightSidebarOpen]);
};

export default useCanvasResizing;
