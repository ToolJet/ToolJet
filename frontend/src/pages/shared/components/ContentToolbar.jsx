import React from 'react';

import FolderBreadcrumb from './FolderBreadcrumb';
import ShimmerEffectSkeleton from './ShimmerEffectSkeleton';

export default function ContentToolbar({
  folderList,
  selectedFolder,
  onChangeSelectedFolder,
  onAddNewFolder,
  leadingSlot = null,
  showLoadingSkeleton = false,
}) {
  return (
    <div
      data-cy="content-toolbar"
      className="tw-flex tw-items-center tw-gap-4 tw-h-10 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak"
    >
      {leadingSlot}

      <div className="tw-flex-1 tw-flex tw-justify-end tw-items-center tw-gap-3">
        {showLoadingSkeleton ? (
          <ShimmerEffectSkeleton className="tw-w-32" />
        ) : (
          <FolderBreadcrumb
            selectedFolder={selectedFolder}
            folderList={folderList}
            onAddNewFolder={onAddNewFolder}
            onChangeSelectedFolder={onChangeSelectedFolder}
          />
        )}
      </div>
    </div>
  );
}
