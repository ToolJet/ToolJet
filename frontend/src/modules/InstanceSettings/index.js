import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { TJLoader } from '@/_ui/TJLoader';

// Instance settings is EE/cloud-only. The EE module loads lazily in its own
// chunk; in CE builds the import is dead-code-eliminated and the route
// redirects, matching the previous withEditionSpecificModule fallback.
const EEInstanceSettings =
  process.env.TOOLJET_EDITION === 'ce' ? null : React.lazy(() => import('@ee/modules/InstanceSettings'));

const InstanceSettings = (props) =>
  process.env.TOOLJET_EDITION === 'ce' ? (
    <Navigate to="/" replace />
  ) : (
    <Suspense fallback={<TJLoader />}>
      <EEInstanceSettings {...props} />
    </Suspense>
  );

export default InstanceSettings;
