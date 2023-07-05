import React from 'react';
import {
  appService,
  authenticationService,
  orgEnvironmentVariableService,
  orgEnvironmentConstantService,
  organizationService,
} from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './Container';
import { Confirm } from './Viewer/Confirm';
import { ViewerNavigation } from './Viewer/ViewerNavigation';
import {
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onComponentClick,
  onQueryConfirmOrCancel,
  onEvent,
  runQuery,
  computeComponentState,
} from '@/_helpers/appUtils';
import queryString from 'query-string';
import ViewerLogoIcon from './Icons/viewer-logo.svg';
import { DataSourceTypes } from './DataSourceManager/SourceComponents';
import {
  resolveReferences,
  safelyParseJSON,
  stripTrailingSlash,
  getSubpath,
  excludeWorkspaceIdFromURL,
} from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { Navigate } from 'react-router-dom';
import Spinner from '@/_ui/Spinner';
import { toast } from 'react-hot-toast';
import { withRouter } from '@/_hoc/withRouter';

import { useDataQueriesStore } from '@/_stores/dataQueriesStore';

class ViewerComponent extends React.Component {
  constructor(props) {
    super(props);

    const deviceWindowWidth = window.screen.width - 5;
    const isMobileDevice = deviceWindowWidth < 600;

    const pageHandle = this.props?.params?.pageHandle;

    const slug = this.props.params.slug;
    const appId = this.props.params.id;
    const versionId = this.props.params.versionId;

    this.subscription = null;

    this.state = {
      slug,
      appId,
      versionId,
      deviceWindowWidth,
      currentLayout: isMobileDevice ? 'mobile' : 'desktop',
      currentUser: null,
      isLoading: true,
      users: null,
      appDefinition: { pages: {} },
      currentState: {
        queries: {},
        components: {},
        globals: {
          currentUser: {},
          theme: { name: props.darkMode ? 'dark' : 'light' },
          urlparams: {},
          environment_variables: {},
          page: {
            handle: pageHandle,
          },
        },
        variables: {},
      },
      queryConfirmationList: [],
      isAppLoaded: false,
      errorAppId: null,
      errorVersionId: null,
      errorDetails: null,
      pages: {},
    };
  }

  setStateForApp = (data) => {
    const copyDefinition = _.cloneDeep(data.definition);
    const pagesObj = copyDefinition.pages || {};

    const newDefinition = {
      ...copyDefinition,
      pages: pagesObj,
    };

    this.setState({
      app: data,
      isLoading: false,
      isAppLoaded: true,
      appDefinition: newDefinition || { components: {} },
    });
  };

  setStateForContainer = async (data) => {
    const currentUser = this.state.currentUser;
    let userVars = {};

    if (currentUser) {
      userVars = {
        email: currentUser.email,
        firstName: currentUser.first_name,
        lastName: currentUser.last_name,
        groups: authenticationService.currentSessionValue?.group_permissions.map((group) => group.group),
      };
    }

    let mobileLayoutHasWidgets = false;

    if (this.state.currentLayout === 'mobile') {
      const currentComponents = data.definition.pages[data.definition.homePageId].components;
      mobileLayoutHasWidgets =
        Object.keys(currentComponents).filter((componentId) => currentComponents[componentId]['layouts']['mobile'])
          .length > 0;
    }

    let queryState = {};
    data.data_queries.forEach((query) => {
      if (query.pluginId || query?.plugin?.id) {
        queryState[query.name] = {
          ...query.plugin.manifestFile.data.source.exposedVariables,
          ...this.state.currentState.queries[query.name],
        };
      } else {
        const dataSourceTypeDetail = DataSourceTypes.find((source) => source.kind === query.kind);
        queryState[query.name] = {
          ...dataSourceTypeDetail.exposedVariables,
          ...this.state.currentState.queries[query.name],
        };
      }
    });

    const variables = await this.fetchOrgEnvironmentVariables(data.slug, data.is_public);
    const constants = await this.fetchOrgEnvironmentConstants(data.slug, data.is_public);

    const pages = Object.entries(data.definition.pages).map(([pageId, page]) => ({ id: pageId, ...page }));
    const homePageId = data.definition.homePageId;
    const startingPageHandle = this.props?.params?.pageHandle;
    const currentPageId = pages.filter((page) => page.handle === startingPageHandle)[0]?.id ?? homePageId;
    const currentPage = pages.find((page) => page.id === currentPageId);

    useDataQueriesStore.getState().actions.setDataQueries(data.data_queries);

    this.setState(
      {
        currentUser,
        currentSidebarTab: 2,
        currentLayout: mobileLayoutHasWidgets ? 'mobile' : 'desktop',
        canvasWidth:
          this.state.currentLayout === 'desktop'
            ? '100%'
            : mobileLayoutHasWidgets
            ? `${this.state.deviceWindowWidth}px`
            : '1292px',
        selectedComponent: null,
        currentState: {
          queries: queryState,
          components: {},
          globals: {
            currentUser: userVars, // currentUser is updated in setupViewer function as well
            theme: { name: this.props.darkMode ? 'dark' : 'light' },
            urlparams: JSON.parse(JSON.stringify(queryString.parse(this.props.location.search))),
          },
          variables: {},
          page: {
            id: currentPage.id,
            handle: currentPage.handle,
            name: currentPage.name,
            variables: {},
          },
          ...variables,
          ...constants,
        },
        dataQueries: data.data_queries,
        currentPageId: currentPage.id,
        pages: {},
      },
      () => {
        computeComponentState(this, data?.definition?.pages[currentPage.id]?.components).then(async () => {
          this.setState({ initialComputationOfStateDone: true });
          console.log('Default component state computed and set');
          this.runQueries(data.data_queries);
          // eslint-disable-next-line no-unsafe-optional-chaining
          const { events } = this.state.appDefinition?.pages[this.state.currentPageId];
          for (const event of events ?? []) {
            await this.handleEvent(event.eventId, event);
          }
        });
      }
    );
  };

