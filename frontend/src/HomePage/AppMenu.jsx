import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useTranslation } from 'react-i18next';

export const AppMenu = function AppMenu({
  deleteApp,
  exportApp,
  canCreateApp,
  canDeleteApp,
  canUpdateApp,
  onMenuOpen,
  openAppActionModal,
  darkMode,
  currentFolder,
}) {
  const { t } = useTranslation();
  const Field = ({ text, onClick, customClass }) => {
    const closeMenu = () => {
      document.body.click();
      onClick();
    };
    return (
      <div className={`field mb-3${customClass ? ` ${customClass}` : ''}`}>
        <span
          role="button"
          onClick={() => {
            closeMenu();
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
        <div>
          <Popover id="popover-app-menu" className={darkMode && 'dark-theme'} placement="bottom">
            <Popover.Body bsPrefix="popover-body">
              <div data-cy="card-options">
                {canUpdateApp && (
                  <Field
                    text={t('homePage.appCard.renameApp', 'Rename app')}
                    onClick={() => openAppActionModal('rename-app')}
                  />
                )}
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
                  </>
                )}
                {canUpdateApp && canCreateApp && (
                  <>
                    <Field
                      text={t('homePage.appCard.cloneApp', 'Clone app')}
                      onClick={() => openAppActionModal('clone-app')}
                    />
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
            </Popover.Body>
          </Popover>
        </div>
      }
    >
      <div className={'cursor-pointer menu-ico'} data-cy={`app-card-menu-icon`}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.8335 9.91667C12.8335 9.27233 13.3558 8.75 14.0002 8.75C14.6445 8.75 15.1668 9.27233 15.1668 9.91667C15.1668 10.561 14.6445 11.0833 14.0002 11.0833C13.3558 11.0833 12.8335 10.561 12.8335 9.91667ZM12.8335 14C12.8335 13.3557 13.3558 12.8333 14.0002 12.8333C14.6445 12.8333 15.1668 13.3557 15.1668 14C15.1668 14.6443 14.6445 15.1667 14.0002 15.1667C13.3558 15.1667 12.8335 14.6443 12.8335 14ZM12.8335 18.0833C12.8335 17.439 13.3558 16.9167 14.0002 16.9167C14.6445 16.9167 15.1668 17.439 15.1668 18.0833C15.1668 18.7277 14.6445 19.25 14.0002 19.25C13.3558 19.25 12.8335 18.7277 12.8335 18.0833Z"
            fill="#11181C"
          />
        </svg>
      </div>
    </OverlayTrigger>
  );
};
