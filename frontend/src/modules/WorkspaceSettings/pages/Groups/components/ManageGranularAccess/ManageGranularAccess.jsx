import React from 'react';
import BaseManageGranularAccess from '../BaseManageGranularAccess';
import EEManageGranularAccess from '@ee/modules/WorkspaceSettings/components/ManageGranularAccess';

const RESOURCES_OPTIONS = ['Apps'];

const ManageGranularAccess = (props) => {
  return <BaseManageGranularAccess resourcesOptions={RESOURCES_OPTIONS} {...props} />;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ManageGranularAccess : EEManageGranularAccess;
