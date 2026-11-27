import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Blocks, FolderOpen } from 'lucide-react';

import { appendBranchName } from '@/_helpers/active-branch';
import { authenticationService } from '@/_services/authentication.service';
import { useDataSourcesDashboardStore } from '@/_stores/dataSourcesDashboardStore';
import { canCreateDataSourceFolder } from '@/modules/dataSources/helpers/dataSourceFolderPermissions';
import { getWorkspaceId } from '@/_helpers/utils';
import { Button } from '@/components/ui/Button/Button';
import DropdownMenu, { type DropdownMenuSection } from '@/components/ui/Rocket/DropdownMenu';
import { HEADER_MENU_CLASSES } from '@/pages/AppsDashboard/components/headerMenuClasses';

import SelectDataSourceDialog from './SelectDataSourceDialog';

const MENU_CLASSES = { ...HEADER_MENU_CLASSES, content: `${HEADER_MENU_CLASSES.content} tw-min-w-40` };

export default function AddNewMenu() {
  const [isSelectDataSourceOpen, setIsSelectDataSourceOpen] = useState(false);
  const navigate = useNavigate();
  const setFolderDialogState = useDataSourcesDashboardStore((state) => state.setFolderDialogState);

  const handleOpenSelectDataSourceDialog = () => setIsSelectDataSourceOpen(true);

  // A new data source has only default options, so open it straight away to fill in the connection details.
  const handleDataSourceCreated = (dataSource: unknown) => {
    const id = (dataSource as { id?: string } | null)?.id;
    if (!id) return;
    navigate(appendBranchName(`/${getWorkspaceId()}/data-sources/${id}`));
  };

  const handleOpenCreateNewFolderDialog = () => setFolderDialogState({ type: 'create-folder', folderDetails: null });

  const sections: DropdownMenuSection[] = [
    {
      id: 'add',
      items: [
        {
          id: 'app',
          label: `Add new datasource`,
          icon: <Blocks />,
          onSelect: handleOpenSelectDataSourceDialog,
          'data-cy': 'add-new-blank-app',
        },
        // Creating a folder has no folder to scope to, so it stays on the coarse group flag.
        ...(canCreateDataSourceFolder(authenticationService.currentSessionValue)
          ? [
              {
                id: 'folder',
                label: 'New folder',
                icon: <FolderOpen />,
                onSelect: handleOpenCreateNewFolderDialog,
                'data-cy': 'add-new-folder',
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <>
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
      <SelectDataSourceDialog
        open={isSelectDataSourceOpen}
        onOpenChange={setIsSelectDataSourceOpen}
        onCreated={handleDataSourceCreated}
      />
    </>
  );
}
