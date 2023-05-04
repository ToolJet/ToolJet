import React from 'react';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useTranslation } from 'react-i18next';

export const FolderMenu = function FolderMenu({
  deleteFolder,
  editFolder,
  canDeleteFolder,
  canUpdateFolder,
  darkMode,
  dataCy = '',
}) {
  const [open, setOpen] = React.useState(false);
  const closeMenu = () => {
    document.body.click();
  };
  const Field = ({ text, onClick, customClass }) => {
    return (
      <div
        className={cx('field mb-3', {
          [customClass]: customClass,
        })}
      >
        <span
          role="button"
          onClick={() => {
            closeMenu();
            onClick();
          }}
          data-cy={`${String(dataCy + '-' + text)
            .toLowerCase()
            .replace(/\s+/g, '-')}-option`}
        >
          {text}
        </span>
      </div>
    );
  };
  const { t } = useTranslation();
  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom-end"
      rootClose
      onToggle={(isOpen) => {
        setOpen(isOpen);
      }}
      overlay={
        <Popover
          id="popover-app-menu"
          className={darkMode && 'dark-theme'}
          data-cy="folder-card"
          style={{ transition: 'none' }}
        >
          <Popover.Body bsPrefix="popover-body">
            <div>
              {canUpdateFolder && (
                <Field text={t('homePage.foldersSection.editFolder', 'Edit folder')} onClick={editFolder} />
              )}
              {canDeleteFolder && (
                <Field
                  text={t('homePage.foldersSection.deleteFolder', 'Delete folder')}
                  customClass="field__danger"
                  onClick={deleteFolder}
                />
              )}
            </div>
          </Popover.Body>
        </Popover>
      }
    >
      <div
        className={cx('folder-menu-icon', {
          'd-grid': open,
        })}
        data-cy={`${dataCy.toLowerCase().replace(/\s+/g, '-')}-card-menu-icon`}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.833 9.91667C12.833 9.27233 13.3553 8.75 13.9997 8.75C14.644 8.75 15.1663 9.27233 15.1663 9.91667C15.1663 10.561 14.644 11.0833 13.9997 11.0833C13.3553 11.0833 12.833 10.561 12.833 9.91667ZM12.833 14C12.833 13.3557 13.3553 12.8333 13.9997 12.8333C14.644 12.8333 15.1663 13.3557 15.1663 14C15.1663 14.6443 14.644 15.1667 13.9997 15.1667C13.3553 15.1667 12.833 14.6443 12.833 14ZM12.833 18.0833C12.833 17.439 13.3553 16.9167 13.9997 16.9167C14.644 16.9167 15.1663 17.439 15.1663 18.0833C15.1663 18.7277 14.644 19.25 13.9997 19.25C13.3553 19.25 12.833 18.7277 12.833 18.0833Z"
            fill="#11181C"
          />
        </svg>
      </div>
    </OverlayTrigger>
  );
};
