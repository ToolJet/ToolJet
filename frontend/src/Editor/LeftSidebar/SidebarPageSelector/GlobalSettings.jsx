import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { Button } from '@/_ui/LeftSidebar';

export const GlobalSettings = ({
  darkMode,
  handlePopoverPinnedState,
  showHideViewerNavigationControls,
  showPageViwerPageNavitation,
}) => {
  const onChange = () => {
    showHideViewerNavigationControls();
  };

  return (
    <OverlayTrigger
      trigger={'click'}
      placement={'bottom-end'}
      rootClose={true}
      onToggle={handlePopoverPinnedState}
      overlay={
        <Popover id="page-handler-menu" className={`global-settings ${darkMode && 'popover-dark-themed'}`}>
          <Popover.Content bsPrefix="popover-body">
            <div className="card-body">
              <label htmlFor="pin" className="form-label">
                Settings
              </label>
              <hr style={{ margin: '0.75rem 0' }} />
              <div className="menu-options mb-0">
                <Toggle onChange={onChange} value={!showPageViwerPageNavitation} />
              </div>
            </div>
          </Popover.Content>
        </Popover>
      }
    >
      <Button darkMode={darkMode} onClick={null} size="sm" styles={{ width: '28px', padding: 0 }}>
        <Button.Content iconSrc="assets/images/icons/editor/left-sidebar/settings.svg" />
      </Button>
    </OverlayTrigger>
  );
};

const Toggle = ({ onChange, value = true }) => {
  return (
    <div className="form-check form-switch">
      <input
        className="form-check-input"
        type="checkbox"
        onClick={(e) => {
          e.stopPropagation();
          onChange();
        }}
        checked={value}
      />
      <span className="form-check-label">Disable Menu</span>

      <div className="toggle-info">
        <small className="secondary-text">
          To hide the page navigation sidebar in viwer mode, set this option to on.
        </small>
      </div>
    </div>
  );
};
