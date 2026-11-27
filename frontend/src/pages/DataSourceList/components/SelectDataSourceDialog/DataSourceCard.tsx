import React from 'react';

import { cn } from '@/lib/utils';
import { getSvgIcon } from '@/_helpers/appUtils';
import { Button } from '@/components/ui/Button/Button';
import Tooltip from '@/components/ui/Rocket/Tooltip';

import type { CatalogItem } from './catalog';

interface DataSourceCardProps {
  item: CatalogItem;
  onConnect: (item: CatalogItem) => void;
  disabled?: boolean;
  /** Why Connect is disabled, shown on hover. */
  disabledReason?: string;
  isLoading?: boolean;
}

export default function DataSourceCard({ item, onConnect, disabled, disabledReason, isLoading }: DataSourceCardProps) {
  const connectButton = (
    <Button
      variant="secondary"
      size="medium"
      disabled={disabled}
      isLoading={isLoading}
      onClick={() => onConnect(item)}
      aria-label={`Connect ${item.name}`}
      data-cy={`${item.name.toLowerCase().replace(/\s+/g, '-')}-connect-button`}
    >
      Connect
    </Button>
  );

  return (
    <li
      className={cn(
        'tw-group tw-relative tw-m-0 tw-flex tw-h-[8.75rem] tw-min-w-0 tw-flex-col tw-gap-2 tw-overflow-hidden tw-rounded-lg tw-p-4',
        'tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-shadow-elevation-100',
        'hover:tw-shadow-elevation-200 focus-within:tw-shadow-elevation-200'
      )}
    >
      {/* The icon gives way to the Connect action on hover or keyboard focus. */}
      <span className="tw-flex tw-size-4 tw-shrink-0 group-hover:tw-hidden group-focus-within:tw-hidden">
        {item.iconData ? (
          <img src={`data:image/svg+xml;base64,${item.iconData}`} alt="" className="tw-size-4" />
        ) : (
          getSvgIcon(item.kind.toLowerCase(), 16, 16)
        )}
      </span>
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-0.5">
        <h3 className="tw-m-0 tw-truncate tw-font-title-large tw-text-text-default">{item.name}</h3>
        {item.description && (
          <p className="tw-m-0 tw-line-clamp-3 tw-font-body-default tw-text-text-placeholder">{item.description}</p>
        )}
      </div>
      <div className="tw-absolute tw-bottom-4 tw-right-4 tw-opacity-0 group-hover:tw-opacity-100 group-focus-within:tw-opacity-100">
        {disabledReason ? (
          <Tooltip arrow content={disabledReason}>
            <span>{connectButton}</span>
          </Tooltip>
        ) : (
          connectButton
        )}
      </div>
    </li>
  );
}
