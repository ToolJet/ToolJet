import React, { useEffect, useMemo } from 'react';
import './_styles/table_component.scss';
// hooks for table properties and styles
import useTableStore from './_stores/tableStore';
// components
import TableContainer from './_components/TableContainer';
import { isEmpty, isArray } from 'lodash';
import { useEvents } from '@/AppBuilder/_stores/slices/eventsSlice';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export const Table = React.memo(
  ({ id, componentName, width, height, properties, styles, darkMode, fireEvent, setExposedVariables }) => {
    // const {
    //   initializeComponent,
    //   removeComponent,
    //   setTableProperties,
    //   setTableStyles,
    //   getTableStyles,
    //   getTableProperties,
    //   setColumnDetails,
    //   setTableActions,
    //   setTableEvents,
    //   getColumnTransformations,
    // } = useTableStore();

    const initializeComponent = useTableStore((state) => state.initializeComponent);
    const removeComponent = useTableStore((state) => state.removeComponent);
    const setTableProperties = useTableStore((state) => state.setTableProperties);
    const setTableActions = useTableStore((state) => state.setTableActions);
    const setTableEvents = useTableStore((state) => state.setTableEvents);
    const setTableStyles = useTableStore((state) => state.setTableStyles);
    const setColumnDetails = useTableStore((state) => state.setColumnDetails);
    const getColumnTransformations = useTableStore((state) => state.getColumnTransformations);

    const visibility = useTableStore((state) => state.getTableProperties(id)?.visibility, shallow);
    const disabledState = useTableStore((state) => state.getTableProperties(id)?.disabledState, shallow);

    const borderRadius = useTableStore((state) => state.getTableStyles(id)?.borderRadius, shallow);
    const boxShadow = useTableStore((state) => state.getTableStyles(id)?.boxShadow, shallow);
    const borderColor = useTableStore((state) => state.getTableStyles(id)?.borderColor, shallow);

    console.log('here--- visibility--- ', visibility);

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const firstRowOfTable = !isEmpty(restOfProperties.data?.[0]) ? restOfProperties.data?.[0] : undefined;
    const transformations = getColumnTransformations(id);

    const allAppEvents = useEvents();
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

    useEffect(() => {
      setTableEvents(id, allAppEvents);
    }, [id, allAppEvents, setTableEvents]);

    const tableData = useMemo(() => {
      const resolvedData = restOfProperties.data;
      if (!Array.isArray(resolvedData) && !isArray(resolvedData)) {
        return [];
      } else {
        return resolvedData
          .filter((data) => data !== null && data !== undefined)
          .map((row) => {
            const transformedObject = {};

            transformations.forEach(({ key, transformation }) => {
              const nestedKeys = key.includes('.') && key.split('.');
              if (nestedKeys) {
                // Single-level nested property
                const [nestedKey, subKey] = nestedKeys;
                const nestedObject = transformedObject?.[nestedKey] || { ...row[nestedKey] }; // Retain existing nested object
                const newValue =
                  getResolvedValue(transformation, {
                    cellValue: row?.[nestedKey]?.[subKey],
                    rowData: row,
                  }) ?? row[key];

                // Apply transformation to subKey
                nestedObject[subKey] = newValue;

                // Update transformedObject with the new nested object
                transformedObject[nestedKey] = nestedObject;
              } else {
                // Non-nested property
                transformedObject[key] =
                  getResolvedValue(transformation, {
                    cellValue: row[key],
                    rowData: row,
                  }) ?? row[key];
              }
            });
            return {
              ...row,
              ...transformedObject,
            };
          });
      }
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
  }
);
