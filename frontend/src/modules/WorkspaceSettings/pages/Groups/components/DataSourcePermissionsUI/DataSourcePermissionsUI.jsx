import React from 'react';
import EEDataSourcePermissionsUI from '@ee/modules/WorkspaceSettings/components/DataSourcePermissionsUI';

const DataSourcePermissionsUI = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? DataSourcePermissionsUI : EEDataSourcePermissionsUI;
