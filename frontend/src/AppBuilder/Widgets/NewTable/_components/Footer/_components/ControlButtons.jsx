import React, { memo } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { Tooltip } from 'react-tooltip';
import { HideColumnsPopover } from './HideColumnsPopover';
import { DownloadPopover } from './DownloadPopover';
import { OverlayTriggerComponent } from './OverlayTriggerComponent';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';

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

  const hideColumnsPopover = () => <HideColumnsPopover table={table} darkMode={darkMode} height={height} />;

  const downlaodPopover = () => <DownloadPopover table={table} darkMode={darkMode} componentName={componentName} />;

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
