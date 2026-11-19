import React from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSearchStore } from '@/_stores/searchStore';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import AppIcon from '../components/AppIcon';
import FolderTag, { LIST_FOLDER_TAG_CLASSES } from '../components/FolderTag';
import ItemActionsMenu from '../components/ItemActionsMenu';
import PinUnpinButton from '../components/PinUnpinButton';
import UnsyncedAppButton from '../components/UnsyncedAppButton';
import { AppQuickActions, REVEAL_ON_ROW_HOVER_CLASS } from './RowHoverActions';

const ICON_SLOT_CLASS = 'tw-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center';

// `depth` 1 = an app inside an expanded folder; Figma indents its icon 24px to line up with the folder's label.
export default function ItemNameCell({ row, depth, appType }) {
  const item = row.original;
  const isSearching = useSearchStore((state) => state.debouncedSearchQuery.trim() !== '');
  // Inside an open folder (depth > 0) the folder is already the parent, so only top-level search hits are tagged.
  const folderName = isSearching && depth === 0 && item.kind === 'app' ? item.folder?.name : undefined;
  const isExpanded = row.getIsExpanded();
  const FolderIcon = isExpanded ? FolderOpen : Folder;
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <div className={cn('tw-flex tw-w-full tw-min-w-0 tw-items-center', depth > 0 && 'tw-pl-6')}>
      <span className={ICON_SLOT_CLASS}>
        {row.getCanExpand() && (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.name}`}
            onClick={row.getToggleExpandedHandler()}
            className={cn(
              ICON_SLOT_CLASS,
              'tw-rounded tw-border-0 tw-bg-transparent tw-p-0 hover:tw-bg-interactive-hover',
              'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline'
            )}
          >
            <ChevronIcon size={12} className="tw-text-icon-strong" />
          </button>
        )}
      </span>
      <span className={ICON_SLOT_CLASS}>
        {item.kind === 'folder' ? (
          <FolderIcon size={12} className="tw-text-icon-strong" />
        ) : (
          <AppIcon icon={item.icon} color="blue" />
        )}
      </span>
      <TruncatedText as="span" arrow content={item.name} className="tw-pl-2 tw-font-body-large tw-text-text-default">
        {item.name}
      </TruncatedText>
      {folderName && (
        <span className="tw-flex tw-min-w-0 tw-pl-2">
          <FolderTag folderName={folderName} classes={LIST_FOLDER_TAG_CLASSES} />
        </span>
      )}
      {/* Figma 3766-109288: status buttons trail the name, pin first. */}
      <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-1 tw-pl-2">
        {/* Pinned items show the pin at rest; others reveal it with the rest of the row actions. */}
        <PinUnpinButton
          appType={appType}
          itemKind={item.kind}
          itemDetails={item}
          pinned={item.pinned}
          className={cn(!item.pinned && `tw-hidden ${REVEAL_ON_ROW_HOVER_CLASS}`)}
        />
        {item.kind === 'app' && item.git?.synced === false && (
          <UnsyncedAppButton itemKind={item.kind} itemDetails={item} appType={appType} />
        )}
      </div>
      {/* Figma 3352-14623 docks the row menu at the end, so it stays reachable while columns scroll. */}
      <div className="tw-ml-auto tw-flex tw-shrink-0 tw-items-center tw-gap-[7px] tw-pl-2">
        {item.kind === 'app' && <AppQuickActions appDetails={item} launch={item.actions.launch} />}
        <ItemActionsMenu appType={appType} itemKind={item.kind} itemDetails={item} />
      </div>
    </div>
  );
}
