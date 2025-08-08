import React, { useEffect, useMemo, memo, useRef } from 'react';
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
import { getColorModeFromLuminance, getCssVarValue, getModifiedColor } from '@/Editor/Components/utils';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import './table.scss';

export const Table = memo(
  ({
    id,
    componentName,
    width,
    height,
    properties,
    styles,
    darkMode,
    fireEvent,
    setExposedVariables,
    adjustComponentPositions,
    currentLayout,
  }) => {
    const { moduleId } = useModuleContext();
    // get table store functions
    const initializeComponent = useTableStore((state) => state.initializeComponent, shallow);
    const removeComponent = useTableStore((state) => state.removeComponent, shallow);
    const setTableProperties = useTableStore((state) => state.setTableProperties, shallow);
    const setTableActions = useTableStore((state) => state.setTableActions, shallow);
    const setTableEvents = useTableStore((state) => state.setTableEvents, shallow);
    const setTableStyles = useTableStore((state) => state.setTableStyles, shallow);
    const setColumnDetails = useTableStore((state) => state.setColumnDetails, shallow);
    const transformations = useTableStore((state) => state.getColumnTransformations(id), shallow);
    const selectedTheme = useStore((state) => state.globalSettings.theme, shallow);
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
    // get resolved value for transformations from app builder store
    const getResolvedValue = useStore((state) => state.getResolvedValue);
    const themeChanged = useStore((state) => state.themeChanged);

    const colorMode = getColorModeFromLuminance(containerBackgroundColor);
    const iconColor = getCssVarValue(document.documentElement, `var(--cc-default-icon-${colorMode})`);
    const textColor = getCssVarValue(document.documentElement, `var(--cc-placeholder-text-${colorMode})`);
    const hoverColor = getModifiedColor(containerBackgroundColor, 'hover');
    const activeColor = getModifiedColor(containerBackgroundColor, 'active');

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

    const firstRowOfTable = !isEmpty(restOfProperties.data?.[0]) ? restOfProperties.data?.[0] : undefined;
    const prevFirstRowOfTable = usePrevious(firstRowOfTable);

    // Get all app events. Needed for certain events like onBulkUpdate
    const allAppEvents = useEvents();

    const shouldAutogenerateColumns = useRef(false);
    const hasDataChanged = useRef(false);

    useEffect(() => {
      hasDataChanged.current = false;
    }, [shouldRender]);

    useEffect(() => {
      hasDataChanged.current = true;
    }, [restOfProperties.data]);

    // Create ref for height observation
    const tableRef = useRef(null);
    const heightChangeValue = useHeightObserver(tableRef, properties.dynamicHeight);

    // Initialize component on the table store
    useEffect(() => {
      initializeComponent(id);
      return () => removeComponent(id);
    }, [id, initializeComponent, removeComponent]);

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

    // Transform table data if transformations are present
    const tableData = useMemo(() => {
      return transformTableData(restOfProperties.data, transformations, getResolvedValue);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getResolvedValue, restOfProperties.data, transformations, shouldRender]); // TODO: Need to figure out a better way to handle shouldRender.
    // Added to handle the dynamic value (fx) on the table column properties

    useDynamicHeight({
      dynamicHeight: properties.dynamicHeight,
      id: id,
      height,
      value: heightChangeValue,
      adjustComponentPositions,
      currentLayout,
      width,
      visibility,
    });

    return (
      <div
        ref={tableRef}
        data-cy={`draggable-widget-${componentName}`}
        data-disabled={disabledState}
        className={`card jet-table table-component ${darkMode ? 'dark-theme' : 'light-theme'}`}
        style={{
          height: properties.dynamicHeight ? 'auto' : `${height}px`,
          display: visibility === 'none' ? 'none' : '',
          borderRadius: Number.parseFloat(borderRadius),
          boxShadow,
          borderColor,
          backgroundColor: containerBackgroundColor,
          '--cc-table-record-text-color': textColor,
          '--cc-table-action-icon-color': iconColor,
          '--cc-table-footer-action-hover': hoverColor,
          '--cc-table-row-hover': hoverColor,
          '--cc-table-row-active': activeColor,
          '--cc-table-scroll-bar-color': activeColor,
          '--cc-table-border-color': borderColor,
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
          fireEvent={fireEvent}
          hasDataChanged={hasDataChanged.current}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Avoid re-rendering if the props are same
    return Object.keys(diff(prevProps, nextProps)).length === 0;
  }
);
