import React from 'react';

import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEManageGranularAccess from '@ee/modules/WorkspaceSettings/components/ManageGranularAccess';

import BaseManageGranularAccess from '../BaseManageGranularAccess';

const RESOURCES_OPTIONS = ['Apps'];

const ManageGranularAccess = (props) => {
  return <BaseManageGranularAccess resourcesOptions={RESOURCES_OPTIONS} {...props} />;
};

export default pickEditionSpecificComponent({
  ce: ManageGranularAccess,
  ee: EEManageGranularAccess,
  cloudSameAsEE: true,
});
