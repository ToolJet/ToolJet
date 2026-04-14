import React, { useState } from 'react';
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
  SelectItemText,
} from '@/components/ui/Rocket/Select/Select';
import { authenticationService } from '@/_services/authentication.service';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { useAppsStore } from '@/_stores/appsStore';
import { useIsWorkspaceBranchLocked } from '@/_hooks/useIsWorkspaceBranchLocked';

import TruncatedText from '../TruncatedText';

export default function FolderBreadcrumb({ selectedFolder, folderList, onChangeSelectedFolder }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const currentUserId = authenticationService.currentSessionValue?.current_user?.id;
  const folderGroupPermissions = authenticationService.currentSessionValue?.folder_group_permissions;

  const isWorkspaceBranchLocked = useIsWorkspaceBranchLocked();

  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);
  const selectedFolderDetails = folderList?.find((folder) => folder.value === selectedFolder) ?? null;

  const [showFolderList, setShowFolderList] = useState(false);

  const handleCreateNewFolder = () => {
    setFolderDialogState({ type: 'create-folder' });
    setShowFolderList(false);
  };

  const handleEditFolder = () => {
    setFolderDialogState({
      type: 'edit-folder',
      currentFolderId: selectedFolder,
      initialFolderName: selectedFolderDetails?.label ?? '',
    });
    setShowFolderList(false);
  };

  const handleDeleteFolder = () => {
    setFolderDialogState({
      type: 'delete-folder',
      currentFolderId: selectedFolder,
      initialFolderName: selectedFolderDetails?.label ?? '',
    });
    setShowFolderList(false);
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
          <Select
            open={showFolderList}
            onOpenChange={setShowFolderList}
            value={selectedFolder}
            onValueChange={onChangeSelectedFolder}
          >
            <SelectTrigger
              showArrow={false}
              data-cy="all-applications-link"
              className="tw-max-w-40 tw-rounded-lg tw-shadow-none tw-gap-1.5 tw-px-2 tw-py-1 tw-text-text-default tw-font-title-default tw-border-0 hover:tw-bg-interactive-hover data-[state=open]:tw-bg-interactive-selected"
            >
              <FolderOpen size={16} color="var(--icon-default)" className="tw-shrink-0" />
              <SelectValue />
            </SelectTrigger>

            <SelectContent
              align="end"
              className={cn('tw-w-60 tw-border tw-border-solid tw-border-border-weak', {
                'dark-theme theme-dark': darkMode,
              })}
            >
              <header className="tw-py-2 tw-px-1">
                <div className="tw-flex tw-justify-between tw-items-center tw-gap-2">
                  <div className="tw-min-w-0 tw-flex-1 tw-flex tw-items-center tw-gap-1.5">
                    <div className="tw-p-1.5 tw-rounded-lg tw-bg-background-accent-weak">
                      <FolderOpen size={16} color="var(--icon-accent)" />
                    </div>

                    <TruncatedText
                      content={selectedFolderDetails?.label ?? ''}
                      className="tw-font-title-default tw-text-text-default tw-flex-1 tw-mb-0 tw-min-w-0"
                    >
                      {selectedFolderDetails?.label ?? ''}
                    </TruncatedText>
                  </div>

                  {selectedFolder && selectedFolder !== 'all' && hasDeleteOrUpdateFolderPermission && (
                    <div className="tw-flex tw-items-center tw-shrink-0">
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
                    <SelectItemText asChild>
                      <TruncatedText content={folder.label} className="tw-flex-1 tw-mb-0 tw-min-w-0">
                        {folder.label}
                      </TruncatedText>
                    </SelectItemText>
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
