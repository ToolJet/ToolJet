import { useEffect, useRef } from 'react';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { getDynamicElementSelector, normalizeLayoutContext } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
import { isTruthyOrZero } from '@/_helpers/appUtils';
import useStore from '@/AppBuilder/_stores/store';

export const useDynamicHeight = ({
  isDynamicHeightEnabled,
  id,
  height,
  value,
  currentLayout,
  width,
  isContainer = false,
  componentCount = 0,
  visibility,
  skipAdjustment = false,
  subContainerIndex,
  isRowSubcontainer = false,
}) => {
  const { contextPath } = useSubcontainerContext();
  const prevDynamicHeight = useRef(isDynamicHeightEnabled);
  const prevHeight = useRef(height);

  useEffect(() => {
    // Build contextIndices from contextPath + subContainerIndex. The two
    // inputs mean different things depending on who is calling:
    //
    //  - Leaf widgets (TextArea, CodeEditor, etc.) inside a listview row:
    //    their WidgetWrapper is rendered INSIDE the row's
    //    SubcontainerContext.Provider, so `contextPath` ALREADY includes the
    //    row. They also receive `subContainerIndex=rowIdx` as a prop, which
    //    duplicates the path's last entry — use contextPath only.
    //
    //  - ListviewSubcontainer's own hook call: the component itself is
    //    rendered OUTSIDE its own Provider (the Provider wraps its children).
    //    `contextPath` reflects the PARENT row (or is empty at root), and
    //    `subContainerIndex=rowIdx` is this row's index, NOT yet in the
    //    path. Append to cover nested listviews: outer row's context +
    //    inner row's index must both land in the key.
    //    Callers that need this behavior pass `isRowSubcontainer: true`.
    //
    //  - ModalV2 pre-merges contextPath + row into an array and passes it as
    //    `subContainerIndex` — trust the array and use it as-is.
    const pathIndices = contextPath.map((segment) => segment.index);
    let indices;
    if (Array.isArray(subContainerIndex)) {
      indices = subContainerIndex;
    } else if (isRowSubcontainer && isTruthyOrZero(subContainerIndex)) {
      indices = [...pathIndices, subContainerIndex];
    } else if (pathIndices.length > 0) {
      indices = pathIndices;
    } else if (isTruthyOrZero(subContainerIndex)) {
      indices = [subContainerIndex];
    } else {
      indices = [];
    }
    const contextIndices = normalizeLayoutContext(indices);
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
      useStore.getState().scheduleReflow(id, currentLayout, isContainer, contextIndices);
    } else if (!isDynamicHeightEnabled && prevDynamicHeight.current) {
      if (element) element.style.height = `${height}px`;
      // Container toggled off: drop the container's own inflated temp so
      // WidgetWrapper reads canonical height this render. Descendants
      // keep their own temps — their grown state (e.g., a TextArea's
      // typed content) is still accurate and self-managed by each
      // widget's own useDynamicHeight hook.
      //
      // Skipped for `isRowSubcontainer` callers: Listview's per-row hook
      // would otherwise re-clear on every row. The Listview widget file
      // owns the clear at the widget level instead.
      if (isContainer && !isRowSubcontainer) {
        const clearContainerTempLayouts = useStore.getState().clearContainerTempLayouts;
        clearContainerTempLayouts?.(id, contextIndices);
      }
      useStore.getState().scheduleReflow(id, currentLayout, isContainer, contextIndices);
    }
    if (element) prevHeight.current = element.offsetHeight;
    prevDynamicHeight.current = isDynamicHeightEnabled;
  }, [
    isDynamicHeightEnabled,
    id,
    value,
    currentLayout,
    height,
    width,
    isContainer,
    componentCount,
    visibility,
    skipAdjustment,
    subContainerIndex,
    isRowSubcontainer,
    contextPath,
  ]);

  return;
};
