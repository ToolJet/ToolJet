import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const AddNewDataPopOver = ({
  disabled,
  children,
  show,
  darkMode,
  toggleAddNewDataMenu,
  handleOnClickCreateNewRow,
  handleOnClickBulkUpdateData,
}) => {
  if (disabled) return children;
  const popover = (
    <Popover
      className={`table-list-items ${darkMode && 'dark-theme'}`}
      style={{
        width: '160px',
      }}
    >
      <Popover.Body className={`${darkMode && 'dark-theme'}`}>
        <div className="row cursor-pointer">
          <div className="col-auto">
            <SolidIcon name="row" width="14" fill={'#889096'} />
          </div>
          <div
            className="col text-truncate tj-text-xsm font-weight-500"
            data-cy="add-new-row-option"
            onClick={(event) => {
              event.stopPropagation();
              toggleAddNewDataMenu(false);
              handleOnClickCreateNewRow(true);
            }}
          >
            Add new row
          </div>
        </div>
        <div className="row mt-3 cursor-pointer">
          <div className="col-auto">
            <SolidIcon name="fileupload" width="14" fill={'#889096'} />
          </div>
          <div
            className="col text-truncate tj-text-xsm font-weight-500"
            data-cy="bulk-upload-data-option"
            onClick={(event) => {
              event.stopPropagation();
              toggleAddNewDataMenu(false);
              handleOnClickBulkUpdateData(true);
            }}
          >
            Bulk upload data
          </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom"
      rootClose
      onToggle={() => {
        toggleAddNewDataMenu(!show);
      }}
      show={show}
      overlay={popover}
    >
      {children}
    </OverlayTrigger>
  );
};
