import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
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

export const Listview = function Listview({
  id,
  width,
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariables,
  adjustComponentPositions,
  currentLayout,
  darkMode,
  dataCy,
  currentMode,
  subContainerIndex,
}) {
  const { moduleId } = useModuleContext();
  const { contextPath } = useSubcontainerContext();
  const parentIndices = useMemo(() => contextPath.map((s) => s.index), [contextPath]);
  const childComponentCount = useStore((state) => (state.containerChildrenMapping?.[id] || []).length);
  const updateCustomResolvables = useStore((state) => state.updateCustomResolvables, shallow);
  const initExposedValueArrayForChildren = useStore((state) => state.initExposedValueArrayForChildren, shallow);
  const fallbackProperties = { height: 100, showBorder: false, data: [] };
  const fallbackStyles = { visibility: true, disabledState: false };
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
  } = combinedProperties;

  const data = dataSourceSelector === 'rawJson' ? combinedProperties?.data : dataSourceSelector;

  const { visibility, disabledState, borderRadius, boxShadow } = { ...fallbackStyles, ...styles };
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
    overflowY: isWidgetInContainerDragging ? 'hidden' : 'auto',
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
    // Update the customResolvables with the new listItems
    if (listItems.length > 0) {
      updateCustomResolvables(id, listItems, 'listItem', moduleId, parentIndices);
      // Initialize exposed value arrays for children so per-row writes are correctly sized
      initExposedValueArrayForChildren(id, filteredData.length, moduleId, parentIndices);
    }
  }
  return (
    <div
      data-disabled={disabledState}
      className={cx(`flex-column w-100 position-relative dynamic-${id}`)}
      id={id}
      ref={parentRef}
      style={computedStyles}
    >
      <div
        className={`row w-100 m-0 ${enablePagination && 'pagination-margin-bottom-last-child'} p-0 ${isDynamicHeightEnabled ? 'flex-grow-1' : ''
          }`}
      >
        {filteredData.map((listItem, index) => (
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
            adjustComponentPositions={adjustComponentPositions}
            data={data}
            currentLayout={currentLayout}
            visibility={visibility}
            parentHeight={height}
            dataCy={dataCy}
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
            ...(isDynamicHeightEnabled ? {} : { left: '1px', right: '1px' }),
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
    </div>
  );
};
