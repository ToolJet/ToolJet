import React, { useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { appService } from '@/_services';
import { Editor } from '../Editor/Editor';
import { RealtimeEditor } from '@/Editor/RealtimeEditor';
import config from 'config';
import { Redirect } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';

const AppLoaderComponent = (props) => {
  const appId = props.match.params.id;
  const [appDetails, setAppDetails] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isLoading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => loadAppDetails(), []);

  const loadAppDetails = () => {
    appService
      .getApp(appId)
      .then((data) => {
        setLoading(false);
        setAppDetails(data);
      })
      .catch((error) => {
        setErrorDetails(error);
        setLoading(false);
      });
  };

  const handleError = () => {
    if (errorDetails?.data) {
      const statusCode = errorDetails.data?.statusCode;
      if (statusCode === 403) {
        return <Redirect to={'/'} />;
      }
    }
  };

  const AppSkeleton = () => {
    return (
      <div>
        <Skeleton />
      </div>
    );
  };

  return (
    <>
      {isLoading ? (
        <AppSkeleton />
      ) : (
        <>
          {appDetails ? (
            <>{config.ENABLE_MULTIPLAYER_EDITING ? <RealtimeEditor {...props} /> : <Editor {...props} />} </>
          ) : (
            handleError()
          )}
        </>
      )}
    </>
  );
};

export const AppLoader = withTranslation()(AppLoaderComponent);
