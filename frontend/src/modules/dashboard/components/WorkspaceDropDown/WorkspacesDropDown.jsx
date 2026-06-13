import React from 'react';
import BaseWorkspaceDropDown from '@/modules/common/components/BaseWorkspaceDropDown';
import EEWorkspaceDropDown from '@ee/modules/Dashboard/components/WorkspaceDropDown';
const WorkspaceDropDown = (props) => {
  return <BaseWorkspaceDropDown {...props} />;
};
export default process.env.TOOLJET_EDITION === 'ce' ? WorkspaceDropDown : EEWorkspaceDropDown;
