import React from 'react';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useTranslation } from 'react-i18next';

const CLOSE_EVENT = 'folder-menu:close';

export const FolderMenu = function FolderMenu({
  deleteFolder,
  editFolder,
  canDeleteFolder,
  canUpdateFolder,
  darkMode,
  dataCy = '',
}) {
  const menuId = React.useRef(Math.random());
  const [open, setOpen] = React.useState(false);

  const handleToggle = (isOpen) => {
    if (isOpen) {
      // Broadcast to all other menus to close
      window.dispatchEvent(new CustomEvent(CLOSE_EVENT, { detail: { id: menuId.current } }));
    }
    setOpen(isOpen);
  };

  const handleHide = () => {
    setOpen(false);
  };

  React.useEffect(() => {
    const handleCloseOthers = (e) => {
      if (e.detail.id !== menuId.current) {
        setOpen(false);
      }
    };
    window.addEventListener(CLOSE_EVENT, handleCloseOthers);
    return () => window.removeEventListener(CLOSE_EVENT, handleCloseOthers);
  }, []);

  const Field = ({ text, onClick, customClass }) => {
    return (
      <div
        role="button"
        onClick={() => {
          handleHide();
          onClick();
        }}
        className={cx('field mb-3', {
          [customClass]: customClass,
        })}
      >
        <span
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
      show={open}
      onToggle={handleToggle}
      onHide={handleHide}
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
