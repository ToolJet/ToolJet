import React, { useCallback } from 'react';
import useTableStore from '../../_stores/tableStore';

export const ActionButtons = ({ actions, row, fireEvent, setExposedVariables, id }) => {
  const { getTableActionEvents } = useTableStore();

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
            borderRadius: action.actionButtonRadius,
          }}
          onClick={() => handleActionClick(action, id)}
          disabled={action.isDisabled}
        >
          {action.buttonText}
        </button>
      ))}
    </div>
  );
};
