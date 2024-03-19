/* eslint-disable react/jsx-key */
import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import DeleteIcon from '../../Icons/DeleteIcon.svg';

// eslint-disable-next-line no-unused-vars
export const UniqueConstraintPopOver = ({ disabled, children, onDelete, darkMode }) => {
  if (disabled) return children;
  const popover = (
    <Popover className={`table ${darkMode && 'dark-theme'}`}>
      <Popover.Body>
        <div className="column-popover row cursor-pointer p-1">
          <div className="d-flex not-null-toggle">
            <label className={`form-switch`}>
              <input
                className="form-check-input"
                type="checkbox"
                checked={true}
                onChange={(e) => {
                  e.preventDefault();
                  console.log('first', 'click');
                }}
              />
            </label>
            <span>Unique</span>
          </div>
        </div>
        <div className="col text-truncate px-2 py-1">Unique value constraint is added</div>

        {/* <hr /> */}

        <div className="column-popover row cursor-pointer p-1 mt-2" onClick={onDelete}>
          <div className="col-auto" data-cy="delete-column-option-icon">
            <DeleteIcon width="14" height="15" />
          </div>
          <div className="col text-truncate text-danger" data-cy="delete-column-option">
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
