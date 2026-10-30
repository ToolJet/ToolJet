import React from 'react';
import { RefreshCcw } from 'lucide-react';

import TooltipComp from '@/components/ui/Rocket/Tooltip';

export default function UnsyncedAppButton() {
  return (
    <TooltipComp arrow content="Click to push app to git">
      <button
        type="button"
        className="tw-flex tw-items-center tw-justify-center tw-size-5 tw-p-0 tw-border-0 tw-bg-transparent tw-cursor-pointer hover:tw-bg-button-danger-secondary-hover"
        aria-label={`Click to push app to git`}
      >
        <RefreshCcw size={12} color="var(--icon-danger)" />
      </button>
    </TooltipComp>
  );
}
