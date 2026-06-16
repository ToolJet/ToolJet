import React, { useEffect } from 'react';
import BaseWorkspaceActions from '@/modules/common/components/BaseWorkspaceActions';
import EEWorkspaceActions from '@ee/modules/Dashboard/components/WorkspaceActions';
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
export default process.env.TOOLJET_EDITION === 'ce' ? WorkspaceActions : EEWorkspaceActions;
