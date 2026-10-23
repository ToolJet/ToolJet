import React from 'react';
import { EllipsisVertical, Play, SquarePen } from 'lucide-react';

import { Button } from '@/components/ui/Button/Button';

// Hidden until the row is hovered or holds keyboard focus (focus-within), so Tab can still reach them.
const REVEAL_ON_ROW_HOVER_CLASS = 'group-hover:tw-flex group-focus-within:tw-flex';

// Figma 2363-733: app rows get Edit + Launch at the end of the name block; actions are wired separately.
export function AppQuickActions({ appName }) {
  return (
    <div className={`tw-ml-auto tw-hidden tw-shrink-0 tw-gap-[7px] tw-pl-2 tw-pr-7 ${REVEAL_ON_ROW_HOVER_CLASS}`}>
      <Button variant="secondary" size="medium" aria-label={`Edit ${appName}`}>
        <SquarePen size={14} className="tw-text-icon-brand" />
        Edit
      </Button>
      <Button variant="outline" size="medium" className="tw-border-border-weak" aria-label={`Launch ${appName}`}>
        <Play size={14} className="tw-text-icon-strong" />
        Launch
      </Button>
    </div>
  );
}

// Figma 2363-733 / 1339-125228: row-actions menu trigger in the trailing 28px column.
export function RowMenuButton({ itemName }) {
  return (
    <Button
      variant="outline"
      size="medium"
      iconOnly
      aria-label={`More actions for ${itemName}`}
      className={`tw-hidden ${REVEAL_ON_ROW_HOVER_CLASS}`}
    >
      <EllipsisVertical size={14} className="tw-text-icon-strong" />
    </Button>
  );
}
