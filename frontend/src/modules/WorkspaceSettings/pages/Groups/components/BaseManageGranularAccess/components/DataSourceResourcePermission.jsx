import React from 'react';
import EEDataSourceResourcePermissions from '@ee/modules/WorkspaceSettings/components/DataSourceResourcePermissions';

function DataSourceResourcePermissions() {
  return <></>;
}

export default process.env.TOOLJET_EDITION === 'ce' ? DataSourceResourcePermissions : EEDataSourceResourcePermissions;
