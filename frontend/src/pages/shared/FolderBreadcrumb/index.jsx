import React from 'react';
import { FolderOpen, SquarePen, Trash } from 'lucide-react';

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
import { useWorkflowListStore } from '../../Workflows/store';

export default function FolderBreadcrumb({ selectedFolder, folderList, onChangeSelectedFolder, onAddNewFolder }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const setFolderDialogState = useWorkflowListStore((state) => state.setFolderDialogState);

  const handleCreateNewFolder = () => {
    setFolderDialogState({ type: 'create-folder' });
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

            <SelectContent className={cn('tw-min-w-52', { 'dark-theme theme-dark': darkMode })}>
              {/* TODO: Search functionality */}
              {/* <p>Search</p>
              <SelectSeparator /> */}

              <SelectGroup>
                {folderList.map((folder) => (
                  <SelectItem key={folder.value} value={folder.value} className="tw-justify-between tw-gap-2">
                    <SelectItemText>{folder.label}</SelectItemText>

                    {/* <div className="tw-flex tw-items-center gap-1">
                      <Button
                        isLucid
                        iconOnly
                        size="small"
                        variant="ghost"
                        leadingIcon="square-pen"
                        onClick={onAddNewFolder}
                      />

                      <Button
                        isLucid
                        iconOnly
                        size="medium"
                        variant="ghost"
                        leadingIcon="trash"
                        onClick={onAddNewFolder}
                      />
                    </div> */}
                  </SelectItem>
                ))}
              </SelectGroup>

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
            </SelectContent>
          </Select>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
