import React, { useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Rocket/dropdown-menu';
import { Button } from '@/components/ui/Button/Button';

import { useWorkflowListStore } from '../store';
import { useFindDependentPlugins } from '../../shared/hooks/pluginsServiceHooks';

const useReadAndImportFile = () => {
  const { mutateAsync: findDependentPlugins } = useFindDependentPlugins();

  const setFileToImportDetails = useWorkflowListStore((state) => state.setFileToImportDetails);

  const handleFileChange = (event) => {
    console.log('event', event);

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

            setFileToImportDetails({
              fileContent,
              fileName,
              dependentPlugins: pluginsToBeInstalled,
              dependentPluginsDetail: { ...pluginsListIdToDetailsMap },
            });
          },
        });
      };

      fileReader.onerror = (error) => {
        toast.error(`Could not import the app: ${error}`);
        return;
      };

      event.target.value = null;
    } catch (error) {
      let errorMessage = 'Some Error Occured';

      if (error?.error) {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  return { handleFileChange };
};

export default function MoreActionsMenu({ disabled }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const { t } = useTranslation();

  const hiddenFileInput = useRef(null);

  const { handleFileChange } = useReadAndImportFile();

  const handleOpenFilePicker = () => {
    hiddenFileInput.current?.click();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            isLucid
            iconOnly
            variant="outline"
            data-cy="import-dropdown-menu"
            leadingIcon="ellipsis-vertical"
            disabled={disabled}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent className={cn('tw-min-w-52', { 'dark-theme theme-dark': darkMode })} align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem
              dataCy="import-option-label"
              className="tw-text-text-default tw-font-body-default"
              onClick={handleOpenFilePicker}
              disabled
            >
              <FileDown size={16} color="var(--icon-weak)" />
              {t('homePage.header.import', 'Import from device')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        type="file"
        accept=".json"
        className="tw-hidden"
        data-cy="import-option-input"
        ref={hiddenFileInput}
        onChange={handleFileChange}
      />
    </>
  );
}
