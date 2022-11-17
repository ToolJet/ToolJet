import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import EditIcon from './Icons/Edit.svg';
import CloneIcon from './Icons/Clone.svg';
import DeleteIcon from './Icons/Delete.svg';
import EllipsisIcon from './Icons/Ellipsis.svg';

export const ListItemPopover = ({ handleDelete }) => {
  const popover = (
    <Popover id="popover-contained">
      <Popover.Content>
        <div className="row cursor-pointer">
          <div className="col-auto">
            <EditIcon />
          </div>
          <div className="col text-truncate">Edit</div>
        </div>
        <div className="row mt-3">
          <div className="col-auto">
            <CloneIcon />
          </div>
          <div className="col text-truncate">Duplicate</div>
        </div>
        <div className="row mt-3">
          <div className="col-auto">
            <DeleteIcon />
          </div>
          <div className="col text-truncate" onClick={handleDelete}>
            Delete table
          </div>
        </div>
      </Popover.Content>
    </Popover>
  );

  return (
    <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={popover}>
      <EllipsisIcon />
    </OverlayTrigger>
  );
};
