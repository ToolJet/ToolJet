import React, { useState } from 'react';
import { capitalize, cloneDeep, isEmpty, sample } from 'lodash';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CircleAlert, Trash, TriangleAlert } from 'lucide-react';
import config from 'config';
import { cn } from '@/lib/utils';
import { validateName, getWorkspaceId } from '@/_helpers/utils';
import appIconConfig from '../../../HomePage/Configs/AppIcon.json';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/Rocket/Field/Field';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { authenticationService } from '@/_services/authentication.service';

import {
  handleError,
  useCloneApp,
  useCreateApp,
  useDeleteApp,
  useImportResource,
  useRenameApp,
} from '@/_services/hooks/appsServiceHooks';
import { useAppsStore } from '@/_stores/appsStore';
import { useInstallDependentPlugins, useUninstallPlugins } from '@/_services/hooks/pluginsServiceHooks';

// import Collapsible from './Collapsible';
import ActionDialog from './ActionDialog';
import { appTypeToDisplayNameMapping } from '../helper';

const MAX_APP_NAME_LENGTH = 100;

// `defaultAppType` is the page's app type, used when the dialog's app doesn't carry its own.
export default function AppCRUDActionDialog({ open, defaultAppType, limits }) {
  const { type: actionType, appDetails, selectedRowIds } = useAppsStore((state) => state.appDialogState);
  const resetAppDialogState = useAppsStore((state) => state.resetAppDialogState);
  const appType = appDetails?.type ?? defaultAppType;
  const appTypeDisplayName = appTypeToDisplayNameMapping[appType];
  const navigate = useNavigate();
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const { mutate: createNewApp, isPending: isCreatingApp } = useCreateApp();
  const { mutate: renameApp, isPending: isRenamingApp } = useRenameApp();
  const { mutate: deleteApp, isPending: isDeletingApp } = useDeleteApp();
  const { mutate: cloneApp, isPending: isCloningApp } = useCloneApp();
  const { mutateAsync: installDependentPlugins, isPending: isInstallingDependentPlugins } =
    useInstallDependentPlugins();
  const { mutateAsync: uninstallPlugins, isPending: isUninstallingPlugins } = useUninstallPlugins();
  const { mutateAsync: importResource, isPending: isImportingResource } = useImportResource();
  // const inputRef = useRef();
  const [name, setName] = useState(appDetails?.name ?? '');
  const [errorText, setErrorText] = useState('');
  const handleResetState = () => {
    resetAppDialogState();
  };
  const handle409Error = (error) => {
    error?.statusCode === 409 && setErrorText(`${capitalize(appTypeDisplayName)} name already exists`);
  };
  const handleNameChange = (e) => {
    const inputValue = e.target.value;
    const trimmedName = inputValue?.trim();
    setName(inputValue);
    if (inputValue.length < MAX_APP_NAME_LENGTH) {
      const error = validateName(trimmedName, 'App', false);
      setErrorText(error?.errorMsg || '');
    }
  };
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const formattedAppName = name?.trim().replace(/\s+/g, ' ');
    switch (actionType) {
      case 'create':
        createNewApp(
          {
            body: { name: formattedAppName, type: appType, icon: sample(appIconConfig.iconList), prompt: undefined },
            // This will remain false in every case post git sync branching implementation change refer: https://github.com/ToolJet/ToolJet/pull/15361/changes#diff-9cdf23554d644a3e168cc72f2f6eab4912bd0ca96c499fa3e894888959c6ff04
            isCommitEnabled: false,
          },
          { onError: handle409Error, onSuccess: handleResetState }
        );
        break;
      case 'rename':
        renameApp(
          { appId: appDetails?.id, name: formattedAppName, appType },
          { onError: handle409Error, onSuccess: handleResetState }
        );
        break;
      case 'delete':
        deleteApp({ appId: appDetails?.id, appType }, { onSuccess: handleResetState });
        break;
      case 'duplicate': {
        if (!limits?.canAddUnlimited && (limits?.current ?? 0) >= (limits?.total ?? 0)) {
          toast.error('You have reached your maximum limit for apps. Upgrade your plan for more.');
          return;
        }
        cloneApp(
          {
            body: {
              app: [{ id: appDetails?.id, name: formattedAppName }],
              organization_id: authenticationService?.currentSessionValue?.current_organization_id,
            },
            appType,
            // This will remain false in every case post git sync branching implementation change refer: https://github.com/ToolJet/ToolJet/pull/15361/changes#diff-9cdf23554d644a3e168cc72f2f6eab4912bd0ca96c499fa3e894888959c6ff04
            isCommitEnabled: false,
          },
          { onError: handle409Error, onSuccess: handleResetState }
        );
        break;
      }
      case 'import':
      case 'import-anyway': {
        const { fileContent, fileName, dependentPlugins, dependentPluginsDetail } = appDetails;

        let installedPluginsInfo = [];

        try {
          if (dependentPlugins?.length) {
            const installedPluginsData = await installDependentPlugins({
              dependentPlugins,
              shouldAutoImportPlugin: true,
            });
            installedPluginsInfo = installedPluginsData?.installedPluginsInfo ?? [];
          }

          let importJSON = cloneDeep(fileContent);
          const isLegacyImport = isEmpty(importJSON.tooljet_version);

          if (isLegacyImport) {
            importJSON = {
              app: [{ definition: importJSON, appName: formattedAppName || fileName }],
              tooljet_version: importJSON.tooljetVersion,
            };
          } else {
            importJSON.app[0].appName = formattedAppName || fileName;
          }

          if (importJSON.app[0].definition.appV2.type !== appType) {
            toast.error(
              `${appType === 'module' ? 'App' : 'Module'} could not be imported in ${
                appType === 'module' ? 'modules' : 'apps'
              } section. Switch to ${appType === 'module' ? 'apps' : 'modules'} section and try again.`,
              { style: { maxWidth: '425px' } }
            );

            resetAppDialogState();
            return;
          }

          const requestBody = {
            organization_id: authenticationService?.currentSessionValue?.current_organization_id,
            ...importJSON,
            skip_permissions_group_check: actionType === 'import-anyway', // import => false, import-anyway => true
          };

          const importResourceResponse = await importResource({ body: requestBody, appType });

          toast.success(`${appTypeDisplayName} imported successfully.`);

          if (!isEmpty(importResourceResponse.imports.app)) {
            navigate(`/${getWorkspaceId()}/apps/${importResourceResponse.imports.app[0].id}`, {
              // This will remain false in every case post git sync branching implementation change refer: https://github.com/ToolJet/ToolJet/pull/15361/changes#diff-9cdf23554d644a3e168cc72f2f6eab4912bd0ca96c499fa3e894888959c6ff04
              state: { commitEnabled: false },
            });
          } else if (!isEmpty(importResourceResponse.imports.tooljet_database)) {
            navigate(`/${getWorkspaceId()}/database`);
          }
        } catch (error) {
          if (error?.error?.type === 'permission-check') {
            setAppDialogState({
              type: 'import-anyway',
              appDetails: {
                fileContent,
                fileName,
                dependentPlugins,
                dependentPluginsDetail,
                missingGroups: error?.error?.data ?? [],
              },
            });
            return;
          }

          if (installedPluginsInfo.length) {
            const pluginsId = installedPluginsInfo.map((pluginInfo) => pluginInfo.id);

            await uninstallPlugins(pluginsId, {
              onError: (err) => {
                handleError(err);
                return;
              },
            });
          }

          if (error.statusCode === 409) {
            handle409Error(error);
            return;
          }

          toast.error(error?.error || error?.message || `${appTypeDisplayName} import failed`);
          resetAppDialogState();
        }
        break;
      }
      default:
        break;
    }
  };

  const selectedRowCount = selectedRowIds?.length || 0;
  const isDeleteActionType = actionType === 'delete' || actionType === 'bulk-delete';
  const isImportAnywayActionType = actionType === 'import-anyway';
  const isAlertDialog = isDeleteActionType || isImportAnywayActionType;
  const { title, submitBtnLabel } = getDialogConfig({
    actionType,
    appTypeDisplayName,
    isAlertDialog,
    selectedRowCount,
  });
  const isNameInvalid = name.trim().length === 0 || name?.length > MAX_APP_NAME_LENGTH || Boolean(errorText);
  const isNameChangeRequired = ['rename'].includes(actionType);
  const isNameChanged = name?.trim() !== appDetails?.name;
  const isFormBeingSubmitted =
    isCreatingApp ||
    isRenamingApp ||
    isDeletingApp ||
    isCloningApp ||
    isInstallingDependentPlugins ||
    isImportingResource ||
    isUninstallingPlugins;
  const isCancelBtnDisabled = isFormBeingSubmitted;
  const isSubmitBtnDisabled = true;
  // const isSubmitBtnDisabled = isNameInvalid || isFormBeingSubmitted || (isNameChangeRequired && !isNameChanged);
  return (
    <ActionDialog
      open={open}
      title={title}
      classes={isImportAnywayActionType ? { dialogContent: 'tw-max-w-[440px]', dialogBody: 'tw-p-0' } : undefined}
      cancelBtnProps={{ 'data-cy': 'cancel-button', disabled: isCancelBtnDisabled, onClick: handleResetState }}
      submitActions={[
        {
          label: submitBtnLabel,
          disabled: isSubmitBtnDisabled,
          isLoading: isFormBeingSubmitted,
          form: `${actionType}-${appType}-form`,
          'data-cy': generateCypressDataCy(`${actionType}-${appType}-button`),
          ...(isDeleteActionType && { variant: 'dangerPrimary' }),
          ...(isAlertDialog && { onClick: handleSubmitForm }),
        },
      ]}
    >
      {['create', 'rename', 'import', 'duplicate', 'create-from-template'].includes(actionType) ? (
        <CreateRenameCloneImportBody
          appType={appType}
          appName={name}
          errorText={errorText}
          actionType={actionType}
          isNameInputDisabled={isFormBeingSubmitted}
          onSubmit={handleSubmitForm}
          onFolderNameChange={handleNameChange}
          dependentPlugins={appDetails?.dependentPlugins}
          dependentPluginsDetail={appDetails?.dependentPluginsDetail}
        />
      ) : actionType === 'delete' ? (
        <DeleteAppBody appType={appType} appName={name} />
      ) : actionType === 'bulk-delete' ? (
        <BulkDeleteAppsBody appType={appType} selectedRowCount={selectedRowIds.length} />
      ) : actionType === 'import-anyway' ? (
        <MissingGroupsDialogBody missingGroups={appDetails?.missingGroups} />
      ) : (
        <></>
      )}
    </ActionDialog>
  );
}
function CreateRenameCloneImportBody({
  actionType,
  appType,
  appName,
  errorText,
  isNameInputDisabled,
  onSubmit,
  onFolderNameChange,
  dependentPlugins,
  dependentPluginsDetail,
}) {
  const appTypeDisplayName = appTypeToDisplayNameMapping[appType];
  const helpText =
    appName.length >= MAX_APP_NAME_LENGTH
      ? 'Maximum length has been reached'
      : `${capitalize(appTypeDisplayName)} name must be unique and max ${MAX_APP_NAME_LENGTH} characters`;
  return (
    <form id={`${actionType}-${appType}-form`} className="tw-px-6 tw-py-4" onSubmit={onSubmit}>
      <Field>
        <FieldLabel htmlFor={`${appType}-name`} data-cy={`${generateCypressDataCy(appTypeDisplayName)}-name-label`}>
          {`${capitalize(appTypeDisplayName)} name`}
        </FieldLabel>
        <Input
          autoFocus
          type="text"
          value={appName}
          maxLength={MAX_APP_NAME_LENGTH}
          id={`${appType}-name`}
          placeholder={`Enter ${appTypeDisplayName.toLowerCase()} name`}
          // ref={inputRef}
          disabled={isNameInputDisabled}
          onChange={onFolderNameChange}
          className={cn({ 'tw-border-border-danger-strong': errorText })}
          data-cy={`${generateCypressDataCy(appTypeDisplayName)}-name-input`}
        />

        {errorText ? (
          <FieldError data-cy={`${generateCypressDataCy(appTypeDisplayName)}-name-error-label`}>{errorText}</FieldError>
        ) : helpText ? (
          <FieldDescription data-cy={`${generateCypressDataCy(appTypeDisplayName)}-name-description-label`}>
            {helpText}
          </FieldDescription>
        ) : (
          <></>
        )}
      </Field>
    </form>
  );
}
function MissingGroupsDialogBody({ missingGroups }) {
  const groupNames = missingGroups.join(', ');

  return (
    <div className="tw-space-y-2 tw-px-6 tw-py-4">
      <CircleAlert size={40} color="var(--icon-brand)" />
      <div className="tw-space-y-4">
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <h6 className="tw-font-title-x-large tw-text-text-default">
            Some user groups don&apos;t exist in this workspace
          </h6>
          <p className="tw-font-body-default tw-text-text-default tw-mb-0">
            The following groups are missing, so their permissions won&apos;t carry over after import.
          </p>
        </div>
        {/* <Collapsible title={`Missing user groups (${missingGroups.length})`}>
          <p className="tw-font-body-default tw-text-text-default tw-mb-0">{groupNames}</p>
        </Collapsible> */}
        <p className="tw-font-body-default tw-text-text-default tw-mb-0">
          Without these groups, restricted pages, queries, and components may become accessible to unintended users. To
          prevent this, create the missing groups before importing or review permissions after.
        </p>
      </div>
    </div>
  );
}
function DeleteAppBody({ appType, appName }) {
  const appTypeDisplayName = appTypeToDisplayNameMapping[appType];
  const heading = `Delete "${appName}"`;
  const message = `The ${appTypeDisplayName} ${appName} and the associated data will be permanently deleted, do you want to continue?`;

  return (
    <div className="tw-px-6 tw-py-4">
      <Trash size={40} color="var(--icon-danger)" className="tw-mb-2" />
      <h6 className="tw-font-title-x-large tw-text-text-default tw-mb-0.5">{heading}</h6>
      <p data-cy="modal-message" className="tw-font-body-default tw-text-text-default tw-mb-0">
        {message}
      </p>
    </div>
  );
}

