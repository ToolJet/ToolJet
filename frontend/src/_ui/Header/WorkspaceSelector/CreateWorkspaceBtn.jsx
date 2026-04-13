import React from 'react';

import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import { Button } from '@/components/ui/Button/Button';

function CreateWorkspaceBtn({ onAddWorkspace }) {
  return <BaseCreateWorkspaceBtn onAddWorkspace={onAddWorkspace} />;
}

export default withEditionSpecificComponent(CreateWorkspaceBtn, 'common');

export function BaseCreateWorkspaceBtn({ onAddWorkspace, hideAddNewWorkspaceBtn = false }) {
  return (
    !hideAddNewWorkspaceBtn && (
      <Button
        isLucid
        variant="ghost"
        leadingIcon="plus"
        className="tw-w-full"
        data-cy="add-new-workspace-button"
        onClick={onAddWorkspace}
      >
        Add new workspace
      </Button>
    )
  );
}
