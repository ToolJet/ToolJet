import React from 'react';
import { FolderOpen } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator } from '@/components/ui/Rocket/breadcrumb';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemText,
  SelectSeparator,
} from '@/components/ui/Rocket/select';
import { authenticationService } from '@/_services/authentication.service';

import { useAppsStore } from '../store';
// import SearchBar from '../SearchBar';

export default function FolderBreadcrumb({ selectedFolder, folderList, onChangeSelectedFolder }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const hasFolderCRUDPermission = authenticationService.currentSessionValue?.user_permissions?.folder_c_r_u_d ?? false;

  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);

  const selectedFolderLabel = folderList?.find((folder) => folder.value === selectedFolder)?.label ?? '';

  const handleCreateNewFolder = () => {
    setFolderDialogState({ type: 'create-folder' });
  };

  const handleEditFolder = () => {
    setFolderDialogState({
      type: 'edit-folder',
      currentFolderId: selectedFolder,
      initialFolderName: selectedFolderLabel,
    });
  };

  const handleDeleteFolder = () => {
    setFolderDialogState({
      type: 'delete-folder',
      currentFolderId: selectedFolder,
    });
  };

  return (
    <Breadcrumb>
      <BreadcrumbList className="sm:tw-gap-2">
        <BreadcrumbItem>
          <p className="tw-font-title-default tw-text-text-placeholder">Folders</p>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <Select value={selectedFolder} onValueChange={onChangeSelectedFolder}>
            <SelectTrigger className="tw-rounded-lg tw-shadow-none tw-gap-1.5 tw-px-2 tw-py-1 tw-text-text-default tw-font-title-default tw-border-0 hover:tw-bg-interactive-hover data-[state=open]:tw-bg-interactive-selected">
              <FolderOpen size={16} color="var(--icon-default)" />
              <SelectValue />
            </SelectTrigger>

            <SelectContent align="end" className={cn('tw-min-w-52', { 'dark-theme theme-dark': darkMode })}>
              <header className="tw-p-2">
                <div className="tw-flex tw-justify-between tw-items-center tw-gap-1">
                  <p className="tw-font-title-default tw-text-text-default tw-flex tw-items-center tw-gap-1.5">
                    <span className="tw-p-1.5 tw-rounded-lg tw-bg-background-accent-weak">
                      <FolderOpen size={16} color="var(--icon-accent)" />
                    </span>
                    {selectedFolderLabel}
                  </p>

                  {selectedFolder && selectedFolder !== 'all' && hasFolderCRUDPermission && (
                    <div className="tw-flex tw-items-center">
                      <Button
                        isLucid
                        iconOnly
                        size="medium"
                        variant="ghost"
                        leadingIcon="square-pen"
                        onClick={handleEditFolder}
                      />

                      <Button
                        isLucid
                        iconOnly
                        size="medium"
                        variant="ghost"
                        leadingIcon="trash"
                        onClick={handleDeleteFolder}
                      />
                    </div>
                  )}
                </div>

                {/* <SearchBar /> */}
              </header>

              <SelectSeparator />

              <SelectGroup className="tw-h-56 tw-overflow-y-auto tw-hide-scrollbar">
                {folderList.map((folder) => (
                  <SelectItem
                    key={folder.value}
                    value={folder.value}
                    className="tw-font-body-default tw-text-text-default tw-justify-between tw-gap-2"
                  >
                    <SelectItemText>{folder.label}</SelectItemText>
                  </SelectItem>
                ))}
              </SelectGroup>

              {hasFolderCRUDPermission && (
                <>
                  <SelectSeparator />

                  <Button
                    isLucid
                    variant="ghostBrand"
                    leadingIcon="plus"
                    className="tw-w-full"
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
