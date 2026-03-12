import React from 'react';

import WorkspaceSelector from './WorkspaceSelector';

export default function Header() {
  return (
    <header className="tw-flex tw-items-center tw-gap-2 tw-h-12 tw-border-b tw-border-border-weak tw-pl-3 tw-pr-8">
      <WorkspaceSelector />
    </header>
  );
}
