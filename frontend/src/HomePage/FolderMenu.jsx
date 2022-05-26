import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

export const FolderMenu = function FolderMenu({
  deleteFolder,
  canDeleteApp = true,
  canUpdateApp = true,
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
            <div data-cy="card-options">
              {canUpdateApp && <Field text="Edit folder" onClick={() => openAppActionModal('edit-folder')} />}
              {canDeleteApp && <Field text="Delete folder" customClass="field__danger" onClick={deleteFolder} />}
            </div>
          </Popover.Content>
        </Popover>
      }
    >
      <div className={`d-grid menu-ico menu-ico${isMenuOpen ? '__open' : ''}`}>
        <img className="svg-icon" src="/assets/images/icons/three-dots.svg" data-cy="folder-item-menu-icon" />
      </div>
    </OverlayTrigger>
  );
};
