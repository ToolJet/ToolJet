import React from 'react';
import { FolderInput, FolderOutput, Pin, Trash } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppsStore } from '@/_stores/appsStore';
import { Button } from '@/components/ui/Button/Button';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';

const MENU_ICON_SIZE = 14;
// Figma 3456-117028. Handlers are wired with the bulk action flows.
const FOLDER_MENU_ITEMS = [
  { id: 'move', label: 'Move to folder', icon: <FolderInput size={MENU_ICON_SIZE} />, disabled: true },
  { id: 'remove', label: 'Remove from folder', icon: <FolderOutput size={MENU_ICON_SIZE} />, disabled: true },
];
const FOLDER_MENU_CLASSES = {
  content: 'tw-w-44 tw-rounded-lg tw-shadow-[shadow:var(--elevation-300-box-shadow)]',
  group: 'tw-p-2',
};

const pluralize = (count, kind) => `${count} ${kind}${count === 1 ? '' : 's'}`;

// Figma 3373-744: floats at the bottom of the list. `pageState` is 'all' when every selectable row of the kind on this page is selected.
export default function SelectionBar({ kind, selectedRowIds, pageState, onClear, className }) {
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);

  const handleOpenRespectiveDeleteDialog = () => {
    switch (kind) {
      case 'app':
        setAppDialogState({ type: 'bulk-delete', selectedRowIds });
        return;
      case 'folder':
        setFolderDialogState({ type: 'bulk-delete-folder', selectedRowIds });
        return;
      default:
        return;
    }
  };

  const selectedRowCount = selectedRowIds.length;
  const label =
    pageState === 'all'
      ? `All ${pluralize(selectedRowCount, kind)} on this page selected`
      : `${pluralize(selectedRowCount, kind)} selected`;

  return (
    <div
      role="toolbar"
      aria-label="Selection actions"
      className={cn(
        'tw-flex tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-02 tw-px-3 tw-py-1.5 tw-h-10 tw-shadow-[shadow:var(--elevation-300-box-shadow)]',
        className
      )}
    >
      <span className="tw-whitespace-nowrap tw-font-body-default tw-text-text-default">{label}</span>

      <Button variant="ghostBrand" size="small" className="tw-underline tw-px-1" onClick={onClear}>
        Clear
      </Button>

      <Separator decorative orientation="vertical" className="tw-h-5 tw-bg-border-default" />
      {/* Bulk actions are UI-only until their API flows are wired. */}
      {pageState !== 'all' && (
        <Button variant="outline" size="small">
          <Pin size={12} className="tw-text-icon-strong" />
          Pin
        </Button>
      )}

      {/* Only apps can be moved in or out of folders. */}
      {kind === 'app' && pageState !== 'all' && (
        <DropdownMenu
          side="top"
          classes={FOLDER_MENU_CLASSES}
          sections={[{ id: 'folder-actions', items: FOLDER_MENU_ITEMS }]}
          trigger={
            <Button variant="outline" size="small">
              <FolderInput size={12} className="tw-text-icon-strong" />
              Folder
            </Button>
          }
        />
      )}

      <Button variant="dangerSecondary" size="small" onClick={handleOpenRespectiveDeleteDialog}>
        <Trash size={12} className="tw-text-icon-danger" />
        Delete
      </Button>
    </div>
  );
}
