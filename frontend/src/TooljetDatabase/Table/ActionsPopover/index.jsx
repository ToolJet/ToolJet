/* eslint-disable react/jsx-key */
import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import DeleteIcon from '../../Icons/DeleteIcon.svg';
import EditIcon from '../../Icons/EditColumn.svg';

// eslint-disable-next-line no-unused-vars
export const TablePopover = ({ disabled, children, onEdit, onDelete, show, darkMode }) => {
  if (disabled) return children;
  const popover = (
    <Popover className={`table-list-items ${darkMode && 'dark-theme'}`}>
      <Popover.Body>
        <div className="column-popover row cursor-pointer p-1">
          <div className="col-auto" data-cy="edit-column-option-icon">
            <EditIcon width="17" height="18" />
          </div>
          <div className="col text-truncate" onClick={onEdit} data-cy="edit-column-option">
            Edit column
          </div>
        </div>
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
    <OverlayTrigger show={show} rootClose={true} trigger="click" placement="bottom" overlay={popover}>
      {children}
    </OverlayTrigger>
  );
};
