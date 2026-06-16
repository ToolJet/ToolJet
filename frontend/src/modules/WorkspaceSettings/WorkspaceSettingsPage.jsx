import React from 'react';
import { BaseWorkspaceSettingsPage } from './components';
import EEWorkspaceSettingsPage from '@ee/modules/WorkspaceSettings/components/WorkspaceSettingsPage';

function WorkspaceSettingsPage(props) {
  return <BaseWorkspaceSettingsPage {...props} />;
}

export default process.env.TOOLJET_EDITION === 'ce' ? WorkspaceSettingsPage : EEWorkspaceSettingsPage;