  runQueries = (data_queries) => {
    data_queries.forEach((query) => {
      if (query.options.runOnPageLoad) {
        runQuery(this, query.id, query.name, undefined, 'view');
      }
    });
  };

  fetchOrgEnvironmentConstants = async (slug, isPublic) => {
    const orgConstants = {};

    let variablesResult;
    if (!isPublic) {
      const { constants } = await orgEnvironmentConstantService.getAll();
      variablesResult = constants;
    } else {
      const { constants } = await orgEnvironmentConstantService.getConstantsFromPublicApp(slug);

      variablesResult = constants;
    }

    console.log('--org constant 2.0', { variablesResult });

    if (variablesResult && Array.isArray(variablesResult)) {
      variablesResult.map((constant) => {
        const constantValue = constant.values.find((value) => value.environmentName === 'production')['value'];
        orgConstants[constant.name] = constantValue;
      });

      // console.log('--org constant 2.0', { orgConstants });

      return {
        constants: orgConstants,
      };
    }

    return { constants: {} };
  };

  fetchOrgEnvironmentVariables = async (slug, isPublic) => {
    const variables = {
      client: {},
      server: {},
    };

    let variablesResult;
    if (!isPublic) {
      variablesResult = await orgEnvironmentVariableService.getVariables();
    } else {
      variablesResult = await orgEnvironmentVariableService.getVariablesFromPublicApp(slug);
    }

    variablesResult.variables.map((variable) => {
      variables[variable.variable_type][variable.variable_name] =
        variable.variable_type === 'server' ? 'HiddenEnvironmentVariable' : variable.value;
    });
    return variables;
  };

  loadApplicationBySlug = (slug) => {
    appService
      .getAppBySlug(slug)
      .then((data) => {
        this.setStateForApp(data);
        this.setStateForContainer(data);
        this.setWindowTitle(data.name);
      })
      .catch((error) => {
        this.setState({
          errorDetails: error,
          errorAppId: slug,
          errorVersionId: null,
          isLoading: false,
        });
      });
  };

  loadApplicationByVersion = (appId, versionId) => {
    appService
      .getAppByVersion(appId, versionId)
      .then((data) => {
        this.setStateForApp(data);
        this.setStateForContainer(data);
      })
      .catch((error) => {
        this.setState({
          errorDetails: error,
          errorAppId: appId,
          errorVersionId: versionId,
          isLoading: false,
        });
      });
  };

  switchOrganization = (orgId, appId, versionId) => {
    const path = `/applications/${appId}${versionId ? `/versions/${versionId}` : ''}`;
    const sub_path = window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : '';

    organizationService.switchOrganization(orgId).then(
      () => {
        window.location.href = `${sub_path}${path}`;
      },
      () => {
        return (window.location.href = `${sub_path}/login/${orgId}?redirectTo=${path}`);
      }
    );
  };

