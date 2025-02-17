import React, { memo } from 'react';
import IndeterminateCheckbox from '../../IndeterminateCheckbox';
import Popover from 'react-bootstrap/Popover';

export const HideColumnsPopover = memo(({ table, darkMode, height }) => {
  return (
    <Popover className={`${darkMode && 'dark-theme'}`} style={{ maxHeight: `${height - 79}px`, overflowY: 'auto' }}>
      <div
        data-cy={`dropdown-hide-column`}
        className={`dropdown-table-column-hide-common ${
          darkMode ? 'dropdown-table-column-hide-dark-themed dark-theme' : 'dropdown-table-column-hide'
        } `}
        placement="top-end"
      >
        <div className="dropdown-item cursor-pointer">
          <IndeterminateCheckbox
            checked={table.getIsAllColumnsVisible()}
            onChange={table.getToggleAllColumnsVisibilityHandler()}
          />
          <span className="hide-column-name tj-text-xsm" data-cy={`options-select-all-coloumn`}>
            Selects All
          </span>
        </div>
        {table.getAllLeafColumns().map((column) => {
          const header = column?.columnDef?.header;
          return (
            typeof header === 'string' && (
              <div key={column.id}>
                <div>
                  <label className="dropdown-item d-flex cursor-pointer">
                    <input
                      type="checkbox"
                      data-cy={`checkbox-coloumn-${String(header).toLowerCase().replace(/\s+/g, '-')}`}
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                    />
                    <span
                      className="hide-column-name tj-text-xsm"
                      data-cy={`options-coloumn-${String(header).toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {` ${header}`}
                    </span>
                  </label>
                </div>
              </div>
            )
          );
        })}
      </div>
    </Popover>
  );
});
