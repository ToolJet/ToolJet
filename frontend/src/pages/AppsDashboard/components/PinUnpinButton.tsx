import React from 'react';
import { Pin } from 'lucide-react';

import { cn } from '@/lib/utils';
import { usePinResources, useUnpinResource } from '@/_services/hooks/appsServiceHooks';
import TooltipComp from '@/components/ui/Rocket/Tooltip';

import type { ItemKindWithDetails } from '../types';
import { TAppType } from '../helper';

type PinUnpinButtonProps = ItemKindWithDetails & {
  className?: string;
  pinned?: boolean;
  appType: TAppType;
};

export default function PinUnpinButton({
  className,
  appType,
  itemKind,
  itemDetails,
  pinned = false,
}: PinUnpinButtonProps) {
  const { mutate: pinResources, isPending: isPinning } = usePinResources();
  const { mutate: unpinResource, isPending: isUnpinning } = useUnpinResource();

  const tooltipContent = `${pinned ? 'Unpin' : 'Pin'} ${itemKind}`;

  const handleClick = () => {
    if (!itemDetails.actions.pin) return;

    if (pinned) unpinResource({ resourceType: itemKind, resourceId: itemDetails.id, appType });
    else pinResources({ resourceType: itemKind, resourceIds: [itemDetails.id], appType });
  };

  return (
    <TooltipComp arrow content={tooltipContent}>
      <button
        type="button"
        className={cn(
          'tw-flex tw-items-center tw-justify-center tw-size-5 tw-p-0 tw-border-0 tw-bg-transparent tw-cursor-pointer hover:tw-bg-button-outline-hover active:tw-bg-button-outline-pressed',
          { 'hover:tw-bg-interactive-hover active:tw-bg-interactive-selected': pinned },
          className
        )}
        aria-label={`${pinned ? 'Unpin' : 'Pin'} ${itemDetails.name} ${itemKind}`}
        disabled={!itemDetails.actions?.pin || isPinning || isUnpinning}
        onClick={handleClick}
      >
        <Pin size={12} className={cn('tw-stroke-icon-default', { 'tw-fill-icon-default': pinned })} />
      </button>
    </TooltipComp>
  );
}
