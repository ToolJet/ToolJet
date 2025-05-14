import React from 'react';
import BaseManageGranularAccess from '../BaseManageGranularAccess';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

const RESOURCES_OPTIONS = ['Apps'];

const ManageGranularAccess = (props) => {
  return <BaseManageGranularAccess resourcesOptions={RESOURCES_OPTIONS} {...props} />;
};

export default withEditionSpecificComponent(ManageGranularAccess, 'WorkspaceSettings');
