import React from 'react';
import { Pin } from 'lucide-react';

import { cn } from '@/lib/utils';
import { usePinDataSourceResources, useUnpinDataSourceResource } from '@/_services/globalDatasource.mutations';
import Tooltip from '@/components/ui/Rocket/Tooltip';

import type { DataSourceListItem } from '@/_services/types/globalDatasource.types';

interface DataSourcePinButtonProps {
  item: DataSourceListItem;
  className?: string;
}

// Mirrors the apps dashboard's PinUnpinButton, against the data source pin endpoints.
export default function DataSourcePinButton({ item, className }: DataSourcePinButtonProps) {
  const { mutate: pinResources, isPending: isPinning } = usePinDataSourceResources();
  const { mutate: unpinResource, isPending: isUnpinning } = useUnpinDataSourceResource();

  const noun = item.kind === 'folder' ? 'folder' : 'datasource';
  const verb = item.pinned ? 'Unpin' : 'Pin';

  const handleClick = () => {
    if (item.pinned) unpinResource({ resourceType: item.kind, resourceId: item.id });
    else pinResources({ resourceType: item.kind, resourceIds: [item.id] });
  };

  return (
    <Tooltip arrow content={`${verb} ${noun}`}>
      <button
        type="button"
        className={cn(
          'tw-flex tw-size-5 tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 hover:tw-bg-button-outline-hover active:tw-bg-button-outline-pressed',
          { 'hover:tw-bg-interactive-hover active:tw-bg-interactive-selected': item.pinned },
          className
        )}
        aria-label={`${verb} ${item.name} ${noun}`}
        disabled={!item.actions.pin || isPinning || isUnpinning}
        onClick={handleClick}
      >
        <Pin size={12} className={cn('tw-stroke-icon-default', { 'tw-fill-icon-default': item.pinned })} />
      </button>
    </Tooltip>
  );
}
