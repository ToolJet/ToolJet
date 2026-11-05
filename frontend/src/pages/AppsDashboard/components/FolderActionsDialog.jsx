import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Trash, Check, TriangleAlert, Folder, X } from 'lucide-react';
import { camelCase, capitalize, startCase } from 'lodash';

import { cn } from '@/lib/utils';
import { validateName } from '@/_helpers/utils';
import { appTypeToDisplayNameMapping } from '../helper';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Rocket/Input/Input';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/Rocket/Combobox/Combobox';
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
  const [selectedFolder, setSelectedFolder] = useState(null);

  const appId = appDetails?.id;
  const appType = appDetails?.type ?? defaultAppType;

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
        if (!selectedFolder?.value || !appId) {
          toast.error('Select a folder');
          return;
        }

        addToFolder({ appId, folderId: selectedFolder.value, appType }, { onSuccess: handleResetState });
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
  const isDeleteFolder = actionType === 'delete-folder';
  const isRemoveAppFromFolder = actionType === 'remove-app-from-folder';

  const isNameEmpty = isCreateOrEditFolder && !name.trim();
  const isFolderToMoveSelected = isAddToFolder && !selectedFolder;
  const isEditTypeAndNameIsSame = actionType === 'rename-folder' && name.trim() === initialFolderName.trim();

  const isFormBeingSubmitted =
    isCreatingNewFolder || isEditingFolder || isDeletingFolder || isAddingToFolder || isRemovingAppFromFolder;
  const isCancelBtnDisabled = isFormBeingSubmitted;

  const isSubmitBtnDisabled =
    hasError || isNameEmpty || isEditTypeAndNameIsSame || isFolderToMoveSelected || isFormBeingSubmitted;

  const isAlertDialog = isDeleteFolder || isFolderHasAppsWarning;

  const submitBtnLabel = isRemoveAppFromFolder
    ? 'Remove from folder'
    : isAddToFolder
      ? 'Move to folder'
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
      ) : isDeleteFolder ? (
        <DeleteFolder appType={appType} actionType={actionType} folderName={initialFolderName} />
      ) : isAddToFolder || isRemoveAppFromFolder ? (
        <MoveOrRemoveFromFolder
          appType={appType}
          appName={appDetails?.name}
          actionType={actionType}
          currentFolderName={initialFolderName}
          currentFolderId={folderId}
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
        />
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

function DeleteFolder({ folderName, actionType, appType }) {
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

function AppToMove({ appType, appName, currentFolderName }) {
  return (
    <div data-cy="app-to-move" className="tw-mb-4">
      <p className="tw-font-title-default tw-text-text-default tw-mb-1">
        {capitalize(appTypeToDisplayNameMapping[appType])} to move
      </p>

      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-px-3 tw-py-2">
        <div className="tw-min-w-0">
          <p className="tw-font-body-default tw-text-text-default tw-mb-0.5 tw-truncate">{appName}</p>

          <p className="tw-flex tw-items-center tw-gap-1 tw-font-body-small tw-text-text-placeholder tw-mb-0">
            <Folder size={12} className="tw-shrink-0 tw-text-icon-default" />
            <span className="tw-truncate">{currentFolderName || 'No folder'}</span>
          </p>
        </div>

        {/* {currentFolderName && (
          <Button
            isLucid
            iconOnly
            variant="ghost"
            size="small"
            aria-label="Remove from folder"
            data-cy="remove-from-folder-button"
            onClick={onRemoveFromFolder}
          >
            <X size={12} />
          </Button>
        )} */}
      </div>
    </div>
  );
}

function MoveOrRemoveFromFolder({
  appType,
  appName,
  actionType,
  currentFolderName,
  currentFolderId,
  selectedFolder,
  setSelectedFolder,
}) {
  const searchQuery = useSearchStore((state) => state.debouncedSearchQuery);

  const { data: folders, isSuccess: isFoldersSuccess } = useFetchFolders({ appType, appSearchQuery: searchQuery });

  if (!isFoldersSuccess) return <></>;

  const baseFolderFilterLogic = (folder) => {
    if (folder.value === currentFolderId) return false;

    const currentSession = authenticationService.currentSessionValue;
    if (currentSession?.super_admin || currentSession?.admin) return true;

    // Check if user has edit permissions for the folder
    const folderPermissions = currentSession?.user_permissions?.folder;
    if (folderPermissions?.is_all_editable || folderPermissions?.editable_folders_id?.includes(folder.id)) return true;

    // Allow folder owners to add apps to their own folders
    const currentUserId = currentSession?.current_user?.id;
    return !!(currentUserId && folder.created_by === currentUserId);
  };

  const filteredFolder = folders.filter(baseFolderFilterLogic);

  return (
    <div data-cy="select-folder" className="tw-px-6 tw-py-4">
      <AppToMove appType={appType} appName={appName} currentFolderName={currentFolderName} />

      {actionType === 'remove-app-from-folder' ? (
        <p className="tw-text-text-placeholder tw-font-body-default">
          Apps will move out of their folders and will be added as stray apps. They won’t be deleted.
        </p>
      ) : (
        <Field>
          <FieldLabel htmlFor="folder-name-input" data-cy="folder-name-label">
            Move to
          </FieldLabel>

          <Combobox
            items={filteredFolder}
            value={selectedFolder}
            itemToStringLabel={(item) => item.label}
            onValueChange={setSelectedFolder}
          >
            <ComboboxInput placeholder="Select folder" />

            <ComboboxContent positionerClassName="!tw-z-[9999]">
              {/* <ComboboxEmpty>No results found</ComboboxEmpty> */}

              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
      )}
    </div>
  );
}
