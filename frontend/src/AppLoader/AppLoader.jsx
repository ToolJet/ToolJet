import React, { useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { appService, organizationService, authenticationService } from '@/_services';
import { Editor } from '../Editor/Editor';
import { RealtimeEditor } from '@/Editor/RealtimeEditor';
import config from 'config';
import { Redirect } from 'react-router-dom';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { safelyParseJSON, stripTrailingSlash } from '@/_helpers/utils';

const AppLoaderComponent = (props) => {
  const appId = props.match.params.id;
  const currentUser = authenticationService.currentUserValue;
  const [appDetails, setAppDetails] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isLoading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => loadAppDetails(), []);

  const loadAppDetails = () => {
    appService
      .getApp(appId, 'edit')
      .then((data) => {
        setLoading(false);
        setAppDetails(data);
      })
      .catch((error) => {
        setErrorDetails(error);
        setLoading(false);
      });
  };

  const switchOrganization = (orgId) => {
    const path = `/apps/${appId}`;
    const sub_path = window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : '';
    organizationService.switchOrganization(orgId).then(
      (data) => {
        authenticationService.updateCurrentUserDetails(data);
        window.location.href = `${sub_path}${path}`;
      },
      () => {
        return (window.location.href = `${sub_path}/login/${orgId}?redirectTo=${path}`);
      }
    );
  };

  const handleError = () => {
    try {
      if (errorDetails?.data) {
        const statusCode = errorDetails.data?.statusCode;
        if (statusCode === 403) {
          const errorObj = safelyParseJSON(errorDetails.data?.message);
          if (errorObj?.organizationId && currentUser.organization_id !== errorObj?.organizationId) {
            switchOrganization(errorObj?.organizationId);
            return;
          }
          return <Redirect to={'/'} />;
        }
      }
    } catch (err) {
      return <Redirect to={'/'} />;
    }
  };

  const AppSkeleton = () => {
    return (
      <SkeletonTheme
        color={props.darkMode ? '#19212c' : '#fff'}
        highlightColor={props.darkMode ? '#2B394B' : '#f1f1f1'}
      >
        <div className="apploader">
          <div className="app-container">
            <div className="editor-header px-1">
              <div className="app-title-skeleton">
                <Skeleton height={'70%'} width={'100px'} className="skeleton" />
              </div>
              <div>
                <div className="right-buttons">
                  <Skeleton height={'70%'} width={'80px'} className="skeleton" />
                  <Skeleton height={'70%'} width={'80px'} className="skeleton" />
                  <Skeleton height={'70%'} width={'80px'} className="skeleton" />
                </div>
              </div>
            </div>
            <div className="row editor-body p-0 m-0">
              <div className="editor-left-panel">
                <div>
                  <div className="left-menu-items">
                    {Array.from(Array(6)).map((_item, index) => (
                      <Skeleton height={'60px'} className="skeleton" key={index} />
                    ))}
                  </div>
                </div>
                <div className="bottom-items">
                  <div className="left-menu-items">
                    {Array.from(Array(2)).map((_item, index) => (
                      <Skeleton height={'60px'} className="skeleton" key={index} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="col col-* editor-center-wrapper">
                <div className="editor-center">
                  <div className="canvas">
                    <div className="mt-5 d-flex flex-column">
                      <div className="mb-1">
                        <Skeleton width={'150px'} height={15} className="skeleton" />
                      </div>
                      {Array.from(Array(4)).map((_item, index) => (
                        <Skeleton key={index} width={'300px'} height={10} className="skeleton" />
                      ))}
                      <div className="align-self-end">
                        <Skeleton width={'100px'} className="skeleton" />
                      </div>
                      <Skeleton className="skeleton mt-4" />
                      <Skeleton height={'150px'} className="skeleton mt-2" />
                    </div>
                  </div>
                  <div className="query-panel">
                    <div className="queries">
                      <div className="queries-title">
                        <Skeleton width={'100px'} className="skeleton" />
                        <Skeleton width={'35px'} className="skeleton" />
                      </div>
                      <div className="query-list">
                        <div className="query-list-item">
                          <Skeleton height={'40px'} className="skeleton mb-2" />
                          <Skeleton height={'40px'} className="skeleton" />
                        </div>
                      </div>
                    </div>
                    <div className="query-editor">
                      <div className="query-editor-header">
                        <div></div>
                        <div className="query-actions">
                          <Skeleton width={'80px'} className="skeleton m-2" />
                          <Skeleton width={'80px'} className="skeleton" />
                        </div>
                      </div>
                      <div className="query-editor-body">
                        <div className="mt-3 px-2">
                          <Skeleton width={'20%'} className="skeleton" />
                          <div className="d-flex mt-3">
                            {Array.from(Array(3)).map((_item, index) => (
                              <div className="button" key={index}>
                                <Skeleton height={40} width={'150px'} className="skeleton" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col col-2 wrapper right-bar">
                <div className="widget-list-header"></div>
                <div className="widget-list">
                  <Skeleton height={35} className="skeleton mt-1" />
                  {Array.from(Array(2)).map((_item, index) => (
                    <div className="mt-3" key={index}>
                      <Skeleton height={10} width={'50%'} className="skeleton" />
                      {Array.from(Array(2)).map((_item, index) => (
                        <div className="widget row mt-1 mb-3" key={index}>
                          <div className="col">
                            <Skeleton height={'60px'} className="skeleton" />
                          </div>
                          <div className="col">
                            <Skeleton height={'60px'} className="skeleton" />
                          </div>
                          <div className="col">
                            <Skeleton height={'60px'} className="skeleton" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
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
