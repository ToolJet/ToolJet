import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bolt, MonitorCloud, Store } from 'lucide-react';

import { cn } from '@/lib/utils';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import { authenticationService } from '@/_services/authentication.service';
import { getPrivateRoute } from '@/_helpers/routes';
import { useAppDataStore } from '@/_stores/appDataStore';
import { shallow } from 'zustand/shallow';
import { checkIfToolJetCloud } from '@/_helpers/utils';
import { fetchEdition } from '@/modules/common/helpers/utils';

function BaseSettingsMenu({
  checkForUnsavedChanges,
  featureAccess,
  getPreWorkspaceItems = () => [],
  getMidMenuItems = () => [],
  options = {
    hideMarketPlaceMenuItem: false,
  },
}) {
  const edition = fetchEdition();
  const isEEorCloud = edition === 'ee' || edition === 'cloud';
  const [isOpen, setIsOpen] = useState(false);
  const { tooljetVersion } = useAppDataStore(
    (state) => ({
      tooljetVersion: state?.metadata?.installed_version,
    }),
    shallow
  );
  // Get common user values
  const currentUserValue = authenticationService.currentSessionValue;
  const admin = currentUserValue?.admin;
  const superAdmin = currentUserValue?.super_admin;
  const isBuilder = !!currentUserValue?.user_permissions?.is_builder;
  const isCloudEdition = edition === 'cloud' || (!!tooljetVersion && checkIfToolJetCloud(tooljetVersion));
  const marketplaceEnabled = !options.hideMarketPlaceMenuItem && !isCloudEdition && (admin || superAdmin || isBuilder);

  const hasCustomGroupsLicense = useMemo(() => {
    if (!featureAccess) return false;
    return featureAccess.customGroups === true && featureAccess.licenseStatus?.isLicenseValid !== false;
  }, [featureAccess]);

  const isGroupAdmin = !!currentUserValue?.is_group_admin && hasCustomGroupsLicense;
  const canAccessWorkspaceSettings = !!admin || (isEEorCloud && isBuilder) || isGroupAdmin;

  const getWorkspaceSettingsRoute = () => {
    if (isGroupAdmin) {
      return getPrivateRoute('workspace_settings_groups');
    }
    if (isBuilder && isEEorCloud) {
      return getPrivateRoute('workspace_settings_builder');
    }
    return getPrivateRoute('workspace_settings');
  };
  const workspaceSettingsRoute = getWorkspaceSettingsRoute();
  const marketplaceRoute = '/integrations/marketplace';

  // Context for the edition-specific item extension points
  const extensionContext = { admin, superAdmin, featureAccess };
  const canSeeMidMenuItems = superAdmin || (edition === 'cloud' && admin);

  const items = [
    marketplaceEnabled &&
      tooljetVersion &&
      !checkIfToolJetCloud(tooljetVersion) && {
        id: 'marketplace',
        label: 'Marketplace',
        icon: <Store />,
        asChild: true,
        render: ({ children }) => (
          <Link
            className="hover:tw-no-underline hover:tw-text-inherit"
            to={marketplaceRoute}
            onClick={(event) => checkForUnsavedChanges(marketplaceRoute, event)}
          >
            {children}
          </Link>
        ),
        'data-cy': 'marketplace-option',
      },
    ...(getPreWorkspaceItems(extensionContext) ?? []),
    ...((canSeeMidMenuItems && getMidMenuItems(extensionContext)) || []),
    canAccessWorkspaceSettings && {
      id: 'workspace-settings',
      label: 'Workspace settings',
      icon: <MonitorCloud />,
      asChild: true,
      render: ({ children }) => (
        <Link
          className="hover:tw-no-underline hover:tw-text-inherit"
          to={workspaceSettingsRoute}
          onClick={(event) => checkForUnsavedChanges(workspaceSettingsRoute, event)}
        >
          {children}
        </Link>
      ),
      'data-cy': 'workspace-settings',
    },
  ].filter(Boolean);

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={setIsOpen}
      side="right"
      align="end"
      classes={{ content: 'tw-w-60' }}
      trigger={
        <button
          type="button"
          aria-label="Settings menu"
          className={cn('tj-leftsidebar-icon-items tw-border-0 tw-bg-transparent tw-p-0', { active: isOpen })}
          data-cy="settings-icon"
        >
          <Bolt size={16} />
        </button>
      }
      sections={[
        { items },
        {
          content: (
            <div
              className="tw-flex tw-h-10 tw-items-center tw-px-4 tw-font-body-default tw-text-text-placeholder"
              data-cy="version-label"
            >
              Version {localStorage.getItem('currentVersion')}
            </div>
          ),
        },
      ]}
    />
  );
}

export default BaseSettingsMenu;
