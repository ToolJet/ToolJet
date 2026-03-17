import React, { useState, useRef } from 'react';
import { capitalize } from 'lodash';
import { Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { validateName } from '@/_helpers/utils';
import { Input } from '@/components/ui/Rocket/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/Rocket/field';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

import { appTypeToDisplayNameMapping } from '../helper';
import { useCreateApp, useDeleteApp, useRenameApp } from '../hooks/appsServiceHooks';

import ActionDialog from '../ActionDialog';

export default function CRUDActionDialog({ open, onClose, actionType, appDetails, appType }) {
  const appTypeDisplayName = appTypeToDisplayNameMapping[appType];

  const { mutate: createNewApp, isLoading: isCreatingApp } = useCreateApp();
  const { mutate: renameApp, isLoading: isRenamingApp } = useRenameApp();
  const { mutate: deleteApp, isLoading: isDeletingApp } = useDeleteApp();

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

  const handleSubmitForm = (e) => {
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
      default:
        break;
    }
  };

  const isDeleteActionType = actionType === 'delete';
  const isNonFormDialog = isDeleteActionType;

  const submitBtnLabel = `${capitalize(actionType)} ${appTypeDisplayName.toLowerCase()}`;
  const title = isNonFormDialog ? '' : submitBtnLabel;
  const isNameInvalid = name.trim().length === 0 || name?.length > 50 || Boolean(errorText);
  const isNameChangeRequired = ['rename'].includes(actionType);
  const isNameChanged = name?.trim() !== appDetails?.name;

  const isFormBeingSubmitted = isCreatingApp || isRenamingApp || isDeletingApp;
  const isCancelBtnDisabled = isFormBeingSubmitted;
  const isSubmitBtnDisabled = isNameInvalid || isFormBeingSubmitted || (isNameChangeRequired && !isNameChanged);

  return (
    <ActionDialog
      open={open}
      title={title}
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
      {['create', 'rename'].includes(actionType) ? (
        <CreateRenameCloneImportBody
          appType={appType}
          appName={name}
          errorText={errorText}
          actionType={actionType}
          isNameInputDisabled={isFormBeingSubmitted}
          onSubmit={handleSubmitForm}
          onFolderNameChange={handleNameChange}
        />
      ) : actionType === 'delete' ? (
        <DeleteAppBody appType={appType} appName={name} />
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
    </form>
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
