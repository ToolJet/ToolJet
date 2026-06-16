import React from 'react';
import { BaseManageOrgConstants } from '@/modules/common/components';
import EEManageOrgConstants from '@ee/modules/WorkspaceSettings/components/ManageOrgConstants';

const ManageOrgConstants = (props) => {
  const getCurrentEnvironment = (orgEnvironments) => {
    return orgEnvironments?.environments?.find((env) => env?.is_default);
  };
  const mergedProps = { ...props, getCurrentEnvironment };
  return <BaseManageOrgConstants {...mergedProps} />;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ManageOrgConstants : EEManageOrgConstants;