  handleError = (errorDetails, appId, versionId) => {
    try {
      if (errorDetails?.data) {
        const statusCode = errorDetails.data?.statusCode;
        if (statusCode === 403) {
          const errorObj = safelyParseJSON(errorDetails.data?.message);
          const currentSessionValue = authenticationService.currentSessionValue;
          if (
            errorObj?.organizationId &&
            this.state.currentUser &&
            currentSessionValue.current_organization_id !== errorObj?.organizationId
          ) {
            this.switchOrganization(errorObj?.organizationId, appId, versionId);
            return;
          }
          return <Navigate replace to={'/'} />;
        } else if (statusCode === 401) {
          window.location = `${getSubpath() ?? ''}/login?redirectTo=${this.props.location.pathname}`;
        } else if (statusCode === 404) {
          toast.error(errorDetails?.error ?? 'App not found', {
            position: 'top-center',
          });
        }
        return <Navigate replace to={'/'} />;
      }
    } catch (err) {
      return <Navigate replace to={'/'} />;
    }
  };

  setupViewer() {
    const slug = this.props.params.slug;
    const appId = this.props.params.id;
    const versionId = this.props.params.versionId;

    this.subscription = authenticationService.currentSession.subscribe((currentSession) => {
      if (currentSession?.load_app) {
        if (currentSession?.group_permissions) {
          const currentUser = currentSession.current_user;
          const userVars = {
            email: currentUser.email,
            firstName: currentUser.first_name,
            lastName: currentUser.last_name,
            groups: currentSession?.group_permissions?.map((group) => group.group),
          };

          this.setState({
            currentUser,
            currentState: {
              ...this.state.currentState,
              globals: {
                ...this.state.currentState.globals,
                currentUser: userVars, // currentUser is updated in setStateForContainer function as well
              },
            },
            userVars,
          });
          slug ? this.loadApplicationBySlug(slug) : this.loadApplicationByVersion(appId, versionId);
        } else if (currentSession?.authentication_failed && !slug) {
          const loginPath = (window.public_config?.SUB_PATH || '/') + 'login';
          const pathname = getSubpath() ? window.location.pathname.replace(getSubpath(), '') : window.location.pathname;
          window.location.href = loginPath + `?redirectTo=${excludeWorkspaceIdFromURL(pathname)}`;
        } else {
          slug && this.loadApplicationBySlug(slug);
        }
      }
      this.setState({ isLoading: false });
    });
  }

  componentDidMount() {
    this.setupViewer();
  }

  componentDidUpdate(prevProps) {
    if (this.props.params.slug && this.props.params.slug !== prevProps.params.slug) {
      this.setState({ isLoading: true });
      this.loadApplicationBySlug(this.props.params.slug);
    }

    if (this.state.initialComputationOfStateDone) this.handlePageSwitchingBasedOnURLparam();
  }

  handlePageSwitchingBasedOnURLparam() {
    const handleOnURL = this.props.params.pageHandle;
    const pageIdCorrespondingToHandleOnURL = handleOnURL
      ? this.findPageIdFromHandle(handleOnURL)
      : this.state.appDefinition.homePageId;
    const currentPageId = this.state.currentPageId;

    if (pageIdCorrespondingToHandleOnURL != this.state.currentPageId) {
      const targetPage = this.state.appDefinition.pages[pageIdCorrespondingToHandleOnURL];
      this.setState(
        {
          pages: {
            ...this.state.pages,
            [currentPageId]: {
              ...this.state.pages?.[currentPageId],
              variables: {
                ...this.state.currentState?.page?.variables,
              },
            },
          },
          currentPageId: pageIdCorrespondingToHandleOnURL,
          handle: targetPage.handle,
          name: targetPage.name,
          currentState: {
            ...this.state.currentState,
            globals: {
              ...this.state.currentState.globals,
              urlparams: JSON.parse(JSON.stringify(queryString.parse(this.props.location.search))),
            },
            page: {
              ...this.state.currentState.page,
              name: targetPage.name,
              handle: targetPage.handle,
              variables: this.state.pages?.[pageIdCorrespondingToHandleOnURL]?.variables ?? {},
              id: pageIdCorrespondingToHandleOnURL,
            },
          },
        },
        async () => {
          computeComponentState(this, this.state.appDefinition?.pages[this.state.currentPageId].components).then(
            async () => {
              // eslint-disable-next-line no-unsafe-optional-chaining
              const { events } = this.state.appDefinition?.pages[this.state.currentPageId];
              for (const event of events ?? []) {
                await this.handleEvent(event.eventId, event);
              }
            }
          );
        }
      );
    }
  }

  findPageIdFromHandle(handle) {
    return (
      Object.entries(this.state.appDefinition.pages).filter(([_id, page]) => page.handle === handle)?.[0]?.[0] ??
      this.state.appDefinition.homePageId
    );
  }

