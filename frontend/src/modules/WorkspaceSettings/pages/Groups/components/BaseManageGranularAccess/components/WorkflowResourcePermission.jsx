import React from 'react';
import EEWorkflowResourcePermissions from '@ee/modules/WorkspaceSettings/components/WorkflowResourcePermissions';

function WorkflowResourcePermissions() {
  return <></>;
}

export default process.env.TOOLJET_EDITION === 'ce' ? WorkflowResourcePermissions : EEWorkflowResourcePermissions;
