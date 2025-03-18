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

  if (appType === 'front-end') return <RenderAppBuilder {...props} />;
  else if (appType === 'workflow') return <RenderWorkflow {...props} />;
};

export default withTranslation()(AppLoader);
