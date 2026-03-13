import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Trash, Check } from 'lucide-react';
import { camelCase, capitalize, startCase } from 'lodash';

import { cn } from '@/lib/utils';
import { validateName } from '@/_helpers/utils';
import { Input } from '@/components/ui/Rocket/input';
import { Field, FieldError } from '@/components/ui/Rocket/field';

import {
  useAddAppToFolder,
  useCreateFolder,
  useDeleteFolder,
  useFetchFolders,
  useRemoveAppFromFolder,
  useUpdateFolder,
} from '../../hooks/folderServiceHooks';
import { useWorkflowListStore } from '../../../Workflows/store';

import ActionDialog from '../../ActionDialog';

export default function FolderActionDialog({ appType }) {
  const { t } = useTranslation();

  const folderDialogState = useWorkflowListStore((state) => state.folderDialogState);
  const resetFolderDialogState = useWorkflowListStore((state) => state.resetFolderDialogState);

  const { mutate: createNewFolder, isPending: isCreatingNewFolder } = useCreateFolder();
  const { mutate: editFolder, isPending: isEditingFolder } = useUpdateFolder();
  const { mutate: deleteFolder, isPending: isDeletingFolder } = useDeleteFolder();
  const { mutate: addToFolder, isPending: isAddingToFolder } = useAddAppToFolder();
  const { mutate: removeAppFromFolder, isPending: isRemovingAppFromFolder } = useRemoveAppFromFolder();

  const { type: actionType, selectedFolderId, selectedFolderInitialName, appIdToProcess } = folderDialogState;

  const [errorText, setErrorText] = useState('');
  const [name, setName] = useState(selectedFolderInitialName ?? '');
  const [selectedFolder, setSelectedFolder] = useState('');

  const handleResetState = () => {
    setName('');
    setErrorText('');
    setSelectedFolder('');
    resetFolderDialogState();
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    const formattedFolderName = name?.trim().replace(/\s+/g, ' ');

    switch (actionType) {
      case 'create-folder': {
        if (!formattedFolderName) {
          setErrorText("Folder name can't be empty");
          return;
        }

        if (errorText) return;

        createNewFolder({ name: formattedFolderName, appType }, { onSuccess: handleResetState });
        break;
      }
      case 'edit-folder': {
        if (formattedFolderName === selectedFolderInitialName) {
          handleResetState();
          return;
        }

        if (errorText || !selectedFolderId) return;

        editFolder({ name: formattedFolderName, folderId: selectedFolderId }, { onSuccess: handleResetState });
        break;
      }
      case 'delete-folder': {
        if (!selectedFolderId) return;

        deleteFolder(selectedFolderId, { onSuccess: handleResetState });
        break;
      }
      case 'add-to-folder': {
        if (!selectedFolder || !appIdToProcess) {
          toast.error('Select a folder');
          return;
        }

        addToFolder({ appId: appIdToProcess, folderId: selectedFolder }, { onSuccess: handleResetState });
        break;
      }
      case 'remove-app-from-folder': {
        if (!selectedFolderId || !appIdToProcess) {
          toast.error('Select a folder');
          return;
        }

        removeAppFromFolder({ appId: appIdToProcess, folderId: selectedFolderId }, { onSuccess: handleResetState });
        break;
      }
      default:
        break;
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);

    setErrorText('');
    const error = validateName(e.target.value, 'Folder name', true, false, false, true, false, true);
    if (!error.status) {
      setErrorText(error.errorMsg);
    }
  };

  const hasError = Boolean(errorText);
  const isAddToFolder = actionType === 'add-to-folder';
  const isCreateOrEditFolder = ['create-folder', 'edit-folder'].includes(actionType);
  const isRemoveAppFromFolderOrDeleteFolder = ['remove-app-from-folder', 'delete-folder'].includes(actionType);

  const isNameEmpty = isCreateOrEditFolder && !name.trim();
  const isFolderToMoveSelected = isAddToFolder && !selectedFolder;
  const isEditTypeAndNameIsSame = actionType === 'edit-folder' && name.trim() === selectedFolderInitialName.trim();

  const isFormBeingSubmitted =
    isCreatingNewFolder || isEditingFolder || isDeletingFolder || isAddingToFolder || isRemovingAppFromFolder;
  const isCancelBtnDisabled = isFormBeingSubmitted;
  const isSubmitBtnDisabled =
    hasError || isNameEmpty || isEditTypeAndNameIsSame || isFolderToMoveSelected || isFormBeingSubmitted;

  const submitBtnLabel = t(`homePage.foldersSection.${camelCase(actionType)}Folder`, capitalize(startCase(actionType)));
  const dialogTitle = isCreateOrEditFolder || isAddToFolder ? submitBtnLabel : '';

  return (
    <ActionDialog
      title={dialogTitle}
      open={Boolean(actionType)}
      cancelBtnProps={{
        'data-cy': 'cancel-button',
        label: t('globals.cancel', 'Cancel'),
        onClick: handleResetState,
        disabled: isCancelBtnDisabled,
      }}
      submitBtnProps={{
        label: submitBtnLabel,
        disabled: isSubmitBtnDisabled,
        isLoading: isFormBeingSubmitted,
        form: `${actionType}-folder-form`,
        'data-cy': `${actionType}-folder-button`,
        ...(isRemoveAppFromFolderOrDeleteFolder && { variant: 'dangerPrimary' }),
        ...(!isCreateOrEditFolder && { onClick: handleSubmitForm }),
      }}
    >
      {isCreateOrEditFolder ? (
        <CreateOrRenameFolderBody
          folderName={name}
          errorText={errorText}
          actionType={actionType}
          onSubmit={handleSubmitForm}
          onFolderNameChange={handleNameChange}
          isNameInputDisabled={isFormBeingSubmitted}
        />
      ) : isRemoveAppFromFolderOrDeleteFolder ? (
        <DeleteOrRemoveAppFromFolder actionType={actionType} folderName={selectedFolderInitialName} />
      ) : isAddToFolder ? (
        <AddToFolder appType={appType} selectedFolder={selectedFolder} setSelectedFolder={setSelectedFolder} />
      ) : (
        <></>
      )}
    </ActionDialog>
  );
}

