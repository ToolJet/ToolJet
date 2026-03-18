import React, { useState, useRef } from 'react';
import { capitalize, isEmpty } from 'lodash';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, CircleAlert, Trash } from 'lucide-react';

import config from 'config';
import { cn } from '@/lib/utils';
import { validateName, getWorkspaceId } from '@/_helpers/utils';
import { Input } from '@/components/ui/Rocket/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/Rocket/field';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { authenticationService } from '@/_services/authentication.service';

import { appTypeToDisplayNameMapping } from '../helper';
import { handleError, useCreateApp, useDeleteApp, useImportResource, useRenameApp } from '../hooks/appsServiceHooks';
import { useInstallDependentPlugins, useUninstallPlugins } from '../hooks/pluginsServiceHooks';
import { useWorkflowListStore } from '../../Workflows/store';

import ActionDialog from '../ActionDialog';

export default function CRUDActionDialog({ open, onClose, actionType, appDetails, appType }) {
  const appTypeDisplayName = appTypeToDisplayNameMapping[appType];

  const navigate = useNavigate();

  const setAppDialogState = useWorkflowListStore((state) => state.setAppDialogState);

  const { mutate: createNewApp, isLoading: isCreatingApp } = useCreateApp();
  const { mutate: renameApp, isLoading: isRenamingApp } = useRenameApp();
  const { mutate: deleteApp, isLoading: isDeletingApp } = useDeleteApp();
  const { mutateAsync: installDependentPlugins, isLoading: isInstallingDependentPlugins } =
    useInstallDependentPlugins();
  const { mutateAsync: importResource, isLoading: isImportingResource } = useImportResource();
  const { mutateAsync: uninstallPlugins, isLoading: isUninstallingPlugins } = useUninstallPlugins();

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
      // TODO: I think their is loop hole for this case in case where app name is pre poluated like rename, clone etc
      setErrorText(error?.errorMsg || '');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const formattedAppName = name?.trim().replace(/\s+/g, ' ');

    switch (actionType) {
      case 'create':
        // TODO: Icon to be random from tabler icons & prompt required for app case
        createNewApp(
          { name: formattedAppName, type: appType, icon: 'share', prompt: undefined },
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

          let importJSON = fileContent;
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

            onClose(); // TODO: Confirm this action
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
              state: { commitEnabled: false }, // TODO: false should not be hardcoded
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
      default:
        break;
    }
  };

  const isDeleteActionType = actionType === 'delete';
  const isImportAnywayActionType = actionType === 'import-anyway';
  const isNonFormDialog = isDeleteActionType || isImportAnywayActionType;

  const submitBtnLabel = isImportAnywayActionType
    ? 'Import anyway'
    : `${capitalize(actionType)} ${appTypeDisplayName.toLowerCase()}`;
  const title = isNonFormDialog ? '' : submitBtnLabel;
  const isNameInvalid = name.trim().length === 0 || name?.length > 50 || Boolean(errorText);
  const isNameChangeRequired = ['rename'].includes(actionType);
  const isNameChanged = name?.trim() !== appDetails?.name;

  const isFormBeingSubmitted =
    isCreatingApp ||
    isRenamingApp ||
    isDeletingApp ||
    isInstallingDependentPlugins ||
    isImportingResource ||
    isUninstallingPlugins;
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
          ...(isNonFormDialog && { onClick: handleSubmitForm }),
        },
      ]}
    >
      {['create', 'rename', 'import'].includes(actionType) ? (
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
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const groupNames = missingGroups.join(', ');

  return (
    <div className="tw-space-y-2 tw-px-6 tw-py-4">
      <CircleAlert size={40} color="var(--icon-brand)" />

      <div className="tw-space-y-4">
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <h6 className="tw-font-title-x-large tw-text-text-default">
            Some user groups don&apos;t exist in this workspace
          </h6>
          <p className="tw-font-body-default tw-text-text-default">
            The following groups are missing, so their permissions won&apos;t carry over after import.
          </p>
        </div>

        <div className="tw-border tw-border-border-weak tw-rounded-lg tw-overflow-hidden">
          <button
            type="button"
            className="tw-flex tw-items-center tw-justify-between tw-w-full tw-h-10 tw-px-4 tw-py-1.5 tw-border-b tw-border-border-weak tw-rounded-none"
            onClick={() => setIsAccordionOpen((prev) => !prev)}
          >
            <span className="tw-font-title-default tw-text-text-default">Missing user groups</span>
            {isAccordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isAccordionOpen && (
            <div className="tw-p-4">
              <p className="tw-font-body-default tw-text-text-default">{groupNames}</p>
            </div>
          )}
        </div>

        <p className="tw-font-body-default tw-text-text-default">
          Without these groups, restricted pages, queries, and components may become accessible to unintended users. To
          prevent this, create the missing groups before importing or review permissions after.
        </p>
      </div>
    </div>
  );
}

function DeleteAppBody({ appType, appName }) {
  const { t } = useTranslation();

  const message = t(
    appType === 'workflow'
      ? 'homePage.deleteWorkflowAndData'
      : appType === 'front-end'
      ? 'homePage.deleteAppAndData'
      : 'This action will permanently delete the module from all connected applications. This cannot be reversed. Confirm deletion?',
    { appName }
  );

  return (
    <div className="tw-px-6 tw-py-4">
      <Trash size={40} color="var(--icon-danger)" className="tw-mb-2" />

      <p className="tw-font-body-default tw-text-text-default">{message}</p>
    </div>
  );
}

function PluginsToBeInstalled({ dependentPlugins, dependentPluginsDetail }) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  return (
    <div>
      <p className="tw-font-title-default tw-text-text-default">Marketplace plugins to be installed</p>
      <p className="tw-font-body-default tw-text-text-default">
        Following plugins will be installed in your workspace to create their respective queries in this template app
      </p>

      <div className="tw-border tw-border-border-weak tw-rounded-lg tw-overflow-hidden">
        <button
          type="button"
          className="tw-flex tw-items-center tw-justify-between tw-w-full tw-h-10 tw-px-4 tw-py-1.5 tw-border-b tw-border-border-weak tw-rounded-none"
          onClick={() => setIsAccordionOpen((prev) => !prev)}
        >
          <span className="tw-font-title-default tw-text-text-default">Plugins to install</span>
          {isAccordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isAccordionOpen && (
          <div>
            <ul className="tw-list-none">
              {dependentPlugins.map((plugin, index) => {
                const pluginsName = dependentPluginsDetail[plugin].name || plugin;
                const iconSrc = `${config.TOOLJET_MARKETPLACE_URL}/marketplace-assets/${plugin}/lib/icon.svg`;

                return (
                  <li key={`${pluginsName}-${index}`} className="tw-flex tw-items-center tw-gap-2 tw-p-1">
                    <img className="tw-size-4" src={iconSrc} />

                    <span className="tw-font-body-default tw-text-text-default">{pluginsName}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
