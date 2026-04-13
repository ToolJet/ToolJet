import React from 'react';

import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import { Button } from '@/components/ui/Button/Button';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

function CreateWorkspaceBtn({ onAddWorkspace }) {
  return <BaseCreateWorkspaceBtn showAddNewWorkspaceBtn onAddWorkspace={onAddWorkspace} />;
}

export default withEditionSpecificComponent(CreateWorkspaceBtn, 'common');

export function BaseCreateWorkspaceBtn({ onAddWorkspace, showAddNewWorkspaceBtn = false, workspacesLimit = null }) {
  return (
    <>
      {showAddNewWorkspaceBtn && (
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
      )}

      <LicenseBanner
        type="workspaces"
        size="small"
        bannerVariant="inline-info"
        classes="[button+&]:tw-mt-2"
        showNewBanner
        limits={workspacesLimit ?? {}}
      />
    </>
  );
}
