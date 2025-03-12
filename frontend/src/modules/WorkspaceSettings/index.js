import React from 'react';
import { withEditionSpecificModule } from '../common/helpers';
import { TJLoader } from '@/_ui/TJLoader';
import CEWorkspaceSettingsRoutes from './CEWorkspaceSettingsRoutes';

const WorkspaceSettingsModule = withEditionSpecificModule('WorkspaceSettings', {
  LoadingComponent: () => (
    <>
      <TJLoader />
    </>
  ),
  BaseModuleRouteComponent: CEWorkspaceSettingsRoutes,
});

export default WorkspaceSettingsModule;
