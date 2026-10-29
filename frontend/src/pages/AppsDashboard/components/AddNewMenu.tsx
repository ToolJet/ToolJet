import React from 'react';
import { Blocks, FolderOpen } from 'lucide-react';

import { authenticationService } from '@/_services/authentication.service';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

import { useAppsStore } from '@/_stores/appsStore';
import { Button } from '@/components/ui/Button/Button';
import DropdownMenu, { type DropdownMenuSection } from '@/components/ui/Rocket/DropdownMenu';
import { HEADER_MENU_CLASSES } from './headerMenuClasses';

import { appTypeToDisplayNameMapping, hasFolderOperationPermission, type TAppType } from '../helper';

interface AddNewMenuProps {
  appType: TAppType;
  isBranchLocked: boolean;
}

const MENU_CLASSES = { ...HEADER_MENU_CLASSES, content: `${HEADER_MENU_CLASSES.content} tw-min-w-40` };

export default function AddNewMenu({ appType, isBranchLocked }: AddNewMenuProps) {
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);
  const toggleSwitchBranchModal = useAppsStore((state) => state.toggleSwitchBranchModal);

  const hasFolderCreatePermission = hasFolderOperationPermission(
    authenticationService.currentSessionValue.user_permissions,
    appType,
    'create'
  );

  const handleOpenCreateAppDialog = () => {
    if (isBranchLocked) {
      toggleSwitchBranchModal({ open: true, postSwitchAction: 'create' });
      return;
    }

    setAppDialogState({ type: 'create' });
  };

  const handleOpenCreateNewFolderDialog = () => {
    if (!hasFolderCreatePermission) return;

    posthogHelper.captureEvent('create_new_folder', {
      workspace_id:
        authenticationService?.currentUserValue?.organization_id ||
        authenticationService?.currentSessionValue?.current_organization_id,
    });

    setFolderDialogState({ type: 'create-folder' });
  };

  const sections: DropdownMenuSection[] = [
    {
      id: 'add',
      items: [
        {
          id: 'app',
          label: `New ${appTypeToDisplayNameMapping[appType]}`,
          icon: <Blocks />,
          onSelect: handleOpenCreateAppDialog,
          'data-cy': 'add-new-blank-app',
        },
        {
          id: 'folder',
          label: 'New folder',
          icon: <FolderOpen />,
          onSelect: handleOpenCreateNewFolderDialog,
          'data-cy': 'add-new-folder',
          disabled: !hasFolderCreatePermission,
        },
      ],
    },
  ];

  return (
    <DropdownMenu
      align="end"
      trigger={
        <Button isLucid variant="secondary" data-cy="page-header-add-new" leadingIcon="plus">
          Add new
        </Button>
      }
      sections={sections}
      classes={MENU_CLASSES}
    />
  );
}
