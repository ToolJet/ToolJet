import React from 'react';
import { toast } from 'react-hot-toast';
import { TriangleAlert } from 'lucide-react';

import { useBulkDeleteDataSourceFolders, useBulkDeleteDataSources } from '@/_services/globalDatasource.mutations';
import { useDataSourcesDashboardStore } from '@/_stores/dataSourcesDashboardStore';
import type { DataSourcePinKind } from '@/_services/types/globalDatasource.types';
import ActionDialog from '@/pages/AppsDashboard/components/ActionDialog';

import { useDataSourceBulkActionFlow } from '../hooks/useDataSourceBulkActionFlow';
import BulkBlockedItems from './BulkBlockedItems';

interface DataSourceBulkDeleteDialogProps {
  open: boolean;
  kind: DataSourcePinKind;
  selectedRowIds: string[];
  onClose: () => void;
}

const nounFor = (kind: DataSourcePinKind) => (kind === 'folder' ? 'folder' : 'datasource');
const pluralize = (count: number, noun: string) => (count === 1 ? noun : `${noun}s`);

// Mounted by the selection bar, its only entry point, so it keeps its own state.
// Confirm → if anything is blocked nothing is deleted, so it lists the blocked items and offers to delete the rest.
export default function DataSourceBulkDeleteDialog({
  open,
  kind,
  selectedRowIds,
  onClose,
}: DataSourceBulkDeleteDialogProps) {
  const clearSelection = useDataSourcesDashboardStore((state) => state.clearSelection);
  const { mutate: bulkDeleteDataSources, isPending: isDeletingDataSources } = useBulkDeleteDataSources();
  const { mutate: bulkDeleteFolders, isPending: isDeletingFolders } = useBulkDeleteDataSourceFolders();

  const noun = nounFor(kind);
  const isDeleting = isDeletingDataSources || isDeletingFolders;

  const { blockedItems, attemptedCount, remainingCount, submit } = useDataSourceBulkActionFlow(
    selectedRowIds,
    (ids, options) =>
      kind === 'data_source'
        ? bulkDeleteDataSources({ dataSourceIds: ids }, options)
        : // Only `folder_only` for now: the folders' data sources move to root (as in the apps list).
          bulkDeleteFolders({ folderIds: ids, mode: 'folder_only' }, options),
    (deletedCount) => {
      toast.success(`${deletedCount} ${pluralize(deletedCount, noun)} deleted.`);
      onClose();
      clearSelection();
    }
  );

  const isBlocked = blockedItems.length > 0;
  const submitLabel = isBlocked
    ? `Delete remaining (${remainingCount})`
    : `Delete ${pluralize(selectedRowIds.length, noun)}`;

  return (
    <ActionDialog
      open={open}
      classes={{ dialogContent: 'tw-max-w-[400px]' }}
      cancelBtnProps={{ 'data-cy': 'cancel-button', disabled: isDeleting, onClick: onClose }}
      // Everything blocked leaves nothing to delete, so only Cancel stays.
      submitActions={
        isBlocked && remainingCount === 0
          ? []
          : [
              {
                label: submitLabel,
                variant: 'dangerPrimary',
                isLoading: isDeleting,
                disabled: isDeleting,
                onClick: submit,
                'data-cy': isBlocked ? 'delete-remaining-button' : 'bulk-delete-button',
              },
            ]
      }
    >
      {isBlocked ? (
        <BulkBlockedItems
          title={`${blockedItems.length} of ${attemptedCount} ${pluralize(attemptedCount, noun)} can't be deleted`}
          message={`${
            kind === 'folder'
              ? 'These folders have restricted access or still hold git-synced datasources'
              : 'These datasources have restricted access, are used by queries on this branch, or are locked by git sync'
          }, so they can't be deleted.${remainingCount > 0 ? ' You can still delete the rest.' : ''}`}
          items={blockedItems}
        />
      ) : (
        <div>
          <TriangleAlert size={40} className="tw-mb-2 tw-text-icon-danger" />
          <h6 className="tw-mb-0.5 tw-font-title-x-large tw-text-text-default">
            Delete selected {pluralize(selectedRowIds.length, noun)}?
          </h6>
          <p data-cy="modal-message" className="tw-mb-0 tw-font-body-default tw-text-text-default">
            {kind === 'folder'
              ? `You are about to delete ${selectedRowIds.length} ${pluralize(selectedRowIds.length, noun)}. Their datasources will move out of the folders and won't be deleted.`
              : `You are about to delete ${selectedRowIds.length} ${pluralize(selectedRowIds.length, noun)}. This action cannot be undone and may break apps that use them.`}
          </p>
        </div>
      )}
    </ActionDialog>
  );
}
