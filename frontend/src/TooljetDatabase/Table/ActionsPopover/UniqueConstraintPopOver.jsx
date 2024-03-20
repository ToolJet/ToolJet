/* eslint-disable react/jsx-key */
import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import DeleteIcon from '../../Icons/DeleteIcon.svg';

// eslint-disable-next-line no-unused-vars
export const UniqueConstraintPopOver = ({ disabled, children, onDelete, darkMode, columns, setColumns, index }) => {
  if (disabled) return children;
  const popover = (
    <Popover className={`create-table-list-items ${darkMode && 'dark-theme'}`}>
      <Popover.Body>
        <div className="unique-constraint-parent">
          <div className="column-popover row cursor-pointer p-1">
            <div className="d-flex not-null-toggle">
              <label className={`form-switch`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={columns[index]?.constraints_type?.is_unique ?? false}
                  onChange={(e) => {
                    const prevColumns = { ...columns };
                    const columnConstraints = prevColumns[index]?.constraints_type ?? {};
                    columnConstraints.is_unique = e.target.checked;
                    prevColumns[index].constraints_type = { ...columnConstraints };
                    setColumns(prevColumns);
                  }}
                  disabled={columns[index]?.constraints_type?.is_primary_key === true}
                />
              </label>
              <span className="unique-tag">Unique</span>
            </div>
          </div>
          <div className="col text-truncate unique-helper-text px-2 py-1">Unique value constraint is added</div>
        </div>

        <hr />

        <div className="column-popover delete-column-table-creation cursor-pointer p-1 mt-2" onClick={onDelete}>
          <div data-cy="delete-column-option-icon">
            <DeleteIcon width="14" height="15" />
          </div>
          <div className="text-truncate text-danger delete-column-text" data-cy="delete-column-option">
            Delete column
          </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger rootClose={true} trigger="click" placement="bottom" overlay={popover}>
      {children}
    </OverlayTrigger>
  );
};
