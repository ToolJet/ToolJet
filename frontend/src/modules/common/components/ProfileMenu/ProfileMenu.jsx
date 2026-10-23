import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import { authenticationService, appService, sessionService } from '@/_services';
import { teardownFrontendMetrics } from '@/_services/frontend-metrics.service';
import { getPrivateRoute } from '@/_helpers/routes';

const avatarClassName =
  'tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-interactive-default tw-font-body-default tw-text-text-placeholder';

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

async function handleLogout() {
  teardownFrontendMetrics();
  // Get latest config first to ensure we have the most up-to-date custom logout url
  await appService
    .getConfig()
    .then((config) => {
      window.public_config = config;
      const customLogoutUrl = window.public_config?.CUSTOM_LOGOUT_URL;
      if (customLogoutUrl && isValidUrl(customLogoutUrl)) {
        sessionService.logout().then(() => {
          window.location.href = customLogoutUrl;
        });
        return;
      }
      sessionService.logout();
    })
    .catch(() => {
      sessionService.logout();
    });
}

function ProfileMenu({ checkForUnsavedChanges }) {
  const { t } = useTranslation();
  const profileSettingsRoute = getPrivateRoute('profile_settings');

  const [openProfileMenu, setOpenProfileMenu] = useState(false);

  const {
    first_name: firstName,
    last_name: lastName,
    email,
  } = authenticationService.currentSessionValue?.current_user ?? {};
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const initials = (`${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}` || email?.[0] || '').toUpperCase();

  return (
    <DropdownMenu
      side="right"
      align="end"
      classes={{ content: 'tw-w-60' }}
      open={openProfileMenu}
      onOpenChange={setOpenProfileMenu}
      trigger={
        <button
          type="button"
          aria-label="Profile menu"
          className={cn(
            avatarClassName,
            'tj-leftsidebar-icon-items !tw-bg-interactive-default tw-border-0 tw-p-0 tw-mb-0',
            {
              '!tw-bg-interactive-selected': openProfileMenu,
            }
          )}
          data-cy="profile-menu-trigger"
        >
          {initials}
        </button>
      }
      sections={[
        {
          content: (
            <div className="tw-flex tw-gap-2 tw-p-4">
              <span className={cn(avatarClassName, 'tw-size-9')}>{initials}</span>
              <div className="tw-min-w-0 tw-font-body-default">
                <p className="tw-m-0 tw-truncate tw-text-text-default">{fullName}</p>
                <p className="tw-m-0 tw-truncate tw-text-text-placeholder">{email}</p>
              </div>
            </div>
          ),
        },
        {
          items: [
            {
              label: 'Profile settings',
              icon: <UserRound />,
              asChild: true,
              render: ({ children }) => (
                <Link
                  className="hover:tw-no-underline hover:tw-text-inherit"
                  to={profileSettingsRoute}
                  onClick={(event) => checkForUnsavedChanges(profileSettingsRoute, event)}
                >
                  {children}
                </Link>
              ),
              'data-cy': 'profile-settings',
            },
            {
              label: t('header.logout', 'Log out'),
              icon: <LogOut />,
              destructive: true,
              onSelect: handleLogout,
              'data-cy': 'logout-link',
            },
          ],
        },
      ]}
    />
  );
}

export default ProfileMenu;
