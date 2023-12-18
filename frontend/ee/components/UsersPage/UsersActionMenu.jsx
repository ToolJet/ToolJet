import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export default function UsersActionMenu({
  toggleEditUserDrawer,
  archivingUser,
  unarchivingUser,
  archiveOrgUser,
  unarchiveOrgUser,
  user,
}) {
  const closeMenu = () => {
    document.body.click();
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom-end"
      rootClose
      overlay={
        <Popover id="popover-user-menu" className={darkMode && 'dark-theme'} style={{ transition: 'none' }}>
          <Popover.Body bsPrefix="popover-body">
            <div>
              <ButtonSolid
                onClick={() => {
                  closeMenu();
                  toggleEditUserDrawer();
                }}
                className="tj-text-xsm"
                variant="tertiary"
                leftIcon="editable"
                iconWidth="12"
              >
                Edit user details
              </ButtonSolid>
              <ButtonSolid
                variant="tertiary"
                className="tj-text-xsm user-archive"
                disabled={unarchivingUser === user.id || archivingUser === user.id}
                leftIcon="archive"
                fill="#E54D2E"
                iconWidth="12"
                onClick={() => {
                  user.status === 'archived' ? unarchiveOrgUser(user.id) : archiveOrgUser(user.id);
                }}
              >
                {user.status === 'archived' ? 'Unarchive' : 'Archive'}
              </ButtonSolid>
            </div>
          </Popover.Body>
        </Popover>
      }
    >
      <div className="user-actions-menu-container">
        <SolidIcon className="actions-menu-icon" name="morevertical" />
      </div>
    </OverlayTrigger>
  );
}
