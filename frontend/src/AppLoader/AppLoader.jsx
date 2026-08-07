import React, { lazy, useLayoutEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { resetAllStores } from '@/_stores/utils';
import { TJLoader } from '@/_ui/TJLoader';

import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import RenderAppBuilder from './RenderAppBuilder';

const eeWorkflowEditor = lazy(() => import('@ee/modules/RenderWorkflow'));
const RenderWorkflow = pickEditionSpecificComponent({
  ce: () => <Navigate to="/" replace />,
  ee: eeWorkflowEditor,
  fallback: <TJLoader />,
});

const AppLoader = (props) => {
  const { type: appType } = props;

  useLayoutEffect(() => {
    resetAllStores();
  }, []);

  switch (appType) {
    case 'front-end':
      return <RenderAppBuilder appType="front-end" {...props} />;
    case 'workflow':
      return <RenderWorkflow {...props} />;
    case 'module':
      return <RenderAppBuilder appType="module" {...props} />;
  }
};

export default withTranslation()(AppLoader);
