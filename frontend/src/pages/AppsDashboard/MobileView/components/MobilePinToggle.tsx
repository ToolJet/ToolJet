import React from 'react';
import { Pin } from 'lucide-react';

import { cn } from '@/lib/utils';
import { usePinResources, useUnpinResource } from '@/_services/hooks/appsServiceHooks';

import type { TAppType } from '../../helper';
import type { ListItem } from '../../dummyData/types';

interface MobilePinToggleProps {
  item: ListItem;
  appType: TAppType;
}

// Each tap saves at once; the list refetches after the call, so there is no local pinned state.
export function MobilePinToggle({ item, appType }: MobilePinToggleProps) {
  const { mutate: pin, isPending: isPinning } = usePinResources();
  const { mutate: unpin, isPending: isUnpinning } = useUnpinResource();

  const canPin = item.actions.pin;
  const isPending = isPinning || isUnpinning;

  const handleClick = () => {
    if (item.pinned) unpin({ resourceType: item.kind, resourceId: item.id, appType });
    else pin({ resourceType: item.kind, resourceIds: [item.id], appType });
  };

  return (
    <button
      type="button"
      disabled={!canPin || isPending}
      aria-label={`${item.pinned ? 'Unpin' : 'Pin'} ${item.name}`}
      aria-pressed={item.pinned}
      className={cn(
        'tw-flex tw-size-11 tw-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-strong',
        (!canPin || isPending) && 'tw-opacity-40'
      )}
      onClick={handleClick}
    >
      <Pin aria-hidden className="tw-size-4" fill={item.pinned ? 'currentColor' : 'none'} />
    </button>
  );
}
