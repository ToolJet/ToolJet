import React from 'react';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import EditIcon from './Icons/Edit.svg';
// import CloneIcon from './Icons/Clone.svg';
import DeleteIcon from './Icons/Delete.svg';
import EllipsisIcon from './Icons/Ellipsis.svg';

export const ListItemPopover = ({ onEdit, onDelete, darkMode }) => {
  const [open, setOpen] = React.useState(false);

  const popover = (
    <Popover id="popover-contained" className="table-list-items">
      <Popover.Content className={`${darkMode && 'theme-dark'}`}>
        <div className={`row cursor-pointer`}>
          <div className="col-auto">
            <EditIcon />
          </div>
          <div
            className="col text-truncate"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit
          </div>
        </div>
        {/* <div className="row mt-3">
          <div className="col-auto">
            <CloneIcon />
          </div>
          <div className="col text-truncate">Duplicate</div>
        </div> */}
        <div className="row mt-3 cursor-pointer">
          <div className="col-auto">
            <DeleteIcon />
          </div>
          <div className="col text-truncate" onClick={onDelete}>
            Delete
          </div>
        </div>
      </Popover.Content>
    </Popover>
  );

  return (
    <div
      className={cx(`float-right cursor-pointer table-list-item-popover ${darkMode && 'dark'}`, {
        'd-grid': open,
      })}
    >
      <OverlayTrigger
        onToggle={(isOpen) => {
          setOpen(isOpen);
        }}
        show={open}
        rootClose
        trigger="click"
        placement="bottom"
        overlay={popover}
      >
        <EllipsisIcon />
      </OverlayTrigger>
    </div>
  );
};
