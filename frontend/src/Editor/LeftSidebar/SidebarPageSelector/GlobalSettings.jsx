import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import MenuIcon from '@assets/images/icons/3dots-menu.svg';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';

export const GlobalSettings = ({ darkMode, showHideViewerNavigationControls, showPageViwerPageNavitation }) => {
  const { isVersionReleased, enableReleasedVersionPopupState } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      enableReleasedVersionPopupState: state.actions.enableReleasedVersionPopupState,
    }),
    shallow
  );

  const onChange = () => {
    if (isVersionReleased) {
      enableReleasedVersionPopupState();
      return;
    }
    showHideViewerNavigationControls();
  };

  return (
    <OverlayTrigger
      trigger={'click'}
      placement={'bottom-end'}
      rootClose={true}
      overlay={
        <Popover id="page-handler-menu" className={`global-settings ${darkMode && 'popover-dark-themed'}`}>
          <Popover.Body bsPrefix="popover-body">
            <div className="card-body">
              <label htmlFor="pin" className="form-label" data-cy={`page-settings-header`}>
                Settings
              </label>
              <hr style={{ margin: '0.75rem 0' }} />
              <div className="menu-options mb-0">
                <Toggle onChange={onChange} value={!showPageViwerPageNavitation} />
              </div>
            </div>
          </Popover.Body>
        </Popover>
      }
    >
      <span>
        <MenuIcon width="10" height="16" data-cy={'menu-icon'} />
      </span>
    </OverlayTrigger>
  );
};

const Toggle = ({ onChange, value = true }) => {
  return (
    <div className="form-check form-switch">
      <input
        data-cy={`disable-page-menu-toggle`}
        className="form-check-input"
        type="checkbox"
        onClick={(e) => {
          e.stopPropagation();
          onChange();
        }}
        checked={value}
      />
      <span className="form-check-label" data-cy={`disable-page-menu-label`}>
        Disable Menu
      </span>

      <div className="toggle-info">
        <small className="secondary-text" data-cy={`disable-page-menu-description`}>
          To hide the page navigation sidebar in viewer mode, set this option to on.
        </small>
      </div>
    </div>
  );
};
