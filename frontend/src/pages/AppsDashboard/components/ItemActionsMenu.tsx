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
import { toast } from 'react-hot-toast';

import { useAppsStore } from '@/_stores/appsStore';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { Button } from '@/components/ui/Button/Button';
import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';

import type { ItemKindWithDetails } from '../types';
import { AppDialogType, FolderDialogType } from '@/_stores/types/appsStore';
import { appTypeToDisplayNameMapping } from '../helper';

import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';

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

const checkIsBranchLocked = ({ currentBranch, orgGitConfig, isInitialized }) => {
  if (!isInitialized || !orgGitConfig) return false;

  const isBranchingEnabled = orgGitConfig?.is_branching_enabled || orgGitConfig?.isBranchingEnabled;
  const isDefault = currentBranch?.is_default || currentBranch?.isDefault;
  return !!(isBranchingEnabled && isDefault);
};

// Sits beside the name; REVEAL_ON_ROW_HOVER_CLASS keeps it shown while open so the menu keeps its anchor.
export default function ItemActionsMenu({ appType, itemKind, itemDetails }: ItemKindWithDetails) {
  const setAppDialogState = useAppsStore((state) => state.setAppDialogState);
  const setFolderDialogState = useAppsStore((state) => state.setFolderDialogState);
  const toggleSwitchBranchModal = useAppsStore((state) => state.toggleSwitchBranchModal);

  const orgGitConfig = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.orgGitConfig);
  const isInitialized = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.isInitialized);
  const currentBranch = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.currentBranch);

  const isBranchLocked = checkIsBranchLocked({ currentBranch, orgGitConfig, isInitialized });

  const handleFolderActionClick = (actionName: FolderDialogType) => () => {
    setFolderDialogState({
      type: actionName,
      folderDetails: {
        id: itemKind === 'app' ? (itemDetails.folder?.id ?? '') : itemDetails.id,
        name: itemKind === 'app' ? (itemDetails.folder?.name ?? '') : itemDetails.name,
      },
      appDetails: itemKind === 'app' ? itemDetails : null,
    });
  };

  const handleAppActionClick = (actionName: AppDialogType) => () => {
    const payload = {
      type: actionName,
      appDetails:
        actionName === 'duplicate'
          ? { ...itemDetails, name: itemDetails?.name ? `${itemDetails.name.slice(0, 95)}_Copy` : '' }
          : itemDetails,
    };

    const showSwitchBranchModal = isBranchLocked && itemKind === 'app' && itemDetails.git?.version_synced === false;

    if (showSwitchBranchModal) {
      switch (actionName) {
        case 'rename': {
          toast.error("Renaming isn't allowed on master. Switch branch to update name.");
          return;
        }
        case 'delete':
        case 'change-icon':
        case 'duplicate': {
          toggleSwitchBranchModal({
            open: true,
            postSwitchActionDetails: payload,
          });
          return;
        }
        default:
          return;
      }
    }

    setAppDialogState(payload);
  };

  const MENU_ITEMS = {
    app: [
      {
        id: 'rename',
        label: `Rename ${appTypeToDisplayNameMapping[appType]}`,
        icon: <AppWindow size={MENU_ICON_SIZE} />,
        disabled: !itemDetails.actions?.edit,
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
        label: `Duplicate ${appTypeToDisplayNameMapping[appType]}`,
        icon: <Copy size={MENU_ICON_SIZE} />,
        onSelect: handleAppActionClick('duplicate'),
      },
      itemKind === 'app' && itemDetails.folder?.id && (isBranchLocked ? !itemDetails.git?.synced : true)
        ? {
            id: 'move',
            label: 'Remove from folder',
            icon: <FolderOutput size={MENU_ICON_SIZE} />,
            onSelect: handleFolderActionClick('remove-app-from-folder'),
          }
        : null,
      (itemKind === 'app' && isBranchLocked ? !itemDetails.git?.synced : true)
        ? {
            id: 'move',
            label: 'Move to folder',
            icon: <FolderInput size={MENU_ICON_SIZE} />,
            onSelect: handleFolderActionClick('add-to-folder'),
          }
        : null,
      {
        id: 'export',
        label: `Export ${appTypeToDisplayNameMapping[appType]}`,
        icon: <FileUp size={MENU_ICON_SIZE} />,
        onSelect: handleAppActionClick('export'),
      },
      {
        id: 'delete',
        label: `Delete ${appTypeToDisplayNameMapping[appType]}`,
        icon: <Trash2 size={MENU_ICON_SIZE} />,
        destructive: true,
        disabled: !itemDetails.actions?.delete,
        onSelect: handleAppActionClick('delete'),
      },
    ],
    folder: [
      {
        id: 'rename',
        label: 'Rename folder',
        icon: <AppWindow size={MENU_ICON_SIZE} />,
        disabled: isBranchLocked || !itemDetails.actions?.rename,
        onSelect: handleFolderActionClick('rename-folder'),
      },
      {
        id: 'delete',
        label: 'Delete folder',
        icon: <Trash2 size={MENU_ICON_SIZE} />,
        destructive: true,
        disabled: isBranchLocked || !itemDetails.actions?.delete,
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
