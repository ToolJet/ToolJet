import React from 'react';

import { Button } from '@/components/ui/Button/Button';

import FolderBreadcrumb from '../FolderBreadcrumb';

export default function ContentToolbar({
  folderList,
  selectedFolder,
  onChangeSelectedFolder,
  onAddNewFolder,
  onToggleContentView,
  leadingSlot = null,
  showFolderBreadcrumb = false,
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-4 tw-h-10 tw-border-b tw-border-border-weak">
      {leadingSlot}

      <div className="tw-flex-1 tw-flex tw-justify-end tw-items-center tw-gap-3">
        {showFolderBreadcrumb && (
          <FolderBreadcrumb
            selectedFolder={selectedFolder}
            folderList={folderList}
            onAddNewFolder={onAddNewFolder}
            onChangeSelectedFolder={onChangeSelectedFolder}
          />
        )}

        {/* <div className="tw-flex tw-items-center tw-gap-1">
        <Button isLucid variant="outline" leadingIcon="rows-3" onClick={onToggleContentView} />
        <Button isLucid variant="outline" leadingIcon="grid-2x2" onClick={onToggleContentView} />
      </div> */}
      </div>
    </div>
  );
}
