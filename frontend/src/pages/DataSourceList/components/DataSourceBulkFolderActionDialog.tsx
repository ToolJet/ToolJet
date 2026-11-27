import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Folder, FolderInput, FolderOutput, X } from 'lucide-react';

import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';
import { useBulkMoveDataSources, useBulkRemoveDataSources } from '@/_services/globalDatasource.mutations';
import { dataSourceFolderOptionsQueryOptions, type DataSourceFolderOption } from '@/_services/globalDatasource.queries';
import { useDataSourcesDashboardStore } from '@/_stores/dataSourcesDashboardStore';
import { Button } from '@/components/ui/Button/Button';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/Rocket/Combobox/Combobox';
import { Field, FieldLabel } from '@/components/ui/Rocket/Field/Field';
import ActionDialog from '@/pages/AppsDashboard/components/ActionDialog';

import { useDataSourceBulkActionFlow } from '../hooks/useDataSourceBulkActionFlow';
import { getIdFromRowId, getLoadedDataSourceItems, type LoadedDataSourceItem } from '../selection';
import BulkBlockedItems from './BulkBlockedItems';

export type DataSourceBulkFolderAction = 'move' | 'remove';

interface DataSourceBulkFolderActionDialogProps {
  open: boolean;
  action: DataSourceBulkFolderAction;
  selectedRowIds: string[];
  onClose: () => void;
}

const pluralize = (count: number) => (count === 1 ? 'datasource' : 'datasources');

