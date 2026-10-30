import React from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';

import { cn } from '@/lib/utils';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import AppIcon from '../AppIcon';
import { AppQuickActions } from './RowHoverActions';

const ICON_SLOT_CLASS = 'tw-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center';

// `depth` 1 = an app inside an expanded folder; Figma indents its icon 24px to line up with the folder's label.
export default function ItemNameCell({ row, depth }) {
  const item = row.original;
  const isExpanded = row.getIsExpanded();
  const FolderIcon = isExpanded ? FolderOpen : Folder;
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <div className={cn('tw-flex tw-min-w-0 tw-items-center', depth > 0 && 'tw-pl-6')}>
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
          <AppIcon icon={item.icon} color={item.icon_color} />
        )}
      </span>
      <TruncatedText as="span" content={item.name} className="tw-pl-2 tw-font-body-large tw-text-text-default">
        {item.name}
      </TruncatedText>
      {item.kind === 'app' && <AppQuickActions appName={item.name} />}
    </div>
  );
}
