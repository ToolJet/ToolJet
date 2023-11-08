import React from 'react';
import { withTranslation } from 'react-i18next';
import { Editor } from '../Editor/Editor';
import { RealtimeEditor } from '@/Editor/RealtimeEditor';
import WorkflowEditor from '../WorkflowEditor';
import _ from 'lodash';

const AppLoaderComponent = (props) => {
  const { type: appType } = props;
  const shouldEnableMultiplayer = window.public_config?.ENABLE_MULTIPLAYER_EDITING === 'true';

  if (appType === 'front-end') return shouldEnableMultiplayer ? <RealtimeEditor {...props} /> : <Editor {...props} />;
  else if (appType === 'workflow') return <WorkflowEditor {...props} />;
};

export const AppLoader = withTranslation()(AppLoaderComponent);
