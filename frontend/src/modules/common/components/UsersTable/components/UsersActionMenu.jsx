import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { authenticationService } from '@/_services';

export default function UsersActionMenu({
  toggleEditUserDrawer,
  archivingUser,
  unarchivingUser,
  archiveOrgUser,
  unarchiveOrgUser,
  onOpen,
  user,
  onResetPasswordClick,
  resetPassword = false,
}) {
  const closeMenu = () => {
    document.body.click();
  };

  const currentSession = authenticationService.currentSessionValue;
  const currentUser = currentSession?.current_user?.email;

  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom-end"
      rootClose
      onToggle={(nextShow) => {
        if (onOpen) [nextShow ? onOpen(user) : onOpen(null)];
      }}
      overlay={
        <Popover id="popover-user-menu" className={darkMode && 'dark-theme'} style={{ transition: 'none' }}>
          <Popover.Body bsPrefix="popover-body">
            <div>
              <ButtonSolid
                onClick={() => {
                  closeMenu();
                  toggleEditUserDrawer();
                }}
                className="tj-text-xsm edit-user-btn"
                variant="tertiary"
                leftIcon="editable"
                iconWidth="12"
                data-cy="edit-user-details-button"
              >
                Edit user details
              </ButtonSolid>
              {resetPassword && user.email !== currentUser && (
                <ButtonSolid
                  onClick={() => {
                    closeMenu();
                    onResetPasswordClick();
                  }}
                  className="tj-text-xsm edit-user-btn"
                  variant="tertiary"
                  leftIcon="lock"
                  iconWidth="12"
                  data-cy="reset-password-button"
                >
                  Reset password
                </ButtonSolid>
              )}
              <ButtonSolid
                variant="tertiary"
                className="tj-text-xsm user-archive"
                disabled={unarchivingUser === user.id || archivingUser === user.id}
                leftIcon="archive"
                fill="#E54D2E"
                iconWidth="12"
                onClick={() => {
                  user.status === 'archived' ? unarchiveOrgUser(user) : archiveOrgUser(user);
                  closeMenu();
                }}
                data-cy="archive-button"
              >
                {user.status === 'archived' ? 'Unarchive user' : 'Archive user'}
              </ButtonSolid>
            </div>
          </Popover.Body>
        </Popover>
      }
    >
      <div className="user-actions-menu-container" data-cy="user-actions-button">
        <SolidIcon className="actions-menu-icon" name="morevertical" />
      </div>
    </OverlayTrigger>
  );
}
