import useStore from '@/AppBuilder/_stores/store';
import autogenerateColumns from '../../_utils/autoGenerateColumns';
import { removeNullValues } from '../helper';
import { isEmpty, isEqual } from 'lodash';
export const createColumnSlice = (set, get) => ({
  getColumnProperties: (id) => {
    return get().components[id]?.columnDetails?.columnProperties ?? [];
  },
  setColumnDetails: (
    id,
    columns,
    useDynamicColumn,
    columnData,
    firstRowOfTable,
    autogenerateColumnsFlag,
    columnDeletionHistory,
    shouldAutogenerateColumns,
    moduleId = 'canvas'
  ) => {
    set(
      (state) => {
        const isDynamicColumnSelected = useDynamicColumn ?? false;
        if (isDynamicColumnSelected) {
          state.components[id].columnDetails.useDynamicColumn = isDynamicColumnSelected;
          state.components[id].columnDetails.columnData = columnData ?? [];
        } else {
          state.components[id].columnDetails.useDynamicColumn = false;
        }
        /*
          Locked schema: autogenerateColumns.value false means keep configured columns as-is so a
          change in the data shape can neither add nor drop columns. Dynamic columns own the schema
          outright, and an empty schema is still allowed to generate once so the table cannot be
          locked into a permanently blank state. generateColumns is forced on whenever this skip
          does not fire so the inner flag cannot return undefined.
        */
        const isSchemaLocked = !autogenerateColumnsFlag && !isDynamicColumnSelected && !isEmpty(columns);
        if (shouldAutogenerateColumns && !isSchemaLocked) {
          const columnProperties = get().generateColumns(
            id,
            columns,
            firstRowOfTable,
            isDynamicColumnSelected,
            true,
            columnDeletionHistory,
            columnData,
            moduleId
          );
          state.components[id].columnDetails.columnProperties = columnProperties;
          state.components[id].columnDetails.transformations = get().generateColumnTransformations(
            id,
            columnProperties
          );
        } else {
          const columnProperties = removeNullValues(columns);
          state.components[id].columnDetails.columnProperties = columnProperties;
          state.components[id].columnDetails.transformations = get().generateColumnTransformations(
            id,
            columnProperties
          );
        }
      },
      false,
      { type: 'setColumnDetails', payload: { id, columns, useDynamicColumn, columnData } }
    );
  },
  generateColumns: (
    id,
    columns,
    firstRowOfTable,
    isDynamicColumnSelected,
    autogenerateColumnsFlag,
    columnDeletionHistory,
    columnData,
    moduleId
  ) => {
    if (autogenerateColumnsFlag) {
      const setComponentProperty = useStore.getState().setComponentProperty;
      const existingGeneratedColumn = get().getColumnProperties(id);
      const generatedColumns = autogenerateColumns(
        firstRowOfTable,
        columns,
        columnDeletionHistory ?? [],
        isDynamicColumnSelected,
        columnData ?? [],
        autogenerateColumns ?? false
      );

      if (!isDynamicColumnSelected && !isEqual(existingGeneratedColumn, generatedColumns)) {
        setComponentProperty(id, 'columns', generatedColumns, 'properties', 'value', false, moduleId, {
          skipUndoRedo: true,
          saveAfterAction: true,
        });
      }
      return generatedColumns;
    }
  },
  generateColumnTransformations: (id, columnProperties) => {
    const transformations = columnProperties
      .filter((column) => column.transformation && column.transformation != '{{cellValue}}')
      .map((column) => {
        return {
          key: column.key ? column.key : column.name,
          transformation: column.transformation,
        };
      });
    const existingTransformations = get().getColumnTransformations(id);
    if (!isEqual(existingTransformations, transformations)) {
      return transformations;
    }
    return existingTransformations;
  },
  getColumnTransformations: (id) => {
    return get().components[id]?.columnDetails?.transformations ?? [];
  },
});
