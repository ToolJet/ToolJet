import React from 'react';
import {
  AppWindow,
  Copy,
  EllipsisVertical,
  FileUp,
  FolderInput,
  FolderOutput,
  PencilRuler,
  Trash2,
} from 'lucide-react';

import { useAppsStore } from '@/_stores/appsStore';
import { Button } from '@/components/ui/Button/Button';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';

import type { ItemKindWithDetails } from '../types';
import { AppDialogType, FolderDialogType } from '@/_stores/types/appsStore';

// Hidden until the row is hovered, holds keyboard focus (so Tab can reach them) or has its actions menu open.
const REVEAL_ON_ROW_HOVER_CLASS =
  'group-hover:tw-flex group-focus-within:tw-flex group-has-[[data-state=open]]:tw-flex';
const MENU_ICON_SIZE = 14;
// Figma menu/action: 156px wide, 8px radius, elevation 300.
// `data-[state=closed]:tw-hidden` skips the exit animation: the card's action row (the anchor) collapses on close,
// and the menu would otherwise jump to the top-left while it fades out.
const ROW_MENU_CLASSES = {
  content: 'tw-w-44 tw-rounded-lg tw-shadow-[shadow:var(--elevation-300-box-shadow)] data-[state=closed]:tw-hidden',
  group: 'tw-p-2',
};

// Sits beside the name; REVEAL_ON_ROW_HOVER_CLASS keeps it shown while open so the menu keeps its anchor.
export default function ItemActionsMenu({ itemKind, itemDetails }: ItemKindWithDetails) {
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);

  const handleFolderActionClick = (actionName: FolderDialogType) => () => {
    setFolderDialogState({
      type: actionName,
      folderId: itemDetails.id,
      initialFolderName:
        actionName === 'remove-app-from-folder' && itemKind === 'app' ? itemDetails.folder?.name : itemDetails.name,
    });
  };

  const handleAppActionClick = (actionName: AppDialogType) => () => {
    setAppDialogState({ type: actionName, appDetails: itemDetails });
  };

  const MENU_ITEMS = {
    app: [
      {
        id: 'rename',
        label: 'Rename app',
        icon: <AppWindow size={MENU_ICON_SIZE} />,
        onSelect: handleAppActionClick('rename'),
      },
      {
        id: 'customize-icon',
        label: 'Customize icon',
        icon: <PencilRuler size={MENU_ICON_SIZE} />,
        onSelect: handleAppActionClick('change-icon'),
      },
      {
        id: 'duplicate',
        label: 'Duplicate app',
        icon: <Copy size={MENU_ICON_SIZE} />,
        onSelect: handleAppActionClick('duplicate'),
      },
      itemKind === 'app' && itemDetails.folder?.id
        ? {
            id: 'move',
            label: 'Remove from folder',
            icon: <FolderOutput size={MENU_ICON_SIZE} />,
            onSelect: handleFolderActionClick('remove-app-from-folder'),
          }
        : null,
      {
        id: 'move',
        label: 'Move to folder',
        icon: <FolderInput size={MENU_ICON_SIZE} />,
        disabled: true,
        // onSelect: handleAppActionClick('move'),
      },
      {
        id: 'export',
        label: 'Export app',
        icon: <FileUp size={MENU_ICON_SIZE} />,
        onSelect: handleAppActionClick('export'),
      },
      {
        id: 'delete',
        label: 'Delete app',
        icon: <Trash2 size={MENU_ICON_SIZE} />,
        destructive: true,
        onSelect: handleAppActionClick('delete'),
      },
    ],
    folder: [
      {
        id: 'rename',
        label: 'Rename folder',
        icon: <AppWindow size={MENU_ICON_SIZE} />,
        onSelect: handleFolderActionClick('rename-folder'),
      },
      {
        id: 'delete',
        label: 'Delete folder',
        icon: <Trash2 size={MENU_ICON_SIZE} />,
        destructive: true,
        onSelect: handleFolderActionClick('delete-folder'),
      },
    ],
  };

  return (
    <DropdownMenu
      align="end"
      classes={ROW_MENU_CLASSES}
      sections={[{ id: 'actions', items: MENU_ITEMS[itemKind].filter(Boolean) }]}
      trigger={
        <Button
          iconOnly
          size="medium"
          variant="outline"
          aria-label={`More actions for ${itemDetails.name}`}
          className={`tw-hidden ${REVEAL_ON_ROW_HOVER_CLASS}`}
        >
          <EllipsisVertical size={14} className="tw-text-icon-strong" />
        </Button>
      }
    />
  );
}