  getCanvasWidth = () => {
    const canvasBoundingRect = document.getElementsByClassName('canvas-area')[0]?.getBoundingClientRect();
    return canvasBoundingRect?.width;
  };

  setWindowTitle(name) {
    document.title = name ?? 'My App';
  }

  computeCanvasBackgroundColor = () => {
    const bgColor =
      (this.state.appDefinition.globalSettings?.backgroundFxQuery ||
        this.state.appDefinition.globalSettings?.canvasBackgroundColor) ??
      '#edeff5';
    const resolvedBackgroundColor = resolveReferences(bgColor, this.state.currentState);
    if (['#2f3c4c', '#edeff5'].includes(resolvedBackgroundColor)) {
      return this.props.darkMode ? '#2f3c4c' : '#edeff5';
    }
    return resolvedBackgroundColor;
  };

  changeDarkMode = (newMode) => {
    this.setState({
      currentState: {
        ...this.state.currentState,
        globals: {
          ...this.state.currentState.globals,
          theme: { name: newMode ? 'dark' : 'light' },
        },
      },
      showQuerySearchField: false,
    });
    this.props.switchDarkMode(newMode);
  };

  switchPage = (id, queryParams = []) => {
    document.getElementById('real-canvas').scrollIntoView();

    if (this.state.currentPageId === id) return;

    const { handle } = this.state.appDefinition.pages[id];

    const queryParamsString = queryParams.map(([key, value]) => `${key}=${value}`).join('&');

    if (this.state.slug) this.props.navigate(`/applications/${this.state.slug}/${handle}?${queryParamsString}`);
    else
      this.props.navigate(
        `/applications/${this.state.appId}/versions/${this.state.versionId}/${handle}?${queryParamsString}`
      );
  };

  handleEvent = (eventName, options) => onEvent(this, eventName, options, 'view');

  computeCanvasMaxWidth = () => {
    const { appDefinition } = this.state;
    let computedCanvasMaxWidth = 1292;

    if (appDefinition.globalSettings?.canvasMaxWidthType === 'px')
      computedCanvasMaxWidth =
        (+appDefinition.globalSettings?.canvasMaxWidth || 1292) - (appDefinition?.showViewerNavigation ? 200 : 0);
    else if (appDefinition.globalSettings?.canvasMaxWidthType === '%')
      computedCanvasMaxWidth = +appDefinition.globalSettings?.canvasMaxWidth + '%';

    return computedCanvasMaxWidth;
  };

  componentWillUnmount() {
    this.subscription && this.subscription.unsubscribe();
  }

