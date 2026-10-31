import React from 'react';

import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEManageGroupPermissionResources from '@ee/modules/WorkspaceSettings/components/ManageGroupPermissionResources';

import BaseManageGroupPermissionResources from '../BaseManageGroupPermissionResources';

const ManageGroupPermissionResources = (props) => {
  return <BaseManageGroupPermissionResources {...props} />;
};

export default pickEditionSpecificComponent({
  ce: ManageGroupPermissionResources,
  ee: EEManageGroupPermissionResources,
  cloudSameAsEE: true,
});
