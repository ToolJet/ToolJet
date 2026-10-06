import React from 'react';

import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import EEWorkspaceSettingsPage from '@ee/modules/WorkspaceSettings/components/WorkspaceSettingsPage';

import BaseWorkspaceSettingsPage from './components/BaseWorkspaceSettingsPage';

function WorkspaceSettingsPage(props) {
  return <BaseWorkspaceSettingsPage {...props} />;
}

export default pickEditionSpecificComponent({
  ce: WorkspaceSettingsPage,
  ee: EEWorkspaceSettingsPage,
  cloudSameAsEE: true,
});
