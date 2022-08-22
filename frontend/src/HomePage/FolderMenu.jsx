import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

export const FolderMenu = function FolderMenu({
  deleteFolder,
  editFolder,
  canDeleteFolder,
  canUpdateFolder,
  onMenuOpen,
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
          data-cy={`${text.toLowerCase().replace(/\s+/g, '-')}-card-option`}
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
        <Popover id="popover-app-menu" className={darkMode && 'popover-dark-themed'} data-cy="folder-card">
          <Popover.Content bsPrefix="popover-body">
            <div>
              {canUpdateFolder && <Field text="Edit folder" onClick={editFolder} />}
              {canDeleteFolder && <Field text="Delete folder" customClass="field__danger" onClick={deleteFolder} />}
            </div>
          </Popover.Content>
        </Popover>
      }
    >
      <div className={`d-grid menu-ico menu-ico`}>
        <img className="svg-icon" src="/assets/images/icons/three-dots.svg" data-cy="folder-card-menu-icon" />
      </div>
    </OverlayTrigger>
  );
};
