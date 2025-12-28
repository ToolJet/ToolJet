import React, { memo } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { Tooltip } from 'react-tooltip';
import { OverlayTriggerComponent } from './OverlayTriggerComponent';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import Popover from 'react-bootstrap/Popover';
import { exportToCSV, exportToExcel, exportToPDF } from '@/AppBuilder/Widgets/NewTable/_utils/exportData';

export const ControlButtons = memo(
  ({ id, table, darkMode, height, componentName, showAddNewRowPopup, setShowAddNewRowPopup, fireEvent }) => {
    const showAddNewRowButton = useTableStore((state) => state.getTableProperties(id)?.showAddNewRowButton, shallow);
    const showDownloadButton = useTableStore((state) => state.getTableProperties(id)?.showDownloadButton, shallow);
    const hideColumnSelectorButton = useTableStore(
      (state) => state.getTableProperties(id)?.hideColumnSelectorButton,
      shallow
    );
    const clientSidePagination = useTableStore((state) => state.getTableProperties(id)?.clientSidePagination, shallow);
    const hasDownloadEvent = useTableStore((state) => state.getHasDownloadEvent(id), shallow);

    const RenderButton = ({ icon, tooltipId, tooltipContent, className, label, fill, ...restProps }) => {
      return (
        <ButtonSolid
          variant="tertiary"
          className={`tj-text-sm !tw-text-[var(--cc-primary-text)] ${className}`}
          customStyles={{
            minWidth: '32px',
          }}
          leftIcon={icon}
          fill={fill || 'var(--cc-primary-icon, var(--cc-default-icon))'}
          iconWidth="16"
          isTablerIcon={true}
          size="md"
          data-tooltip-id={tooltipId}
          data-tooltip-content={tooltipContent}
          {...restProps}
        >
          {label}
        </ButtonSolid>
      );
    };

    const renderOverlay = (icon, callBack, tooltipId, tooltipContent) => {
      const onClick = (e) => {
        if (document.activeElement === e.currentTarget) {
          e.currentTarget.blur();
        }
      };

      return (
        <OverlayTriggerComponent
          id={id}
          trigger="click"
          overlay={callBack()}
          rootClose={true}
          placement={'top-end'}
          tooltipId={tooltipId}
        >
          <RenderButton icon={icon} onClick={onClick} tooltipId={tooltipId} tooltipContent={tooltipContent} />
        </OverlayTriggerComponent>
      );
    };

    // Haven't seperated this into a separate component because of UI issues
    const hideColumnsPopover = () => (
      <Popover
        data-cy={`dropdown-hide-column`}
        className={`table-widget-popup hide-column-popup ${darkMode && 'dark-theme'}`}
        style={{ maxHeight: `${height - 79}px` }}
        placement="top-end"
      >
        <Popover.Body>
          <RenderButton
            label="Selects All"
            data-cy={`options-select-all-coloumn`}
            onClick={table.getToggleAllColumnsVisibilityHandler()}
            icon={table.getIsAllColumnsVisible() ? 'tickv3' : ''}
            fill="var(--cc-primary-brand)"
            isTablerIcon={false}
            variant="ghostBlack"
            className={`tw-w-full justify-content-start tw-pr-[6px] ${
              table.getIsAllColumnsVisible() ? 'tw-pl-[12px]' : 'tw-pl-[36px]'
            }`}
          />
          {table.getAllLeafColumns().map((column) => {
            const header = column?.columnDef?.header;
            return (
              typeof header === 'string' && (
                <RenderButton
                  key={column.id}
                  label={header}
                  data-cy={`options-coloumn-${String(header).toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={column.getToggleVisibilityHandler()}
                  icon={column.getIsVisible() ? 'tickv3' : ''}
                  fill="var(--cc-primary-brand)"
                  isTablerIcon={false}
                  variant="ghostBlack"
                  className={`tw-w-full justify-content-start tw-pr-[6px] ${
                    column.getIsVisible() ? 'tw-pl-[12px]' : 'tw-pl-[36px]'
                  }`}
                />
              )
            );
          })}
        </Popover.Body>
      </Popover>
    );

    // Haven't seperated this into a separate component because of UI issues
    const downlaodPopover = () => (
      <Popover
        id="popover-basic"
        data-cy="popover-card"
        className={`table-widget-popup download-popup ${darkMode && 'dark-theme'}`}
        placement="top-end"
      >
        <Popover.Body>
          <RenderButton
            label="Download as CSV"
            data-cy={`option-download-CSV`}
            onClick={() => exportToCSV(table, componentName)}
            variant="ghostBlack"
            className="tw-w-full justify-content-start tw-px-[8px]"
          />
          <RenderButton
            label="Download as Excel"
            data-cy={`option-download-execel`}
            onClick={() => exportToExcel(table, componentName)}
            variant="ghostBlack"
            className="tw-w-full justify-content-start tw-px-[8px]"
          />
          <RenderButton
            label="Download as PDF"
            data-cy={`option-download-pdf`}
            onClick={() => exportToPDF(table, componentName)}
            variant="ghostBlack"
            className="tw-w-full justify-content-start tw-px-[8px]"
          />
        </Popover.Body>
      </Popover>
    );

    const renderAddRowButton = () => {
      return (
        <>
          <span>
            <Tooltip id="tooltip-for-add-new-row" className="tooltip" />
            <RenderButton
              icon="IconPlus"
              onClick={() => setShowAddNewRowPopup(true)}
              tooltipId="tooltip-for-add-new-row"
              tooltipContent="Add new row"
              className={`${showAddNewRowPopup && 'always-active-btn'}`}
            />
          </span>
        </>
      );
    };

    const renderDownloadButton = () => {
      // if server side pagination is enabled and download event is associated with the table, then directly fire download event without displaying popover
      if (hasDownloadEvent && !clientSidePagination) {
        const onClick = () => {
          fireEvent('onTableDataDownload');
        };
        return (
          <>
            <Tooltip id="tooltip-for-download-serverside-pagingation" className="tooltip" />
            <RenderButton
              icon="IconFileDownload"
              onClick={onClick}
              tooltipId="tooltip-for-download-serverside-pagingation"
              tooltipContent="Download"
            />
          </>
        );
      }

      return renderOverlay('IconFileDownload', downlaodPopover, 'tooltip-for-download', 'Download');
    };

    const renderColumnSelectorButton = () => {
      return renderOverlay('IconFreezeColumn', hideColumnsPopover, 'tooltip-for-manage-columns', 'Manage columns');
    };

    const btns = [];

    if (showAddNewRowButton) btns.push(renderAddRowButton());
    if (showDownloadButton) btns.push(renderDownloadButton());
    if (!hideColumnSelectorButton) btns.push(renderColumnSelectorButton());

    return (
      <div className="d-flex footer-control-btns">
        {btns.map((btnEl, index) => {
          return (
            <div key={index} data-index={index} data-last={index === btns.length - 1}>
              {btnEl}
            </div>
          );
        })}
      </div>
    );
  }
);
