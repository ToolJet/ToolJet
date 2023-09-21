import React from 'react';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import EditIcon from './Icons/Edit.svg';
// import CloneIcon from './Icons/Clone.svg';
import DeleteIcon from './Icons/Delete.svg';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const ListItemPopover = ({ onEdit, onDelete, darkMode, onMenuToggle }) => {
  const closeMenu = () => {
    document.body.click();
  };

  const popover = (
    <Popover id="popover-contained" className={`table-list-items ${darkMode && 'dark-theme'}`}>
      <Popover.Body className={`${darkMode && 'theme-dark'}`}>
        <div className={`row cursor-pointer`}>
          <div className="col-auto" data-cy="edit-option-icon">
            <EditIcon />
          </div>
          <div
            className="col text-truncate"
            data-cy="edit-option"
            onClick={(event) => {
              event.stopPropagation();
              closeMenu();
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
          <div className="col-auto" data-cy="delete-option-icon">
            <DeleteIcon />
          </div>
          <div
            className="col text-truncate"
            data-cy="delete-option"
            onClick={() => {
              closeMenu();
              onDelete();
            }}
          >
            Delete
          </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="bottom" rootClose onToggle={onMenuToggle} overlay={popover}>
      <div className={cx(`float-right cursor-pointer table-list-item-popover`)} data-cy="table-kebab-icon">
        <span>
          <SolidIcon name="morevertical" width="14" fill={darkMode ? '#FDFDFE' : '#11181C'} />
        </span>
      </div>
    </OverlayTrigger>
  );
};
