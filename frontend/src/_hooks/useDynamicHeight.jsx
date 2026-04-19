import { useEffect, useRef } from 'react';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { getDynamicElementSelector, normalizeLayoutContext } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';

export const useDynamicHeight = ({
  isDynamicHeightEnabled,
  id,
  height,
  value,
  adjustComponentPositions,
  currentLayout,
  width,
  isContainer = false,
  componentCount = 0,
  visibility,
  skipAdjustment = false,
  subContainerIndex,
}) => {
  const { contextPath } = useSubcontainerContext();
  const prevDynamicHeight = useRef(isDynamicHeightEnabled);
  const prevHeight = useRef(height);

  useEffect(() => {
    const contextIndices = normalizeLayoutContext(
      contextPath.length > 0 ? contextPath.map((segment) => segment.index) : subContainerIndex
    );
    const elementSelector = getDynamicElementSelector(id, contextIndices);
    const element = document.querySelector(elementSelector);
    // Note: element may be null when the caller is a row-context reflow for a
    // widget whose own WidgetWrapper lives at a different context (e.g.
    // ListviewSubcontainer fires for the Listview id at row index [0], but
    // the Listview's own wrapper has data-layout-context="root"). In that
    // case we still need to kick off `adjustComponentPositions` so row
    // heights get recomputed — we just can't touch the element's inline
    // style because there isn't one to touch.

    // Bail when the widget lives inside a display:none ancestor subtree
    // (inactive tab pane, collapsed accordion content). In that state the
    // element's offsetHeight reads 0; running the reflow would write
    // temp[this]={height:0} and, on re-show, the delta-based reflow
    // (+fullHeight against a 0 baseline) pushes siblings below far past
    // their authored position. Widgets with internal ResizeObservers
    // (TextArea/CodeEditor/etc.) trigger this hook on the hide transition,
    // so the guard sits here — the re-show transition will re-fire the
    // hook with a valid measurement once offsetParent is back.
    //
    // Must exclude the "widget's own visibility turned off" case — that
    // also produces offsetParent === null, but we need the reflow to run
    // so siblings with `collapseWhenHidden` can collapse up.
    if (isDynamicHeightEnabled && visibility !== false && element && element.offsetParent === null) {
      return;
    }

    if (skipAdjustment && isDynamicHeightEnabled) {
      if (element) element.style.height = `${prevHeight.current}px`;
    } else if (isDynamicHeightEnabled) {
      // For containers, height is calculated from child layout positions (not DOM measurement),
      // so we can adjust synchronously without setting height to 'auto' first.
      // For non-containers, we need the element at 'auto' height so the DOM can be measured.
      if (!isContainer && element) element.style.height = 'auto';
      requestAnimationFrame(() => {
        adjustComponentPositions(id, currentLayout, isContainer, contextIndices);
      });
    } else if (!isDynamicHeightEnabled && prevDynamicHeight.current) {
      if (element) element.style.height = `${height}px`;
      requestAnimationFrame(() => {
        adjustComponentPositions(id, currentLayout, isContainer, contextIndices);
      });
    }
    if (element) prevHeight.current = element.offsetHeight;
    prevDynamicHeight.current = isDynamicHeightEnabled;
  }, [
    isDynamicHeightEnabled,
    id,
    value,
    adjustComponentPositions,
    currentLayout,
    height,
    width,
    isContainer,
    componentCount,
    visibility,
    skipAdjustment,
    subContainerIndex,
    contextPath,
  ]);

  return;
};
