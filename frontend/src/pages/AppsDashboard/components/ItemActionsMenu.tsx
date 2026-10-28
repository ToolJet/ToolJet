import React from 'react';
import { AppWindow, Copy, EllipsisVertical, FileUp, FolderInput, PencilRuler, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button/Button';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';

import type { TItemKind } from '../types';

// Hidden until the row is hovered, holds keyboard focus (so Tab can reach them) or has its actions menu open.
const REVEAL_ON_ROW_HOVER_CLASS =
  'group-hover:tw-flex group-focus-within:tw-flex group-has-[[data-state=open]]:tw-flex';
const MENU_ICON_SIZE = 14;
// Figma menu/action: 156px wide, 8px radius, elevation 300.
// `data-[state=closed]:tw-hidden` skips the exit animation: the card's action row (the anchor) collapses on close,
// and the menu would otherwise jump to the top-left while it fades out.
const ROW_MENU_CLASSES = {
  content:
    'tw-w-[156px] tw-rounded-lg tw-shadow-[shadow:var(--elevation-300-box-shadow)] data-[state=closed]:tw-hidden',
  group: 'tw-p-2',
};

// Figma 1194-110986 (app) / 1194-121374 (folder); item handlers are wired with the bulk/row action flows.
// Pin/Unpin lands with pinning (Phase 6).
const MENU_ITEMS = {
  app: [
    { id: 'rename', label: 'Rename app', icon: <AppWindow size={MENU_ICON_SIZE} /> },
    { id: 'customize-icon', label: 'Customize icon', icon: <PencilRuler size={MENU_ICON_SIZE} /> },
    { id: 'duplicate', label: 'Duplicate app', icon: <Copy size={MENU_ICON_SIZE} /> },
    { id: 'move', label: 'Move to folder', icon: <FolderInput size={MENU_ICON_SIZE} /> },
    { id: 'export', label: 'Export app', icon: <FileUp size={MENU_ICON_SIZE} /> },
    { id: 'delete', label: 'Delete app', icon: <Trash2 size={MENU_ICON_SIZE} />, destructive: true },
  ],
  folder: [
    { id: 'rename', label: 'Rename folder', icon: <AppWindow size={MENU_ICON_SIZE} /> },
    { id: 'delete', label: 'Delete folder', icon: <Trash2 size={MENU_ICON_SIZE} />, destructive: true },
  ],
};

// Sits beside the name; REVEAL_ON_ROW_HOVER_CLASS keeps it shown while open so the menu keeps its anchor.
export default function ItemActionsMenu({ item }: { item: { name: string; kind: TItemKind } }) {
  return (
    <DropdownMenu
      align="end"
      classes={ROW_MENU_CLASSES}
      sections={[{ id: 'actions', items: MENU_ITEMS[item.kind] }]}
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
  );
}
