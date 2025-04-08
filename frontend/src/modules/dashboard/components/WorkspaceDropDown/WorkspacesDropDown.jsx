import React from 'react';
import BaseWorkspaceDropDown from '@/modules/common/components/BaseWorkspaceDropDown';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
const WorkspaceDropDown = (props) => {
  return <BaseWorkspaceDropDown {...props} />;
};
export default withEditionSpecificComponent(WorkspaceDropDown, 'Dashboard');