function BulkDeleteAppsBody({ appType, selectedRowCount }) {
  const appTypeDisplayName = appTypeToDisplayNameMapping[appType];
  const noun = selectedRowCount > 1 ? `${appTypeDisplayName}s` : appTypeDisplayName;
  const heading = `Delete selected ${noun}?`;
  const message = `You are about to delete ${selectedRowCount} ${noun}. This action cannot be undone and may remove any related data.`;

  return (
    <div className="tw-px-6 tw-py-4">
      <TriangleAlert size={40} color="var(--icon-danger)" className="tw-mb-2" />
      <h6 className="tw-font-title-x-large tw-text-text-default tw-mb-0.5">{heading}</h6>
      <p data-cy="modal-message" className="tw-font-body-default tw-text-text-default tw-mb-0">
        {message}
      </p>
    </div>
  );
}
// function PluginsToBeInstalled({ dependentPlugins, dependentPluginsDetail }) {
//   return (
//     <Collapsible
//       subTitle="These plugins are needed to run queries in this app."
//       title={`Marketplace plugins required (${dependentPlugins.length})`}
//       classes={{ collapsibleContainer: 'tw-mt-5' }}
//     >
//       <ul className="tw-list-none tw-mb-0 tw-pl-0 tw-max-h-32 tw-overflow-y-auto tw-hide-scrollbar">
//         {dependentPlugins.map((plugin, index) => {
//           const pluginsName = dependentPluginsDetail[plugin].name || plugin;
//           const iconSrc = `${config.TOOLJET_MARKETPLACE_URL}/marketplace-assets/${plugin}/lib/icon.svg`;
//           return (
//             <li key={`${pluginsName}-${index}`} className="tw-flex tw-items-center tw-gap-2 tw-p-1">
//               <img className="tw-size-4" src={iconSrc} alt={pluginsName} />
//               <span className="tw-font-body-default tw-text-text-default">{pluginsName}</span>
//             </li>
//           );
//         })}
//       </ul>
//     </Collapsible>
//   );
// }
function getDialogConfig({ actionType, appTypeDisplayName, isAlertDialog, selectedRowCount }) {
  switch (actionType) {
    case 'create-from-template':
      return {
        title: 'Create from template',
        submitBtnLabel: `Create ${appTypeDisplayName}`,
      };
    case 'import-anyway':
      return {
        title: '',
        submitBtnLabel: 'Import anyway',
      };
    case 'bulk-delete':
      return {
        title: '',
        submitBtnLabel: `Delete ${appTypeDisplayName}${selectedRowCount > 1 ? 's' : ''}`,
      };
    default: {
      const submitBtnLabel = `${capitalize(actionType)} ${appTypeDisplayName}`;
      return { title: isAlertDialog ? '' : submitBtnLabel, submitBtnLabel };
    }
  }
}
