import React from 'react';
import { withTranslation } from 'react-i18next';
import { Editor } from '../Editor/Editor';
import { RealtimeEditor } from '@/Editor/RealtimeEditor';
import config from 'config';
import WorkflowEditor from '../WorkflowEditor';
import _ from 'lodash';

const AppLoaderComponent = (props) => {
  const { type: appType } = props;

  if (appType === 'front-end')
    return config.ENABLE_MULTIPLAYER_EDITING ? <RealtimeEditor {...props} /> : <Editor {...props} />;
  else if (appType === 'workflow') return <WorkflowEditor {...props} />;
};

export const AppLoader = withTranslation()(AppLoaderComponent);
