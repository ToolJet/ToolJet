import React from 'react';
import type { Row } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getSvgIcon } from '@/_helpers/appUtils';
import { decodeEntities } from '@/_helpers/utils';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';

import DataSourcePinButton from './components/DataSourcePinButton';
import DataSourceUnsyncedButton from './components/DataSourceUnsyncedButton';
import DataSourceRowActions, { REVEAL_ON_ROW_HOVER_CLASS } from './DataSourceRowActions';
import type { DataSourceListItem } from '@/_services/types/globalDatasource.types';

const ICON_SLOT_CLASS = 'tw-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center';

interface DataSourceNameCellProps {
  row: Row<DataSourceListItem>;
  /** 1 = a data source inside an expanded folder; indented to line up with the folder's label. */
  depth: number;
}

export default function DataSourceNameCell({ row, depth }: DataSourceNameCellProps) {
  const item = row.original;
  const isExpanded = row.getIsExpanded();
  const FolderIcon = isExpanded ? FolderOpen : Folder;
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  const dsName = decodeEntities(item.name);

  return (
    <div className={cn('tw-flex tw-w-full tw-min-w-0 tw-items-center', depth > 0 && 'tw-pl-6')}>
      <span className={ICON_SLOT_CLASS}>
        {row.getCanExpand() && (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${dsName}`}
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
          getSvgIcon(item.data_source_kind, 12, 12)
        )}
      </span>
      <TruncatedText as="span" arrow content={dsName} className="tw-pl-2 tw-font-body-large tw-text-text-default">
        {dsName}
      </TruncatedText>
      {/* Status buttons trail the name, pin first (as in the apps list). */}
      <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-1 tw-pl-2">
        {/* Pinned items show the pin at rest; others reveal it with the rest of the row actions. */}
        <DataSourcePinButton item={item} className={cn(!item.pinned && `tw-hidden ${REVEAL_ON_ROW_HOVER_CLASS}`)} />
        {item.kind === 'data_source' && <DataSourceUnsyncedButton dataSource={item} />}
      </div>
      {/* Docked at the end of the name block, so it stays reachable while the other columns scroll. */}
      <DataSourceRowActions item={item} />
    </div>
  );
}
