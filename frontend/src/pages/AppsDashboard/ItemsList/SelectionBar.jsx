import React, { useState } from 'react';
import { FolderInput, FolderOutput, Pin, Trash } from 'lucide-react';

import { cn } from '@/lib/utils';
import { usePinResources } from '@/_services/hooks/appsServiceHooks';
import { useAppsStore } from '@/_stores/appsStore';
import { getIdFromRowId } from '@/pages/AppsDashboard/items';
import { Button } from '@/components/ui/Button/Button';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import { useIsWorkspaceBranchLocked } from '@/pages/AppsDashboard/hooks/useIsWorkspaceBranchLocked';
import BulkDeleteDialog from './BulkDeleteDialog';
import BulkFolderActionDialog from './BulkFolderActionDialog';

const MENU_ICON_SIZE = 14;
// Figma 3456-117028.
const getFolderMenuItems = ({ onSelect, disabled }) => [
  {
    id: 'move',
    label: 'Move to folder',
    icon: <FolderInput size={MENU_ICON_SIZE} />,
    disabled,
    onSelect: () => onSelect('move'),
  },
  {
    id: 'remove',
    label: 'Remove from folder',
    icon: <FolderOutput size={MENU_ICON_SIZE} />,
    disabled,
    onSelect: () => onSelect('remove'),
  },
];
const FOLDER_MENU_CLASSES = {
  content: 'tw-w-44 tw-rounded-lg tw-shadow-[shadow:var(--elevation-300-box-shadow)]',
  group: 'tw-p-2',
};

const pluralize = (count, kind) => `${count} ${kind}${count === 1 ? '' : 's'}`;

// Figma 3373-744: floats at the bottom of the list. `pageState` is 'all' when every selectable row of the kind on this page is selected.
export default function SelectionBar({ kind, selectedRowIds, pageState, onClear, className, appType }) {
  // The bar is the dialog's only entry point, so it owns the dialog; mounting it per open resets its state.
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [folderAction, setFolderAction] = useState(null);
  const clearSelection = useAppsStore((state) => state.clearSelection);
  const { mutate: pinResources, isPending: isPinning } = usePinResources();
  // TODO: pending product confirmation on how bulk delete, move and remove behave on a locked branch; disabled for now.
  const { isBranchLocked } = useIsWorkspaceBranchLocked();

  const selectedRowCount = selectedRowIds.length;
  const label =
    pageState === 'all'
      ? `All ${pluralize(selectedRowCount, kind)} on this page selected`
      : `${pluralize(selectedRowCount, kind)} selected`;

  // A selection holds one kind, which the endpoint requires per call.
  const handlePin = () =>
    pinResources(
      { resourceType: kind, resourceIds: selectedRowIds.map(getIdFromRowId), appType },
      { onSuccess: clearSelection }
    );

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
      {pageState !== 'all' && (
        <Button variant="outline" size="small" disabled={isPinning} onClick={handlePin}>
          <Pin size={12} className="tw-text-icon-strong" />
          Pin
        </Button>
      )}

      {/* Only apps can be moved in or out of folders. */}
      {kind === 'app' && pageState !== 'all' && (
        <DropdownMenu
          side="top"
          classes={FOLDER_MENU_CLASSES}
          sections={[
            {
              id: 'folder-actions',
              items: getFolderMenuItems({ onSelect: setFolderAction, disabled: isBranchLocked }),
            },
          ]}
          trigger={
            <Button variant="outline" size="small">
              <FolderInput size={12} className="tw-text-icon-strong" />
              Folder
            </Button>
          }
        />
      )}

      <Button
        variant="dangerSecondary"
        size="small"
        disabled={isBranchLocked}
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        <Trash size={12} className="tw-text-icon-danger" />
        Delete
      </Button>

      {folderAction && (
        <BulkFolderActionDialog
          open
          action={folderAction}
          appType={appType}
          selectedRowIds={selectedRowIds}
          onClose={() => setFolderAction(null)}
        />
      )}

      {isDeleteDialogOpen && (
        <BulkDeleteDialog
          open
          kind={kind}
          appType={appType}
          selectedRowIds={selectedRowIds}
          onClose={() => setIsDeleteDialogOpen(false)}
        />
      )}
    </div>
  );
}
