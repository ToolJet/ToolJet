import React, { useEffect, useMemo, memo, useRef, useState } from 'react';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { shallow } from 'zustand/shallow';
import { isEmpty, isEqual } from 'lodash';
import { useEvents } from '@/AppBuilder/_stores/slices/eventsSlice';
import useStore from '@/AppBuilder/_stores/store';
import useTableStore from './_stores/tableStore';
import TableContainer from './_components/TableContainer';
import { transformTableData } from './_utils/transformTableData';
import { usePrevious } from '@dnd-kit/utilities';
import { getColorModeFromLuminance, getCssVarValue, getModifiedColor } from '@/AppBuilder/Widgets/utils';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import './table.scss';

const Table = memo(
  ({
    id,
    componentName,
    width,
    height,
    properties,
    styles,
    darkMode,
    fireEvent,
    setExposedVariable,
    setExposedVariables,
    currentLayout,
    currentMode,
    subContainerIndex,
    componentType,
  }) => {
    const { moduleId } = useModuleContext();
    // get table store functions
    const initializeComponent = useTableStore((state) => state.initializeComponent, shallow);
    const removeComponent = useTableStore((state) => state.removeComponent, shallow);
    const expandedRows = useTableStore((state) => state.getExpandedRows(id), shallow);
    const lastExpandedRowIndex = useTableStore((state) => state.components[id]?.lastExpandedRowIndex ?? null, shallow);
    const collapseAllRows = useTableStore((state) => state.collapseAllRows, shallow);
    const setTableProperties = useTableStore((state) => state.setTableProperties, shallow);
    const setTableActions = useTableStore((state) => state.setTableActions, shallow);
    const setTableEvents = useTableStore((state) => state.setTableEvents, shallow);
    const setTableStyles = useTableStore((state) => state.setTableStyles, shallow);
    const setColumnDetails = useTableStore((state) => state.setColumnDetails, shallow);
    const transformations = useTableStore((state) => state.getColumnTransformations(id), shallow);
    const selectedTheme = useStore((state) => state.globalSettings.theme, shallow);
    const tableBodyRef = useRef(null);

    // get table properties
    const visibility = useTableStore((state) => state.getTableProperties(id)?.visibility, shallow);
    const disabledState = useTableStore((state) => state.getTableProperties(id)?.disabledState, shallow);
    const borderRadius = useTableStore((state) => state.getTableStyles(id)?.borderRadius, shallow);

    // get table styles
    const boxShadow = useTableStore((state) => state.getTableStyles(id)?.boxShadow, shallow);
    const borderColor = useTableStore((state) => state.getTableStyles(id)?.borderColor, shallow);
    const containerBackgroundColor = useTableStore(
      (state) => state.getTableStyles(id)?.containerBackgroundColor,
      shallow
    );
    const selectedRowColor = useTableStore((state) => state.getTableStyles(id)?.selectedRowColor, shallow);
    // get resolved value for transformations from app builder store
    const getResolvedValue = useStore((state) => state.getResolvedValue);
    const updateCustomResolvablesLazy = useStore((state) => state.updateCustomResolvablesLazy, shallow);
    const resolveExpandedRows = useStore((state) => state.resolveExpandedRows, shallow);
    const cleanupLazyResolvables = useStore((state) => state.cleanupLazyResolvables, shallow);
    const themeChanged = useStore((state) => state.themeChanged);
    const loadingState = useTableStore((state) => state.getLoadingState(id), shallow);
    const isRefreshing = useTableStore((state) => state.getIsRefreshing(id), shallow);
    const colorMode = getColorModeFromLuminance(containerBackgroundColor);
    const iconColor = getCssVarValue(document.documentElement, `var(--cc-default-icon-${colorMode})`);
    const hoverColor = getModifiedColor(containerBackgroundColor, 6);
    const scrollColor = getModifiedColor(containerBackgroundColor, 12);
    const editableColumnColor = getModifiedColor(containerBackgroundColor, 12);
    const stripedBackgroundColor = getModifiedColor(containerBackgroundColor, 3);
    const stripedHoverColor = getModifiedColor(containerBackgroundColor, 9);
    const stripedEditableColumnColor = getModifiedColor(containerBackgroundColor, 15);

    const {
      columns,
      useDynamicColumn,
      columnData,
      columnDeletionHistory,
      autogenerateColumns,
      actions,
      shouldRender,
      ...restOfProperties
    } = properties;

    const data =
      restOfProperties.dataSourceSelector === 'rawJson' ? restOfProperties.data : restOfProperties.dataSourceSelector;

    const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';

    const firstRowOfTable = useMemo(() => {
      if (!Array.isArray(data) || data.length === 0 || isEmpty(data[0])) return undefined;

      const firstRow = data[0];
      const hasNullValues = Object.values(firstRow).some(
        (columnValue) => columnValue === null || columnValue === undefined
      );
      if (!hasNullValues) return firstRow;

      const representative = { ...firstRow };
      const nullColumns = Object.keys(firstRow).filter(
        (columnKey) => firstRow[columnKey] === null || firstRow[columnKey] === undefined
      );

      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        if (nullColumns.length === 0) break;
        const row = data[rowIndex];
        for (let i = nullColumns.length - 1; i >= 0; i--) {
          const key = nullColumns[i];
          if (row[key] !== null && row[key] !== undefined) {
            representative[key] = row[key];
            nullColumns.splice(i, 1);
          }
        }
      }
      return representative;
    }, [data]);
    const prevFirstRowOfTable = usePrevious(firstRowOfTable);

    // Get all app events. Needed for certain events like onBulkUpdate
    const allAppEvents = useEvents();

    const shouldAutogenerateColumns = useRef(false);
    const hasDataChanged = useRef(false);

    const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
      isLoading: loadingState,
      isVisible: visibility,
      isDisabled: disabledState,
    });

    // ===== HELPER FUNCTION =====
    const updateExposedVariablesState = (key, value) => {
      setExposedVariablesTemporaryState((prevState) => ({
        ...prevState,
        [key]: value,
      }));
    };

    useEffect(() => {
      hasDataChanged.current = false;
    }, [shouldRender]);

    useEffect(() => {
      hasDataChanged.current = true;
    }, [data]);

    const enableExpandableRows = restOfProperties?.enableExpandableRows ?? false;

    // Store only index 0 as template for initial component setup (setResolvedComponentByProperty).
    // Full row data is populated on-demand in resolveExpandedRows when rows expand.
    useEffect(() => {
      if (!enableExpandableRows || !Array.isArray(data) || data.length === 0) {
        cleanupLazyResolvables(id, moduleId);
        return;
      }
      updateCustomResolvablesLazy(id, [{ rowData: data[0] }], moduleId, []);
    }, [data, enableExpandableRows, id, moduleId, updateCustomResolvablesLazy, cleanupLazyResolvables]);

    // When rows expand/collapse or data changes, resolve only expanded rows.
    // resolveExpandedRows populates customResolvables for expanded indices,
    // then reuses updateDependencyValues which scopes to those rows via the guard.
    useEffect(() => {
      if (!enableExpandableRows || !Array.isArray(data) || data.length === 0) return;
      const indices = Object.values(expandedRows).filter((v) => typeof v === 'number' && v < data.length);
      resolveExpandedRows(id, indices, data, moduleId);
    }, [expandedRows, data, enableExpandableRows, id, moduleId, resolveExpandedRows]);

    // Collapse all rows and clear exposed variables when expandable rows is toggled
    const prevEnableExpandableRowsRef = useRef(enableExpandableRows);
    useEffect(() => {
      if (prevEnableExpandableRowsRef.current === enableExpandableRows) return;
      prevEnableExpandableRowsRef.current = enableExpandableRows;
      collapseAllRows(id);
      setExposedVariables({ currentExpandedRows: [], lastExpandedRow: null });
    }, [enableExpandableRows, collapseAllRows, id, setExposedVariables]);

    // Expose currentExpandedRows / lastExpandedRow and fire onExpand on new expansions
    const prevExpandedRowsRef = useRef({});
    useEffect(() => {
      const prev = prevExpandedRowsRef.current;
      const currentExpandedRows = Object.values(expandedRows)
        .filter((v) => typeof v === 'number')
        .sort((a, b) => a - b);

      setExposedVariables({ currentExpandedRows, lastExpandedRow: lastExpandedRowIndex });

      // Fire onExpand only when a row is newly expanded
      const hasNewExpansion = Object.keys(expandedRows).some((rowId) => !(rowId in prev));
      if (hasNewExpansion) fireEvent('onExpand');

      prevExpandedRowsRef.current = { ...expandedRows };
    }, [expandedRows, lastExpandedRowIndex, setExposedVariables, fireEvent]);

    // Create ref for height observation
    const tableRef = useRef(null);
    const heightChangeValue = useHeightObserver(tableBodyRef, isDynamicHeightEnabled);

    // Disabled table blocks the mouse via `data-disabled`; `inert` also removes the search, filters,
    // pagination and cell editors from the tab order (runtime only — keeps the builder editable).
    useDisableInert(tableRef, exposedVariablesTemporaryState.isDisabled);

    // Initialize component on the table store
    useEffect(() => {
      initializeComponent(id);
      return () => {
        removeComponent(id);
        cleanupLazyResolvables(id, moduleId);
      };
    }, [id, initializeComponent, removeComponent, cleanupLazyResolvables, moduleId]);

    // Set properties to the table store
    useEffect(() => {
      setTableProperties(id, restOfProperties);
    }, [id, restOfProperties, setTableProperties]);

    // Set actions to the table store
    useEffect(() => {
      setTableActions(id, actions);
    }, [id, actions, setTableActions]);

    useEffect(() => {
      if (useDynamicColumn || (!isEqual(prevFirstRowOfTable, firstRowOfTable) && !isEmpty(firstRowOfTable)))
        shouldAutogenerateColumns.current = true;
    }, [firstRowOfTable, useDynamicColumn, columnData, prevFirstRowOfTable]);

    // Set column details to the table store. This is responsible for auto-generating columns
    useEffect(() => {
      setColumnDetails(
        id,
        columns,
        useDynamicColumn,
        columnData,
        firstRowOfTable,
        autogenerateColumns,
        columnDeletionHistory,
        shouldAutogenerateColumns.current,
        moduleId
      );
      shouldAutogenerateColumns.current = false;
    }, [
      id,
      columns,
      useDynamicColumn,
      columnData,
      setColumnDetails,
      firstRowOfTable,
      autogenerateColumns,
      moduleId,
      columnDeletionHistory,
    ]);

    // Set styles to the table store
    useEffect(() => {
      setTableStyles(id, styles, darkMode);
    }, [id, styles, darkMode, setTableStyles]);

    // Set events to the table store
    useEffect(() => {
      setTableEvents(id, allAppEvents);
    }, [id, allAppEvents, setTableEvents]);

    useBatchedUpdateEffectArray([
      {
        dep: loadingState || isRefreshing,
        sideEffect: () => {
          updateExposedVariablesState('isLoading', loadingState || isRefreshing);
          setExposedVariable('isLoading', loadingState || isRefreshing);
        },
      },
      {
        dep: visibility,
        sideEffect: () => {
          updateExposedVariablesState('isVisible', visibility);
          setExposedVariable('isVisible', visibility);
        },
      },
      {
        dep: disabledState,
        sideEffect: () => {
          updateExposedVariablesState('isDisabled', disabledState);
          setExposedVariable('isDisabled', disabledState);
        },
      },
    ]);

    useEffect(() => {
      setExposedVariables({
        isLoading: exposedVariablesTemporaryState.isLoading,
        isVisible: exposedVariablesTemporaryState.isVisible,
        isDisabled: exposedVariablesTemporaryState.isDisabled,
        setLoading: async function (value) {
          setExposedVariable('isLoading', !!value);
          updateExposedVariablesState('isLoading', !!value);
        },
        setVisibility: async function (value) {
          setExposedVariable('isVisible', !!value);
          updateExposedVariablesState('isVisible', !!value);
        },
        setDisable: async function (value) {
          setExposedVariable('isDisabled', !!value);
          updateExposedVariablesState('isDisabled', !!value);
        },
      });
    }, []);

    // Transform table data if transformations are present
    const tableData = useMemo(() => {
      const resolveInModule = (value, customVariables = {}) => getResolvedValue(value, customVariables, moduleId);
      return transformTableData(data, transformations, resolveInModule);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getResolvedValue, data, transformations, shouldRender, moduleId]); // TODO: Need to figure out a better way to handle shouldRender.
    // Added to handle the dynamic value (fx) on the table column properties

    // Allow empty-table height recalculation only on visibility changes to avoid flicker during brief null/empty data states.
    const prevVisibility = usePrevious(exposedVariablesTemporaryState?.isVisible);
    const hasVisibilityChanged = prevVisibility !== exposedVariablesTemporaryState.isVisible;

    useDynamicHeight({
      isDynamicHeightEnabled,
      id: id,
      height,
      value: JSON.stringify({ heightChangeValue, tableData, expandedRows }),
      skipAdjustment: exposedVariablesTemporaryState.isLoading || (tableData.length === 0 && !hasVisibilityChanged),
      currentLayout,
      width,
      visibility: exposedVariablesTemporaryState.isVisible,
      subContainerIndex,
      componentType,
    });

    return (
      <div
        ref={tableRef}
        data-cy={`draggable-widget-${componentName}`}
        data-disabled={exposedVariablesTemporaryState.isDisabled}
        className={`card jet-table table-component ${darkMode ? 'dark-theme' : 'light-theme'}`}
        style={{
          height: isDynamicHeightEnabled ? (subContainerIndex != null ? 'auto' : '100%') : `${height}px`,
          ...(isDynamicHeightEnabled && { minHeight: `${height}px` }),
          display: exposedVariablesTemporaryState.isVisible ? '' : 'none',
          borderRadius: Number.parseFloat(borderRadius),
          boxShadow,
          borderColor,
          backgroundColor: containerBackgroundColor,
          '--cc-table-action-icon-color': iconColor,
          '--cc-table-footer-action-hover': hoverColor,
          '--cc-table-row-hover': hoverColor,
          '--cc-table-scroll-bar-color': scrollColor,
          '--cc-table-border-color': borderColor,
          '--cc-table-editable-column-hover': editableColumnColor,
          '--cc-table-edited-cell': 'rgba(233, 163, 57, 0.1)',
          '--cc-table-striped-row-bg-color': stripedBackgroundColor,
          '--cc-table-striped-row-hover': stripedHoverColor,
          '--cc-table-striped-editable-column-hover': stripedEditableColumnColor,
          '--cc-table-pinned-column-bg': containerBackgroundColor,
          '--cc-table-selected-row-bg': selectedRowColor,
        }}
      >
        <TableContainer
          id={id}
          data={tableData}
          width={width}
          height={height}
          darkMode={darkMode}
          componentName={componentName}
          setExposedVariables={setExposedVariables}
          loadingState={exposedVariablesTemporaryState.isLoading || isRefreshing}
          fireEvent={fireEvent}
          hasDataChanged={hasDataChanged.current}
          tableBodyRef={tableBodyRef}
          moduleId={moduleId}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Avoid re-rendering if the props are same
    return Object.keys(diff(prevProps, nextProps)).length === 0;
  }
);

export default Table;
