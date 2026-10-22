import React from 'react';

import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import BaseManageOrgConstants from '@/modules/common/components/BaseManageOrgConstants';
import EEManageOrgConstants from '@ee/modules/WorkspaceSettings/components/ManageOrgConstants';

const ManageOrgConstants = (props) => {
  const getCurrentEnvironment = (orgEnvironments) => {
    return orgEnvironments?.environments?.find((env) => env?.is_default);
  };
  const mergedProps = { ...props, getCurrentEnvironment };
  return <BaseManageOrgConstants {...mergedProps} />;
};

export default pickEditionSpecificComponent({
  ce: ManageOrgConstants,
  ee: EEManageOrgConstants,
  cloudSameAsEE: true,
});
