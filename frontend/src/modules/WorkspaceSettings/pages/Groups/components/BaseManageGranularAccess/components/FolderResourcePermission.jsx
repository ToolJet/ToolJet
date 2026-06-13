import React from 'react';
import EEFolderResourcePermissions from '@ee/modules/WorkspaceSettings/components/FolderResourcePermissions';

function FolderResourcePermissions() {
  return <></>;
}

export default process.env.TOOLJET_EDITION === 'ce' ? FolderResourcePermissions : EEFolderResourcePermissions;