// Mounted by the selection bar, its only entry point, so it keeps its own state.
// Move and Remove share the layout (as in the apps list); a blocked response swaps in the blocked list and offers the rest.
export default function DataSourceBulkFolderActionDialog({
  open,
  action,
  selectedRowIds,
  onClose,
}: DataSourceBulkFolderActionDialogProps) {
  const isMove = action === 'move';
  const queryClient = useQueryClient();
  const branchId = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.activeBranchId);
  const clearSelection = useDataSourcesDashboardStore((state) => state.clearSelection);
  const { mutate: bulkMove, isPending: isMoving } = useBulkMoveDataSources();
  const { mutate: bulkRemove, isPending: isRemoving } = useBulkRemoveDataSources();
  const { data: folders = [] } = useQuery({ ...dataSourceFolderOptionsQueryOptions(branchId), enabled: isMove });

  // The row X buttons drop data sources from this dialog only; the table selection stays as it was.
  const [rowIds, setRowIds] = useState(selectedRowIds);
  const [targetFolder, setTargetFolder] = useState<DataSourceFolderOption | null>(null);
  // Loaded once so the list keeps its rows (and their folders) after a refetch.
  const [items] = useState(() => getLoadedDataSourceItems(queryClient, selectedRowIds.map(getIdFromRowId)));

  const isSubmitting = isMoving || isRemoving;

  const { blockedItems, attemptedCount, remainingCount, submit } = useDataSourceBulkActionFlow(
    rowIds,
    (ids, options) =>
      isMove
        ? bulkMove({ dataSourceIds: ids, folderId: targetFolder?.value ?? '' }, options)
        : bulkRemove({ dataSourceIds: ids }, options),
    (doneCount) => {
      toast.success(
        isMove
          ? `${doneCount} ${pluralize(doneCount)} moved to ${targetFolder?.label}.`
          : `${doneCount} ${pluralize(doneCount)} removed from folder.`
      );
      onClose();
      clearSelection();
    }
  );

  const isBlocked = blockedItems.length > 0;
  const visibleItems = items.filter((item) => rowIds.includes(`data_source:${item.id}`));
  const isSubmitDisabled = isSubmitting || remainingCount === 0 || (isMove && !targetFolder);

  const verb = isMove ? 'move' : 'remove';
  const submitLabel = isBlocked
    ? `${isMove ? 'Move' : 'Remove'} remaining (${remainingCount})`
    : isMove
      ? `Move ${pluralize(remainingCount)}`
      : 'Remove from folder';
  const SubmitIcon = isMove ? FolderInput : FolderOutput;

  return (
    <ActionDialog
      open={open}
      title={isBlocked ? null : `${isMove ? 'Move datasources to' : 'Remove datasources from'} folder`}
      classes={{ dialogContent: 'tw-max-w-[400px]' }}
      cancelBtnProps={{ 'data-cy': 'cancel-button', disabled: isSubmitting, onClick: onClose }}
      submitActions={
        isBlocked && remainingCount === 0
          ? []
          : [
              {
                label: (
                  <>
                    {!isBlocked && <SubmitIcon size={14} />}
                    {submitLabel}
                  </>
                ),
                isLoading: isSubmitting,
                disabled: isSubmitDisabled,
                onClick: submit,
                'data-cy': isBlocked ? `${verb}-remaining-button` : `bulk-${verb}-button`,
              },
            ]
      }
    >
      {isBlocked ? (
        <BulkBlockedItems
          title={`${blockedItems.length} of ${attemptedCount} ${pluralize(attemptedCount)} can't be ${verb}d`}
          message={`These datasources have a permission or branch issue.${
            remainingCount > 0 ? ` You can still ${verb} the rest.` : ''
          }`}
          items={blockedItems}
          iconClassName="tw-text-icon-accent"
        />
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-4">
          <DataSourcesToAct
            label={`Datasources to ${verb}`}
            items={visibleItems}
            onDrop={(id) => setRowIds((ids) => ids.filter((rowId) => rowId !== `data_source:${id}`))}
          />

          {isMove ? (
            <Field>
              <FieldLabel>Move to</FieldLabel>
              <Combobox
                items={folders}
                value={targetFolder}
                itemToStringLabel={(item: DataSourceFolderOption) => item.label}
                onValueChange={setTargetFolder}
              >
                <ComboboxInput placeholder="Select folder" />
                <ComboboxContent positionerClassName="!tw-z-[9999]">
                  <ComboboxList>
                    {(item: DataSourceFolderOption) => (
                      <ComboboxItem key={item.value} value={item}>
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
          ) : (
            <p className="tw-mb-0 tw-font-body-default tw-text-text-placeholder">
              Datasources will move out of their folders to the top level. They won’t be deleted.
            </p>
          )}
        </div>
      )}
    </ActionDialog>
  );
}

interface DataSourcesToActProps {
  label: string;
  items: LoadedDataSourceItem[];
  onDrop: (id: string) => void;
}

function DataSourcesToAct({ label, items, onDrop }: DataSourcesToActProps) {
  return (
    <div data-cy="datasources-to-act">
      <p className="tw-mb-1 tw-flex tw-items-center tw-gap-1 tw-font-title-default tw-text-text-default">
        {label}
        <span className="tw-rounded-full tw-bg-background-accent-strong tw-px-[7px] tw-text-[10px] tw-leading-3 tw-text-text-on-solid">
          {items.length}
        </span>
      </p>

      {items.length ? (
        <ul className="tw-m-0 tw-max-h-[190px] tw-list-none tw-overflow-y-auto tw-hide-scrollbar tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-0">
          {items.map(({ id, name, folderName }) => (
            <li
              key={id}
              className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-3 tw-py-2 last:tw-border-b-0"
            >
              <div className="tw-min-w-0">
                <p className="tw-mb-0 tw-truncate tw-font-body-default tw-text-text-default">{name}</p>
                <p className="tw-mb-0 tw-flex tw-items-center tw-gap-1 tw-font-body-small tw-text-text-placeholder">
                  <Folder size={12} className="tw-shrink-0 tw-text-icon-default" />
                  <span className="tw-truncate">{folderName || 'No folder'}</span>
                </p>
              </div>

              <Button
                isLucid
                iconOnly
                variant="ghost"
                size="small"
                aria-label={`Remove ${name} from the list`}
                onClick={() => onDrop(id)}
              >
                <X size={12} />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder">No items selected</p>
      )}
    </div>
  );
}
