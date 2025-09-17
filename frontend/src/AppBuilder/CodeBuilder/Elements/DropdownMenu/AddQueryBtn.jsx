import React, { useRef, useEffect } from 'react';
import useShowPopover from '@/_hooks/useShowPopover';
import useStore from '@/AppBuilder/_stores/store';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import DataSourceSelect from '@/AppBuilder/QueryManager/Components/DataSourceSelect';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const AddQueryBtn = ({ darkMode, disabled: _disabled, onQueryCreate }) => {
  const [showMenu, setShowMenu] = useShowPopover(
    false,
    '#component-data-query-add-popover',
    '#component-data-query-add-popover-btn'
  );
  const selectRef = useRef();
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const disabled = _disabled || shouldFreeze;

  useEffect(() => {
    if (showMenu) {
      selectRef.current.focus();
    }
  }, [showMenu]);

  return (
    <OverlayTrigger
      show={showMenu && !disabled}
      placement="left"
      arrowOffsetTop={90}
      arrowOffsetLeft={90}
      overlay={
        <Popover
          key={'page.i'}
          id="component-data-query-add-popover"
          className={`${darkMode && 'popover-dark-themed dark-theme tj-dark-mode'}`}
          style={{ width: '244px', maxWidth: '246px' }}
        >
          <DataSourceSelect
            selectRef={selectRef}
            darkMode={darkMode}
            closePopup={() => setShowMenu(false)}
            onQueryCreate={onQueryCreate}
          />
        </Popover>
      }
    >
      <span className="col-auto" id="component-data-query-add-popover-btn">
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (disabled) {
              return;
            }
            setShowMenu((show) => !show);
          }}
          className="tw-flex tw-items-center tw-w-full tw-text-left dropdown-menu-item"
        >
          <span style={{ width: '16px', height: '16px' }} />
          <span className="icon-image tw-flex tw-items-center">
            <SolidIcon name="file-code" width={16} height={16} />
          </span>
          <span>Add new query</span>
          <span style={{ marginLeft: 'auto' }}>
            <SolidIcon name="rightarrrow" width={16} height={16} />
          </span>
        </div>
      </span>
    </OverlayTrigger>
  );
};

export default AddQueryBtn;
