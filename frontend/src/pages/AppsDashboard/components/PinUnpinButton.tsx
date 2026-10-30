import React from 'react';
import { Pin } from 'lucide-react';

import { cn } from '@/lib/utils';
import TooltipComp from '@/components/ui/Rocket/Tooltip';

import type { ItemKindWithDetails } from '../types';

type PinUnpinButtonProps = ItemKindWithDetails & {
  className?: string;
  pinned?: boolean;
  handleTogglePinning?: () => void;
};

export default function PinUnpinButton({
  className,
  itemKind,
  itemDetails,
  pinned = false,
  handleTogglePinning,
}: PinUnpinButtonProps) {
  const tooltipContent = `${pinned ? 'Unpin' : 'Pin'} ${itemKind}`;

  return (
    <TooltipComp arrow content={tooltipContent}>
      <button
        type="button"
        className={cn(
          'tw-flex tw-items-center tw-justify-center tw-size-5 tw-p-0 tw-border-0 tw-bg-transparent tw-cursor-pointer',
          className
        )}
        aria-label={`${pinned ? 'Unpin' : 'Pin'} ${itemDetails.name} ${itemKind}`}
        {...(handleTogglePinning && { onClick: handleTogglePinning })}
      >
        <Pin size={12} className={cn('tw-stroke-icon-default', { 'tw-fill-icon-default': pinned })} />
      </button>
    </TooltipComp>
  );
}
