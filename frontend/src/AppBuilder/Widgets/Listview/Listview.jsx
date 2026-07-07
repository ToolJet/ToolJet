import React, { useRef, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useExposedValueBatch } from '@/AppBuilder/_hooks/useExposedValueBatch';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
// import { SubContainer } from '../SubContainer';
import { Pagination } from '@/_components/Pagination';
import _ from 'lodash';
import './listview.scss';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
// eslint-disable-next-line import/no-unresolved
import { useVirtualizer } from '@tanstack/react-virtual';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { ListviewSubcontainer } from './ListviewSubcontainer';
import cx from 'classnames';
import Spinner from '@/_ui/Spinner';

export const Listview = function Listview({
  id,
  width,
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariables,
  currentLayout,
  darkMode,
  dataCy,
  currentMode,
  subContainerIndex,
  componentType,
}) {
  const { moduleId } = useModuleContext();
  const { contextPath } = useSubcontainerContext();
  const parentIndices = useMemo(() => contextPath.map((s) => s.index), [contextPath]);
  const childComponentCount = useStore((state) => (state.containerChildrenMapping?.[id] || []).length);
  const updateCustomResolvables = useStore((state) => state.updateCustomResolvables, shallow);
  const updateCustomResolvablesLazy = useStore((state) => state.updateCustomResolvablesLazy, shallow);
  const ensureListviewRowsResolved = useStore((state) => state.ensureListviewRowsResolved, shallow);
  const initExposedValueArrayForChildren = useStore((state) => state.initExposedValueArrayForChildren, shallow);
  const fallbackProperties = { height: 100, showBorder: false, data: [] };
  const isWidgetInContainerDragging = useStore(
    (state) => state.containerChildrenMapping?.[id]?.includes(state?.draggingComponentId),
    shallow
  );
  const prevFilteredDataRef = useRef([]);
  const prevChildComponentCount = useRef(0);
  const prevParentIndicesRef = useRef([]);
  const combinedProperties = { ...fallbackProperties, ...properties };
  const {
    rowHeight,
    showBorder,
    rowsPerPage = 10,
    enablePagination = false,
    mode = 'list',
    columns = 1,
    dataSourceSelector,
    dynamicHeight,
    loadingState = false,
  } = combinedProperties;

  const data = dataSourceSelector === 'rawJson' ? combinedProperties?.data : dataSourceSelector;

  const { borderRadius, boxShadow } = styles;
  const visibility = combinedProperties.visibility ?? true;
  const disabledState = combinedProperties.disabledState ?? false;
  const backgroundColor =
    ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor;
  const borderColor = styles.borderColor ?? 'transparent';
  const rowPerPageValue = Number(rowsPerPage) ? +rowsPerPage || 10 : 10;
  const isDynamicHeightEnabled = dynamicHeight && currentMode === 'view';

  const computedStyles = {
    backgroundColor,
    border: '1px solid',
    borderColor,
    ...(isDynamicHeightEnabled && { minHeight: `${height}px` }),
    height: isDynamicHeightEnabled ? '100%' : enablePagination ? height - 54 : height,
    display: visibility ? 'flex' : 'none',
    borderRadius: borderRadius ?? 0,
    boxShadow,
    padding: '7px',
    overflowX: 'hidden',
    // Dynamic mode (view-only) hides the listview's own scroll to suppress
    // the one-frame flash while rows grow ahead of the parent reflow. Static
    // and edit modes keep the default auto-scroll.
    overflowY: isWidgetInContainerDragging || isDynamicHeightEnabled ? 'hidden' : 'auto',
  };

  const computeCanvasBackgroundColor = useMemo(() => {
    return {
      backgroundColor: computedStyles.backgroundColor,
      maxWidth: mode === 'grid' ? '100%' : undefined,
    };
  }, [computedStyles.backgroundColor, mode]);

  const [selectedRowIndex, setSelectedRowIndex] = useState(undefined);
  const [positiveColumns, setPositiveColumns] = useState(columns);
  const parentRef = useRef(null);
  // Disabled list blocks the mouse via `data-disabled`; `inert` also removes the row components from
  // the tab order (runtime only — keeps the builder editable).
  useDisableInert(parentRef, disabledState);

  // Dynamic-height toggle-off transition: drop this Listview's own inflated
  // temp (widget-level + per-row heights). Done once at the widget level so
  // it doesn't re-fire per row. Descendants (row template widgets) keep
  // their own temps — they stay at whatever layout they currently hold, and
  // the resolveContainerHeight gate on `dynamicHeight=false` stops row temps
  // from feeding back into the widget height.
  //
  // parentIndices scopes the clear: at root the listview's keys across all
  // row contexts are cleared; for a Listview nested inside a parent row,
  // only keys under that parent row context are cleared so sibling parent
  // rows stay untouched.
  const clearContainerTempLayouts = useStore((state) => state.clearContainerTempLayouts, shallow);
  const prevDynamicRef = useRef(isDynamicHeightEnabled);
  useEffect(() => {
    if (prevDynamicRef.current && !isDynamicHeightEnabled) {
      clearContainerTempLayouts?.(id, parentIndices);
    }
    prevDynamicRef.current = isDynamicHeightEnabled;
  }, [isDynamicHeightEnabled, id, parentIndices, clearContainerTempLayouts]);

  // children/data are now derived directly in the store by deriveListviewExposedData.
  // onRecordOrRowClicked reads from the store imperatively at click time.
  const onRecordOrRowClicked = useCallback(
    (index) => {
      setSelectedRowIndex(index);
      const state = useStore.getState();
      let lvExposed = state.resolvedStore.modules[moduleId]?.exposedValues?.components?.[id];
      // For nested ListView, navigate to current row's exposed values
      if (Array.isArray(lvExposed) && parentIndices.length > 0) {
        for (const idx of parentIndices) {
          lvExposed = lvExposed?.[idx];
          if (!lvExposed) break;
        }
      }
      const selectedRow = lvExposed?.children?.[index];
      setExposedVariables({
        selectedRecordId: index,
        selectedRecord: selectedRow,
        selectedRowId: index,
        selectedRow: selectedRow,
      });
      fireEvent('onRecordClicked');
      fireEvent('onRowClicked');
    },
    [id, moduleId, parentIndices, setExposedVariables, fireEvent]
  );

  useEffect(() => {
    if (columns < 1) {
      setPositiveColumns(1);
    } else setPositiveColumns(columns);
  }, [columns]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageChanged = (page) => {
    setCurrentPage(page);
  };
  const startIndexOfRowInThePage = currentPage === 1 ? 0 : currentPage * rowPerPageValue - rowPerPageValue;
  const endIndexOfRowInThePage = startIndexOfRowInThePage + rowPerPageValue;
  const filteredData = _.isArray(data)
    ? enablePagination
      ? data.slice(startIndexOfRowInThePage, endIndexOfRowInThePage)
      : data
    : [];

  // Check if parentIndices changed (component moved into/out of a ListView)
  const parentIndicesChanged =
    parentIndices.length !== prevParentIndicesRef.current.length ||
    parentIndices.some((val, idx) => val !== prevParentIndicesRef.current[idx]);

  // Lazy row-property resolution (top-level, virtualizable ListViews only —
  // same conditions as shouldVirtualize below, plus top-level since nested
  // lazy resolution isn't covered yet). Gates both which customResolvables
  // path is used just below AND the visible-range sync effect further down.
  // Matches shouldVirtualize's scope (including edit mode) — rendering
  // virtualization alone wouldn't help a large dataset tested in the
  // builder if property resolution still eagerly resolved every row.
  const canLazilyResolve = parentIndices.length === 0 && !isDynamicHeightEnabled && mode !== 'grid';

  // Check if the previous filtered data is different from the current filtered data
  if (
    Object.keys(diff(filteredData, prevFilteredDataRef.current)).length > 0 ||
    childComponentCount !== prevChildComponentCount.current ||
    parentIndicesChanged
  ) {
    prevFilteredDataRef.current = filteredData;
    prevParentIndicesRef.current = parentIndices;
    prevChildComponentCount.current = childComponentCount;

    // Adding listItem as key value pair to the customResolvables
    const listItems = filteredData.map((listItem) => {
      return {
        listItem,
      };
    });
    // Update the customResolvables with the new listItems. The lazy path
    // stores the data cheaply but skips the eager per-row property-
    // resolution cascade (updateCustomResolvables itself triggers that
    // cascade for ALL rows, unconditionally — the dominant cost at scale,
    // confirmed via profiler at 1000+ rows). Actual resolution is deferred
    // to ensureListviewRowsResolved, called below for the virtualizer's
    // visible+overscan range only. Nested/dynamic-height/grid/edit-mode
    // ListViews keep the original eager path unchanged.
    if (listItems.length > 0) {
      if (canLazilyResolve) {
        updateCustomResolvablesLazy(id, listItems, moduleId, parentIndices);
      } else {
        updateCustomResolvables(id, listItems, 'listItem', moduleId, parentIndices);
      }
      // Initialize exposed value arrays for children so per-row writes are correctly sized
      initExposedValueArrayForChildren(id, filteredData.length, moduleId, parentIndices);
    }
  }

  const renderedRowCount = filteredData.length;

  useExposedValueBatch(renderedRowCount);

  // Windowed rendering: only for fixed-height, single-column ListViews.
  // Dynamic height needs the row's real mounted DOM to measure (out of scope
  // for v1 — see Phase 4 doc); grid mode packs `positiveColumns` items per
  // visual row, which needs row-grouping rather than one-item-per-slot
  // virtualization. Runs in the builder's edit-mode canvas too — an earlier
  // version excluded edit mode on the (unverified) hypothesis that absolute
  // positioning might conflict with the grid/drag-and-drop measurement
  // system; re-enabled per explicit request. Watch for the "gaps between
  // rows on a fresh drop" symptom this exclusion was originally added to
  // fix — if it reappears, that hypothesis was likely correct and edit mode
  // needs the exclusion back (or a real fix to the grid-conflict itself).
  const shouldVirtualize = !isDynamicHeightEnabled && mode !== 'grid';
  const estimateSize = useCallback(() => rowHeight || 40, [rowHeight]);
  const getItemKey = useCallback((index) => index, []);

  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? filteredData.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize,
    getItemKey,
    overscan: 5,
  });

  // useExposedValueBatch(renderedRowCount) above only opens a batch when the
  // TOTAL row count increases — during virtualized scrolling the total count
  // never changes, only the visible window does, so every scroll-driven
  // row mount/unmount was writing unbatched (the exact "500-700 sequential
  // set() calls" freeze the batching doc describes, now happening on every
  // scroll tick instead of once at initial load). Key a second bracket on
  // the actual rendered range so it opens/closes around every such remount.
  const virtualItems = shouldVirtualize ? rowVirtualizer.getVirtualItems() : null;
  const virtualRangeKey = virtualItems?.length
    ? `${virtualItems[0].index}-${virtualItems[virtualItems.length - 1].index}-${virtualItems.length}`
    : null;

  // Keeps property resolution scoped to the visible+overscan window instead
  // of the whole dataset — this is the piece that actually fixes 10k+ row
  // scaling; batching (above) only fixed how the writes land, not how many
  // rows get resolved in the first place. Fires on mount and every
  // scroll-driven range change; a row once resolved is never re-resolved
  // (ensureListviewRowsResolved only grows the tracked set, never shrinks
  // it, since a row's underlying data doesn't change once written).
  // useLayoutEffect (not useEffect): a newly-revealed row's widgets read
  // resolved properties during THIS SAME render, before any effect runs —
  // triggering resolution in a plain useEffect (which fires after paint)
  // would let that first render commit and paint with stale/fallback data,
  // then flicker once resolution's resulting re-render lands. useLayoutEffect
  // still runs after commit, but before the browser paints, so the
  // corrective re-render replaces the wrong one before it's ever shown.
  useLayoutEffect(() => {
    if (!canLazilyResolve || virtualRangeKey === null) return;
    const indices = virtualItems.map((v) => v.index);
    ensureListviewRowsResolved(id, indices, moduleId, parentIndices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLazilyResolve, virtualRangeKey, id, moduleId, ensureListviewRowsResolved]);

  const startExposedValueBatch = useStore((state) => state.startExposedValueBatch);
  const flushExposedValueBatch = useStore((state) => state.flushExposedValueBatch);
  const isExposedValueBatching = useStore((state) => state.isExposedValueBatching);

  useLayoutEffect(() => {
    if (virtualRangeKey === null) return;
    startExposedValueBatch();
  }, [virtualRangeKey, startExposedValueBatch]);

  useEffect(() => {
    if (virtualRangeKey === null) return;
    flushExposedValueBatch();
  }, [virtualRangeKey, flushExposedValueBatch]);

  useEffect(() => {
    return () => {
      if (isExposedValueBatching()) flushExposedValueBatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rowContainerClassName = `row w-100 m-0 ${enablePagination && 'pagination-margin-bottom-last-child'} p-0`;

  const renderRows = () => {
    if (!shouldVirtualize) {
      return (
        <div className={rowContainerClassName}>
          {filteredData.map((_listItem, index) => (
            <ListviewSubcontainer
              key={index}
              id={id}
              index={index}
              mode={mode}
              rowHeight={rowHeight}
              positiveColumns={positiveColumns}
              showBorder={showBorder}
              onRecordOrRowClicked={onRecordOrRowClicked}
              computeCanvasBackgroundColor={computeCanvasBackgroundColor}
              darkMode={darkMode}
              width={width}
              isDynamicHeightEnabled={isDynamicHeightEnabled}
              data={data}
              currentLayout={currentLayout}
              visibility={visibility}
              parentHeight={height}
              dataCy={dataCy}
              componentType={componentType}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        className={rowContainerClassName}
        // flexShrink: 0 — parentRef is `display: flex; flex-direction: column`
        // (`flex-column` class), and this div is one of its flex items. Flex
        // items default to flex-shrink: 1, so without this, the flex
        // algorithm shrinks this div's explicit height down to whatever
        // space is left in the (much shorter) viewport, regardless of the
        // real virtualized total — the absolutely-positioned rows inside
        // still use their true offsets and overflow past the shrunk box, so
        // the scrollable range only ever grows to "as far as you've already
        // scrolled," never the real end. This is why the scrollbar could
        // never represent (or reach) the true bottom of a large ListView.
        style={{ position: 'relative', height: `${rowVirtualizer.getTotalSize()}px`, flexShrink: 0 }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <ListviewSubcontainer
            key={virtualRow.key}
            id={id}
            index={virtualRow.index}
            mode={mode}
            rowHeight={rowHeight}
            positiveColumns={positiveColumns}
            showBorder={showBorder}
            onRecordOrRowClicked={onRecordOrRowClicked}
            computeCanvasBackgroundColor={computeCanvasBackgroundColor}
            darkMode={darkMode}
            width={width}
            isDynamicHeightEnabled={isDynamicHeightEnabled}
            data={data}
            currentLayout={currentLayout}
            visibility={visibility}
            parentHeight={height}
            dataCy={dataCy}
            componentType={componentType}
            virtualTop={virtualRow.start}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      data-disabled={disabledState}
      className={cx(`flex-column w-100 position-relative dynamic-${id}`, {
        'jet-container-loading': loadingState,
      })}
      id={id}
      ref={parentRef}
      style={computedStyles}
    >
      {loadingState ? (
        <Spinner />
      ) : (
        <>
          {renderRows()}
          {enablePagination && _.isArray(data) && (
            <div
              className={cx({ 'fixed-bottom position-fixed': !isDynamicHeightEnabled })}
              style={{
                border: '1px solid',
                borderColor,
                margin: '1px',
                borderTop: 0,
                ...(isDynamicHeightEnabled ? { marginTop: 'auto' } : { left: '1px', right: '1px' }),
              }}
            >
              <div style={{ backgroundColor }}>
                {data?.length > 0 ? (
                  <Pagination
                    darkMode={darkMode}
                    currentPage={currentPage}
                    pageChanged={pageChanged}
                    count={data?.length}
                    itemsPerPage={rowPerPageValue}
                  />
                ) : (
                  <div style={{ height: '61px' }}></div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
