import React from 'react';
import BaseManageGroupPermissions from './components/BaseManageGroupPermissions';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

const GROUP_DUPLICATE_OPTIONS = { addPermission: true, addApps: true, addUsers: true };

const ManageGroupPermissions = (props) => {
  return (
    <BaseManageGroupPermissions
      groupDuplicateOption={GROUP_DUPLICATE_OPTIONS}
      isFeatureEnabled={true}
      isTrial={false}
      {...props}
    />
  );
};

export default withEditionSpecificComponent(ManageGroupPermissions, 'WorkspaceSettings');
