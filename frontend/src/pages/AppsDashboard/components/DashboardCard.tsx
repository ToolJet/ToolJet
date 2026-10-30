import React from 'react';

import { cn } from '@/lib/utils';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';

import PinUnpinButton from './PinUnpinButton';
import ItemActionsMenu from './ItemActionsMenu';
import UnsyncedAppButton from './UnsyncedAppButton';

import { getItemDescription } from '../items';

import type { DashboardCardProps } from './types';

// Out of the flex flow but still tabbable. `sr-only` is avoided because its `not-sr-only` reset sets width and height to auto, overriding sizes.
// The open menu is portaled out of the card, so it drops hover and focus; has-[data-state=open] keeps the row (the menu's anchor) visible.
const HIDDEN_UNTIL_ACTIVE_CLASS =
  'tw-pointer-events-none tw-absolute tw-opacity-0 group-focus-within:tw-pointer-events-auto group-focus-within:tw-static group-focus-within:tw-opacity-100 group-hover:tw-pointer-events-auto group-hover:tw-static group-hover:tw-opacity-100 group-has-[[data-state=open]]:tw-pointer-events-auto group-has-[[data-state=open]]:tw-static group-has-[[data-state=open]]:tw-opacity-100';

// `item` keeps `itemKind` and `itemDetails` together, so each stays paired when passed on.
export default function DashboardCard({
  icon,
  startAction,
  endAction,
  appType,
  pinned,
  isUnsynced,
  ...item
}: DashboardCardProps) {
  const { name } = item.itemDetails;
  const description = getItemDescription(item.itemDetails, appType);

  return (
    <div className="tw-group tw-flex tw-h-[104px] tw-min-w-0 tw-flex-col tw-justify-between tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-p-4 hover:tw-shadow-elevation-200 has-[[data-state=open]]:tw-shadow-elevation-200">
      <div className="tw-flex tw-items-center tw-justify-between group-focus-within:tw-hidden group-hover:tw-hidden group-has-[[data-state=open]]:tw-hidden">
        {icon}

        <div className="tw-flex tw-items-center tw-gap-1">
          {isUnsynced && <UnsyncedAppButton />}
          {pinned && <PinUnpinButton {...item} pinned={pinned} />}
        </div>
      </div>

      <div className="tw-flex tw-items-start tw-justify-between">
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-0.5">
          <TruncatedText arrow as="h6" className="tw-m-0 tw-font-title-large tw-text-text-default" content={name}>
            {name}
          </TruncatedText>

          <TruncatedText arrow className="tw-m-0 tw-font-body-default tw-text-text-placeholder" content={description}>
            {description}
          </TruncatedText>
        </div>

        <div className={cn('tw-flex tw-items-center tw-gap-1', HIDDEN_UNTIL_ACTIVE_CLASS)}>
          {isUnsynced && <UnsyncedAppButton />}
          <PinUnpinButton {...item} pinned={pinned} />
        </div>
      </div>
      {/* Hidden rather than display:none so the buttons stay tabbable; focusing one reveals the row via focus-within. */}
      <div className={cn('tw-flex tw-items-center tw-justify-between', HIDDEN_UNTIL_ACTIVE_CLASS)}>
        {startAction}

        <div className="tw-flex tw-items-center tw-gap-2 tw-ml-auto">
          {endAction}

          <ItemActionsMenu {...item} />
        </div>
      </div>
    </div>
  );
}
