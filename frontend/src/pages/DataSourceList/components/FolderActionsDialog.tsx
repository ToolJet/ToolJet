import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Info, Trash } from 'lucide-react';
import { capitalize, startCase } from 'lodash';

import { extractErrorMessage, extractErrorPayload } from '@/_helpers/messages';
import { validateName } from '@/_helpers/utils';
import {
  useCreateDataSourceFolder,
  useDeleteDataSourceFolder,
  useRenameDataSourceFolder,
} from '@/_services/globalDatasource.mutations';
import { useDataSourcesDashboardStore } from '@/_stores/dataSourcesDashboardStore';
import type { DataSourceFolderDialogType } from '@/_stores/types/dataSourcesDashboardStore';
import type { ButtonProps } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/Rocket/Field/Field';
import ActionDialog from '@/pages/AppsDashboard/components/ActionDialog';

const MAX_FOLDER_NAME_LENGTH = 50;

interface FolderActionsDialogProps {
  open: boolean;
}

// Create, rename and delete for data source folders; the open action lives in `folderDialogState`.
export default function FolderActionsDialog({ open }: FolderActionsDialogProps) {
  const {
    type: actionType,
    folderDetails,
    folderHasItemsOnBranch,
  } = useDataSourcesDashboardStore((state) => state.folderDialogState);
  const resetFolderDialogState = useDataSourcesDashboardStore((state) => state.resetFolderDialogState);
  const setFolderDialogState = useDataSourcesDashboardStore((state) => state.setFolderDialogState);

  const { mutate: createFolder, isPending: isCreating } = useCreateDataSourceFolder();
  const { mutate: renameFolder, isPending: isRenaming } = useRenameDataSourceFolder();
  const { mutate: deleteFolder, isPending: isDeleting } = useDeleteDataSourceFolder();

  const folderId = folderDetails?.id;
  const initialFolderName = folderDetails?.name ?? '';

  const [errorText, setErrorText] = useState('');
  const [name, setName] = useState(initialFolderName);

  const formattedName = name.trim().replace(/\s+/g, ' ');
  const isDelete = actionType === 'delete-folder';
  const isWarning = actionType === 'folder-has-data-sources-warning';
  const isCreateOrRename = ['create-folder', 'rename-folder'].includes(actionType);

  const isNameEmpty = isCreateOrRename && !formattedName;
  const isNameUnchanged = actionType === 'rename-folder' && formattedName === initialFolderName.trim();

  const isAlertDialog = isDelete;
  const isSubmitting = isCreating || isRenaming || isDeleting;
  const isSubmitDisabled = Boolean(errorText) || isNameEmpty || isNameUnchanged || isSubmitting;

  const { title, submitBtnLabel, submitBtnVariant } = getDialogConfig({ actionType, isAlertDialog });

  const handleSubmitForm = (event?: FormEvent) => {
    event?.preventDefault();

    if (isSubmitDisabled) return;

    switch (actionType) {
      case 'create-folder': {
        if (!formattedName) {
          setErrorText("Folder name can't be empty");
          return;
        }

        if (errorText) return;

        createFolder({ name: formattedName }, { onSuccess: resetFolderDialogState });
        break;
      }
      case 'rename-folder': {
        if (formattedName === initialFolderName) {
          resetFolderDialogState();
          return;
        }

        if (errorText || !folderId) return;

        renameFolder({ name: formattedName, folderId }, { onSuccess: resetFolderDialogState });
        break;
      }
      case 'delete-folder': {
        if (!folderId) return;

        deleteFolder(
          { folderId },
          {
            onSuccess: resetFolderDialogState,
            onError: ({ error }) => {
              // A refusal over branch contents carries the owning branch names. The folder can be empty on the
              // branch being viewed, so a bare toast would read as wrong; show them in the warning instead.
              const branches: string[] | undefined = extractErrorPayload(error)?.branches;

              if (branches?.length) {
                setFolderDialogState({ type: 'folder-has-data-sources-warning', folderHasItemsOnBranch: branches });
                return;
              }

              toast.error(extractErrorMessage(error) || 'Could not delete folder');
            },
          }
        );
        break;
      }
      case 'folder-has-data-sources-warning': {
        resetFolderDialogState();
        break;
      }
      default:
        break;
    }
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);

    // Mirrors the backend folder name DTO: alphanumeric plus space and hyphen, no path separators.
    const validation = validateName(event.target.value, 'Folder name', true, false, false, true, false, true);
    setErrorText(validation.status ? '' : validation.errorMsg);
  };

  return (
    <ActionDialog
      open={open}
      title={title}
      showCancelButton={!isWarning}
      cancelBtnProps={{
        'data-cy': 'cancel-button',
        label: 'Cancel',
        onClick: resetFolderDialogState,
        disabled: isSubmitting,
      }}
      submitActions={[
        {
          label: submitBtnLabel,
          disabled: isSubmitDisabled,
          isLoading: isSubmitting,
          form: `${actionType}-form`,
          'data-cy': `${actionType}-button`,
          ...(!isCreateOrRename && { onClick: handleSubmitForm }),
          ...(submitBtnVariant && { variant: submitBtnVariant }),
        },
      ]}
    >
      {isCreateOrRename ? (
        <CreateOrRenameFolderBody
          folderName={name}
          errorText={errorText}
          formId={`${actionType}-form`}
          onSubmit={handleSubmitForm}
          onFolderNameChange={handleNameChange}
          isNameInputDisabled={isSubmitting}
        />
      ) : isDelete ? (
        <DeleteFolder folderName={initialFolderName} />
      ) : isWarning ? (
        <FolderHasDataSourcesWarning folderName={initialFolderName} branches={folderHasItemsOnBranch} />
      ) : null}
    </ActionDialog>
  );
}

