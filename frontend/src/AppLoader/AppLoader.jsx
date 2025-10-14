import React, { Suspense, lazy, useLayoutEffect } from 'react';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { resetAllStores } from '@/_stores/utils';
import RenderWorkflow from '@/modules/RenderWorkflow';
// import RenderAppBuilder from './RenderAppBuilder';

const RenderAppBuilder = lazy(() => import('./RenderAppBuilder'));

const AppLoader = (props) => {
  const { type: appType } = props;

  useLayoutEffect(() => {
    resetAllStores();
  }, []);

  switch (appType) {
    case 'front-end':
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <RenderAppBuilder appType="front-end" {...props} />
        </Suspense>
      );
    case 'workflow':
      return <RenderWorkflow {...props} />;
    case 'module':
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <RenderAppBuilder appType="module" {...props} />
        </Suspense>
      );
  }
};

export default withTranslation()(AppLoader);
