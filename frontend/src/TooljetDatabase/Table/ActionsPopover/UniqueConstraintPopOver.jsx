/* eslint-disable react/jsx-key */
import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import DeleteIcon from '../../Icons/DeleteIcon.svg';
import { ToolTip } from '@/_components/ToolTip';
import Information from '@/_ui/Icon/solidIcons/Information';
// eslint-disable-next-line no-unused-vars
export const UniqueConstraintPopOver = ({
  disabled,
  children,
  onDelete,
  darkMode,
  columns,
  setColumns,
  index,
  isEditMode,
}) => {
  if (disabled) return children;
  const toolTipPlacementStyle = {
    width: '126px',
  };

  const showUniqueConstraintInfo = () => {
    const numberOfPrimaryKeys = Object.values(columns).reduce((count, column) => {
      if (column.constraints_type?.is_primary_key) {
        return count + 1;
      }
      return count;
    }, 0);
    return numberOfPrimaryKeys >= 2;
  };

  const popover = (
    <Popover className={`create-table-list-items ${darkMode && 'dark-theme'}`}>
      <Popover.Body>
        <div className="unique-constraint-parent">
          {showUniqueConstraintInfo() && (
            <div className="unique-constraint-info">
              <Information width={16} viewBox="0 0 24 24" fill="var(--indigo9)" />
              <span className="tj-text-xxsm">
                Unique constraint will be added to combinations of values of a composite primary key
              </span>
            </div>
          )}
          <div className="column-popover row cursor-pointer p-1">
            <ToolTip
              message={
                columns[index]?.constraints_type?.is_primary_key === true
                  ? 'Primary key values must be unique'
                  : columns[index]?.data_type === 'serial' && columns[index]?.constraints_type?.is_primary_key !== true
                  ? 'Serial data type value must be unique'
                  : null
              }
              placement="top"
              tooltipClassName="tootip-table"
              style={toolTipPlacementStyle}
              show={
                columns[index]?.constraints_type?.is_primary_key === true ||
                (columns[index]?.data_type === 'serial' && columns[index]?.constraints_type?.is_primary_key !== true)
              }
            >
              <div className="d-flex not-null-toggle">
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={
                      isEditMode &&
                      columns[index]?.constraints_type?.is_unique === false &&
                      columns[index]?.constraints_type?.is_primary_key
                        ? true
                        : columns[index]?.data_type === 'boolean'
                        ? false
                        : columns[index]?.constraints_type?.is_unique
                        ? true
                        : false
                    }
                    onChange={(e) => {
                      const prevColumns = { ...columns };
                      const columnConstraints = prevColumns[index]?.constraints_type ?? {};
                      columnConstraints.is_unique = e.target.checked;
                      prevColumns[index].constraints_type = { ...columnConstraints };
                      setColumns(prevColumns);
                    }}
                    disabled={
                      columns[index]?.constraints_type?.is_primary_key === true ||
                      columns[index]?.data_type === 'serial' ||
                      columns[index]?.data_type === 'boolean'
                    }
                  />
                </label>
                <div>
                  <div className="tj-text-xsm unique-tag">
                    {columns[index]?.constraints_type?.is_primary_key || columns[index]?.constraints_type?.is_unique
                      ? 'UNIQUE'
                      : 'NOT UNIQUE'}
                  </div>
                  <div className="tj-text-xsm">
                    {columns[index]?.constraints_type?.is_primary_key || columns[index]?.constraints_type?.is_unique
                      ? 'Unique value constraint is added'
                      : 'Unique value constraint is not added'}
                  </div>
                </div>
              </div>
            </ToolTip>
          </div>
          {/* <div className="col unique-helper-text px-2 py-1">
            {columns[index]?.constraints_type?.is_primary_key || columns[index]?.constraints_type?.is_unique
              ? 'Unique value constraint is added'
              : 'Unique value constraint is not added'}
          </div> */}
        </div>

        <hr />

        <div className="column-popover delete-column-table-creation cursor-pointer p-1 mt-2" onClick={onDelete}>
          <div data-cy="delete-column-option-icon">
            <DeleteIcon width="14" height="15" />
          </div>
          <div className="text-truncate text-danger delete-column-text" data-cy="delete-column-option">
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
