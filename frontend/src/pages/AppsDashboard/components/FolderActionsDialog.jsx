import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Trash, Check, TriangleAlert } from 'lucide-react';
import { camelCase, capitalize, startCase } from 'lodash';

import { cn } from '@/lib/utils';
import { validateName } from '@/_helpers/utils';
import { appTypeToDisplayNameMapping } from '../helper';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { Field, FieldError, FieldDescription, FieldLabel } from '@/components/ui/Rocket/Field/Field';
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
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
// import SearchBar from '../SearchBar';

const MAX_FOLDER_NAME_LENGTH = 50;

// `defaultAppType` is the page's app type, used when the dialog's app doesn't carry its own.
export default function FolderActionsDialog({ open, defaultAppType }) {
  const { t } = useTranslation();

  const {
    type: actionType,
    folderDetails,
    appDetails,
    selectedRowIds,
    folderHasItemsOnBranch,
  } = useAppsStore((state) => state.folderDialogState);
  const resetFolderDialogState = useAppsStore((state) => state.resetFolderDialogState);
  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);

  const { mutate: createNewFolder, isPending: isCreatingNewFolder } = useCreateFolder();
  const { mutate: editFolder, isPending: isEditingFolder } = useUpdateFolder();
  const { mutate: deleteFolder, isPending: isDeletingFolder } = useDeleteFolder();
  const { mutate: addToFolder, isPending: isAddingToFolder } = useAddAppToFolder();
  const { mutate: removeAppFromFolder, isPending: isRemovingAppFromFolder } = useRemoveAppFromFolder();

  const folderId = folderDetails?.id;
  const initialFolderName = folderDetails?.name ?? '';

  const [errorText, setErrorText] = useState('');
  const [name, setName] = useState(initialFolderName);
  const [selectedFolder, setSelectedFolder] = useState('');

  const appId = appDetails?.id;
  const appType = appDetails?.type ?? defaultAppType;
  const selectedRowCount = selectedRowIds?.length ?? 0;

  const handleResetState = () => {
    resetFolderDialogState();
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    const formattedFolderName = name?.trim()?.replace(/\s+/g, ' '); // Regex: Collapse multiple spaces into one

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
        if (formattedFolderName === initialFolderName || !folderDetails.actions.rename) {
          handleResetState();
          return;
        }

        if (errorText || !folderId) return;

        editFolder({ name: formattedFolderName, folderId, appType }, { onSuccess: handleResetState });
        break;
      }
      case 'delete-folder': {
        if (!folderId) return;

        deleteFolder(
          { folderId, appType },
          {
            onSuccess: handleResetState,
            onError: ({ error }) => {
              // The global exception filter collapses error responses down to { message, ... },
              // so the branch list is JSON-encoded inside the message string on the backend
              // (see FoldersService.deleteFolder) — parse it back out here.
              let folderHasItemsOnBranch = [];
              try {
                folderHasItemsOnBranch = JSON.parse(error)?.branches;
              } catch (e) {
                // error is a plain string message, not JSON — fall through to the toast below
              }

              if (folderHasItemsOnBranch?.length)
                setFolderDialogState({ type: 'folder-has-apps-warning', folderHasItemsOnBranch });
              else toast.error(error);
            },
          }
        );
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
      case 'folder-has-apps-warning': {
        resetFolderDialogState();
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
  const isFolderHasAppsWarning = actionType === 'folder-has-apps-warning';
  const isCreateOrEditFolder = ['create-folder', 'rename-folder'].includes(actionType);
  const isRemoveAppFromFolderOrDeleteFolder = ['remove-app-from-folder', 'delete-folder'].includes(actionType);
  const isBulkDeleteFolders = actionType === 'bulk-delete-folder';

  const isNameEmpty = isCreateOrEditFolder && !name.trim();
  const isFolderToMoveSelected = isAddToFolder && !selectedFolder;
  const isEditTypeAndNameIsSame = actionType === 'rename-folder' && name.trim() === initialFolderName.trim();

  const isFormBeingSubmitted =
    isCreatingNewFolder || isEditingFolder || isDeletingFolder || isAddingToFolder || isRemovingAppFromFolder;
  const isCancelBtnDisabled = isFormBeingSubmitted;

  const isSubmitBtnDisabled =
    hasError || isNameEmpty || isEditTypeAndNameIsSame || isFolderToMoveSelected || isFormBeingSubmitted;

  const isAlertDialog = isRemoveAppFromFolderOrDeleteFolder || isBulkDeleteFolders || isFolderHasAppsWarning;

  const submitBtnLabel =
    actionType === 'remove-app-from-folder'
      ? 'Remove from folder'
      : isBulkDeleteFolders
        ? `Delete folder${selectedRowCount > 1 ? 's' : ''}`
        : isFolderHasAppsWarning
          ? `I understand`
          : t(`homePage.foldersSection.${camelCase(actionType)}Folder`, capitalize(startCase(actionType)));

  const customSubmitBtnProp = isFolderHasAppsWarning
    ? { variant: 'outline' }
    : isAlertDialog
      ? { variant: 'dangerPrimary' }
      : {};
  const dialogTitle = isAlertDialog ? '' : submitBtnLabel;
  const showCancelButton = !isFolderHasAppsWarning;

  return (
    <ActionDialog
      open={open}
      title={dialogTitle}
      showCancelButton={showCancelButton}
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
          ...(!isCreateOrEditFolder && { onClick: handleSubmitForm }),
          ...customSubmitBtnProp,
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
      ) : isFolderHasAppsWarning ? (
        <FolderHasAppsWarning
          appType={appType}
          branches={folderHasItemsOnBranch?.length ? folderHasItemsOnBranch : []}
        />
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
        <FieldLabel htmlFor="folder-name-input" data-cy="folder-name-label">
          Folder name
        </FieldLabel>

        <Input
          autoFocus
          type="text"
          id="folder-name-input"
          value={folderName}
          placeholder={placeholder}
          maxLength={MAX_FOLDER_NAME_LENGTH}
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

function FolderHasAppsWarning({ branches, appType }) {
  const defaultBranchName = useWorkspaceBranchesStore(
    (state) => state.branches?.find((branch) => branch.is_default || branch.isDefault)?.name
  );

  const appTypeDisplayName = appTypeToDisplayNameMapping[appType]?.toLowerCase() || 'app';

  return (
    <div className="tw-px-6 tw-py-4 tw-font-body-default tw-text-text-default ">
      <TriangleAlert size={40} color="var(--icon-warning)" className="tw-mb-2" />

      <h6 className="tw-font-title-large tw-text-text-default tw-mb-0.5">
        Folder with {appTypeDisplayName}s cannot be deleted
      </h6>

      <p className="tw-mb-0">This folder contains {appTypeDisplayName}s on the following branches:</p>

      <ol>
        {branches.map((branchName) => (
          <li key={branchName}>{branchName}</li>
        ))}
      </ol>

      <p className="folder-has-apps-modal-intro-text">
        Folders are shared across all branches in this workspace, so to delete it:
      </p>

      <ul>
        <li>Remove all {appTypeDisplayName}s from this folder in each listed branch</li>
        <li>Delete the folder from any branch, it&apos;ll be removed workspace-wide</li>
      </ul>

      <p className="mb-0">
        Make sure changes are committed and merged to {defaultBranchName || 'the default branch'}. Else, the folder will
        reappear on the next pull.
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
