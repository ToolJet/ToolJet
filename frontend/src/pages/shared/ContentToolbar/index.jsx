import React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';

import FolderBreadcrumb from '../FolderBreadcrumb';

export default function ContentToolbar({
  folderList,
  selectedFolder,
  onChangeSelectedFolder,
  onAddNewFolder,
  onToggleContentView,
  classes = null,
}) {
  return (
    <div className={cn('tw-flex tw-justify-end tw-items-center tw-gap-3 tw-border-b tw-border-border-weak tw-pb-1')}>
      <FolderBreadcrumb
        selectedFolder={selectedFolder}
        folderList={folderList}
        onAddNewFolder={onAddNewFolder}
        onChangeSelectedFolder={onChangeSelectedFolder}
      />

      {/* <div className="tw-flex tw-items-center tw-gap-1">
        <Button isLucid variant="outline" leadingIcon="rows-3" onClick={onToggleContentView} />
        <Button isLucid variant="outline" leadingIcon="grid-2x2" onClick={onToggleContentView} />
      </div> */}
    </div>
  );
}
