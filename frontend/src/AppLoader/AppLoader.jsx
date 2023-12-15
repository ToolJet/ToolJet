import React, { useEffect, useLayoutEffect } from 'react';
import { withTranslation } from 'react-i18next';
import { Editor } from '../Editor/Editor';
import { RealtimeEditor } from '@/Editor/RealtimeEditor';
import WorkflowEditor from '../WorkflowEditor';
import config from 'config';
import { appService } from '@/_services';
import { useAppDataActions } from '@/_stores/appDataStore';
import _ from 'lodash';
import { resetAllStores } from '@/_stores/utils';
import { useEditorActions } from '@/_stores/editorStore';
import { TJLoader } from '@/_ui/TJLoader';

const AppLoaderComponent = (props) => {
  const { type: appType } = props;

  if (appType === 'front-end') return <AppBuilder {...props} />;
  else if (appType === 'workflow') return <WorkflowEditor {...props} />;
};

const AppBuilder = React.memo((props) => {
  const [shouldLoadApp, setShouldLoadApp] = React.useState(false);
  const { updateState } = useAppDataActions();
  const { updateFeatureAccess } = useEditorActions();

  useLayoutEffect(() => {
    resetAllStores();
  }, []);

  useEffect(() => {
    props?.id && props?.slug && loadAppDetails(props?.id);

    return () => {
      setShouldLoadApp(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAppDetails = (appId) => {
    updateFeatureAccess();
    appService.fetchApp(appId, 'edit').then((data) => {
      setShouldLoadApp(true);
      updateState({
        app: data,
        appId: data.id,
      });
    });
  };

  if (!shouldLoadApp) return <TJLoader />;

  return config.ENABLE_MULTIPLAYER_EDITING ? (
    <RealtimeEditor {...props} shouldLoadApp={shouldLoadApp} />
  ) : (
    <Editor {...props} />
  );
});

export const AppLoader = withTranslation()(AppLoaderComponent);
