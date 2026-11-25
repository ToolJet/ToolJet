import React from 'react';

import { Button } from '@/components/ui/Button/Button';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { useAppsStore } from '@/_stores/appsStore';

const LABEL = 'Collapse folders';

// List-view action beside the tabs: closes every open folder.
export default function CollapseFoldersButton() {
  const setExpanded = useAppsStore((state) => state.setExpanded);

  return (
    <Tooltip arrow content={LABEL}>
      <Button
        variant="ghost"
        size="medium"
        isLucid
        iconOnly
        leadingIcon="list-collapse"
        aria-label={LABEL}
        onClick={() => setExpanded({})}
      />
    </Tooltip>
  );
}
