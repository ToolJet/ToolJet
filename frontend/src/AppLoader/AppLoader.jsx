import React, { useLayoutEffect } from 'react';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { resetAllStores } from '@/_stores/utils';
import RenderWorkflow from '@/modules/RenderWorkflow';
import RenderAppBuilder from './RenderAppBuilder';

const AppLoader = (props) => {
  const { type: appType } = props;

  useLayoutEffect(() => {
    resetAllStores();
  }, []);

  switch (appType) {
    case 'front-end':
      return <RenderAppBuilder {...props} />;
    case 'workflow':
      return <RenderWorkflow {...props} />;
    case 'module':
      return <RenderAppBuilder appType="module" {...props} />;
  }
};

export default withTranslation()(AppLoader);
