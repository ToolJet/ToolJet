import React from 'react';
import { EllipsisVertical, Pin, PinOff, SquarePen, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button/Button';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import { usePinDataSourceResources, useUnpinDataSourceResource } from '@/_services/globalDatasource.mutations';
import { useDataSourcesDashboardStore } from '@/_stores/dataSourcesDashboardStore';

import type { DataSourceListItem } from '@/_services/types/globalDatasource.types';

const MENU_ICON_SIZE = 14;
// Hidden until the row is hovered, holds keyboard focus (so Tab can reach them) or has its actions menu open.
export const REVEAL_ON_ROW_HOVER_CLASS =
  'group-hover:tw-flex group-focus-within:tw-flex group-has-[[data-state=open]]:tw-flex';
// Figma 5084-89845: 156px wide, 8px radius, elevation 300.
const ROW_MENU_CLASSES = {
  content: 'tw-w-44 tw-rounded-lg tw-shadow-[shadow:var(--elevation-300-box-shadow)]',
  group: 'tw-p-2',
};

interface DataSourceRowActionsProps {
  item: DataSourceListItem;
}

// Handlers without an action yet (edit, data source delete) are no-ops until their API calls land.
const noop = () => {};

export default function DataSourceRowActions({ item }: DataSourceRowActionsProps) {
  const setFolderDialogState = useDataSourcesDashboardStore((state) => state.setFolderDialogState);
  const { mutate: pinResources } = usePinDataSourceResources();
  const { mutate: unpinResource } = useUnpinDataSourceResource();
  const isFolder = item.kind === 'folder';
  const noun = isFolder ? 'folder' : 'datasource';
  const PinIcon = item.pinned ? PinOff : Pin;

  const openFolderDialog = (type: 'rename-folder' | 'delete-folder') => () =>
    setFolderDialogState({ type, folderDetails: { id: item.id, name: item.name } });

  // Figma 5084-89845 (folder) and 5083-89137 (datasource); only folders can be renamed. The server's
  // `actions` flags decide what a folder offers, so the menu never shows a rename or delete it would refuse.
  const canRenameFolder = item.kind === 'folder' && item.actions.rename;
  const canDelete = item.kind === 'folder' ? item.actions.delete : true;

  const menuItems = [
    ...(canRenameFolder
      ? [
          {
            id: 'rename',
            label: 'Rename folder',
            icon: <SquarePen size={MENU_ICON_SIZE} />,
            onSelect: openFolderDialog('rename-folder'),
          },
        ]
      : []),
    ...(item.actions.pin
      ? [
          {
            id: 'pin',
            label: `${item.pinned ? 'Unpin' : 'Pin'} ${noun}`,
            icon: <PinIcon size={MENU_ICON_SIZE} />,
            onSelect: () =>
              item.pinned
                ? unpinResource({ resourceType: item.kind, resourceId: item.id })
                : pinResources({ resourceType: item.kind, resourceIds: [item.id] }),
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            id: 'delete',
            label: `Delete ${noun}`,
            icon: <Trash2 size={MENU_ICON_SIZE} />,
            destructive: true,
            onSelect: isFolder ? openFolderDialog('delete-folder') : noop,
          },
        ]
      : []),
  ];

  return (
    <div className="tw-ml-auto tw-flex tw-shrink-0 tw-items-center tw-gap-[7px] tw-pl-2">
      {!isFolder && (
        <Button
          isLucid
          variant="secondary"
          size="medium"
          leadingIcon="square-pen"
          aria-label={`Edit ${item.name}`}
          className={`tw-hidden ${REVEAL_ON_ROW_HOVER_CLASS}`}
          onClick={noop}
        >
          Edit
        </Button>
      )}
      <DropdownMenu
        align="end"
        classes={ROW_MENU_CLASSES}
        sections={[{ id: 'actions', items: menuItems }]}
        trigger={
          <Button
            iconOnly
            size="medium"
            variant="outline"
            aria-label={`More actions for ${item.name}`}
            className={`tw-hidden ${REVEAL_ON_ROW_HOVER_CLASS}`}
          >
            <EllipsisVertical size={14} className="tw-text-icon-strong" />
          </Button>
        }
      />
    </div>
  );
}
