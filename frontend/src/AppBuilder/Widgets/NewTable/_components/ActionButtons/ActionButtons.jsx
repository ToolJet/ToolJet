import React, { useCallback } from 'react';
import useTableStore from '../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
export const ActionButtons = ({ actions, row, cell, fireEvent, setExposedVariables, id }) => {
  const { getTableActionEvents } = useTableStore();
  const actionButtonRadius = useTableStore((state) => state.getTableStyles(id)?.actionButtonRadius, shallow);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

  const handleActionClick = useCallback(
    (action) => {
      setExposedVariables({
        selectedRowId: row.id,
        selectedRow: row.original,
      });

      fireEvent('onTableActionButtonClicked', {
        action,
        tableActionEvents: getTableActionEvents(id),
      });
    },
    [id, row, setExposedVariables, fireEvent, getTableActionEvents]
  );

  return (
    <div className="d-flex align-items-center">
      {actions.map((action) => (
        <button
          key={action.name}
          className="btn btn-sm m-1 btn-light action-button"
          style={{
            background: action.backgroundColor,
            color: action.textColor,
            borderRadius: actionButtonRadius,
          }}
          onClick={() => handleActionClick(action, id)}
          disabled={getResolvedValue(action.disableActionButton, { rowData: row.original, cellValue: cell.getValue() })}
        >
          {action.buttonText}
        </button>
      ))}
    </div>
  );
};
