import React, { useState, useRef } from 'react';
import { capitalize } from 'lodash';

import { cn } from '@/lib/utils';
import { validateName } from '@/_helpers/utils';
import { Input } from '@/components/ui/Rocket/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/Rocket/field';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

import { appTypeToDisplayNameMapping } from '../helper';
import { useWorkflowListStore } from '../../Workflows/store';
import { useCreateApp, useRenameApp } from '../hooks/appsServiceHooks';

import ActionDialog from '../ActionDialog';

export default function CRUDActionDialog({ open, actionType, initialName }) {
  const appType = 'workflow';
  const appTypeDisplayName = appTypeToDisplayNameMapping[appType];

  const openWorkflowDialogType = useWorkflowListStore((state) => state.openWorkflowDialogType);
  const setOpenWorkflowDialogType = useWorkflowListStore((state) => state.setOpenWorkflowDialogType);

  const { mutate: createNewApp, isLoading: isCreatingApp } = useCreateApp();
  const { mutate: renameApp, isLoading: isRenamingApp } = useRenameApp();

  const inputRef = useRef();
  const [name, setName] = useState(initialName ?? '');
  const [errorText, setErrorText] = useState('');
  const [isNameChanged, setIsNameChanged] = useState(false);

  const handleResetState = () => {
    setName('');
    setErrorText('');
    setOpenWorkflowDialogType('');
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
      // I think their is loop hole for this case in case where app name is pre poluated like rename, clone etc
      setErrorText(error?.errorMsg || '');
    }
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    const formattedAppName = name?.trim().replace(/\s+/g, ' ');

    switch (openWorkflowDialogType) {
      case 'create':
        // TODO: Icon to be random from tabler icons & prompt required for app case
        createNewApp(
          { name: formattedAppName, type: appType, icon: 'share', prompt: undefined },
          { onError: handle409Error, onSuccess: handleResetState }
        );
        break;
      case 'rename':
        // renameApp({ appId, name: formattedAppName, appType }, { onError: handle409Error, onSuccess: handleResetState });
        break;
      default:
        break;
    }
  };

  const title = `${capitalize(openWorkflowDialogType)} workflow`;
  const isNameInvalid = name.trim().length === 0 || name?.length > 50 || Boolean(errorText);

  const isFormBeingSubmitted = isCreatingApp || isRenamingApp;
  const isCancelBtnDisabled = isFormBeingSubmitted;
  const isSubmitBtnDisabled = isNameInvalid || isFormBeingSubmitted;

  const helpText =
    name.length >= 50
      ? 'Maximum length has been reached'
      : `${appTypeDisplayName} name must be unique and max 50 characters`;

  return (
    <ActionDialog
      open={Boolean(openWorkflowDialogType)}
      title={title}
      cancelBtnProps={{ dataCy: 'cancel-button', disabled: isCancelBtnDisabled, onClick: handleResetState }}
      submitBtnProps={{
        label: title,
        disabled: isSubmitBtnDisabled,
        isLoading: isFormBeingSubmitted,
        form: `${openWorkflowDialogType}-${appType}-form`,
        dataCy: generateCypressDataCy(`${openWorkflowDialogType}-${appType}-button`),
      }}
    >
      <form id={`${openWorkflowDialogType}-${appType}-form`} onSubmit={handleSubmitForm}>
        <Field>
          <FieldLabel htmlFor={`${appType}-name`} dataCy={`${generateCypressDataCy(appTypeDisplayName)}-name-label`}>
            {`${appTypeDisplayName} name`}
          </FieldLabel>

          <Input
            autoFocus
            type="text"
            value={name}
            maxLength={50}
            id={`${appType}-name`}
            placeholder={`Enter ${appType} name`}
            ref={inputRef}
            disabled={isFormBeingSubmitted}
            onChange={handleNameChange}
            dataCy={`${generateCypressDataCy(appTypeDisplayName)}-name-input`}
          />

          <FieldError
            className={cn({ 'tw-text-text-placeholder': !errorText })}
            data-cy={`${generateCypressDataCy(appTypeDisplayName)}-name-error-label`}
          >
            {errorText || helpText}
          </FieldError>
        </Field>
      </form>
    </ActionDialog>
  );
}
