import React, { useState } from 'react';
import { FolderInput, FolderOutput, Pin, Trash } from 'lucide-react';

import { cn } from '@/lib/utils';
import { usePinDataSourceResources } from '@/_services/globalDatasource.mutations';
import { useDataSourcesDashboardStore } from '@/_stores/dataSourcesDashboardStore';
import type { DataSourcePinKind } from '@/_services/types/globalDatasource.types';
import { Button } from '@/components/ui/Button/Button';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import { useIsWorkspaceBranchLocked } from '@/pages/AppsDashboard/hooks/useIsWorkspaceBranchLocked';

import { getIdFromRowId } from '../selection';
import DataSourceBulkDeleteDialog from './DataSourceBulkDeleteDialog';
import DataSourceBulkFolderActionDialog, { type DataSourceBulkFolderAction } from './DataSourceBulkFolderActionDialog';

const MENU_ICON_SIZE = 14;
const FOLDER_MENU_CLASSES = {
  content: 'tw-w-44 tw-rounded-lg tw-shadow-[shadow:var(--elevation-300-box-shadow)]',
  group: 'tw-p-2',
};

const pluralize = (count: number, kind: DataSourcePinKind) => {
  const noun = kind === 'folder' ? 'folder' : 'datasource';
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
};

interface DataSourceSelectionBarProps {
  kind: DataSourcePinKind;
  selectedRowIds: string[];
  /** 'all' when every selectable row of the kind on this page is selected. */
  pageState: 'all' | 'some';
  className?: string;
}

// Floats at the bottom of the list, as in the apps list (Figma 3373-744).
export default function DataSourceSelectionBar({
  kind,
  selectedRowIds,
  pageState,
  className,
}: DataSourceSelectionBarProps) {
  // The bar is the dialogs' only entry point, so it owns them; mounting one per open resets its state.
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [folderAction, setFolderAction] = useState<DataSourceBulkFolderAction | null>(null);
  const clearSelection = useDataSourcesDashboardStore((state) => state.clearSelection);
  const { mutate: pinResources, isPending: isPinning } = usePinDataSourceResources();
  // As in the apps list: delete, move and remove are disabled on a locked branch (the server refuses move/remove there).
  const { isBranchLocked } = useIsWorkspaceBranchLocked();

  const selectedRowCount = selectedRowIds.length;
  const label =
    pageState === 'all'
      ? `All ${pluralize(selectedRowCount, kind)} on this page selected`
      : `${pluralize(selectedRowCount, kind)} selected`;

  // A selection holds one kind, which the endpoint requires per call.
  const handlePin = () =>
    pinResources(
      { resourceType: kind, resourceIds: selectedRowIds.map(getIdFromRowId) },
      { onSuccess: clearSelection }
    );

  const folderMenuItems = [
    {
      id: 'move',
      label: 'Move to folder',
      icon: <FolderInput size={MENU_ICON_SIZE} />,
      disabled: isBranchLocked,
      onSelect: () => setFolderAction('move'),
    },
    {
      id: 'remove',
      label: 'Remove from folder',
      icon: <FolderOutput size={MENU_ICON_SIZE} />,
      disabled: isBranchLocked,
      onSelect: () => setFolderAction('remove'),
    },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Selection actions"
      className={cn(
        'tw-flex tw-h-10 tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-02 tw-px-3 tw-py-1.5 tw-shadow-[shadow:var(--elevation-300-box-shadow)]',
        className
      )}
    >
      <span className="tw-whitespace-nowrap tw-font-body-default tw-text-text-default">{label}</span>

      <Button variant="ghostBrand" size="small" className="tw-px-1 tw-underline" onClick={clearSelection}>
        Clear
      </Button>

      <Separator decorative orientation="vertical" className="tw-h-5 tw-bg-border-default" />
      {/* Hidden when the whole page is selected, so the bar never pins a whole page (as in the apps list). */}
      {pageState !== 'all' && (
        <Button variant="outline" size="small" disabled={isPinning} onClick={handlePin}>
          <Pin size={12} className="tw-text-icon-strong" />
          Pin
        </Button>
      )}

      {/* Only data sources move in or out of folders. */}
      {kind === 'data_source' && pageState !== 'all' && (
        <DropdownMenu
          side="top"
          classes={FOLDER_MENU_CLASSES}
          sections={[{ id: 'folder-actions', items: folderMenuItems }]}
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
        <DataSourceBulkFolderActionDialog
          open
          action={folderAction}
          selectedRowIds={selectedRowIds}
          onClose={() => setFolderAction(null)}
        />
      )}

      {isDeleteDialogOpen && (
        <DataSourceBulkDeleteDialog
          open
          kind={kind}
          selectedRowIds={selectedRowIds}
          onClose={() => setIsDeleteDialogOpen(false)}
        />
      )}
    </div>
  );
}
