import React, { useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FileDown, AppWindow } from 'lucide-react';
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
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

import { useAppsStore } from './store';
import { useFindDependentPlugins } from './hooks/pluginsServiceHooks';

const useReadAndImportFile = () => {
  const { mutateAsync: findDependentPlugins } = useFindDependentPlugins();

  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);

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

            setAppDialogState({
              type: 'import',
              appDetails: {
                name: fileName,
                fileContent,
                fileName,
                dependentPlugins: pluginsToBeInstalled,
                dependentPluginsDetail: { ...pluginsListIdToDetailsMap },
              },
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
      const errorMessage = error?.error || error?.message || 'Some Error Occured';

      toast.error(errorMessage);
    }
  };

  return { handleFileChange };
};

function MoreAppsActionMenu(props) {
  return <BaseMoreAppsActionMenu {...props} />;
}

export default withEditionSpecificComponent(MoreAppsActionMenu, 'common');

export function BaseMoreAppsActionMenu({ disabled, appType, eeSpecificMenuItems = null }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const { t } = useTranslation();

  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);

  const hiddenFileInput = useRef(null);

  const { handleFileChange } = useReadAndImportFile();

  const handleOpenFilePicker = () => {
    hiddenFileInput.current?.click();
  };

  const handleChooseFromTemplate = () => {
    setAppDialogState({ type: 'choose-from-template' });
  };

  return (
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

      <DropdownMenuContent
        align="end"
        className={cn('tw-min-w-52 tw-border-border-weak', { 'dark-theme theme-dark': darkMode })}
      >
        <DropdownMenuGroup>
          {appType === 'front-end' && (
            <DropdownMenuItem
              data-cy="choose-from-template-button"
              className="tw-text-text-default tw-font-body-default"
              onClick={handleChooseFromTemplate}
            >
              <AppWindow size={16} color="var(--icon-weak)" />
              {t('homePage.header.chooseFromTemplate', 'Choose from template')}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            data-cy="import-option-label"
            className="tw-text-text-default tw-font-body-default"
            onClick={handleOpenFilePicker}
          >
            <FileDown size={16} color="var(--icon-weak)" />
            {t('homePage.header.import', 'Import from device')}
          </DropdownMenuItem>

          {eeSpecificMenuItems}
        </DropdownMenuGroup>
      </DropdownMenuContent>

      <input
        type="file"
        accept=".json"
        className="tw-hidden"
        data-cy="import-option-input"
        ref={hiddenFileInput}
        onChange={handleFileChange}
      />
    </DropdownMenu>
  );
}
