import React from 'react';
import { toast } from 'react-hot-toast';
import { CircleAlert, Folder, TriangleAlert } from 'lucide-react';

import { useAppsStore } from '@/_stores/appsStore';
import { useBulkDeleteApps } from '@/_services/hooks/appsServiceHooks';
import { useBulkDeleteFolders } from '@/_services/hooks/foldersServiceHooks';
import { appTypeToDisplayNameMapping, type TAppType } from '@/pages/AppsDashboard/helper';
import { useBulkActionFlow } from '@/pages/AppsDashboard/hooks/useBulkActionFlow';
import type { LoadedItemSummary } from '@/pages/AppsDashboard/items';
import type { TItemKind } from '@/pages/AppsDashboard/types';
import ActionDialog from '@/pages/AppsDashboard/components/ActionDialog';
import AppIcon from '@/pages/AppsDashboard/components/AppIcon';
import { cn } from '@/lib/utils';

interface BulkDeleteDialogProps {
  open: boolean;
  kind: TItemKind;
  appType: TAppType;
  selectedRowIds: string[];
  onClose: () => void;
}

const pluralize = (count: number, noun: string) => (count === 1 ? noun : `${noun}s`);

// Mounted by the selection bar, its only entry point, so it keeps its own state.
// Confirm → if anything is blocked nothing is deleted, so it lists the blocked items (Figma 2349-150327)
// and offers to delete the rest.
export default function BulkDeleteDialog({ open, kind, appType, selectedRowIds, onClose }: BulkDeleteDialogProps) {
  const clearSelection = useAppsStore((state) => state.clearSelection);
  const { mutate: bulkDeleteApps, isPending: isDeletingApps } = useBulkDeleteApps();
  const { mutate: bulkDeleteFolders, isPending: isDeletingFolders } = useBulkDeleteFolders();

  const noun = kind === 'app' ? appTypeToDisplayNameMapping[appType] : 'folder';
  const isDeleting = isDeletingApps || isDeletingFolders;

  const { blockedItems, attemptedCount, remainingCount, submit } = useBulkActionFlow(
    selectedRowIds,
    (ids, options) =>
      kind === 'app'
        ? bulkDeleteApps({ appIds: ids, appType }, options)
        : // Only `folder_only` for now: the folders' apps move to root. `folder_and_apps` is pending (see DECISIONS.md).
          bulkDeleteFolders({ folderIds: ids, mode: 'folder_only', appType }, options),
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
        <BlockedBody
          kind={kind}
          noun={noun}
          blockedItems={blockedItems}
          attemptedCount={attemptedCount}
          hasRemaining={remainingCount > 0}
        />
      ) : (
        <ConfirmBody noun={noun} selectedCount={selectedRowIds.length} />
      )}
    </ActionDialog>
  );
}

function ConfirmBody({ className, noun, selectedCount }: { className?: string; noun: string; selectedCount: number }) {
  const nouns = pluralize(selectedCount, noun);

  return (
    <div className={cn(className, 'tw-pb-0')}>
      <TriangleAlert size={40} className="tw-mb-2 tw-text-icon-danger" />
      <h6 className="tw-mb-0.5 tw-font-title-x-large tw-text-text-default">Delete selected {nouns}?</h6>
      <p data-cy="modal-message" className="tw-mb-0 tw-font-body-default tw-text-text-default">
        You are about to delete {selectedCount} {nouns}. This action cannot be undone and may remove any related data.
      </p>
    </div>
  );
}

interface BlockedBodyProps {
  className?: string;
  kind: TItemKind;
  noun: string;
  blockedItems: LoadedItemSummary[];
  attemptedCount: number;
  hasRemaining: boolean;
}

function BlockedBody({ className, kind, noun, blockedItems, attemptedCount, hasRemaining }: BlockedBodyProps) {
  return (
    <div className={cn(className, 'tw-pb-0')}>
      <CircleAlert size={40} className="tw-mb-2 tw-text-icon-danger" />
      <h6 className="tw-mb-0.5 tw-font-title-x-large tw-text-text-default">
        {blockedItems.length} of {attemptedCount} {pluralize(attemptedCount, noun)} can&apos;t be deleted
      </h6>
      <p data-cy="modal-message" className="tw-mb-4 tw-font-body-default tw-text-text-default">
        These {noun}s have restricted access, so they can&apos;t be deleted.
        {hasRemaining && ' You can still delete the rest.'}
      </p>

      <ul
        data-cy="blocked-items"
        className="tw-m-0 tw-max-h-[180px] tw-list-none tw-overflow-y-auto tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-0"
      >
        {blockedItems.map(({ id, name, icon }) => (
          <li
            key={id}
            className="tw-flex tw-h-9 tw-items-center tw-gap-1.5 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4 last:tw-border-b-0"
          >
            {kind === 'folder' ? (
              <Folder size={12} className="tw-shrink-0 tw-text-icon-strong" />
            ) : (
              <AppIcon icon={icon} color="blue" className="tw-shrink-0" />
            )}
            <span className="tw-truncate tw-font-body-default tw-text-text-default">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
