import React from 'react';
import EEWorkflowPermissionsUI from '@ee/modules/WorkspaceSettings/components/WorkflowPermissionsUI';

const WorkflowPermissionsUI = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? WorkflowPermissionsUI : EEWorkflowPermissionsUI;
