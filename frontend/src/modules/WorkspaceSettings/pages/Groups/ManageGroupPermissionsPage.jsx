import React from 'react';
import BaseManageGroupPermissions from './components/BaseManageGroupPermissions';
import EEManageGroupPermissions from '@ee/modules/WorkspaceSettings/components/ManageGroupPermissions';

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

export default process.env.TOOLJET_EDITION === 'ce' ? ManageGroupPermissions : EEManageGroupPermissions;
