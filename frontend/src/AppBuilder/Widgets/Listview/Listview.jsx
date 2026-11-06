import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { useExposedValueBatch } from '@/AppBuilder/_hooks/useExposedValueBatch';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
// import { SubContainer } from '../SubContainer';
import { Pager } from '@/AppBuilder/Shared/Pager/Pager';
import { getWidthRule } from '@/AppBuilder/Shared/Pager/pagerUtils';
import _ from 'lodash';
import './listview.scss';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import SubcontainerContext, { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { ListviewSubcontainer } from './ListviewSubcontainer';
import { ListviewEmptyState } from './ListviewEmptyState';
import { isNeverDisabled, isRecordDisabled } from './disabledRecords';
import { hasComponentInRecords, isMovingInListview, isSelectedInListview } from './isMovingInListview';
import { HorizontalSlot } from '@/AppBuilder/Widgets/Form/Components/HorizontalSlot';
import { useActiveSlot } from '@/AppBuilder/_hooks/useActiveSlot';
import { useSubContainerResizable } from '@/AppBuilder/_hooks/useSubContainerResizable';
import cx from 'classnames';
import Spinner from '@/_ui/Spinner';
import {
  DIVIDER_WIDTH,
  HEADER_HEIGHT,
  HEADER_DIVIDER_HEIGHT,
  PAGER_FOOTER_HEIGHT,
  LEGACY_PADDING,
  NEW_STYLE_PADDING,
  getListStyle,
  getListviewMode,
  getRowsPerPage,
  getRecordGap,
  getRecordHeight,
  getRecordBorderInset,
  getRecordCanvasWidth,
} from './listStyleLayout';

const HOVER_THROTTLE_MS = 200;
const NO_RECORDS = [];
const RECORD_MIN_HEIGHT = 10;
const DEFAULT_RECORD_HEIGHT = 100;

// The click that ends a drag goes to the nearest common ancestor of the press and the release, which is rarely the handle.
function swallowNextClick() {
  let timer;
  const stop = (event) => {
    event.stopPropagation();
    remove();
  };
  function remove() {
    clearTimeout(timer);
    window.removeEventListener('click', stop, true);
    window.removeEventListener('mousedown', remove, true);
  }
  window.addEventListener('click', stop, true);
  window.addEventListener('mousedown', remove, true);
  timer = setTimeout(remove, 500);
}

export const Listview = function Listview({
  id,
  width,
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  currentLayout,
  darkMode,
  dataCy,
  currentMode,
  subContainerIndex,
  componentType,
}) {
  const { moduleId } = useModuleContext();
  const {
    contextPath,
    listviewCopy: insideCopy = false,
    listviewCopyOutline: insideCopyOutline,
  } = useSubcontainerContext();
  // The header is not row-scoped (same path as the ListView), but its Text and Button follow the record overflow rule.
  const headerContext = useMemo(
    () => ({ contextPath, inListviewRecord: true, listviewCopy: insideCopy, listviewCopyOutline: insideCopyOutline }),
    [contextPath, insideCopy, insideCopyOutline]
  );
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
    serverSidePagination = false,
    totalRecords,
    mode: rawMode = 'list',
    columns = 1,
    dataSourceSelector,
    dynamicHeight,
    loadingState: loadingStateProperty = false,
    gridRecordHeight,
    showHeader = false,
  } = combinedProperties;

  const data = dataSourceSelector === 'rawJson' ? combinedProperties?.data : dataSourceSelector;

  const {
    borderRadius,
    boxShadow,
    listStyle,
    gap,
    recordBackgroundColor,
    recordBorderColor,
    recordDividerColor,
    recordBorderRadius,
    recordBoxShadow,
    headerBackgroundColor,
    headerDividerColor,
  } = styles;
  const recordStyle = getListStyle(listStyle);
  const isLegacy = recordStyle === 'legacy';
  const isBordered = recordStyle === 'bordered';
  const recordGap = getRecordGap(recordStyle, gap);
  const visibilityProperty = combinedProperties.visibility ?? true;
  const disabledProperty = combinedProperties.disabledState ?? false;
  // Action state starts from the property and is replaced by either: the newest change wins.
  const [visibility, setVisibilityState] = useState(visibilityProperty);
  const [disabledState, setDisabledState] = useState(disabledProperty);
  const [loadingState, setLoadingState] = useState(loadingStateProperty);
  useBatchedUpdateEffectArray([
    {
      dep: visibilityProperty,
      sideEffect: () => {
        setVisibilityState(visibilityProperty);
        setExposedVariable('isVisible', visibilityProperty);
      },
    },
    {
      dep: disabledProperty,
      sideEffect: () => {
        setDisabledState(disabledProperty);
        setExposedVariable('isDisabled', disabledProperty);
      },
    },
    {
      dep: loadingStateProperty,
      sideEffect: () => {
        setLoadingState(loadingStateProperty);
        setExposedVariable('isLoading', loadingStateProperty);
      },
    },
  ]);
  const backgroundColor =
    ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor;
  const borderColor = styles.borderColor ?? 'transparent';
  const rowPerPageValue = getRowsPerPage(rowsPerPage);
  // Two places compare this against their own lower-case literal, so a capitalised value would
  // match neither and the row and its canvas would pick different modes.
  const mode = getListviewMode(rawMode);
  const isDynamicHeightEnabled = dynamicHeight && currentMode === 'view';
  const recordHeight = getRecordHeight(mode, rowHeight, gridRecordHeight);
  const containerPadding = isLegacy ? LEGACY_PADDING : NEW_STYLE_PADDING;
  const activeSlot = useActiveSlot(id);

  const computedStyles = {
    backgroundColor,
    border: '1px solid',
    borderColor,
    ...(isDynamicHeightEnabled && { minHeight: `${height}px` }),
    height: isDynamicHeightEnabled ? '100%' : height,
    display: visibility ? 'flex' : 'none',
    // The Number input saves a plain string such as "6", which CSS needs as a number.
    borderRadius: Math.max(0, Number.parseFloat(borderRadius) || 0),
    boxShadow,
    // One shorthand: a conditional paddingTop key leaves padding-top cleared after showHeader turns off.
    padding: showHeader ? `0 ${containerPadding}px ${containerPadding}px` : `${containerPadding}px`,
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
  const [mainRecordHovered, setMainRecordHovered] = useState(false);
  const [isResizingRecord, setIsResizingRecord] = useState(false);
  const [resizePreviewHeight, setResizePreviewHeight] = useState(null);
  const isBuilder = currentMode === 'edit';
  // These selectors run on every store change, and only the editable record reads them.
  const isEditableInstance = isBuilder && !insideCopy;
  const isMovingInside = useStore((state) => isEditableInstance && isMovingInListview(state, id, moduleId));
  const isSelectedInside = useStore((state) => isEditableInstance && isSelectedInListview(state, id, moduleId));
  const isVersionFrozen = useStore((state) => isEditableInstance && state.getShouldFreeze());
  const [positiveColumns, setPositiveColumns] = useState(columns);
  const recordHeightKey = mode === 'grid' ? 'gridRecordHeight' : 'rowHeight';
  // The saved text, not the resolved value: a number and an expression that resolves to one look alike.
  const isDynamicRecordHeight = useStore((state) => {
    if (!isEditableInstance) return false;
    const saved = state.getComponentDefinition(id, moduleId)?.component?.definition?.properties;
    const value = (
      recordHeightKey === 'gridRecordHeight' ? (saved?.gridRecordHeight ?? saved?.rowHeight) : saved?.rowHeight
    )?.value;
    return typeof value === 'string' && value.includes('{{');
  });
  const setComponentProperty = useStore((state) => state.setComponentProperty, shallow);
  const setIsListviewRecordResizing = useStore((state) => state.setIsListviewRecordResizing, shallow);
  const recordHeightPx = Number.parseFloat(recordHeight) || DEFAULT_RECORD_HEIGHT;
  const { rootRef: mainRecordRef, getHandleProps: getRecordResizeHandleProps } = useSubContainerResizable({
    lockHorizontal: true,
    minHeight: RECORD_MIN_HEIGHT,
    maxHeight: Infinity,
    floorAtStart: true,
    stepHeight: 10,
    // Not clientHeight: a Container record's border sits inside it and would shift every step by 2.
    getStartHeight: () => recordHeightPx,
    onDragStart: () => setIsResizingRecord(true),
    onResize: ({ newHeight }) => setResizePreviewHeight(newHeight),
    onDragEnd: ({ snappedHeight }) => {
      setIsResizingRecord(false);
      setResizePreviewHeight(null);
      swallowNextClick();
      if (snappedHeight === recordHeightPx) return;
      setComponentProperty(id, recordHeightKey, snappedHeight, 'properties', 'value', false, moduleId);
    },
  });
  useEffect(() => {
    if (!isResizingRecord) return undefined;
    document.body.classList.add('listview-record-resizing');
    setIsListviewRecordResizing(true);
    return () => {
      document.body.classList.remove('listview-record-resizing');
      setIsListviewRecordResizing(false);
      // A live resize moves the record from under the pointer, so its mouseleave may never fire.
      setMainRecordHovered(!!mainRecordRef.current?.matches(':hover'));
    };
  }, [isResizingRecord, setIsListviewRecordResizing]);

  const recordBoxStyle = useMemo(() => {
    if (recordStyle === 'bordered') return { backgroundColor: recordBackgroundColor };
    if (recordStyle !== 'container') return null;
    return {
      backgroundColor: recordBackgroundColor,
      border: `1px solid ${recordBorderColor ?? 'var(--cc-weak-border)'}`,
      borderRadius: Math.max(0, Number.parseFloat(recordBorderRadius) || 0),
      ...(recordBoxShadow && { boxShadow: recordBoxShadow }),
    };
  }, [recordStyle, recordBackgroundColor, recordBorderColor, recordBorderRadius, recordBoxShadow]);
  const recordsPerLine = mode === 'grid' ? positiveColumns : 1;
  // A CSS grid keeps columns and the dividers between them exact; Legacy keeps its percentage widths.
  const isGridLayout = !isLegacy && mode === 'grid';
  // Half the gap on each side of a divider puts the line in the middle of the gap.
  const gapAroundRecord = isBordered ? recordGap / 2 : recordGap;
  const recordListStyle = isLegacy
    ? undefined
    : {
        rowGap: gapAroundRecord,
        ...(isGridLayout && {
          display: 'grid',
          columnGap: gapAroundRecord,
          gridTemplateColumns: isBordered
            ? Array(positiveColumns).fill('minmax(0, 1fr)').join(' 0px ')
            : `repeat(${positiveColumns}, minmax(0, 1fr))`,
        }),
      };
  const recordBorderInset = getRecordBorderInset(recordStyle);
  const recordCanvasWidth = getRecordCanvasWidth({ listStyle: recordStyle, width, gap, recordsPerLine });
  const dividerColor = recordDividerColor ?? 'var(--cc-weak-border)';
  const columnDividerStyle = {
    width: DIVIDER_WIDTH,
    // The 0px track and Bootstrap's `.row > * { max-width: 100% }` would clamp the line to 0.
    minWidth: DIVIDER_WIDTH,
    maxWidth: 'none',
    marginRight: -DIVIDER_WIDTH,
    padding: 0,
    backgroundColor: dividerColor,
  };
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
  // Like Table: only the pager fires On page change, not setPage and not a clamp the list makes itself.
  const pagerClicked = useRef(false);
  const pagerPageChanged = (page) => {
    if (page !== currentPageRef.current) pagerClicked.current = true;
    setCurrentPage(page);
  };
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;
  const lastPageRef = useRef(1);
  const isServerSide = enablePagination && !!serverSidePagination;
  const dataLength = _.isArray(data) ? data.length : 0;
  // Store validation turns an empty, text or undefined Total records into 0, so 0 is "no count yet".
  const totalCount = Math.ceil(Number(totalRecords));
  const hasValidTotal = Number.isFinite(totalCount) && totalCount > 0;
  // Without a count (a bound query is running) the current page must stay reachable, not be clamped away.
  const serverFallbackCount = Math.max(dataLength, (currentPage - 1) * rowPerPageValue + 1);
  const pagerCount = !isServerSide ? dataLength : hasValidTotal ? totalCount : serverFallbackCount;
  // Same formula as the shared Pagination, which "fixes" a page count it disagrees with as a user page change.
  const showPager = isServerSide ? hasValidTotal || dataLength > 0 || currentPage > 1 : dataLength > 0;
  const lastPage = enablePagination ? Math.max(1, Math.floor((pagerCount - 1) / rowPerPageValue) + 1) : 1;
  lastPageRef.current = lastPage;
  // The list owns the clamp (data, Total records, rowsPerPage or pagination changed) so the pager never reports one.
  if (currentPage > lastPage) setCurrentPage(lastPage);
  const fireEventRef = useRef(fireEvent);
  fireEventRef.current = fireEvent;

  useEffect(() => {
    setExposedVariable('pageIndex', currentPage);
    if (pagerClicked.current) fireEventRef.current('onPageChanged');
    pagerClicked.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    setExposedVariables({
      isVisible: visibility,
      isDisabled: disabledState,
      isLoading: loadingState,
      setVisibility: async (value) => {
        setVisibilityState(!!value);
        setExposedVariable('isVisible', !!value);
      },
      setDisable: async (value) => {
        setDisabledState(!!value);
        setExposedVariable('isDisabled', !!value);
      },
      setLoading: async (value) => {
        setLoadingState(!!value);
        setExposedVariable('isLoading', !!value);
      },
      setPage: async (pageNo) => {
        const requested = Math.floor(Number(pageNo));
        if (Number.isNaN(requested)) return;
        setCurrentPage(Math.min(Math.max(requested, 1), lastPageRef.current));
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const prevDataRef = useRef(data);
  const prevIsServerSideRef = useRef(isServerSide);
  // Rows have no id, so a client side selection stays while its position holds an equal record; a server page or a Type switch changes what the index means.
  const recordAt = (records) => (_.isArray(records) ? records[selectedRowIndex] : undefined);
  const dataChanged = prevDataRef.current !== data;
  const selectionLost =
    selectedRowIndex !== undefined &&
    (prevIsServerSideRef.current !== isServerSide ||
      (dataChanged && (isServerSide || !_.isEqual(recordAt(prevDataRef.current), recordAt(data)))));
  prevDataRef.current = data;
  prevIsServerSideRef.current = isServerSide;
  if (selectionLost) {
    setSelectedRowIndex(undefined);
    setExposedVariables({
      selectedRecordId: undefined,
      selectedRecord: undefined,
      selectedRowId: undefined,
      selectedRow: undefined,
      selectedRecordIndex: undefined,
    });
  }
  const startIndexOfRowInThePage = currentPage === 1 ? 0 : currentPage * rowPerPageValue - rowPerPageValue;
  const endIndexOfRowInThePage = startIndexOfRowInThePage + rowPerPageValue;
  // Stable between renders, so a hover re-render does not deep-diff the page again.
  const filteredData = useMemo(
    () =>
      _.isArray(data)
        ? enablePagination && !isServerSide
          ? data.slice(startIndexOfRowInThePage, endIndexOfRowInThePage)
          : data
        : NO_RECORDS,
    [data, enablePagination, isServerSide, startIndexOfRowInThePage, endIndexOfRowInThePage]
  );

  // Read as typed: the resolved property has no record, so `listItem` is resolved here once per record of the page.
  const disableRecordsExpression = useStore(
    (state) => state.getComponentDefinition(id, moduleId)?.component?.definition?.properties?.disableRecords?.value
  );
  const neverDisabled = isNeverDisabled(disableRecordsExpression);
  // Only what the expression can read: a hover or a selection leaves this value, and so the records, alone.
  const exposedValues = useStore((state) =>
    neverDisabled ? null : state.resolvedStore.modules[moduleId]?.exposedValues
  );
  const computedDisabledRecords = useMemo(
    () =>
      neverDisabled
        ? NO_RECORDS
        : filteredData.map((listItem) => isRecordDisabled(disableRecordsExpression, listItem, moduleId)),
    // exposedValues is not read inside, it is the signal that something the expression reads changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [neverDisabled, disableRecordsExpression, filteredData, exposedValues, moduleId]
  );
  const disabledRecordsRef = useRef(NO_RECORDS);
  const disabledRecords = _.isEqual(disabledRecordsRef.current, computedDisabledRecords)
    ? disabledRecordsRef.current
    : computedDisabledRecords;
  disabledRecordsRef.current = disabledRecords;
  // A disabled record 1 is no editable template, so nothing about it fades, frames or resizes.
  const hasMainRecord = isEditableInstance && startIndexOfRowInThePage === 0 && !disabledRecords[0];
  // No fade while resizing, whatever is hovered or selected.
  const fadeOthers = hasMainRecord && !isResizingRecord && (mainRecordHovered || isMovingInside || isSelectedInside);
  // No handle on an expression, so a drag can never overwrite it.
  const canResizeRecord = hasMainRecord && !isDynamicRecordHeight && !isVersionFrozen;
  // Client side: the first row of all the data, so the lock is the same on every page. Server side knows page 1 only.
  const needsFirstRowOfData = !neverDisabled && startIndexOfRowInThePage !== 0 && !isServerSide;
  const firstRowOfDataDisabled = useMemo(
    () =>
      needsFirstRowOfData &&
      _.isArray(data) &&
      data.length > 0 &&
      isRecordDisabled(disableRecordsExpression, data[0], moduleId),
    // exposedValues is the signal that something the expression reads changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [needsFirstRowOfData, data, disableRecordsExpression, exposedValues, moduleId]
  );
  const isTemplateLocked =
    isEditableInstance && (startIndexOfRowInThePage === 0 ? !!disabledRecords[0] : firstRowOfDataDisabled);
  const setListviewLocked = useStore((state) => state.setListviewLocked, shallow);
  // Published for the keys, the right panel and the sidebar, which only know component ids.
  useEffect(() => {
    if (!isTemplateLocked) return undefined;
    setListviewLocked(id, true, moduleId);
    // Once, when the lock starts: a selected child would otherwise stay editable by key.
    const state = useStore.getState();
    const kept = state.selectedComponents.filter(
      (componentId) => !hasComponentInRecords(state, [componentId], id, moduleId)
    );
    if (kept.length !== state.selectedComponents.length) state.setSelectedComponents(kept);
    return () => setListviewLocked(id, false, moduleId);
  }, [isTemplateLocked, id, moduleId, setListviewLocked]);
  // Record 1 can vanish under the pointer, and no mouseleave follows.
  useEffect(() => {
    if (!hasMainRecord || filteredData.length === 0) setMainRecordHovered(false);
  }, [hasMainRecord, filteredData.length]);

  // Moveable draws a component's border and resize handles outside the record, so reaching them must not end the hover.
  useEffect(() => {
    if (!hasMainRecord) return undefined;
    const controlsOfRecords = (node) => {
      const box = node?.closest?.('.moveable-control-box[target-id]');
      const targetId = box?.getAttribute('target-id');
      return targetId && hasComponentInRecords(useStore.getState(), [targetId], id, moduleId) ? box : null;
    };
    const onOver = (e) => {
      if (controlsOfRecords(e.target)) setMainRecordHovered(true);
    };
    // React has already re-entered record 1 when the pointer goes from the border into it.
    const inMainRecord = (node) => {
      for (let item = node?.closest?.('.list-item'); item; item = item.parentElement?.closest('.list-item')) {
        const canvas = item.querySelector('.real-canvas');
        if (canvas?.id === `canvas-${id}`) return canvas.getAttribute('data-listview-copy') !== 'true';
      }
      return false;
    };
    const onOut = (e) => {
      const box = controlsOfRecords(e.target);
      if (box && !box.contains(e.relatedTarget) && !inMainRecord(e.relatedTarget)) setMainRecordHovered(false);
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, [hasMainRecord, id, moduleId]);

  // Check if parentIndices changed (component moved into/out of a ListView)
  const parentIndicesChanged =
    parentIndices.length !== prevParentIndicesRef.current.length ||
    parentIndices.some((val, idx) => val !== prevParentIndicesRef.current[idx]);

  // Check if the previous filtered data is different from the current filtered data
  const filteredDataChanged =
    filteredData !== prevFilteredDataRef.current &&
    Object.keys(diff(filteredData, prevFilteredDataRef.current)).length > 0;
  if (filteredDataChanged || childComponentCount !== prevChildComponentCount.current || parentIndicesChanged) {
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
  } else {
    // Same content in a new array: remember it so the next render skips the deep diff.
    prevFilteredDataRef.current = filteredData;
  }

  // Callbacks read the current page through a ref so their identity does not change every render.
  const filteredDataRef = useRef(filteredData);
  filteredDataRef.current = filteredData;

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
        // Across all records, unlike the page-relative selectedRecordId.
        selectedRecordIndex: startIndexOfRowInThePage + index,
      });
      // Every row event carries its record, so a handler on the list itself can read {{listItem}}.
      const fireRowEvent = (name) =>
        fireEvent(name, {
          customVariables: { listItem: filteredDataRef.current[index] },
          sourceSubContainerIndex: [...parentIndices, index],
        });
      fireRowEvent('onRecordClicked');
      fireRowEvent('onRowClicked');
    },
    [id, moduleId, parentIndices, setExposedVariables, fireEvent, startIndexOfRowInThePage]
  );

  const hoverRecord = useMemo(
    () =>
      _.throttle(
        (index, listItem) =>
          fireEventRef.current('onRecordHovered', {
            customVariables: { listItem },
            sourceSubContainerIndex: [...parentIndices, index],
          }),
        HOVER_THROTTLE_MS,
        { leading: true, trailing: true }
      ),
    [parentIndices]
  );
  useEffect(() => () => hoverRecord.cancel(), [hoverRecord]);
  const onRecordHovered = useCallback((index) => hoverRecord(index, filteredDataRef.current[index]), [hoverRecord]);

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
          {showHeader && (
            // Sticky over scrolling records; widget background so records do not show through.
            <div
              className="listview-header-wrapper"
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                flexShrink: 0,
                marginLeft: -containerPadding,
                marginRight: -containerPadding,
                marginBottom: containerPadding,
                backgroundColor,
              }}
            >
              <SubcontainerContext.Provider value={headerContext}>
                <HorizontalSlot
                  slotName="header"
                  id={`${id}-header`}
                  height={HEADER_HEIGHT - HEADER_DIVIDER_HEIGHT}
                  width={width}
                  darkMode={darkMode}
                  isActive={activeSlot === `${id}-header`}
                  isResizable={false}
                  slotStyle={{
                    backgroundColor: headerBackgroundColor,
                    boxSizing: 'border-box',
                    height: HEADER_HEIGHT,
                    borderBottom: `1px solid ${headerDividerColor ?? 'var(--cc-weak-border)'}`,
                    overflow: 'hidden',
                  }}
                  componentType="Listview"
                  dataCy={dataCy}
                />
              </SubcontainerContext.Provider>
            </div>
          )}
          {filteredData.length === 0 ? (
            <ListviewEmptyState />
          ) : (
            <div role="list" className="row w-100 m-0 p-0" style={recordListStyle}>
              {filteredData.map((_listItem, index) => (
                // Keyed by record: a page-local key makes React reuse row 0's children on every page.
                <React.Fragment key={startIndexOfRowInThePage + index}>
                  <ListviewSubcontainer
                    id={id}
                    index={index}
                    moduleId={moduleId}
                    mode={mode}
                    rowHeight={resizePreviewHeight ?? recordHeight}
                    positiveColumns={positiveColumns}
                    showBorder={isLegacy && showBorder}
                    recordWidth={isGridLayout ? '100%' : `${100 / positiveColumns}%`}
                    recordBoxStyle={recordBoxStyle}
                    recordBorderInset={recordBorderInset}
                    onRecordOrRowClicked={onRecordOrRowClicked}
                    onRecordHovered={onRecordHovered}
                    computeCanvasBackgroundColor={computeCanvasBackgroundColor}
                    darkMode={darkMode}
                    width={recordCanvasWidth}
                    isDynamicHeightEnabled={isDynamicHeightEnabled}
                    data={data}
                    currentLayout={currentLayout}
                    visibility={visibility}
                    parentHeight={height}
                    dataCy={dataCy}
                    componentType={componentType}
                    recordOffset={startIndexOfRowInThePage}
                    isBuilder={isBuilder}
                    isFaded={fadeOthers && index > 0}
                    isDisabled={!!disabledRecords[index]}
                    isListDisabled={!!disabledState}
                    recordRef={index === 0 && canResizeRecord ? mainRecordRef : undefined}
                    resizeHandleProps={index === 0 && canResizeRecord ? getRecordResizeHandleProps() : undefined}
                    isResizing={isResizingRecord}
                    isMainHovered={index === 0 && mainRecordHovered}
                    isMoving={hasMainRecord && isMovingInside && index === 0}
                    onMainHoverChange={setMainRecordHovered}
                  />
                  {/* aria-hidden: a list may only own list items. The negative margin keeps each line inside its gap. */}
                  {isGridLayout && isBordered && (index + 1) % recordsPerLine !== 0 && (
                    <div aria-hidden="true" className="listview-record-divider-vertical" style={columnDividerStyle} />
                  )}
                  {/* An incomplete last line keeps its column lines: a filler cell per missing record holds each line's track. */}
                  {isGridLayout &&
                    isBordered &&
                    index === filteredData.length - 1 &&
                    Array.from({ length: Math.max(0, recordsPerLine - 2 - (index % recordsPerLine)) }, (_, missing) => (
                      <React.Fragment key={`filler-${missing}`}>
                        <div aria-hidden="true" />
                        <div
                          aria-hidden="true"
                          className="listview-record-divider-vertical"
                          style={columnDividerStyle}
                        />
                      </React.Fragment>
                    ))}
                  {isBordered && (index + 1) % recordsPerLine === 0 && index < filteredData.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="listview-record-divider"
                      style={{
                        gridColumn: '1 / -1',
                        flex: '0 0 100%',
                        height: DIVIDER_WIDTH,
                        marginBottom: -DIVIDER_WIDTH,
                        padding: 0,
                        backgroundColor: dividerColor,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          {enablePagination && (
            // Last flex item; sticky so it stays at the bottom while the records scroll behind it.
            <div
              data-cy="container-pagination"
              style={{
                position: 'sticky',
                bottom: 0,
                zIndex: 2,
                flexShrink: 0,
                marginTop: 'auto',
                marginLeft: -containerPadding,
                marginRight: -containerPadding,
                marginBottom: -containerPadding,
                height: PAGER_FOOTER_HEIGHT,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderTop: '1px solid var(--cc-weak-border)',
                backgroundColor,
              }}
            >
              {showPager && (
                <Pager
                  id={id}
                  page={currentPage}
                  pageCount={lastPage}
                  onGoToPage={pagerPageChanged}
                  onPrevious={() => pagerPageChanged(currentPage - 1)}
                  onNext={() => pagerPageChanged(currentPage + 1)}
                  canPrevious={currentPage > 1}
                  canNext={currentPage < lastPage}
                  {...getWidthRule(width)}
                  darkMode={darkMode}
                  height={height}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
