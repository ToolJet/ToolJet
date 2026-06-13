import React from 'react';
import EEDataSourcPermissionActionContainer from '@ee/modules/WorkspaceSettings/components/DataSourcPermissionActionContainer';

function DataSourcPermissionActionContainer() {
  return <></>;
}

export default process.env.TOOLJET_EDITION === 'ce'
  ? DataSourcPermissionActionContainer
  : EEDataSourcPermissionActionContainer;
