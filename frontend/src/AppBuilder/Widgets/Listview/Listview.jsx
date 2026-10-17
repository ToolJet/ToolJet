import React, { useRef, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useExposedValueBatch } from '@/AppBuilder/_hooks/useExposedValueBatch';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
// import { SubContainer } from '../SubContainer';
import { Pagination } from '@/_components/Pagination';
import _ from 'lodash';
import './listview.scss';
import { sameValue } from '@/AppBuilder/_engines/data/equality';
import { useWindow } from '@/AppBuilder/_engines/rendering/useWindow';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { ListviewSubcontainer } from './ListviewSubcontainer';
import cx from 'classnames';
import Spinner from '@/_ui/Spinner';
import { assignSlots, NO_SLOTS } from './rowSlots';
import { isEditable } from '@/AppBuilder/AppCanvas/interaction/dom';

// A ListView rendering more widgets than this (rows × child components) renders only the rows in view (and rows the
// user has touched), in slots: see rowSlots.js. Smaller lists render every row, as before.
const WINDOWED_WIDGETS = 2000;
// Lines of rows rendered beyond each edge of the view.
const OVERSCAN_LINES = 3;
// Rows new to the view mount within about this much time per frame (nearest the view first).
const MOUNT_BUDGET_MS = 8;
const NO_SCROLL_ELEMENT = { current: null };
// Rows the user only clicked stay rendered, at most this many (the longest untouched since is let go first). Rows with
// a field the user touched stay for good: a row that unmounts re-exposes its defaults when it mounts again.
const MAX_PINNED_ROWS = 50;
const lineKey = (line) => line;

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
  const initExposedValueArrayForChildren = useStore((state) => state.initExposedValueArrayForChildren, shallow);
  const setListviewSlots = useStore((state) => state.setListviewSlots, shallow);
  const clearListviewSlots = useStore((state) => state.clearListviewSlots, shallow);
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
      clearContainerTempLayouts?.(id, parentIndices, moduleId);
    }
    prevDynamicRef.current = isDynamicHeightEnabled;
  }, [isDynamicHeightEnabled, id, parentIndices, clearContainerTempLayouts, moduleId]);

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

  // A long list renders only the lines of rows in view (in list mode a line is one row), plus the rows the user has
  // touched (pinned: they stay mounted, so what was typed or picked in them stays), each in a slot (rowSlots.js).
  // Not with dynamic height (the rows set the list's height) or inside another ListView's row.
  const rowCount = filteredData.length;
  const lineHeight = Number(rowHeight);
  const windowed =
    !isDynamicHeightEnabled &&
    parentIndices.length === 0 &&
    lineHeight > 0 &&
    rowCount * Math.max(1, childComponentCount) > WINDOWED_WIDGETS;
  const lineColumns = mode === 'grid' ? Math.max(1, positiveColumns) : 1;
  const rowsRef = useRef(null);
  const rowWindow = useWindow({
    count: windowed ? Math.ceil(rowCount / lineColumns) : 0,
    scrollRef: windowed ? parentRef : NO_SCROLL_ELEMENT,
    listRef: rowsRef,
    estimateSize: windowed ? lineHeight : 1,
    getItemKey: lineKey,
    overscan: windowed ? OVERSCAN_LINES * lineHeight : 0,
    mountBudgetMs: MOUNT_BUDGET_MS,
  });
  const pinnedRows = useRef(new Set());
  const editedRows = useRef(new Set());
  const pinRow = useCallback((row, target) => {
    if (editedRows.current.has(row)) return;
    const pinned = pinnedRows.current;
    pinned.delete(row);
    if (isEditable(target)) {
      editedRows.current.add(row);
      return;
    }
    pinned.add(row);
    if (pinned.size > MAX_PINNED_ROWS) pinned.delete(pinned.values().next().value);
  }, []);
  const slotState = useRef(NO_SLOTS);
  const pendingSlots = useRef(null);
  const prevWindowedRef = useRef(false);
  const windowedChanged = windowed !== prevWindowedRef.current;
  useEffect(() => () => clearListviewSlots(id, moduleId), [id, moduleId, clearListviewSlots]);

  if (windowed) {
    const rows = [];
    for (const item of rowWindow.items) {
      for (let column = 0; column < lineColumns; column++) {
        const row = item.index * lineColumns + column;
        if (row < rowCount) rows.push(row);
      }
    }
    const inView = new Set(rows);
    for (const kept of [editedRows.current, pinnedRows.current]) {
      for (const row of kept) {
        if (row >= rowCount) kept.delete(row);
        else if (!inView.has(row)) rows.push(row);
      }
    }
    const assigned = assignSlots(slotState.current, rows);
    if (
      assigned.changed ||
      windowedChanged ||
      !sameValue(filteredData, prevFilteredDataRef.current) ||
      childComponentCount !== prevChildComponentCount.current
    ) {
      slotState.current = { slots: assigned.slots, items: assigned.items };
      prevFilteredDataRef.current = filteredData;
      prevChildComponentCount.current = childComponentCount;
      prevWindowedRef.current = true;
      // The store sees a ListView of as many rows as there are slots, each slot with its row's listItem. Written after
      // this render (below), not during it.
      pendingSlots.current = {
        slots: Object.freeze(assigned.slots.slice()),
        // Entering windowed mode, every slot: the children's per-row values are still indexed by data row.
        reset: windowedChanged ? assigned.slots.map((_row, slot) => slot) : assigned.reset,
        slotItems: assigned.items.map((row) => ({ listItem: filteredData[Math.min(row, rowCount - 1)] })),
        rowCount,
      };
    }
  } else if (windowedChanged) {
    pendingSlots.current = { clear: true };
    slotState.current = NO_SLOTS;
    pinnedRows.current.clear();
    editedRows.current.clear();
    prevWindowedRef.current = false;
  }

  // The slots this render assigned, into the store before paint (their rows' widgets re-render with them).
  useLayoutEffect(() => {
    const write = pendingSlots.current;
    pendingSlots.current = null;
    // Leaving windowed mode: the children's per-row values were indexed by slot.
    if (write?.clear) {
      clearListviewSlots(id, moduleId, true);
      return;
    }
    if (!write) {
      // Remounted (StrictMode, Activity): the unmount cleanup cleared the store's slots.
      if (windowed && !useStore.getState().resolvedStore.modules[moduleId]?.listviewSlots?.[id]) {
        setListviewSlots(id, Object.freeze(slotState.current.slots.slice()), [], moduleId);
      }
      return;
    }
    setListviewSlots(id, write.slots, write.reset, moduleId);
    if (write.slotItems.length > 0) updateCustomResolvables(id, write.slotItems, 'listItem', moduleId, parentIndices);
    initExposedValueArrayForChildren(id, write.slotItems.length, moduleId, parentIndices, write.rowCount);
  });

  // Check if the previous filtered data is different from the current filtered data
  if (
    !windowed &&
    (windowedChanged ||
      !sameValue(filteredData, prevFilteredDataRef.current) ||
      childComponentCount !== prevChildComponentCount.current ||
      parentIndicesChanged)
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
    // Update the customResolvables with the new listItems
    if (listItems.length > 0) {
      updateCustomResolvables(id, listItems, 'listItem', moduleId, parentIndices);
    }
    // Size children's per-row exposed values to the row count. Runs for an empty list too:
    // it is what prunes the removed rows from this Listview's children/data.
    initExposedValueArrayForChildren(id, filteredData.length, moduleId, parentIndices);
  }

  const renderedRowCount = windowed ? slotState.current.slots.length : filteredData.length;

  useExposedValueBatch(renderedRowCount);

  return (
    <div
      data-disabled={disabledState}
      className={cx(`flex-column w-100 position-relative dynamic-${id} listview-scroll-container`, {
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
          {windowed ? (
            <div
              ref={rowsRef}
              className={`row w-100 m-0 ${enablePagination && 'pagination-margin-bottom-last-child'} p-0`}
              style={{ position: 'relative', height: rowWindow.height, flex: 'none' }}
            >
              {slotState.current.slots.map((row, slot) =>
                row < 0 ? null : (
                  <ListviewSubcontainer
                    key={row}
                    id={id}
                    index={slot}
                    rowIndex={row}
                    placement={{
                      position: 'absolute',
                      top: rowWindow.itemTop(rowWindow.startOf(Math.floor(row / lineColumns))),
                      left: `${((row % lineColumns) * 100) / lineColumns}%`,
                    }}
                    onRowTouched={pinRow}
                    moduleId={moduleId}
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
                )
              )}
            </div>
          ) : (
            <div className={`row w-100 m-0 ${enablePagination && 'pagination-margin-bottom-last-child'} p-0`}>
              {filteredData.map((_listItem, index) => (
                <ListviewSubcontainer
                  key={index}
                  id={id}
                  index={index}
                  moduleId={moduleId}
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
          )}
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
