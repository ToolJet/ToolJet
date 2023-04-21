/* eslint-disable react/jsx-key */
import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import DeleteIcon from './Icons/Delete.svg';

// eslint-disable-next-line no-unused-vars
export const TablePopover = ({ disabled, children, onEdit, onDelete }) => {
  if (disabled) return children;
  const popover = (
    <Popover>
      <Popover.Body>
        {/* <div className="w-min-100 row list-group-item-action cursor-pointer">
          <div className="col-auto">
            <EditIcon />
          </div>
          <div className="col text-truncate" onClick={onEdit}>
            Edit
          </div>
        </div> */}
        <div className="w-min-100 row list-group-item-action cursor-pointer" onClick={onDelete}>
          <div className="col-auto">
            <DeleteIcon />
          </div>
          <div className="col text-truncate" data-cy="column-delete-option">
            Delete
          </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={popover}>
      {children}
    </OverlayTrigger>
  );
};
