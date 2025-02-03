import React from 'react';

export const ActionButtons = ({ actions, row, fireEvent, setExposedVariables, tableActionEvents }) => {
  const handleActionClick = (action) => {
    setExposedVariables({
      selectedRowId: row.id,
      selectedRow: row.original,
    });

    fireEvent('onTableActionButtonClicked', {
      data: row.original,
      rowId: row.id,
      action,
      tableActionEvents,
    });
  };

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
          onClick={() => handleActionClick(action)}
          disabled={action.isDisabled}
        >
          {action.buttonText}
        </button>
      ))}
    </div>
  );
};