  render() {
    const {
      appDefinition,
      isLoading,
      isAppLoaded,
      currentLayout,
      deviceWindowWidth,
      defaultComponentStateComputed,
      dataQueries,
      queryConfirmationList,
      errorAppId,
      errorVersionId,
      errorDetails,
      canvasWidth,
    } = this.state;

    const currentCanvasWidth = canvasWidth;

    const canvasMaxWidth = this.computeCanvasMaxWidth();

    if (this.state.app?.isLoading) {
      return (
        <div className="tooljet-logo-loader">
          <div>
            <div className="loader-logo">
              <ViewerLogoIcon />
            </div>
            <div className="loader-spinner">
              <Spinner />
            </div>
          </div>
        </div>
      );
    } else {
      const startingPageHandle = this.props?.params?.pageHandle;
      const homePageHandle = this.state.appDefinition?.pages?.[this.state.appDefinition?.homePageId]?.handle;
      if (!startingPageHandle && homePageHandle) {
        return <Navigate to={homePageHandle} replace />;
      }
      if (this.state.app?.is_maintenance_on) {
        return (
          <div className="maintenance_container">
            <div className="card">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h3>{this.props.t('viewer', 'Sorry!. This app is under maintenance')}</h3>
              </div>
            </div>
          </div>
        );
      } else {
        if (errorDetails) {
          this.handleError(errorDetails, errorAppId, errorVersionId);
        }

        const pageArray = Object.values(this.state.appDefinition?.pages || {});
        //checking if page is hidden
        if (
          pageArray.find((page) => page.handle === this.props.params.pageHandle)?.hidden &&
          this.state.currentPageId !== this.state.appDefinition?.homePageId && //Prevent page crashing when home page is hidden
          this.state.appDefinition?.pages?.[this.state.appDefinition?.homePageId]
        ) {
          const homeHandle = this.state.appDefinition?.pages?.[this.state.appDefinition?.homePageId]?.handle;
          let url = `/applications/${this.state.appId}/versions/${this.state.versionId}/${homeHandle}`;
          if (this.state.slug) {
            url = `/applications/${this.state.slug}/${homeHandle}`;
          }
          return <Navigate to={url} replace />;
        }

        //checking if page exists
        if (
          !pageArray.find((page) => page.handle === this.props.params.pageHandle) &&
          this.state.appDefinition?.pages?.[this.state.appDefinition?.homePageId]
        ) {
          const homeHandle = this.state.appDefinition?.pages?.[this.state.appDefinition?.homePageId]?.handle;
          let url = `/applications/${this.state.appId}/versions/${this.state.versionId}/${homeHandle}`;
          if (this.state.slug) {
            url = `/applications/${this.state.slug}/${homeHandle}`;
          }
          return <Navigate to={`${url}${this.props.params.pageHandle ? '' : window.location.search}`} replace />;
        }

        return (
          <div className="viewer wrapper">
            <Confirm
              show={queryConfirmationList.length > 0}
              message={'Do you want to run this query?'}
              onConfirm={(queryConfirmationData) => onQueryConfirmOrCancel(this, queryConfirmationData, true, 'view')}
              onCancel={() => onQueryConfirmOrCancel(this, queryConfirmationList[0], false, 'view')}
              queryConfirmationData={queryConfirmationList[0]}
              key={queryConfirmationList[0]?.queryName}
            />
            <DndProvider backend={HTML5Backend}>
              <ViewerNavigation.Header
                showHeader={!appDefinition.globalSettings?.hideHeader && isAppLoaded}
                appName={this.state.app?.name ?? null}
                changeDarkMode={this.changeDarkMode}
                darkMode={this.props.darkMode}
                pages={Object.entries(this.state.appDefinition?.pages) ?? []}
                currentPageId={this.state?.currentPageId ?? this.state.appDefinition?.homePageId}
                switchPage={this.switchPage}
                currentLayout={this.state.currentLayout}
              />
              <div className="sub-section">
                <div className="main">
                  <div className="canvas-container align-items-center">
                    <div className="areas d-flex flex-rows justify-content-center">
                      {appDefinition?.showViewerNavigation && (
                        <ViewerNavigation
                          isMobileDevice={this.state.currentLayout === 'mobile'}
                          canvasBackgroundColor={this.computeCanvasBackgroundColor()}
                          pages={Object.entries(this.state.appDefinition?.pages) ?? []}
                          currentPageId={this.state?.currentPageId ?? this.state.appDefinition?.homePageId}
                          switchPage={this.switchPage}
                          darkMode={this.props.darkMode}
                        />
                      )}
                      <div
                        className="canvas-area"
                        style={{
                          width: currentCanvasWidth,
                          minHeight: +appDefinition.globalSettings?.canvasMaxHeight || 2400,
                          maxWidth: canvasMaxWidth,
                          maxHeight: +appDefinition.globalSettings?.canvasMaxHeight || 2400,
                          backgroundColor: this.computeCanvasBackgroundColor(),
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {defaultComponentStateComputed && (
                          <>
                            {isLoading ? (
                              <div className="mx-auto mt-5 w-50 p-5">
                                <center>
                                  <div className="spinner-border text-azure" role="status"></div>
                                </center>
                              </div>
                            ) : (
                              <Container
                                appDefinition={appDefinition}
                                appDefinitionChanged={() => false} // function not relevant in viewer
                                snapToGrid={true}
                                appLoading={isLoading}
                                darkMode={this.props.darkMode}
                                onEvent={(eventName, options) => onEvent(this, eventName, options, 'view')}
                                mode="view"
                                deviceWindowWidth={deviceWindowWidth}
                                currentLayout={currentLayout}
                                currentState={this.state.currentState}
                                selectedComponent={this.state.selectedComponent}
                                onComponentClick={(id, component) => {
                                  this.setState({
                                    selectedComponent: { id, component },
                                  });
                                  onComponentClick(this, id, component, 'view');
                                }}
                                onComponentOptionChanged={(component, optionName, value) => {
                                  return onComponentOptionChanged(this, component, optionName, value);
                                }}
                                onComponentOptionsChanged={(component, options) =>
                                  onComponentOptionsChanged(this, component, options)
                                }
                                canvasWidth={this.getCanvasWidth()}
                                dataQueries={dataQueries}
                                currentPageId={this.state.currentPageId}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DndProvider>
          </div>
        );
      }
    }
  }
}

export const Viewer = withTranslation()(withRouter(ViewerComponent));