interface DialogConfig {
  /** Empty for the alert-style dialogs (delete, warning), which carry their own heading in the body. */
  title: string;
  submitBtnLabel: string;
  submitBtnVariant?: ButtonProps['variant'];
}

interface CreateOrRenameFolderBodyProps {
  folderName: string;
  errorText: string;
  formId: string;
  onSubmit: (event: FormEvent) => void;
  onFolderNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isNameInputDisabled: boolean;
}

function CreateOrRenameFolderBody({
  folderName,
  errorText,
  formId,
  onSubmit,
  onFolderNameChange,
  isNameInputDisabled,
}: CreateOrRenameFolderBodyProps) {
  return (
    <form id={formId} className="tw-px-6 tw-py-4" onSubmit={onSubmit}>
      <Field>
        <FieldLabel htmlFor="folder-name-input" data-cy="folder-name-label">
          Folder name
        </FieldLabel>

        <Input
          autoFocus
          type="text"
          id="folder-name-input"
          value={folderName}
          placeholder="Folder name"
          maxLength={MAX_FOLDER_NAME_LENGTH}
          onChange={onFolderNameChange}
          disabled={isNameInputDisabled}
          data-cy="datasource-folder-name-input"
        />

        {errorText ? (
          <FieldError data-cy="folder-name-error-label">{errorText}</FieldError>
        ) : (
          <FieldDescription data-cy="folder-name-description-label">{`Folder name must be unique and max ${MAX_FOLDER_NAME_LENGTH} characters`}</FieldDescription>
        )}
      </Field>
    </form>
  );
}

function DeleteFolder({ folderName }: { folderName: string }) {
  return (
    <div className="tw-px-6 tw-py-4">
      <Trash size={40} color="var(--icon-danger)" className="tw-mb-2" />

      <h6 className="tw-font-title-x-large tw-text-text-default tw-mb-0.5">{`Delete folder "${folderName}"`}</h6>

      <p data-cy="modal-message" className="tw-font-body-default tw-text-text-default tw-mb-0">
        Deleting this folder will only delete the folder and not the data sources in it. This action is irreversible.
        Are you sure you want to continue?
      </p>
    </div>
  );
}

function FolderHasDataSourcesWarning({ folderName, branches }: { folderName: string; branches: string[] }) {
  return (
    <div className="tw-px-6 tw-py-4 tw-font-body-default tw-text-text-default">
      <Info size={40} color="var(--icon-accent)" className="tw-mb-2" />

      <h6 className="tw-font-title-large tw-text-text-default tw-mb-0.5">Folder cannot be deleted</h6>

      <p className="tw-mb-0">{`Folder "${folderName}" contains data sources on the following ${branches.length === 1 ? 'branch' : 'branches'}:`}</p>

      <ol data-cy="folder-delete-blocked-branch-list">
        {branches.map((branchName) => (
          <li key={branchName} data-cy="folder-delete-blocked-branch">
            {branchName}
          </li>
        ))}
      </ol>

      <p>Remove them from the folder on each branch, then delete the folder.</p>
    </div>
  );
}

function getDialogConfig({
  actionType,
  isAlertDialog,
}: {
  actionType: DataSourceFolderDialogType;
  isAlertDialog: boolean;
}): DialogConfig {
  switch (actionType) {
    case 'folder-has-data-sources-warning':
      return { title: '', submitBtnLabel: 'I understand' };
    default: {
      // "create-folder" -> "Create folder"
      const submitBtnLabel = capitalize(startCase(actionType));
      return {
        title: isAlertDialog ? '' : submitBtnLabel,
        submitBtnLabel,
        ...(isAlertDialog && { submitBtnVariant: 'dangerPrimary' }),
      };
    }
  }
}
