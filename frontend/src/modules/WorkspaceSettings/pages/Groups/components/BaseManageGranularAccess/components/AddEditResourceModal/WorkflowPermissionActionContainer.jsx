import React from 'react';
import EEWorkflowPermissionActionContainer from '@ee/modules/WorkspaceSettings/components/WorkflowPermissionActionContainer';

function WorkflowPermissionActionContainer() {
  return <></>;
}

export default process.env.TOOLJET_EDITION === 'ce'
  ? WorkflowPermissionActionContainer
  : EEWorkflowPermissionActionContainer;
