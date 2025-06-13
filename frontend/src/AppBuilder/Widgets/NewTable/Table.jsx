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
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

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

    // get table properties
    const visibility = useTableStore((state) => state.getTableProperties(id)?.visibility, shallow);
    const disabledState = useTableStore((state) => state.getTableProperties(id)?.disabledState, shallow);
    const borderRadius = useTableStore((state) => state.getTableStyles(id)?.borderRadius, shallow);

    // get table styles
    const boxShadow = useTableStore((state) => state.getTableStyles(id)?.boxShadow, shallow);
    const borderColor = useTableStore((state) => state.getTableStyles(id)?.borderColor, shallow);

    // get resolved value for transformations from app builder store
    const getResolvedValue = useStore((state) => state.getResolvedValue);

    const {
      columns,
      useDynamicColumn,
      columnData,
      columnDeletionHistory,
      autogenerateColumns,
      actions,
      ...restOfProperties
    } = properties;

    const firstRowOfTable = !isEmpty(restOfProperties.data?.[0]) ? restOfProperties.data?.[0] : undefined;
    const prevFirstRowOfTable = usePrevious(firstRowOfTable);

    // Get all app events. Needed for certain events like onBulkUpdate
    const allAppEvents = useEvents();

    const shouldAutogenerateColumns = useRef(false);

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
    }, [getResolvedValue, restOfProperties.data, transformations]);

    useDynamicHeight({
      dynamicHeight: properties.dynamicHeight,
      id: id,
      height,
      value: JSON.stringify(tableData),
      adjustComponentPositions,
      currentLayout,
      width,
    });

    return (
      <div
        data-cy={`draggable-widget-${componentName}`}
        data-disabled={disabledState}
        className={`card jet-table table-component ${darkMode ? 'dark-theme' : 'light-theme'}`}
        style={{
          height: properties.dynamicHeight ? 'auto' : `${height}px`,
          display: visibility === 'none' ? 'none' : '',
          borderRadius: Number.parseFloat(borderRadius),
          boxShadow,
          borderColor,
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
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Avoid re-rendering if the props are same
    return Object.keys(diff(prevProps, nextProps)).length === 0;
  }
);
