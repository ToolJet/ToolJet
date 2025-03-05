import React, { useEffect, useMemo, memo } from 'react';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { shallow } from 'zustand/shallow';
import { isEmpty } from 'lodash';
import { useEvents } from '@/AppBuilder/_stores/slices/eventsSlice';
import useStore from '@/AppBuilder/_stores/store';
import useTableStore from './_stores/tableStore';
import TableContainer from './_components/TableContainer';
import { transformTableData } from './_utils/transformTableData';

export const Table = memo(
  ({ id, componentName, width, height, properties, styles, darkMode, fireEvent, setExposedVariables }) => {
    // get table store functions
    const initializeComponent = useTableStore((state) => state.initializeComponent, shallow);
    const removeComponent = useTableStore((state) => state.removeComponent, shallow);
    const setTableProperties = useTableStore((state) => state.setTableProperties, shallow);
    const setTableActions = useTableStore((state) => state.setTableActions, shallow);
    const setTableEvents = useTableStore((state) => state.setTableEvents, shallow);
    const setTableStyles = useTableStore((state) => state.setTableStyles, shallow);
    const setColumnDetails = useTableStore((state) => state.setColumnDetails, shallow);
    const getColumnTransformations = useTableStore((state) => state.getColumnTransformations, shallow);

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
    const transformations = getColumnTransformations(id);

    // Get all app events. Needed for certain events like onBulkUpdate
    const allAppEvents = useEvents();

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

    // Set column details to the table store. This is responsible for auto-generating columns
    useEffect(() => {
      setColumnDetails(
        id,
        columns,
        useDynamicColumn,
        columnData,
        firstRowOfTable,
        autogenerateColumns,
        columnDeletionHistory
      );
    }, [
      id,
      columns,
      useDynamicColumn,
      columnData,
      setColumnDetails,
      firstRowOfTable,
      autogenerateColumns,
      columnDeletionHistory,
    ]);

    // Set styles to the table store
    useEffect(() => {
      setTableStyles(id, styles);
    }, [id, styles, setTableStyles]);

    // Set events to the table store
    useEffect(() => {
      setTableEvents(id, allAppEvents);
    }, [id, allAppEvents, setTableEvents]);

    // Transform table data if transformations are present
    const tableData = useMemo(() => {
      return transformTableData(restOfProperties.data, transformations, getResolvedValue);
    }, [getResolvedValue, restOfProperties.data, transformations]);

    return (
      <div
        data-cy={`draggable-widget-${componentName}`}
        data-disabled={disabledState}
        className={`card jet-table table-component ${darkMode ? 'dark-theme' : 'light-theme'}`}
        style={{
          height: `${height}px`,
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
