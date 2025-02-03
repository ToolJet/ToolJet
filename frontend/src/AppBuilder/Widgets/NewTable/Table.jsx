import React, { useEffect, useRef } from 'react';
import './_styles/table_component.scss';
// hooks for table properties and styles
import useTableStore from './_stores/tableStore';
// components
import TableContainer from './_components/TableContainer';
import _ from 'lodash';

export const Table = React.memo(
  ({ id, componentName, width, height, properties, styles, darkMode, fireEvent, setExposedVariables }) => {
    const {
      initializeComponent,
      removeComponent,
      setTableProperties,
      setTableStyles,
      getTableStyles,
      getTableProperties,
      setColumnDetails,
      setTableActions,
    } = useTableStore();

    const { disabledState, visibility } = getTableProperties(id);
    const { borderRadius, boxShadow, borderColor } = getTableStyles(id);
    const {
      columns,
      useDynamicColumn,
      columnData,
      columnDeletionHistory,
      autogenerateColumns,
      actions,
      ...restOfProperties
    } = properties;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const firstRowOfTable = !_.isEmpty(restOfProperties.data?.[0]) ? restOfProperties.data?.[0] : {};

    useEffect(() => {
      initializeComponent(id);
      return () => removeComponent(id);
    }, [id, initializeComponent, removeComponent]);

    useEffect(() => {
      setTableProperties(id, restOfProperties);
    }, [id, restOfProperties, setTableProperties]);

    useEffect(() => {
      setTableActions(id, actions);
    }, [id, actions, setTableActions]);

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

    useEffect(() => {
      setTableStyles(id, styles);
    }, [id, styles, setTableStyles]);

    return (
      <div
        data-cy={`draggable-widget-${componentName}`}
        data-disabled={disabledState}
        className={`card jet-table table-component ${darkMode ? 'dark-theme' : 'light-theme'}`}
        style={{
          height: `${height}px`,
          display: visibility,
          borderRadius: borderRadius,
          boxShadow,
          borderColor: borderColor,
        }}
      >
        <TableContainer
          id={id}
          data={restOfProperties.data}
          width={width}
          height={height}
          darkMode={darkMode}
          componentName={componentName}
        />
      </div>
    );
  }
);
