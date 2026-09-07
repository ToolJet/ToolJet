import React from 'react';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import EditIcon from '../../Icons/EditColumn.svg';
// import CloneIcon from './Icons/Clone.svg';
import DeleteIcon from './Icons/Delete.svg';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Menu from '../../Icons/Menu.svg';
import { ToolTip } from '@/_components/ToolTip';

export const ListItemPopover = ({
  onEdit,
  onDelete,
  darkMode,
  handleExportTable,
  onExportCsv,
  onMenuToggle,
  onAddNewColumnBtnClick,
  canEditTjdb,
  canEditSchema,
}) => {
  const closeMenu = () => {
    document.body.click();
  };

  // A schema affordance can be blocked either because the user lacks the TJDB permission
  // (canEditTjdb false) or because they are not on Development (canEditTjdb true, canEditSchema
  // false). Only the latter gets the environment tooltip - a permission block keeps its existing,
  // tooltip-less greyed treatment.
  const blockedByEnvironment = canEditTjdb && !canEditSchema;
  const ddlItemClass = `col text-truncate${!canEditSchema ? ' tj-text-muted' : ''}`;
  const ddlRowClass = `row${!canEditSchema ? ' tj-disabled-row' : ' cursor-pointer'}`;
  const wrapIfEnvBlocked = (row) =>
    blockedByEnvironment ? (
      <ToolTip message="Schema changes can only be made in the Development environment" placement="top">
        <div>{row}</div>
      </ToolTip>
    ) : (
      row
    );

  const popover = (
    <Popover id="popover-contained" className={`table-list-items ${darkMode && 'dark-theme'}`}>
      <Popover.Body className={`${darkMode && 'dark-theme'}`}>
        {wrapIfEnvBlocked(
          <div className={ddlRowClass} style={!canEditSchema ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
            <div className="col-auto" data-cy="edit-option-icon">
              <EditIcon />
            </div>
            <div
              className={ddlItemClass}
              data-cy="rename-table-option"
              onClick={(event) => {
                event.stopPropagation();
                closeMenu();
                onEdit();
              }}
            >
              Edit table
            </div>
          </div>
        )}
        {wrapIfEnvBlocked(
          <div className={`mt-3 ${ddlRowClass}`} style={!canEditSchema ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
            <div className="col-auto" data-cy="add-new-column-icon">
              <SolidIcon name="column" width="14" />
            </div>
            <div
              className={ddlItemClass}
              data-cy="add-new-column-option"
              onClick={(event) => {
                event.stopPropagation();
                closeMenu();
                onAddNewColumnBtnClick();
              }}
            >
              Add new column
            </div>
          </div>
        )}
        <div className="row mt-3 cursor-pointer">
          <div className="col-auto" data-cy="export-schema-option-icon">
            <SolidIcon name="filedownload" width="14" viewBox="0 0 25 25" />
          </div>
          <div
            className="col text-truncate"
            data-cy="export-schema-option"
            onClick={() => {
              closeMenu();
              handleExportTable();
            }}
          >
            Export schema
          </div>
        </div>
        <div className="row mt-3 cursor-pointer">
          <div className="col-auto" data-cy="export-csv-option-icon">
            <SolidIcon name="filedownload" width="14" viewBox="0 0 25 25" />
          </div>
          <div
            className="col text-truncate"
            data-cy="export-csv-option"
            onClick={() => {
              closeMenu();
              onExportCsv();
            }}
          >
            Export data as CSV
          </div>
        </div>
        {/* <div className="row mt-3">
          <div className="col-auto">
            <CloneIcon />
          </div>
          <div className="col text-truncate">Duplicate</div>
        </div> */}
        {wrapIfEnvBlocked(
          <div className={`mt-3 ${ddlRowClass}`} style={!canEditSchema ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
            <div className="col-auto" data-cy="delete-table-option-icon">
              <DeleteIcon />
            </div>
            <div
              className={ddlItemClass}
              data-cy="delete-table-option"
              onClick={() => {
                closeMenu();
                onDelete();
              }}
            >
              Delete table
            </div>
          </div>
        )}
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="bottom" rootClose onToggle={onMenuToggle} overlay={popover}>
      <div className={cx(`float-right cursor-pointer table-list-item-popover`)} data-cy="table-kebab-icon">
        <Menu width="20" height="20" />
      </div>
    </OverlayTrigger>
  );
};
