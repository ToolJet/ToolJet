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
  handleOnClickSeedData,
  hideSeedDataOption,
}) => {
  if (disabled) return children;
  const popover = (
    <Popover
      className={`table-list-items ${darkMode && 'dark-theme'}`}
      style={{
        width: '170px',
      }}
    >
      <Popover.Body className={`${darkMode && 'dark-theme'}`}>
        <div
          className="row cursor-pointer"
          data-cy="add-new-row-option"
          onClick={(event) => {
            event.stopPropagation();
            toggleAddNewDataMenu(false);
            handleOnClickCreateNewRow(true);
          }}
        >
          <div className="col-auto">
            <SolidIcon name="row" width="14" fill={'#889096'} />
          </div>
          <div className="col text-truncate tj-text-xsm font-weight-500">Add new row</div>
        </div>
        <div
          className="row mt-3 cursor-pointer"
          data-cy="bulk-upload-data-option"
          onClick={(event) => {
            event.stopPropagation();
            toggleAddNewDataMenu(false);
            handleOnClickBulkUpdateData(true);
          }}
        >
          <div className="col-auto">
            <SolidIcon name="fileupload" width="14" fill={'#889096'} />
          </div>
          <div className="col text-truncate tj-text-xsm font-weight-500">Bulk upload data</div>
        </div>
        {!hideSeedDataOption && (
          <div
            className="row mt-3 cursor-pointer"
            data-cy="seed-data-sql-option"
            onClick={(event) => {
              event.stopPropagation();
              toggleAddNewDataMenu(false);
              handleOnClickSeedData(true);
            }}
          >
            <div className="col-auto">
              <SolidIcon name="code" width="14" fill={'#889096'} />
            </div>
            <div className="col text-truncate tj-text-xsm font-weight-500">Seed data with SQL</div>
          </div>
        )}
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
