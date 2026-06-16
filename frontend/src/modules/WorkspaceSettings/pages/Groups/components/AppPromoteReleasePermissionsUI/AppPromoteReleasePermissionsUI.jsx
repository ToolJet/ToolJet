import React from 'react';
import EEAppPromoteReleasePermissionsUI from '@ee/modules/WorkspaceSettings/components/AppPromoteReleasePermissionsUI';

const AppPromoteReleasePermissionsUI = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? AppPromoteReleasePermissionsUI : EEAppPromoteReleasePermissionsUI;
