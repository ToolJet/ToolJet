import React from 'react';
import BaseManageGroupPermissionResources from '../BaseManageGroupPermissionResources';
import EEManageGroupPermissionResources from '@ee/modules/WorkspaceSettings/components/ManageGroupPermissionResources';

const ManageGroupPermissionResources = (props) => {
  return <BaseManageGroupPermissionResources {...props} />;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ManageGroupPermissionResources : EEManageGroupPermissionResources;
