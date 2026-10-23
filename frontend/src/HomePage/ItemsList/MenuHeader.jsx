import React from 'react';

import { DropdownMenuItem } from '@/components/ui/Rocket/DropdownMenu/DropdownMenu';

// The action is a menu item so arrow-key navigation reaches it like any other option.
export default function MenuHeader({ title, actionLabel, onAction }) {
  return (
    <div className="tw-flex tw-h-10 tw-items-center tw-justify-between tw-px-3">
      <span className="tw-font-body-default tw-text-text-default">{title}</span>
      <DropdownMenuItem
        onSelect={onAction}
        className="tw-h-auto tw-p-0 tw-font-body-default tw-text-text-accent focus:tw-bg-transparent focus:tw-text-text-accent focus:tw-underline"
      >
        {actionLabel}
      </DropdownMenuItem>
    </div>
  );
}
