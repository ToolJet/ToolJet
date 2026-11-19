import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AppWindow, EllipsisVertical, FileDown, FolderGit2 } from 'lucide-react';

import { useFindDependentPlugins } from '@/_services/hooks/pluginsServiceHooks';
import { Button } from '@/components/ui/Button/Button';
import DropdownMenu, { type DropdownMenuSection } from '@/components/ui/Rocket/DropdownMenu';
import { HEADER_MENU_CLASSES } from './headerMenuClasses';

import type { TAppType } from '../helper';
import { useAppsStore } from '@/_stores/appsStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { useIsWorkspaceBranchLocked } from '../hooks/useIsWorkspaceBranchLocked';

import type { ILicenseStore } from '@/_stores/types/licenseStore';
import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';

interface MoreActionsMenuProps {
  appType: TAppType;
}

// Figma items are 180px wide: + 16px group padding + 2px border.
const MENU_CLASSES = { ...HEADER_MENU_CLASSES, content: `${HEADER_MENU_CLASSES.content} tw-min-w-[198px]` };

export default function MoreActionsMenu({ appType }: MoreActionsMenuProps) {
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const toggleSwitchBranchModal = useAppsStore((state) => state.toggleSwitchBranchModal);

  const currentBranch = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.currentBranch);
  const checkBranchExistsOnRemote = useWorkspaceBranchesStore(
    (state: IWorkspaceBranchesStore) => state.actions.checkBranchExistsOnRemote
  );

  const isModulesFeatureEnabled = useLicenseStore(
    (state: ILicenseStore) => state.featureAccess?.modulesEnabled ?? false
  );

  const { isBranchLocked, isGitSyncLicenseLocked } = useIsWorkspaceBranchLocked();
  const { handleFileChange } = useReadAndImportFile(appType);

  const hiddenFileInput = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isCreationDisabled = isGitSyncLicenseLocked || (appType === 'module' && !isModulesFeatureEnabled);

  const handleImportFromDevice = () => {
    if (isCreationDisabled) return;

    if (isBranchLocked) {
      toggleSwitchBranchModal({ open: true, postSwitchActionDetails: { type: 'create', appDetails: null } });
      return;
    }

    hiddenFileInput.current?.click();
  };

  const handleOpenTemplateDialog = () => {
    if (isCreationDisabled) return;

    setAppDialogState({ type: 'choose-from-template', appDetails: null });
  };

  const handleOpenImportFromGitDialog = () => {
    if (isCreationDisabled) return;

    if (currentBranch) {
      const exists = checkBranchExistsOnRemote(currentBranch.name);

      if (!exists) {
        toast.error(
          'Branch does not exist in git. Delete this branch and create a new one to continue to make changes.'
        );
        return;
      }

      // Importing from git is allowed on a locked branch.
      setAppDialogState({ type: 'import-from-git', appDetails: null }, true);
    }
  };

  const sections: DropdownMenuSection[] = [
    {
      id: 'more-actions',
      items: [
        {
          id: 'import-device',
          label: 'Import from device',
          icon: <FileDown />,
          onSelect: handleImportFromDevice,
          disabled: isCreationDisabled,
          'data-cy': 'more-actions-import-from-device',
        },
        ...(appType === 'front-end'
          ? [
              {
                id: 'template',
                label: 'Create app from template',
                icon: <AppWindow />,
                onSelect: handleOpenTemplateDialog,
                disabled: isCreationDisabled,
                'data-cy': 'more-actions-create-from-template',
              },
              {
                id: 'import-git',
                label: 'Import app from Git repo',
                icon: <FolderGit2 />,
                onSelect: handleOpenImportFromGitDialog,
                disabled: isCreationDisabled,
                'data-cy': 'more-actions-import-from-git',
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <>
      <DropdownMenu
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        align="end"
        trigger={
          <Button
            variant="outline"
            iconOnly
            aria-label="More actions"
            className="tw-rounded-lg tw-border-border-weak"
            data-cy="page-header-more-actions"
            disabled={isCreationDisabled}
          >
            <EllipsisVertical size={16} className="tw-text-icon-strong" />
          </Button>
        }
        sections={sections}
        classes={MENU_CLASSES}
      />

      {/* {isMenuOpen && ( */}
      <input
        type="file"
        accept=".json"
        className="tw-hidden"
        data-cy="import-option-input"
        ref={hiddenFileInput}
        onChange={handleFileChange}
      />
      {/* )} */}
    </>
  );
}

const useReadAndImportFile = (appType: TAppType) => {
  const { mutateAsync: findDependentPlugins } = useFindDependentPlugins();

  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);

  const handleFileChange = (event) => {
    try {
      const file = event.target.files?.[0];

      if (!file) return;

      const fileReader = new FileReader();
      const fileName = file.name.replace('.json', '').substring(0, 50);

      fileReader.readAsText(file, 'UTF-8');
      fileReader.onload = async (event) => {
        const result = event.target.result;
        let fileContent;
        try {
          fileContent = JSON.parse(result);
        } catch (parseError) {
          toast.error(`Could not import: ${parseError}`);
          return;
        }

        const importedAppDef = fileContent.app || fileContent.appV2;
        const dataSourcesUsedInApps = [];

        importedAppDef.forEach((appDefinition) => {
          appDefinition?.definition?.appV2?.dataSources.forEach((dataSource) => {
            dataSourcesUsedInApps.push(dataSource);
          });
        });

        await findDependentPlugins(dataSourcesUsedInApps, {
          onSuccess: (response) => {
            const { pluginsToBeInstalled = [], pluginsListIdToDetailsMap = {} } = response.data;

            setAppDialogState(
              {
                type: 'import',
                appDetails: {
                  name: fileName,
                  fileContent,
                  fileName,
                  dependentPlugins: pluginsToBeInstalled,
                  dependentPluginsDetail: { ...pluginsListIdToDetailsMap },
                },
              },
              appType
            );
          },
        });
      };

      fileReader.onerror = (error) => {
        toast.error(`Could not import the app: ${error}`);
        return;
      };

      event.target.value = null;
    } catch (error) {
      const errorMessage = error?.error || error?.message || 'Some Error Occured';

      toast.error(errorMessage);
    }
  };

  return { handleFileChange };
};
