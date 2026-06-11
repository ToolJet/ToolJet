import React, { useEffect } from 'react';
import BaseWorkspaceActions from '@/modules/common/components/BaseWorkspaceActions';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
const WorkspaceActions = ({ workspacesLimit, super_admin, handleAddWorkspace, ...props }) => {
  return (
    <BaseWorkspaceActions
      workspacesLimit={workspacesLimit}
      super_admin={super_admin}
      handleAddWorkspace={handleAddWorkspace}
      {...props}
    />
  );
};
export default withEditionSpecificComponent(WorkspaceActions, 'Dashboard');
