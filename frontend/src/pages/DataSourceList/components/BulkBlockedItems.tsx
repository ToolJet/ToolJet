import React from 'react';
import { CircleAlert, Folder } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getSvgIcon } from '@/_helpers/appUtils';

import type { LoadedDataSourceItem } from '../selection';

interface BulkBlockedItemsProps {
  /** e.g. "1 of 3 datasources can't be deleted". */
  title: string;
  message: string;
  items: LoadedDataSourceItem[];
  iconClassName?: string;
}

// The body a bulk dialog swaps in after a blocked response (as in the apps list, Figma 2349-150327).
export default function BulkBlockedItems({ title, message, items, iconClassName }: BulkBlockedItemsProps) {
  return (
    <div>
      <CircleAlert size={40} className={cn('tw-mb-2 tw-text-icon-danger', iconClassName)} />
      <h6 className="tw-mb-0.5 tw-font-title-x-large tw-text-text-default">{title}</h6>
      <p data-cy="modal-message" className="tw-mb-4 tw-font-body-default tw-text-text-default">
        {message}
      </p>

      <ul
        data-cy="blocked-items"
        className="tw-m-0 tw-max-h-[180px] tw-list-none tw-overflow-y-auto tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-0"
      >
        {items.map(({ id, name, kind, dataSourceKind }) => (
          <li
            key={id}
            className="tw-flex tw-h-9 tw-items-center tw-gap-1.5 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4 last:tw-border-b-0"
          >
            {kind === 'folder' ? (
              <Folder size={12} className="tw-shrink-0 tw-text-icon-strong" />
            ) : (
              dataSourceKind && getSvgIcon(dataSourceKind, 12, 12)
            )}
            <span className="tw-truncate tw-font-body-default tw-text-text-default">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
