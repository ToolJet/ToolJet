import React from 'react';
import EEFolderPermissionActionContainer from '@ee/modules/WorkspaceSettings/components/FolderPermissionActionContainer';

function FolderPermissionActionContainer() {
  return <></>;
}

export default process.env.TOOLJET_EDITION === 'ce'
  ? FolderPermissionActionContainer
  : EEFolderPermissionActionContainer;
