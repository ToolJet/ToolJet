import React, { useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { appService } from '@/_services';
import { Editor } from '../Editor/Editor';
import { RealtimeEditor } from '@/Editor/RealtimeEditor';
import config from 'config';
import { Redirect } from 'react-router-dom';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

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
      <SkeletonTheme color={props.darkMode ? '#1F2936' : ''} highlightColor={props.darkMode ? '#2B394B' : ''}>
        <div className="apploader">
          <div className="app-container">
            <div className="editor-header px-1">
              <div className="app-title-skeleton">
                <SkeletonTheme color="#fff">
                  <Skeleton height={'70%'} width={'100px'} className="skeleton" />
                </SkeletonTheme>
              </div>
              <div className="right-buttons">
                <SkeletonTheme color="#fff">
                  <Skeleton height={'70%'} width={'80px'} className="skeleton" />
                </SkeletonTheme>
                <SkeletonTheme color="#fff">
                  <Skeleton height={'70%'} width={'80px'} className="skeleton" />
                </SkeletonTheme>
                <SkeletonTheme color="#fff">
                  <Skeleton height={'70%'} width={'80px'} className="skeleton" />
                </SkeletonTheme>
              </div>
            </div>
            <div className="row editor-body p-0 m-0">
              <div className="skeleton editor-left-panel">
                <Skeleton height={'100%'} />
              </div>
              <div className="col col-*">
                <div className="flex-column justify-content-between h-100">
                  <div className="skeleton" style={{ height: '70%' }}>
                    <Skeleton height={'100%'} />
                  </div>
                  <div className="skeleton h-30" style={{ height: '30%' }}>
                    <Skeleton height={'100%'} />
                  </div>
                </div>
              </div>
              <div className="col col-2 skeleton">
                <Skeleton height={'100%'} />
              </div>
            </div>
          </div>
        </div>
      </SkeletonTheme>
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
