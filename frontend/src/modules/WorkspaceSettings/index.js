import React, { Suspense } from 'react';
import { TJLoader } from '@/_ui/TJLoader';
import CEWorkspaceSettingsRoutes from './CEWorkspaceSettingsRoutes';

// CE renders its own routes; EE/cloud lazy-loads the EE routes in a separate
// chunk. The import is dead-code-eliminated from CE builds.
const EEWorkspaceSettings =
  process.env.TOOLJET_EDITION === 'ce' ? null : React.lazy(() => import('@ee/modules/WorkspaceSettings'));

const WorkspaceSettingsModule = (props) =>
  process.env.TOOLJET_EDITION === 'ce' ? (
    <CEWorkspaceSettingsRoutes {...props} />
  ) : (
    <Suspense fallback={<TJLoader />}>
      <EEWorkspaceSettings {...props} />
    </Suspense>
  );

export default WorkspaceSettingsModule;
