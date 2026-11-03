import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';

import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import { TJLoader } from '@/_ui/TJLoader';

const eeInstanceSettings = lazy(() => import('@ee/modules/InstanceSettings'));

const InstanceSettings = pickEditionSpecificComponent({
  ce: () => <Navigate to="/" replace />,
  ee: eeInstanceSettings,
  cloudSameAsEE: true,
  fallback: <TJLoader />,
});

export default InstanceSettings;
