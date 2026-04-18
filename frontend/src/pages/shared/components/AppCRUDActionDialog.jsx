import React, { useState } from 'react';
import { capitalize, cloneDeep, isEmpty, sample } from 'lodash';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CircleAlert, Trash } from 'lucide-react';

import config from 'config';
import { cn } from '@/lib/utils';
import { validateName, getWorkspaceId } from '@/_helpers/utils';
import { defaultAppIconList, appTypeToDisplayNameMapping } from '@/_helpers/appUtils';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { Field, FieldLabel, FieldError } from '@/components/ui/Rocket/Field/Field';
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
import { useDeployTemplateApp } from '@/_services/hooks/libraryAppServiceHooks';
import { useInstallDependentPlugins, useUninstallPlugins } from '@/_services/hooks/pluginsServiceHooks';

import Collapsible from './Collapsible';
import ActionDialog from './ActionDialog';

export default function AppCRUDActionDialog({ open, onClose, actionType, appDetails, appType, limits }) {
  const appTypeDisplayName = appTypeToDisplayNameMapping[appType];

  const navigate = useNavigate();

  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);

  const { mutate: createNewApp, isPending: isCreatingApp } = useCreateApp();
  const { mutate: renameApp, isPending: isRenamingApp } = useRenameApp();
  const { mutate: deleteApp, isPending: isDeletingApp } = useDeleteApp();
  const { mutate: cloneApp, isPending: isCloningApp } = useCloneApp();
  const { mutateAsync: installDependentPlugins, isPending: isInstallingDependentPlugins } =
    useInstallDependentPlugins();
  const { mutateAsync: importResource, isPending: isImportingResource } = useImportResource();
  const { mutateAsync: uninstallPlugins, isPending: isUninstallingPlugins } = useUninstallPlugins();
  const { mutate: deployTemplateApp, isPending: isDeployingTemplateApp } = useDeployTemplateApp();

  // const inputRef = useRef();

  const [name, setName] = useState(appDetails?.name ?? '');
  const [errorText, setErrorText] = useState('');

  const handleResetState = () => {
    onClose();
  };

  const handle409Error = (error) => {
    error?.statusCode === 409 && setErrorText(`${appTypeDisplayName} name already exists`);
  };

  const handleNameChange = (e) => {
    const inputValue = e.target.value;
    const trimmedName = inputValue?.trim();
    setName(inputValue);

    if (inputValue.length < 50) {
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
            body: { name: formattedAppName, type: appType, icon: sample(defaultAppIconList), prompt: undefined },
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
      case 'clone': {
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

            onClose();
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
          onClose();
        }
        break;
      }
      case 'create-from-template': {
        const { templateId, dependentPlugins } = appDetails;

        deployTemplateApp(
          {
            identifier: templateId,
            appName: formattedAppName,
            dependentPlugins,
            shouldAutoImportPlugin: Boolean(dependentPlugins?.length),
            appTypeDisplayName,
            // This will remain false in every case post git sync branching implementation change refer: https://github.com/ToolJet/ToolJet/pull/15361/changes#diff-9cdf23554d644a3e168cc72f2f6eab4912bd0ca96c499fa3e894888959c6ff04
            isCommitEnabled: false,
          },
          {
            onError: (error) => {
              if (error.statusCode === 409) {
                handle409Error(error);
                return;
              }

              onClose();
            },
          }
        );

        break;
      }
      default:
        break;
    }
  };

  const isDeleteActionType = actionType === 'delete';
  const isImportAnywayActionType = actionType === 'import-anyway';
  const isAlertDialog = isDeleteActionType || isImportAnywayActionType;

  const { title, submitBtnLabel } = getDialogConfig({ actionType, appTypeDisplayName, isAlertDialog });
  const isNameInvalid = name.trim().length === 0 || name?.length > 50 || Boolean(errorText);
  const isNameChangeRequired = ['rename'].includes(actionType);
  const isNameChanged = name?.trim() !== appDetails?.name;

  const isFormBeingSubmitted =
    isCreatingApp ||
    isRenamingApp ||
    isDeletingApp ||
    isCloningApp ||
    isInstallingDependentPlugins ||
    isImportingResource ||
    isUninstallingPlugins ||
    isDeployingTemplateApp;
  const isCancelBtnDisabled = isFormBeingSubmitted;
  const isSubmitBtnDisabled = isNameInvalid || isFormBeingSubmitted || (isNameChangeRequired && !isNameChanged);

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
      {['create', 'rename', 'import', 'clone', 'create-from-template'].includes(actionType) ? (
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
    appName.length >= 50
      ? 'Maximum length has been reached'
      : `${appTypeDisplayName} name must be unique and max 50 characters`;

  return (
    <form id={`${actionType}-${appType}-form`} className="tw-px-6 tw-py-4" onSubmit={onSubmit}>
      <Field>
        <FieldLabel htmlFor={`${appType}-name`} data-cy={`${generateCypressDataCy(appTypeDisplayName)}-name-label`}>
          {`${appTypeDisplayName} name`}
        </FieldLabel>

        <Input
          autoFocus
          type="text"
          value={appName}
          maxLength={50}
          id={`${appType}-name`}
          placeholder={`Enter ${appTypeDisplayName.toLowerCase()} name`}
          // ref={inputRef}
          disabled={isNameInputDisabled}
          onChange={onFolderNameChange}
          className={cn({ 'tw-border-border-danger-strong': errorText })}
          data-cy={`${generateCypressDataCy(appTypeDisplayName)}-name-input`}
        />

        <FieldError
          className={cn({ 'tw-text-text-placeholder': !errorText })}
          data-cy={`${generateCypressDataCy(appTypeDisplayName)}-name-error-label`}
        >
          {errorText || helpText}
        </FieldError>
      </Field>

      {Boolean(dependentPlugins?.length) && (
        <PluginsToBeInstalled dependentPlugins={dependentPlugins} dependentPluginsDetail={dependentPluginsDetail} />
      )}
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

        <Collapsible title={`Missing user groups (${missingGroups.length})`}>
          <p className="tw-font-body-default tw-text-text-default tw-mb-0">{groupNames}</p>
        </Collapsible>

        <p className="tw-font-body-default tw-text-text-default tw-mb-0">
          Without these groups, restricted pages, queries, and components may become accessible to unintended users. To
          prevent this, create the missing groups before importing or review permissions after.
        </p>
      </div>
    </div>
  );
}

function DeleteAppBody({ appType, appName }) {
  const appTypeDisplayName = appTypeToDisplayNameMapping[appType]?.toLowerCase() || 'app';

  const heading = `Delete "${appName}"`;

  const message = `This will permanently delete the ${appTypeDisplayName} and all its associated data. This action cannot be undone.`;

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

function PluginsToBeInstalled({ dependentPlugins, dependentPluginsDetail }) {
  return (
    <Collapsible
      subTitle="These plugins are needed to run queries in this app."
      title={`Marketplace plugins required (${dependentPlugins.length})`}
      classes={{ collapsibleContainer: 'tw-mt-5' }}
    >
      <ul className="tw-list-none tw-mb-0 tw-pl-0 tw-max-h-32 tw-overflow-y-auto tw-hide-scrollbar">
        {dependentPlugins.map((plugin, index) => {
          const pluginsName = dependentPluginsDetail[plugin].name || plugin;
          const iconSrc = `${config.TOOLJET_MARKETPLACE_URL}/marketplace-assets/${plugin}/lib/icon.svg`;

          return (
            <li key={`${pluginsName}-${index}`} className="tw-flex tw-items-center tw-gap-2 tw-p-1">
              <img className="tw-size-4" src={iconSrc} alt={pluginsName} />

              <span className="tw-font-body-default tw-text-text-default">{pluginsName}</span>
            </li>
          );
        })}
      </ul>
    </Collapsible>
  );
}

function getDialogConfig({ actionType, appTypeDisplayName, isAlertDialog }) {
  switch (actionType) {
    case 'create-from-template':
      return {
        title: 'Create from template',
        submitBtnLabel: `Create ${appTypeDisplayName.toLowerCase()}`,
      };
    case 'import-anyway':
      return {
        title: '',
        submitBtnLabel: 'Import anyway',
      };
    default: {
      const submitBtnLabel = `${capitalize(actionType)} ${appTypeDisplayName.toLowerCase()}`;

      return { title: isAlertDialog ? '' : submitBtnLabel, submitBtnLabel };
    }
  }
}
