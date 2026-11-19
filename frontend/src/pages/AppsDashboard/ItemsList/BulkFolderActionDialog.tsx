import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { capitalize } from 'lodash';
import { CircleAlert, Folder, FolderInput, FolderOutput, X } from 'lucide-react';

import { useAppsStore } from '@/_stores/appsStore';
import {
  useBulkMoveAppsToFolder,
  useBulkRemoveAppsFromFolder,
  useFetchFolders,
} from '@/_services/hooks/foldersServiceHooks';
import { appTypeToDisplayNameMapping, type TAppType } from '@/pages/AppsDashboard/helper';
import { useBulkActionFlow } from '@/pages/AppsDashboard/hooks/useBulkActionFlow';
import { getIdFromRowId, getLoadedItems, type LoadedItemSummary } from '@/pages/AppsDashboard/items';
import ActionDialog from '@/pages/AppsDashboard/components/ActionDialog';
import AppIcon from '@/pages/AppsDashboard/components/AppIcon';
import { Button } from '@/components/ui/Button/Button';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/Rocket/Combobox/Combobox';
import { Field, FieldLabel } from '@/components/ui/Rocket/Field/Field';

export type BulkFolderAction = 'move' | 'remove';

interface BulkFolderActionDialogProps {
  open: boolean;
  action: BulkFolderAction;
  appType: TAppType;
  selectedRowIds: string[];
  onClose: () => void;
}

interface FolderOption {
  label: string;
  value: string;
}

const pluralize = (count: number, noun: string) => (count === 1 ? noun : `${noun}s`);

// Mounted by the selection bar, its only entry point, so it keeps its own state.
// Move (Figma 1399-48713) and Remove (3403-55402) share the layout; a blocked response swaps in the list
// of blocked apps (Figma 2251-178635) and offers to act on the rest.
export default function BulkFolderActionDialog({
  open,
  action,
  appType,
  selectedRowIds,
  onClose,
}: BulkFolderActionDialogProps) {
  const isMove = action === 'move';
  const queryClient = useQueryClient();
  const clearSelection = useAppsStore((state) => state.clearSelection);
  const { mutate: bulkMove, isPending: isMoving } = useBulkMoveAppsToFolder();
  const { mutate: bulkRemove, isPending: isRemoving } = useBulkRemoveAppsFromFolder();
  const { data: folders = [] } = useFetchFolders({ appType });

  // The row X buttons drop apps from this dialog only; the table selection stays as it was.
  const [rowIds, setRowIds] = useState(selectedRowIds);
  const [targetFolder, setTargetFolder] = useState<FolderOption | null>(null);
  // Loaded once so the list keeps its rows (and their folders) after a refetch.
  const [items] = useState(() => getLoadedItems(queryClient, selectedRowIds.map(getIdFromRowId)));

  const noun = appTypeToDisplayNameMapping[appType];
  const isSubmitting = isMoving || isRemoving;

  const { blockedItems, attemptedCount, remainingCount, submit } = useBulkActionFlow(
    rowIds,
    (ids, options) =>
      isMove
        ? bulkMove({ appIds: ids, folderId: targetFolder?.value ?? '', appType }, options)
        : bulkRemove({ appIds: ids, appType }, options),
    (doneCount) => {
      toast.success(
        isMove
          ? `${doneCount} ${pluralize(doneCount, noun)} moved to ${targetFolder?.label}.`
          : `${doneCount} ${pluralize(doneCount, noun)} removed from folder.`
      );
      onClose();
      clearSelection();
    }
  );

  const isBlocked = blockedItems.length > 0;
  const visibleItems = items.filter((item) => rowIds.includes(`app:${item.id}`));
  const isSubmitDisabled = isSubmitting || remainingCount === 0 || (isMove && !targetFolder);

  const verb = isMove ? 'move' : 'remove';
  const submitLabel = isBlocked
    ? `${capitalize(verb)} remaining (${remainingCount})`
    : isMove
      ? `Move ${pluralize(remainingCount, noun)}`
      : 'Remove from folder';
  const SubmitIcon = isMove ? FolderInput : FolderOutput;

  return (
    <ActionDialog
      open={open}
      title={isBlocked ? null : `${isMove ? 'Move' : 'Remove'} ${noun}s ${isMove ? 'to' : 'from'} folder`}
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
        <BlockedBody
          verb={verb}
          noun={noun}
          blockedItems={blockedItems}
          attemptedCount={attemptedCount}
          hasRemaining={remainingCount > 0}
        />
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-4">
          <AppsToAct
            label={`${capitalize(noun)}s to ${verb}`}
            items={visibleItems}
            onDrop={(id) => setRowIds((ids) => ids.filter((rowId) => rowId !== `app:${id}`))}
          />

          {isMove ? (
            <Field>
              <FieldLabel>Move to</FieldLabel>
              <Combobox
                items={folders}
                value={targetFolder}
                itemToStringLabel={(item: FolderOption) => item.label}
                onValueChange={setTargetFolder}
              >
                <ComboboxInput placeholder="Select folder" />
                <ComboboxContent positionerClassName="!tw-z-[9999]">
                  <ComboboxList>
                    {(item: FolderOption) => (
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
              {capitalize(noun)}s will move out of their folders and will be added as stray {noun}s. They won’t be
              deleted.
            </p>
          )}
        </div>
      )}
    </ActionDialog>
  );
}

interface AppsToActProps {
  label: string;
  items: LoadedItemSummary[];
  onDrop: (id: string) => void;
}

function AppsToAct({ label, items, onDrop }: AppsToActProps) {
  return (
    <div data-cy="apps-to-act">
      <p className="tw-mb-1 tw-flex tw-items-center tw-gap-1 tw-font-title-default tw-text-text-default">
        {label}
        <span className="tw-rounded-full tw-bg-background-accent-strong tw-px-[7px] tw-text-[10px] tw-leading-3 tw-text-text-on-solid">
          {items.length}
        </span>
      </p>

      {items?.length ? (
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

interface BlockedBodyProps {
  verb: string;
  noun: string;
  blockedItems: LoadedItemSummary[];
  attemptedCount: number;
  hasRemaining: boolean;
}

function BlockedBody({ verb, noun, blockedItems, attemptedCount, hasRemaining }: BlockedBodyProps) {
  return (
    <div>
      <CircleAlert size={40} className="tw-mb-2 tw-text-icon-accent" />
      <h6 className="tw-mb-0.5 tw-font-title-x-large tw-text-text-default">
        {blockedItems.length} of {attemptedCount} {pluralize(attemptedCount, noun)} can&apos;t be {verb}d
      </h6>
      <p data-cy="modal-message" className="tw-mb-4 tw-font-body-default tw-text-text-default">
        These {noun}s have a permission or branch issue.
        {hasRemaining && ` You can still ${verb} the rest.`}
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
            <AppIcon icon={icon} color="blue" className="tw-shrink-0" />
            <span className="tw-truncate tw-font-body-default tw-text-text-default">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
