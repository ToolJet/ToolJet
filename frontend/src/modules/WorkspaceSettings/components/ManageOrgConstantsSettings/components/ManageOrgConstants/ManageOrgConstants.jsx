import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import { BaseManageOrgConstants } from '@/modules/common/components';

const ManageOrgConstants = (props) => {
  const getCurrentEnvironment = (orgEnvironments) => {
    return orgEnvironments?.environments?.find((env) => env?.is_default);
  };
  const mergedProps = { ...props, getCurrentEnvironment };
  return <BaseManageOrgConstants {...mergedProps} />;
};

export default withEditionSpecificComponent(ManageOrgConstants, 'WorkspaceSettings');
