import React from 'react';
import { FolderOpen } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from '@/components/ui/Rocket/Breadcrumb/Breadcrumb';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
} from '@/components/ui/Rocket/Select/Select';
import { authenticationService } from '@/_services/authentication.service';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { useAppsStore } from '@/_stores/appsStore';
import { useIsWorkspaceBranchLocked } from '@/_hooks/useIsWorkspaceBranchLocked';

// import SearchBar from '../SearchBar';

export default function FolderBreadcrumb({ selectedFolder, folderList, onChangeSelectedFolder }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const currentUserId = authenticationService.currentSessionValue?.current_user?.id;
  const folderGroupPermissions = authenticationService.currentSessionValue?.folder_group_permissions;

  const isWorkspaceBranchLocked = useIsWorkspaceBranchLocked();

  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);
  const selectedFolderDetails = folderList?.find((folder) => folder.value === selectedFolder) ?? null;

  const handleCreateNewFolder = () => {
    setFolderDialogState({ type: 'create-folder' });
  };

  const handleEditFolder = () => {
    setFolderDialogState({
      type: 'edit-folder',
      currentFolderId: selectedFolder,
      initialFolderName: selectedFolderDetails?.label ?? '',
    });
  };

  const handleDeleteFolder = () => {
    setFolderDialogState({
      type: 'delete-folder',
      currentFolderId: selectedFolder,
    });
  };

  // Check if user can edit a specific folder (granular permission)
  const canEditSpecificFolder = (folderId) => {
    if (!folderGroupPermissions) return false;

    return Boolean(
      folderGroupPermissions.is_all_editable || folderGroupPermissions.editable_folders_id?.includes(folderId)
    );
  };

  const isOwnerOfFolder = (folder) => {
    return folder?.createdBy === currentUserId;
  };

  const hasOverallCreateFolderPermission =
    authenticationService.currentSessionValue?.user_permissions?.folder_create ?? false;
  const hasOverallDeleteFolderPermission =
    authenticationService.currentSessionValue?.user_permissions?.folder_delete ?? false;

  const hasCreateFolderPermission = !isWorkspaceBranchLocked && hasOverallCreateFolderPermission;

  // Determine if user can update/delete a specific folder
  // Rename: requires granular canEditFolder OR (folderCreate + ownership)
  // Delete: requires master Delete OR (folderCreate + ownership)
  const hasDeleteFolderPermission =
    (!isWorkspaceBranchLocked && hasOverallDeleteFolderPermission) || isOwnerOfFolder(selectedFolderDetails);
  const hasUpdateFolderPermission = canEditSpecificFolder(selectedFolder) || isOwnerOfFolder(selectedFolderDetails);

  const hasDeleteOrUpdateFolderPermission = hasDeleteFolderPermission || hasUpdateFolderPermission;

  return (
    <Breadcrumb>
      <BreadcrumbList className="sm:tw-gap-2 tw-mb-0">
        <BreadcrumbItem>
          <p data-cy="folder-info" className="tw-font-title-default tw-text-text-placeholder tw-mb-0">
            Folders
          </p>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <Select value={selectedFolder} onValueChange={onChangeSelectedFolder}>
            <SelectTrigger
              data-cy="all-applications-link"
              className="tw-rounded-lg tw-shadow-none tw-gap-1.5 tw-px-2 tw-py-1 tw-text-text-default tw-font-title-default tw-border-0 hover:tw-bg-interactive-hover data-[state=open]:tw-bg-interactive-selected"
            >
              <FolderOpen size={16} color="var(--icon-default)" />
              <SelectValue />
            </SelectTrigger>

            <SelectContent
              align="end"
              className={cn('tw-min-w-52 tw-border tw-border-solid tw-border-border-weak', {
                'dark-theme theme-dark': darkMode,
              })}
            >
              <header className="tw-p-2">
                <div className="tw-flex tw-justify-between tw-items-center tw-gap-1">
                  <p className="tw-font-title-default tw-text-text-default tw-flex tw-items-center tw-gap-1.5 tw-mb-0">
                    <span className="tw-p-1.5 tw-rounded-lg tw-bg-background-accent-weak">
                      <FolderOpen size={16} color="var(--icon-accent)" />
                    </span>
                    {selectedFolderDetails?.label ?? ''}
                  </p>

                  {selectedFolder && selectedFolder !== 'all' && hasDeleteOrUpdateFolderPermission && (
                    <div className="tw-flex tw-items-center">
                      {hasUpdateFolderPermission && (
                        <Button
                          isLucid
                          iconOnly
                          size="medium"
                          variant="ghost"
                          leadingIcon="square-pen"
                          data-cy="edit-folder-icon-button"
                          onClick={handleEditFolder}
                        />
                      )}

                      {hasDeleteFolderPermission && (
                        <Button
                          isLucid
                          iconOnly
                          size="medium"
                          variant="ghost"
                          leadingIcon="trash"
                          data-cy="delete-folder-icon-button"
                          onClick={handleDeleteFolder}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* <SearchBar /> */}
              </header>

              <SelectSeparator className="tw-bg-border-weak" />

              <SelectGroup data-cy="folder-dropdown-list" className="tw-h-56 tw-overflow-y-auto tw-hide-scrollbar">
                {folderList.map((folder) => (
                  <SelectItem
                    key={folder.value}
                    value={folder.value}
                    className="tw-font-body-default tw-text-text-default tw-justify-between tw-gap-2"
                    data-cy={`${generateCypressDataCy(folder.label)}-folder-name`}
                  >
                    {folder.label}
                  </SelectItem>
                ))}
              </SelectGroup>

              {hasCreateFolderPermission && (
                <>
                  <SelectSeparator className="tw-bg-border-weak" />

                  <Button
                    isLucid
                    variant="ghostBrand"
                    leadingIcon="plus"
                    className="tw-w-full"
                    data-cy="create-new-folder-button"
                    onClick={handleCreateNewFolder}
                  >
                    New folder
                  </Button>
                </>
              )}
            </SelectContent>
          </Select>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
