import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useExposedValueBatch } from '@/AppBuilder/_hooks/useExposedValueBatch';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
// import { SubContainer } from '../SubContainer';
import { Pagination } from '@/_components/Pagination';
import _ from 'lodash';
import './listview.scss';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
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
  const deriveListviewExposedData = useStore((state) => state.deriveListviewExposedData, shallow);
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
    mode: rawMode = 'list',
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
  // A page size has to be a whole number of at least one: a negative runs the slice backwards and
  // returns nothing, and a fraction lands mid-record and hands neighbouring pages different sizes.
  const requestedRowsPerPage = Math.floor(Number(rowsPerPage));
  const rowPerPageValue = requestedRowsPerPage >= 1 ? requestedRowsPerPage : 10;
  // Two places compare this against their own lower-case literal, so a capitalised value would
  // match neither and the row and its canvas would pick different modes.
  const mode = String(rawMode ?? 'list').toLowerCase();
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

  useEffect(() => {
    if (columns < 1) {
      setPositiveColumns(1);
    } else setPositiveColumns(columns);
  }, [columns]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageChanged = (page) => {
    setCurrentPage(page);
  };
  // A delete or add must not lose the reader's place; only a page past the new end moves, to the last one.
  const prevRecordCount = useRef(_.isArray(data) ? data.length : 0);
  const recordCount = _.isArray(data) ? data.length : 0;
  if (prevRecordCount.current !== recordCount) {
    prevRecordCount.current = recordCount;
    const lastPage = Math.max(1, Math.ceil(recordCount / rowPerPageValue));
    if (currentPage > lastPage) setCurrentPage(lastPage);
    // A selection outlives its record otherwise, and a handler acts on a row the data no longer has.
    if (selectedRowIndex !== undefined && selectedRowIndex >= recordCount) {
      setSelectedRowIndex(undefined);
      setExposedVariables({
        selectedRecordId: undefined,
        selectedRecord: undefined,
        selectedRowId: undefined,
        selectedRow: undefined,
      });
    }
  }
  // A copy of the clicked item must not outlive a change to the records it came from (D-10).
  const prevDataRef = useRef(data);
  if (prevDataRef.current !== data) {
    const contentChanged = !_.isEqual(prevDataRef.current, data);
    prevDataRef.current = data;
    if (contentChanged) setExposedVariables({ selectedListItem: undefined });
  }
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

  // Check if the previous filtered data is different from the current filtered data
  if (
    Object.keys(diff(filteredData, prevFilteredDataRef.current)).length > 0 ||
    childComponentCount !== prevChildComponentCount.current ||
    parentIndicesChanged
  ) {
    const childrenChanged = childComponentCount !== prevChildComponentCount.current;
    prevFilteredDataRef.current = filteredData;
    prevParentIndicesRef.current = parentIndices;
    prevChildComponentCount.current = childComponentCount;

    // A child leaving writes nothing, so only an explicit re-derive drops it from the published rows.
    if (childrenChanged) {
      filteredData.forEach((_row, rowIndex) => deriveListviewExposedData(id, rowIndex, parentIndices, moduleId));
    }

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
    // Runs even at zero rows: this is the call that drops rows the data no longer has.
    initExposedValueArrayForChildren(id, filteredData.length, moduleId, parentIndices);
  }

  const onRecordOrRowClicked = useCallback(
    (index) => {
      // Position in the whole data, so the shrink check below works on every page.
      setSelectedRowIndex(startIndexOfRowInThePage + index);
      // The clicked child's own write is still queued; read after it lands or selectedRecord is stale.
      useStore.getState().flushPendingPerRowWrites?.();
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
        // The data item itself: selectedRecordId is page-relative, so it cannot find it past page one.
        selectedListItem: filteredData[index],
      });
      // Every row event carries its record, so a handler on the list itself can read {{listItem}}.
      const fireRowEvent = (name) =>
        fireEvent(name, {
          customVariables: { listItem: filteredData[index] },
          sourceSubContainerIndex: [...parentIndices, index],
        });
      fireRowEvent('onRecordClicked');
      fireRowEvent('onRowClicked');
    },
    [id, moduleId, parentIndices, setExposedVariables, fireEvent, filteredData, startIndexOfRowInThePage]
  );

  const renderedRowCount = filteredData.length;

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
          <div role="list" className={`row w-100 m-0 ${enablePagination && 'pagination-margin-bottom-last-child'} p-0`}>
            {filteredData.map((_listItem, index) => (
              <ListviewSubcontainer
                // Keyed by record: a page-local key makes React reuse row 0's children on every page.
                key={startIndexOfRowInThePage + index}
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
