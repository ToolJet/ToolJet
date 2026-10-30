import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Trash, Check, TriangleAlert } from 'lucide-react';
import { camelCase, capitalize, startCase } from 'lodash';

import { cn } from '@/lib/utils';
import { validateName } from '@/_helpers/utils';
import { appTypeToDisplayNameMapping } from '../helper';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { Field, FieldError, FieldDescription } from '@/components/ui/Rocket/Field/Field';
import {
  useAddAppToFolder,
  useCreateFolder,
  useDeleteFolder,
  useFetchFolders,
  useRemoveAppFromFolder,
  useUpdateFolder,
} from '@/_services/hooks/foldersServiceHooks';
import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';
import { authenticationService } from '@/_services/authentication.service';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { useSearch } from '@/_hooks/useSearch';

import ActionDialog from './ActionDialog';
// import SearchBar from '../SearchBar';

const MAX_FOLDER_NAME_LENGTH = 100;

// `defaultAppType` is the page's app type, used when the dialog's app doesn't carry its own.
export default function FolderActionsDialog({ open, defaultAppType }) {
  const { t } = useTranslation();

  const {
    type: actionType,
    appDetails,
    folderId,
    initialFolderName,
    selectedRowIds,
  } = useAppsStore((state) => state.folderDialogState);
  const resetFolderDialogState = useAppsStore((state) => state.resetFolderDialogState);

  const { mutate: createNewFolder, isPending: isCreatingNewFolder } = useCreateFolder();
  const { mutate: editFolder, isPending: isEditingFolder } = useUpdateFolder();
  const { mutate: deleteFolder, isPending: isDeletingFolder } = useDeleteFolder();
  const { mutate: addToFolder, isPending: isAddingToFolder } = useAddAppToFolder();
  const { mutate: removeAppFromFolder, isPending: isRemovingAppFromFolder } = useRemoveAppFromFolder();

  const [errorText, setErrorText] = useState('');
  const [name, setName] = useState(initialFolderName ?? '');
  const [selectedFolder, setSelectedFolder] = useState('');

  const appId = appDetails?.id;
  const appType = appDetails?.type ?? defaultAppType;
  const selectedRowCount = selectedRowIds?.length ?? 0;

  const handleResetState = () => {
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
      case 'rename-folder': {
        if (formattedFolderName === initialFolderName) {
          handleResetState();
          return;
        }

        if (errorText || !folderId) return;

        editFolder({ name: formattedFolderName, folderId, appType }, { onSuccess: handleResetState });
        break;
      }
      case 'delete-folder': {
        if (!folderId) return;

        deleteFolder({ folderId, appType }, { onSuccess: handleResetState });
        break;
      }
      case 'add-to-folder': {
        if (!selectedFolder || !appId) {
          toast.error('Select a folder');
          return;
        }

        addToFolder({ appId, folderId: selectedFolder, appType }, { onSuccess: handleResetState });
        break;
      }
      case 'remove-app-from-folder': {
        if (!folderId || !appId) {
          toast.error('Select a folder');
          return;
        }

        removeAppFromFolder({ appId, folderId, appType }, { onSuccess: handleResetState });
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
  const isCreateOrEditFolder = ['create-folder', 'rename-folder'].includes(actionType);
  const isRemoveAppFromFolderOrDeleteFolder = ['remove-app-from-folder', 'delete-folder'].includes(actionType);
  const isBulkDeleteFolders = actionType === 'bulk-delete-folder';

  const isNameEmpty = isCreateOrEditFolder && !name.trim();
  const isFolderToMoveSelected = isAddToFolder && !selectedFolder;
  const isEditTypeAndNameIsSame = actionType === 'rename-folder' && name.trim() === initialFolderName.trim();

  const isFormBeingSubmitted =
    isCreatingNewFolder || isEditingFolder || isDeletingFolder || isAddingToFolder || isRemovingAppFromFolder;
  const isCancelBtnDisabled = isFormBeingSubmitted;
  const isSubmitBtnDisabled = true;
  // const isSubmitBtnDisabled =
  //   hasError || isNameEmpty || isEditTypeAndNameIsSame || isFolderToMoveSelected || isFormBeingSubmitted;

  const isAlertDialog = isRemoveAppFromFolderOrDeleteFolder || isBulkDeleteFolders;

  const submitBtnLabel =
    actionType === 'remove-app-from-folder'
      ? 'Remove from folder'
      : actionType === 'bulk-delete-folder'
        ? `Delete folder${selectedRowCount > 1 ? 's' : ''}`
        : t(`homePage.foldersSection.${camelCase(actionType)}Folder`, capitalize(startCase(actionType)));
  const dialogTitle = isAlertDialog ? '' : submitBtnLabel;

  return (
    <ActionDialog
      open={open}
      title={dialogTitle}
      cancelBtnProps={{
        'data-cy': 'cancel-button',
        label: t('globals.cancel', 'Cancel'),
        onClick: handleResetState,
        disabled: isCancelBtnDisabled,
      }}
      submitActions={[
        {
          label: submitBtnLabel,
          disabled: isSubmitBtnDisabled,
          isLoading: isFormBeingSubmitted,
          form: `${actionType}-folder-form`,
          'data-cy': `${actionType}-button`,
          ...(isAlertDialog && { variant: 'dangerPrimary' }),
          ...(!isCreateOrEditFolder && { onClick: handleSubmitForm }),
        },
      ]}
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
        <DeleteOrRemoveAppFromFolder appType={appType} actionType={actionType} folderName={initialFolderName} />
      ) : isAddToFolder ? (
        <AddToFolder
          appType={appType}
          currentFolderId={folderId}
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
        />
      ) : isBulkDeleteFolders ? (
        <BulkDeleteFoldersBody selectedRowCount={selectedRowCount} />
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
          maxLength={MAX_FOLDER_NAME_LENGTH}
          placeholder={placeholder}
          onChange={onFolderNameChange}
          disabled={isNameInputDisabled}
          data-cy="folder-name-input"
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

function DeleteOrRemoveAppFromFolder({ folderName, actionType, appType }) {
  // TODO: folderName is representing incorrect value incase of remove app from folder action
  const appTypeDisplayName = appTypeToDisplayNameMapping[appType]?.toLowerCase() || 'app';

  const heading =
    actionType === 'remove-app-from-folder'
      ? `Remove ${appTypeDisplayName} from "${folderName}"`
      : `Delete folder "${folderName}"`;
  const description =
    actionType === 'remove-app-from-folder'
      ? `This ${appTypeDisplayName} will be removed from ${folderName} and will no longer appear in this folder.`
      : `The folder will be permanently deleted, do you want to continue?`;

  return (
    <div className="tw-px-6 tw-py-4">
      <Trash size={40} color="var(--icon-danger)" className="tw-mb-2" />

      <h6 className="tw-font-title-x-large tw-text-text-default tw-mb-0.5">{heading}</h6>

      <p data-cy="modal-message" className="tw-font-body-default tw-text-text-default tw-mb-0">
        {description}
      </p>
    </div>
  );
}

function BulkDeleteFoldersBody({ selectedRowCount }) {
  const noun = selectedRowCount > 1 ? 'folders' : 'folder';
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

function AddToFolder({ appType, currentFolderId, selectedFolder, setSelectedFolder }) {
  const searchQuery = useSearchStore((state) => state.searchQuery);

  const { searchTerm, setSearchTerm, debouncedSearchTerm } = useSearch({ debounceDelay: 300 });
  const { data: folders, isSuccess: isFoldersSuccess } = useFetchFolders({ appType, appSearchQuery: searchQuery });

  if (!isFoldersSuccess) return <></>;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const baseFolderFilterLogic = (folder) => {
    if (folder.value === 'all' || folder.value === currentFolderId) return false;

    const currentSession = authenticationService.currentSessionValue;
    if (currentSession?.super_admin || currentSession?.admin) return true;

    // Check if user has edit permissions for the folder
    const folderPermissions = currentSession?.user_permissions?.folder;
    if (folderPermissions?.is_all_editable || folderPermissions?.editable_folders_id?.includes(folder.id)) return true;

    // Allow folder owners to add apps to their own folders
    const currentUserId = currentSession?.current_user?.id;
    return !!(currentUserId && folder.created_by === currentUserId);
  };

  const filteredFolder =
    debouncedSearchTerm.trim() === ''
      ? folders.filter(baseFolderFilterLogic)
      : folders.filter(
          (folder) =>
            baseFolderFilterLogic(folder) && folder.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );

  return (
    <div
      data-cy="select-folder"
      className="tw-px-6 tw-py-4 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak"
    >
      {/* <SearchBar
        placeholder="Search folders"
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        classes={{ searchInputContainer: 'tw-mb-4' }}
        dataCy="search-folder-input"
      /> */}

      <ul data-cy="folder-list" className="tw-list-none tw-h-56 tw-overflow-y-auto tw-pl-0 tw-mb-0">
        {filteredFolder.length ? (
          filteredFolder.map((folder) => (
            <li
              role="button"
              key={folder.value}
              onClick={() => setSelectedFolder(folder.value)}
              data-cy={`folder-option-${generateCypressDataCy(folder.value)}`}
              className="tw-flex tw-items-center tw-gap-2 tw-px-2 tw-py-1.5 tw-rounded-md tw-transition hover:tw-bg-interactive-default"
            >
              <div className="tw-size-4">
                {selectedFolder === folder.value && <Check size={16} strokeWidth={3} color="var(--icon-accent)" />}
              </div>

              <span className="tw-font-body-default tw-text-text-default">{folder.label}</span>
            </li>
          ))
        ) : (
          <li>
            <p className="tw-text-center tw-text-body-large tw-text-text-placeholder tw-mb-0">No results found</p>
          </li>
        )}
      </ul>
    </div>
  );
}
