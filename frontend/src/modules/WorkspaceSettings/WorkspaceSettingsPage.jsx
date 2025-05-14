import React from 'react';
import { BaseWorkspaceSettingsPage } from './components';
import { withEditionSpecificComponent } from '../common/helpers';

function WorkspaceSettingsPage(props) {
  return <BaseWorkspaceSettingsPage {...props} />;
}

export default withEditionSpecificComponent(WorkspaceSettingsPage, 'WorkspaceSettings');
