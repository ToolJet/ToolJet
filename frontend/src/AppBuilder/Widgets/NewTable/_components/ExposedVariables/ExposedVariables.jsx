import { useEffect } from 'react';
import useTableStore from '../../_stores/tableStore';
import { shallow } from 'zustand/shallow';

export const ExposedVariables = ({ id, data, setExposedVariables, fireEvent, table }) => {
  const editedRows = useTableStore((state) => state.getAllEditedRows(id), shallow);
  const editedFields = useTableStore((state) => state.getAllEditedFields(id), shallow);
  const addNewRowDetails = useTableStore((state) => state.getAllAddNewRowDetails(id), shallow);
  const allowSelection = useTableStore((state) => state.getTableProperties(id)?.allowSelection, shallow);
  const showBulkSelector = useTableStore((state) => state.getTableProperties(id)?.showBulkSelector, shallow);

  useEffect(() => {
    setExposedVariables({
      currentData: data,
    });
  }, [data, setExposedVariables]);

  useEffect(() => {
    let updatedData = [...data];
    editedRows.forEach((value, key) => {
      updatedData[key] = value;
    });

    setExposedVariables({
      changeSet: Object.fromEntries(editedFields),
      dataUpdates: Object.fromEntries(editedRows),
      updatedData: updatedData,
    });
    if (editedRows.size > 0) {
      fireEvent('onCellValueChanged');
    }
  }, [editedRows, editedFields, data, setExposedVariables, fireEvent]);

  useEffect(() => {
    if (addNewRowDetails) {
      console.log('here--- addNewRowDetails--- ', [...addNewRowDetails.values()]);
      setExposedVariables({
        newRows: [...addNewRowDetails.values()],
      });
    }
  }, [addNewRowDetails, setExposedVariables]);

  useEffect(() => {
    if (!allowSelection) {
      return table.toggleAllRowsSelected(false);
    }
    if (allowSelection && !showBulkSelector) {
      return table.toggleAllRowsSelected(false);
    }
  }, [allowSelection, showBulkSelector, table, setExposedVariables]);

  return null;
};
