import React from 'react';
import { Link } from 'react-router-dom';
import { authenticationService } from '@/_services';
import Avatar from '@/_ui/Avatar';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { useTranslation } from 'react-i18next';
import { ToolTip } from '@/_components/ToolTip';
import { getPrivateRoute } from '@/_helpers/routes';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const Profile = function Header({ darkMode, checkForUnsavedChanges }) {
  const currentSession = authenticationService.currentSessionValue;
  const [currentUser, setCurrentUser] = React.useState({
    first_name: currentSession?.current_user.first_name,
    last_name: currentSession?.current_user.last_name,
    avatar_id: currentSession?.current_user.avatar_id,
  });
  const { t } = useTranslation();

  function logout() {
    authenticationService.logout();
  }

  function getUserDetails() {
    authenticationService.getUserDetails().then((currentUser) => {
      const { firstName, lastName, avatarId } = currentUser;
      setCurrentUser({ first_name: firstName, last_name: lastName, avatar_id: avatarId });
    });
  }

  React.useEffect(() => {
    const observable = authenticationService.currentSession.subscribe((session) => {
      if (session.isUserUpdated) {
        getUserDetails();
        authenticationService.updateCurrentSession({ ...session, isUserUpdated: false });
      }
    });

    () => observable.unsubscribe();
  }, []);

  const getOverlay = () => {
    return (
      <div className={`profile-card card ${darkMode && 'dark-theme'}`}>
        <Link
          data-testid="settingsBtn"
          onClick={(event) => checkForUnsavedChanges(getPrivateRoute('settings'), event)}
          to={getPrivateRoute('settings')}
          className="dropdown-item tj-text-xsm"
          data-cy="profile-link"
        >
          <SolidIcon name="user" width="20" />

          <span>{t('header.profile', 'Profile')}</span>
        </Link>

        <Link
          data-testid="logoutBtn"
          to="#"
          onClick={logout}
          className="dropdown-item text-danger tj-text-xsm"
          data-cy="logout-link"
        >
          <SolidIcon name="logout" width="20" />

          <span>{t('header.logout', 'Logout')}</span>
        </Link>
      </div>
    );
  };

  return (
    <OverlayTrigger trigger="click" placement={'right'} rootClose={true} overlay={getOverlay()}>
      <div className="user-avatar-nav-item cursor-pointer">
        <ToolTip message="Profile">
          <div className="d-xl-block" data-cy="profile-settings">
            <Avatar
              avatarId={currentUser?.avatar_id}
              text={`${currentUser?.first_name ? currentUser?.first_name[0] : ''}${
                currentUser?.last_name ? currentUser?.last_name[0] : ''
              }`}
            />
          </div>
        </ToolTip>
      </div>
    </OverlayTrigger>
  );
};
