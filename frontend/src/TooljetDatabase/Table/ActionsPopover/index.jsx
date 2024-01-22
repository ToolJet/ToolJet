/* eslint-disable react/jsx-key */
import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import DeleteIcon from '../../Icons/DeleteIcon.svg';
import EditIcon from '../../Icons/EditColumn.svg';

// eslint-disable-next-line no-unused-vars
export const TablePopover = ({ disabled, children, onEdit, onDelete, show }) => {
  if (disabled) return children;
  const popover = (
    <Popover>
      <Popover.Body>
        <div className="column-popover row list-group-item-action cursor-pointer p-1">
          <div className="col-auto">
            <EditIcon width="17" height="18" />
          </div>
          <div className="col text-truncate" onClick={onEdit}>
            Edit column
          </div>
        </div>
        <div className="column-popover row list-group-item-action cursor-pointer p-1 mt-2" onClick={onDelete}>
          <div className="col-auto">
            <DeleteIcon width="14" height="15" />
          </div>
          <div className="col text-truncate text-danger" data-cy="column-delete-option">
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
