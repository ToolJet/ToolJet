import React from 'react';
import { Link } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { history } from '@/_helpers';
import Avatar from '@/_ui/Avatar';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { useTranslation } from 'react-i18next';
import { ToolTip } from '@/_components/ToolTip';

export const Profile = function Header({ switchDarkMode, darkMode }) {
  const { first_name, last_name, avatar_id } = authenticationService.currentUserValue;
  const { t } = useTranslation();

  function logout() {
    authenticationService.logout();
    history.push('/login');
  }

  const getOverlay = () => {
    return (
      <div className={`profile-card card ${darkMode && 'dark'}`}>
        <Link data-testid="settingsBtn" to="/settings" className="dropdown-item" data-cy="profile-link">
          <svg
            className="icon mx-1"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6 2C5.17157 2 4.5 2.67157 4.5 3.5C4.5 4.32843 5.17157 5 6 5C6.82843 5 7.5 4.32843 7.5 3.5C7.5 2.67157 6.82843 2 6 2ZM3.5 3.5C3.5 2.11929 4.61929 1 6 1C7.38071 1 8.5 2.11929 8.5 3.5C8.5 4.88071 7.38071 6 6 6C4.61929 6 3.5 4.88071 3.5 3.5Z"
              fill="#C1C8CD"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5 8C4.60218 8 4.22064 8.15804 3.93934 8.43934C3.65804 8.72064 3.5 9.10217 3.5 9.5V10.5C3.5 10.7761 3.27614 11 3 11C2.72386 11 2.5 10.7761 2.5 10.5V9.5C2.5 8.83696 2.76339 8.20107 3.23223 7.73223C3.70107 7.26339 4.33696 7 5 7H7C7.66304 7 8.29893 7.26339 8.76777 7.73223C9.23661 8.20107 9.5 8.83696 9.5 9.5V10.5C9.5 10.7761 9.27614 11 9 11C8.72386 11 8.5 10.7761 8.5 10.5V9.5C8.5 9.10218 8.34196 8.72064 8.06066 8.43934C7.77936 8.15804 7.39782 8 7 8H5Z"
              fill="#C1C8CD"
            />
          </svg>

          {t('header.profile', 'Profile')}
        </Link>
        <div className="dropdown-item cursor-pointer" onClick={() => switchDarkMode(!darkMode)}>
          <svg
            className="icon mx-1"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.07911 2.10377C4.68117 2.19802 4.29824 2.35316 3.94435 2.56531C3.32328 2.93762 2.81493 3.47153 2.47351 4.1101C2.13209 4.74867 1.97042 5.46794 2.00574 6.19119C2.04106 6.91444 2.27204 7.61454 2.67405 8.2168C3.07606 8.81907 3.63402 9.30091 4.28841 9.61094C4.94279 9.92096 5.66907 10.0475 6.38975 9.97716C7.11043 9.90678 7.79849 9.64209 8.38054 9.21132C8.66502 9.00078 8.91896 8.75443 9.1367 8.47949C8.57316 8.53111 8.00077 8.47005 7.45382 8.29504C6.50735 7.9922 5.69693 7.36727 5.16343 6.52889C4.62992 5.69051 4.40707 4.69168 4.53361 3.70604C4.60671 3.13658 4.79378 2.59232 5.07911 2.10377ZM6.06316 1.00009H6.19639C6.40197 1.00009 6.58659 1.12592 6.66176 1.31726C6.73694 1.50859 6.68734 1.72644 6.53674 1.86638C5.98005 2.38365 5.62223 3.07964 5.52547 3.83337C5.4287 4.5871 5.59912 5.35091 6.00709 5.99203C6.41507 6.63314 7.0348 7.11103 7.75857 7.34261C8.48234 7.5742 9.26437 7.54484 9.96874 7.25964C10.1556 7.18398 10.3697 7.22795 10.5116 7.37116C10.6535 7.51438 10.6955 7.72881 10.6181 7.91498C10.2707 8.75081 9.70299 9.47667 8.97543 10.0151C8.24787 10.5536 7.3878 10.8844 6.48694 10.9724C5.58609 11.0604 4.67825 10.9022 3.86026 10.5146C3.04228 10.1271 2.34483 9.52482 1.84232 8.77198C1.33981 8.01915 1.05108 7.14403 1.00693 6.23997C0.962781 5.3359 1.16487 4.43681 1.59164 3.6386C2.01841 2.84039 2.65386 2.173 3.43019 1.70761C4.20653 1.24223 5.09463 0.996312 5.99977 0.996094C6.02103 0.996089 6.04229 0.997438 6.06316 1.00009Z"
              fill="#C1C8CD"
            />
          </svg>

          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </div>
        <Link
          data-testid="logoutBtn"
          to="#"
          onClick={logout}
          className="dropdown-item text-danger"
          data-cy="logout-link"
        >
          <svg
            className="icon mx-1"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.43934 1.93934C1.72064 1.65804 2.10218 1.5 2.5 1.5H6C6.39782 1.5 6.77936 1.65804 7.06066 1.93934C7.34196 2.22064 7.5 2.60217 7.5 3V4C7.5 4.27614 7.27614 4.5 7 4.5C6.72386 4.5 6.5 4.27614 6.5 4V3C6.5 2.86739 6.44732 2.74021 6.35355 2.64645C6.25979 2.55268 6.13261 2.5 6 2.5H2.5C2.36739 2.5 2.24021 2.55268 2.14645 2.64645C2.05268 2.74021 2 2.86739 2 3V9C2 9.13261 2.05268 9.25979 2.14645 9.35355C2.24021 9.44732 2.36739 9.5 2.5 9.5H6C6.13261 9.5 6.25978 9.44732 6.35355 9.35355C6.44732 9.25978 6.5 9.13261 6.5 9V8C6.5 7.72386 6.72386 7.5 7 7.5C7.27614 7.5 7.5 7.72386 7.5 8V9C7.5 9.39783 7.34196 9.77936 7.06066 10.0607C6.77936 10.342 6.39783 10.5 6 10.5H2.5C2.10217 10.5 1.72064 10.342 1.43934 10.0607C1.15804 9.77936 1 9.39782 1 9V3C1 2.60218 1.15804 2.22064 1.43934 1.93934ZM8.64645 4.14645C8.84171 3.95118 9.15829 3.95118 9.35355 4.14645L10.8536 5.64645C11.0488 5.84171 11.0488 6.15829 10.8536 6.35355L9.35355 7.85355C9.15829 8.04882 8.84171 8.04882 8.64645 7.85355C8.45118 7.65829 8.45118 7.34171 8.64645 7.14645L9.29289 6.5H3.5C3.22386 6.5 3 6.27614 3 6C3 5.72386 3.22386 5.5 3.5 5.5H9.29289L8.64645 4.85355C8.45118 4.65829 8.45118 4.34171 8.64645 4.14645Z"
              fill="#E54D2E"
            />
          </svg>

          {t('header.logout', 'Logout')}
        </Link>
      </div>
    );
  };

  return (
    <OverlayTrigger trigger="click" placement={'right'} rootClose={true} overlay={getOverlay()}>
      <div className="user-avatar-nav-item cursor-pointer">
        <ToolTip message="Profile">
          <div className="d-xl-block" data-cy="user-menu">
            <Avatar avatarId={avatar_id} text={`${first_name ? first_name[0] : ''}${last_name ? last_name[0] : ''}`} />
          </div>
        </ToolTip>
      </div>
    </OverlayTrigger>
  );
};