function CreateOrRenameFolderBody({
  folderName,
  actionType,
  errorText,
  onSubmit,
  onFolderNameChange,
  isNameInputDisabled,
}) {
  const { t } = useTranslation();

  const placeholder = t('homePage.foldersSection.folderName', 'folder name');

  return (
    <form id={`${actionType}-folder-form`} className="tw-px-6 tw-py-4" onSubmit={onSubmit}>
      <Field>
        <Input
          autoFocus
          type="text"
          value={folderName}
          maxLength={50}
          placeholder={placeholder}
          onChange={onFolderNameChange}
          disabled={isNameInputDisabled}
          dataCy="folder-name-input"
        />

        <FieldError className={cn({ 'tw-text-text-placeholder': !errorText })}>{errorText || ''}</FieldError>
      </Field>
    </form>
  );
}

function DeleteOrRemoveAppFromFolder({ folderName, actionType }) {
  const { t } = useTranslation();

  return (
    <div className="tw-px-6 tw-py-4">
      <Trash size={40} color="var(--icon-danger)" className="tw-mb-2" />

      <p className="tw-font-body-default tw-text-text-default">
        {actionType === 'remove-app-from-folder'
          ? t('homePage.removeAppFromFolder', 'The app will be removed from this folder, do you want to continue?')
          : t(
              'homePage.foldersSection.wishToDeleteFolder',
              `Are you sure you want to delete the folder {{folderName}}? Apps within the folder will not be deleted.`,
              { folderName }
            )}
      </p>
    </div>
  );
}

function AddToFolder({ appType, selectedFolder, setSelectedFolder }) {
  const { data: folders, isSuccess: isFoldersSuccess } = useFetchFolders({ appType }, {});

  if (!isFoldersSuccess) return <></>; // TODO: Can add Skeleton loader

  const filteredFolder = folders.filter((folder) => folder.value !== 'all');

  return (
    <div className="tw-px-6 tw-py-4 tw-border-b tw-border-border-weak">
      <ul className="tw-list-none tw-max-h-56 tw-overflow-y-auto">
        {filteredFolder.map((folder) => (
          <li
            role="button"
            key={folder.value}
            onClick={() => setSelectedFolder(folder.value)}
            className="tw-flex tw-items-center tw-gap-2 tw-px-2 tw-py-1.5 tw-rounded-md tw-transition hover:tw-bg-interactive-default"
          >
            <div className="tw-size-4">
              {selectedFolder === folder.value && <Check size={16} strokeWidth={3} color="var(--icon-accent)" />}
            </div>

            <span className="tw-font-body-default tw-text-text-default">{folder.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
