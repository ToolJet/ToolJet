import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { TJLoader } from '@/_ui/TJLoader';

// Workflows is EE-only. In EE/cloud builds the module loads lazily in its own
// chunk; in CE builds the import is dead-code-eliminated and the route
// redirects, matching the previous withEditionSpecificModule fallback.
const EEWorkflows = process.env.TOOLJET_EDITION === 'ce' ? null : React.lazy(() => import('@ee/modules/Workflows'));

const Workflows = (props) =>
  process.env.TOOLJET_EDITION === 'ce' ? (
    <Navigate to="/" replace />
  ) : (
    <Suspense fallback={<TJLoader />}>
      <EEWorkflows {...props} />
    </Suspense>
  );

export default Workflows;
