import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

export const AppMenu = function AppMenu({
  deleteApp,
  cloneApp,
  exportApp,
  canCreateApp,
  canDeleteApp,
  canUpdateApp,
  onMenuOpen,
  isMenuOpen,
  openAppActionModal,
  darkMode,
}) {
  const closeMenu = () => {
    document.body.click();
  };
  const Field = ({ text, onClick, customClass }) => {
    return (
      <div className={`field mb-3${customClass ? ` ${customClass}` : ''}`}>
        <span
          role="button"
          onClick={() => {
            closeMenu();
            onClick();
          }}
        >
          {text}
        </span>
      </div>
    );
  };

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom-end"
      rootClose
      onToggle={onMenuOpen}
      overlay={
        <Popover id="popover-app-menu" className={darkMode && 'popover-dark-themed'}>
          <Popover.Content bsPrefix="popover-body">
            <div>
              {canUpdateApp && <Field text="Change icon" onClick={() => openAppActionModal('change-icon')} />}
              {canCreateApp && (
                <>
                  <Field text="Add to folder" onClick={() => openAppActionModal('add-to-folder')} />
                  <Field text="Clone app" onClick={cloneApp} />
                  <Field text="Export app" onClick={exportApp} />
                </>
              )}
              {canDeleteApp && <Field text="Delete app" customClass="field__danger" onClick={deleteApp} />}
            </div>
          </Popover.Content>
        </Popover>
      }
    >
      <div className={`d-grid menu-ico menu-ico${isMenuOpen ? '__open' : ''}`}>
        <img className="svg-icon" src="/assets/images/icons/three-dots.svg" />
      </div>
    </OverlayTrigger>
  );
};
