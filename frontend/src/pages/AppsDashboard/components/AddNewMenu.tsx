import React from 'react';
import { Blocks, FolderOpen } from 'lucide-react';

import { useAppsStore } from '@/_stores/appsStore';
import { Button } from '@/components/ui/Button/Button';
import DropdownMenu, { type DropdownMenuSection } from '@/components/ui/Rocket/DropdownMenu';
import { HEADER_MENU_CLASSES } from './headerMenuClasses';

import { appTypeToDisplayNameMapping, type TAppType } from '../helper';

interface AddNewMenuProps {
  appType: TAppType;
  isWorkspaceBranchLocked: boolean;
  onAddApp?: () => void;
  onAddFolder?: () => void;
}

const MENU_CLASSES = { ...HEADER_MENU_CLASSES, content: `${HEADER_MENU_CLASSES.content} tw-min-w-40` };

export default function AddNewMenu({ appType, isWorkspaceBranchLocked, onAddFolder }: AddNewMenuProps) {
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);
  const setOpenSwitchBranchModal = useAppsStore((state) => state.setOpenSwitchBranchModal);

  const handleOpenCreateAppDialog = () => {
    if (isWorkspaceBranchLocked && appType === 'front-end') {
      setOpenSwitchBranchModal(true);
      return;
    }

    setAppDialogState({ type: 'create' });
  };

  const handleOpenCreateNewFolderDialog = () => {
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
