import React from 'react';
import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import { TJLoader } from '@/_ui/TJLoader';
import CEWorkspaceSettingsRoutes from './CEWorkspaceSettingsRoutes';
import eeWorkspaceSettings from '@ee/modules/WorkspaceSettings';

const WorkspaceSettings = pickEditionSpecificComponent({
  ce: CEWorkspaceSettingsRoutes,
  ee: eeWorkspaceSettings,
  cloudSameAsEE: true,
  fallback: <TJLoader />,
});

export default WorkspaceSettings;
