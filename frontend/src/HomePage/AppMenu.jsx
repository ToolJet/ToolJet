import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useTranslation } from 'react-i18next';

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
  currentFolder,
}) {
  const closeMenu = () => {
    document.body.click();
  };
  const { t } = useTranslation();
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
        <Popover id="popover-app-menu" className={darkMode && 'popover-dark-themed'}>
          <Popover.Content bsPrefix="popover-body">
            <div data-cy="card-options">
              {canUpdateApp && (
                <Field
                  text={t('homePage.appCard.changeIcon', 'Change Icon')}
                  onClick={() => openAppActionModal('change-icon')}
                />
              )}
              {canCreateApp && (
                <>
                  <Field
                    text={t('homePage.appCard.addToFolder', 'Add to folder')}
                    onClick={() => openAppActionModal('add-to-folder')}
                  />

                  {currentFolder.id && (
                    <Field
                      text={t('homePage.appCard.removeFromFolder', 'Remove from folder')}
                      onClick={() => openAppActionModal('remove-app-from-folder')}
                    />
                  )}
                  <Field text={t('homePage.appCard.cloneApp', 'Clone app')} onClick={cloneApp} />
                  <Field text={t('homePage.appCard.exportApp', 'Export app')} onClick={exportApp} />
                </>
              )}
              {canDeleteApp && (
                <Field
                  text={t('homePage.appCard.deleteApp', 'Delete app')}
                  customClass="field__danger"
                  onClick={deleteApp}
                />
              )}
            </div>
          </Popover.Content>
        </Popover>
      }
    >
      <div className={`d-grid menu-ico menu-ico${isMenuOpen ? '__open' : ''}`}>
        <img className="svg-icon" src="assets/images/icons/three-dots.svg" data-cy="app-card-menu-icon" />
      </div>
    </OverlayTrigger>
  );
};
