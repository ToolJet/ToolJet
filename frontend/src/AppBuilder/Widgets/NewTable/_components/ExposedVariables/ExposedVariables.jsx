import { useEffect } from 'react';
import useTableStore from '../../_stores/tableStore';

export const ExposedVariables = ({ id, data, setExposedVariables, fireEvent }) => {
  const { getAllEditedRows, getAllEditedFields, getAllAddNewRowDetails } = useTableStore();
  const editedRows = getAllEditedRows(id);
  const editedFields = getAllEditedFields(id);
  const addNewRowDetails = getAllAddNewRowDetails(id);

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

  return null;
};
