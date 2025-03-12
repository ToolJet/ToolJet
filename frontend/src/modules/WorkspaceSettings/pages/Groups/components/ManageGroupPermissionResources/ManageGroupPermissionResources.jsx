import React from 'react';
import BaseManageGroupPermissionResources from '../BaseManageGroupPermissionResources';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

const ManageGroupPermissionResources = (props) => {
  return <BaseManageGroupPermissionResources {...props} />;
};

export default withEditionSpecificComponent(ManageGroupPermissionResources, 'WorkspaceSettings');
