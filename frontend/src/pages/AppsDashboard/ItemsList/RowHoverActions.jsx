import React from 'react';
import { SquarePen } from 'lucide-react';

import { Button } from '@/components/ui/Button/Button';
import LaunchButton from '@/pages/AppsDashboard/components/LaunchButton';

// Hidden until the row is hovered, holds keyboard focus (so Tab can reach them) or has its actions menu open.
export const REVEAL_ON_ROW_HOVER_CLASS =
  'group-hover:tw-flex group-focus-within:tw-flex group-has-[[data-state=open]]:tw-flex';
// Figma 2363-733: app rows get Edit + Launch at the end of the name block; actions are wired separately.
export function AppQuickActions({ appName, launch }) {
  return (
    <div className={`tw-hidden tw-gap-[7px] ${REVEAL_ON_ROW_HOVER_CLASS}`}>
      <Button variant="secondary" size="medium" aria-label={`Edit ${appName}`}>
        <SquarePen size={14} className="tw-text-icon-brand" />
        Edit
      </Button>
      <LaunchButton launch={launch} />
    </div>
  );
}
