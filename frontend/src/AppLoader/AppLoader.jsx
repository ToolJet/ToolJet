import React, { useLayoutEffect } from 'react';
import { withTranslation } from 'react-i18next';
import { RealtimeEditor } from '@/Editor/RealtimeEditor';
import WorkflowEditor from '../WorkflowEditor';
import _ from 'lodash';
import { resetAllStores } from '@/_stores/utils';

const AppLoaderComponent = (props) => {
  const { type: appType } = props;

  if (appType === 'front-end') return <AppBuilder {...props} />;
  else if (appType === 'workflow') return <WorkflowEditor {...props} />;
};

const AppBuilder = React.memo((props) => {
  useLayoutEffect(() => {
    resetAllStores();
  }, []);

  return <RealtimeEditor {...props} />;
});

export const AppLoader = withTranslation()(AppLoaderComponent);
