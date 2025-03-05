import React, { memo } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { Tooltip } from 'react-tooltip';
import { OverlayTriggerComponent } from './OverlayTriggerComponent';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import IndeterminateCheckbox from '../../IndeterminateCheckbox';
import Popover from 'react-bootstrap/Popover';
import { exportToCSV, exportToExcel, exportToPDF } from '@/AppBuilder/Widgets/NewTable/_utils/exportData';

export const ControlButtons = memo(({ id, table, darkMode, height, componentName, setShowAddNewRowPopup }) => {
  const showAddNewRowButton = useTableStore((state) => state.getTableProperties(id)?.showAddNewRowButton, shallow);
  const showDownloadButton = useTableStore((state) => state.getTableProperties(id)?.showDownloadButton, shallow);
  const hideColumnSelectorButton = useTableStore(
    (state) => state.getTableProperties(id)?.hideColumnSelectorButton,
    shallow
  );

  const renderOverlay = (id, icon, callBack, tooltipId, tooltipContent) => {
    return (
      <>
        <Tooltip id={tooltipId} className="tooltip" />
        <OverlayTriggerComponent trigger="click" overlay={callBack()} rootClose={true} placement={'top-end'}>
          <ButtonSolid
            variant="ghostBlack"
            className={`tj-text-xsm `}
            customStyles={{
              minWidth: '32px',
            }}
            leftIcon={icon}
            fill={`var(--icons-default)`}
            iconWidth="16"
            size="md"
            data-tooltip-id={tooltipId}
            data-tooltip-content={tooltipContent}
            onClick={(e) => {
              if (document.activeElement === e.currentTarget) {
                e.currentTarget.blur();
              }
            }}
          ></ButtonSolid>
        </OverlayTriggerComponent>
      </>
    );
  };

  // Haven't seperated this into a separate component because of UI issues
  const hideColumnsPopover = () => (
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

  // Haven't seperated this into a separate component because of UI issues
  const downlaodPopover = () => (
    <Popover
      id="popover-basic"
      data-cy="popover-card"
      className={`${darkMode && 'dark-theme'} shadow table-widget-download-popup`}
      placement="top-end"
    >
      <Popover.Body className="p-0">
        <div className="table-download-option cursor-pointer">
          <span
            data-cy={`option-download-CSV`}
            className="cursor-pointer"
            onClick={() => exportToCSV(table, componentName)}
          >
            Download as CSV
          </span>
          <span
            data-cy={`option-download-execel`}
            className="pt-2 cursor-pointer"
            onClick={() => exportToExcel(table, componentName)}
          >
            Download as Excel
          </span>
          <span
            data-cy={`option-download-pdf`}
            className="pt-2 cursor-pointer"
            onClick={() => exportToPDF(table, componentName)}
          >
            Download as PDF
          </span>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <div className="col d-flex justify-content-end ">
      {showAddNewRowButton && (
        <>
          <Tooltip id="tooltip-for-add-new-row" className="tooltip" />
          <ButtonSolid
            variant="ghostBlack"
            fill={`var(--icons-default)`}
            className={'tj-text-xsm'}
            customStyles={{ minWidth: '32px' }}
            leftIcon="plus"
            iconWidth="16"
            onClick={() => {
              setShowAddNewRowPopup(true);
            }}
            size="md"
            data-tooltip-id="tooltip-for-add-new-row"
            data-tooltip-content="Add new row"
          ></ButtonSolid>
        </>
      )}
      {showDownloadButton && renderOverlay(id, 'filedownload', downlaodPopover, 'tooltip-for-download', 'Download')}
      {!hideColumnSelectorButton &&
        renderOverlay(id, 'eye1', hideColumnsPopover, 'tooltip-for-manage-columns', 'Manage columns')}
    </div>
  );
});
