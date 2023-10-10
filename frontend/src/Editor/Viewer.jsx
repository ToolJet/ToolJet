import React from 'react';
import {
  appService,
  authenticationService,
  orgEnvironmentVariableService,
  orgEnvironmentConstantService,
  organizationService,
  dataqueryService,
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
  buildAppDefinition,
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
  isQueryRunnable,
  redirectToDashboard,
  getWorkspaceId,
} from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { Navigate } from 'react-router-dom';
import Spinner from '@/_ui/Spinner';
import { toast } from 'react-hot-toast';
import { withRouter } from '@/_hoc/withRouter';
import { useEditorStore } from '@/_stores/editorStore';
import { setCookie } from '@/_helpers/cookie';
import { useDataQueriesStore } from '@/_stores/dataQueriesStore';
import { useCurrentStateStore } from '@/_stores/currentStateStore';
import { shallow } from 'zustand/shallow';
import { useAppDataActions } from '@/_stores/appDataStore';

class ViewerComponent extends React.Component {
  constructor(props) {
    super(props);

    const deviceWindowWidth = window.screen.width - 5;

    const slug = this.props.params.slug;
    const appId = this.props.params.id;
    const versionId = this.props.params.versionId;

    this.subscription = null;

    this.state = {
      slug,
      appId,
      versionId,
      deviceWindowWidth,
      currentUser: null,
      isLoading: true,
      users: null,
      appDefinition: { pages: {} },
      isAppLoaded: false,
      errorAppId: null,
      errorVersionId: null,
      errorDetails: null,
      pages: {},
      homepage: null,
      currentPageId: null,
    };
  }

  setStateForApp = (data, byAppSlug = false) => {
    const appDefData = buildAppDefinition(data);

    if (byAppSlug) {
      appDefData.globalSettings = data.globalSettings;
      appDefData.homePageId = data.homePageId;
      appDefData.showViewerNavigation = data.showViewerNavigation;
    }

    this.setState({
      app: data,
      isLoading: false,
      isAppLoaded: true,
      appDefinition: { ...appDefData },
      pages: appDefData.pages,
    });
  };

  setStateForContainer = async (data, appVersionId) => {
    const appDefData = buildAppDefinition(data);

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

    if (this.props.currentLayout === 'mobile') {
      const currentComponents = data.definition.pages[data.definition.homePageId].components;
      mobileLayoutHasWidgets =
        Object.keys(currentComponents).filter((componentId) => currentComponents[componentId]['layouts']['mobile'])
          .length > 0;
    }

    let queryState = {};
    let dataQueries = [];

    if (appVersionId) {
      const { data_queries } = await dataqueryService.getAll(appVersionId);
      dataQueries = data_queries;
    } else {
      dataQueries = data.data_queries;
    }
    const queryConfirmationList = [];

    if (dataQueries.length > 0) {
      dataQueries.forEach((query) => {
        if (query?.options && query?.options?.requestConfirmation && query?.options?.runOnPageLoad) {
          queryConfirmationList.push({ queryId: query.id, queryName: query.name });
        }

        if (query.pluginId || query?.plugin?.id) {
          queryState[query.name] = {
            ...query.plugin.manifestFile.data.source.exposedVariables,
            ...this.props.currentState.queries[query.name],
          };
        } else {
          const dataSourceTypeDetail = DataSourceTypes.find((source) => source.kind === query.kind);
          queryState[query.name] = {
            ...dataSourceTypeDetail.exposedVariables,
            ...this.props.currentState.queries[query.name],
          };
        }
      });
    }

    if (queryConfirmationList.length !== 0) {
      useEditorStore.getState().actions.updateQueryConfirmationList(queryConfirmationList);
    }
    const variables = await this.fetchOrgEnvironmentVariables(data.slug, data.is_public);
    const constants = await this.fetchOrgEnvironmentConstants(data.slug, data.is_public);

    const pages = data.pages;
    const homePageId = appVersionId ? data.editing_version.homePageId : data?.homePageId;
    const startingPageHandle = this.props?.params?.pageHandle;
    const currentPageId = pages.filter((page) => page.handle === startingPageHandle)[0]?.id ?? homePageId;
    const currentPage = pages.find((page) => page.id === currentPageId);

    useDataQueriesStore.getState().actions.setDataQueries(dataQueries);
    this.props.setCurrentState({
      queries: queryState,
      components: {},
      globals: {
        currentUser: userVars, // currentUser is updated in setupViewer function as well
        theme: { name: this.props.darkMode ? 'dark' : 'light' },
        urlparams: JSON.parse(JSON.stringify(queryString.parse(this.props.location.search))),
        mode: {
          value: this.state.slug ? 'view' : 'preview',
        },
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
    });
    useEditorStore.getState().actions.toggleCurrentLayout(mobileLayoutHasWidgets ? 'mobile' : 'desktop');
    this.props.updateState({ events: data.events ?? [] });
    this.setState(
      {
        currentUser,
        currentSidebarTab: 2,
        canvasWidth:
          this.props.currentLayout === 'desktop'
            ? '100%'
            : mobileLayoutHasWidgets
            ? `${this.state.deviceWindowWidth}px`
            : '1292px',
        selectedComponent: null,
        dataQueries: dataQueries,
        currentPageId: currentPage.id,
        homepage: appDefData?.pages?.[this.state.appDefinition?.homePageId]?.handle,
        events: data.events ?? [],
      },
      () => {
        const components = appDefData?.pages[currentPageId]?.components || {};

        computeComponentState(components).then(async () => {
          this.setState({ initialComputationOfStateDone: true, defaultComponentStateComputed: true });
          console.log('Default component state computed and set');
          this.runQueries(dataQueries);

          const currentPageEvents = this.state.events.filter(
            (event) => event.target === 'page' && event.sourceId === this.state.currentPageId
          );

          await this.handleEvent('onPageLoad', currentPageEvents);
        });
      }
    );
  };

  runQueries = (data_queries) => {
    data_queries.forEach((query) => {
      if (query.options.runOnPageLoad && isQueryRunnable(query)) {
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
        this.setStateForApp(data, true);
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
        this.setStateForContainer(data, versionId);
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
          /* router dom Navigate is not working now. so hard reloading */
          redirectToDashboard();
          return <Navigate replace to={'/'} />;
        } else if (statusCode === 401) {
          window.location = `${getSubpath() ?? ''}/login${
            !_.isEmpty(getWorkspaceId()) ? `/${getWorkspaceId()}` : ''
          }?redirectTo=${this.props.location.pathname}`;
        } else if (statusCode === 404) {
          toast.error(errorDetails?.error ?? 'App not found', {
            position: 'top-center',
          });
        } else {
          redirectToDashboard();
          return <Navigate replace to={'/'} />;
        }
      }
    } catch (err) {
      redirectToDashboard();
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
          this.props.setCurrentState({
            globals: {
              ...this.props.currentState.globals,
              currentUser: userVars, // currentUser is updated in setStateForContainer function as well
            },
          });
          this.setState({
            currentUser,

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

  /**
   *
   * ThandleMessage event listener in the login component fir iframe communication.
   * It now checks if the received message has a type of 'redirectTo' and extracts the redirectPath value from the payload.
   * If the value is present, it sets a cookie named 'redirectPath' with the received value and a one-day expiration.
   * This allows for redirection to a specific path after the login process is completed.
   */
  handleMessage = (event) => {
    const { data } = event;

    if (data?.type === 'redirectTo') {
      const redirectCookie = data?.payload['redirectPath'];
      setCookie('redirectPath', redirectCookie, 1);
    }
  };

  updateQueryConfirmationList = (queryConfirmationList) =>
    useEditorStore.getState().actions.updateQueryConfirmationList(queryConfirmationList);

  componentDidMount() {
    this.setupViewer();
    const isMobileDevice = this.state.deviceWindowWidth < 600;
    useEditorStore.getState().actions.toggleCurrentLayout(isMobileDevice ? 'mobile' : 'desktop');
    window.addEventListener('message', this.handleMessage);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.params.slug && this.props.params.slug !== prevProps.params.slug) {
      this.setState({ isLoading: true });
      this.loadApplicationBySlug(this.props.params.slug);
    }

    if (this.state.initialComputationOfStateDone) this.handlePageSwitchingBasedOnURLparam();
    if (this.state.homepage !== prevState.homepage && !this.state.isLoading) {
      <Navigate to={`${this.state.homepage}${this.props.params.pageHandle ? '' : window.location.search}`} replace />;
    }
  }

  handlePageSwitchingBasedOnURLparam() {
    const handleOnURL = this.props.params.pageHandle;
    const pageIdCorrespondingToHandleOnURL = handleOnURL
      ? this.findPageIdFromHandle(handleOnURL)
      : this.state.appDefinition.homePageId;
    const currentPageId = this.state.currentPageId;

    if (pageIdCorrespondingToHandleOnURL != this.state.currentPageId) {
      const targetPage = this.state.appDefinition.pages[pageIdCorrespondingToHandleOnURL];
      this.props.setCurrentState({
        globals: {
          ...this.props.currentState.globals,
          urlparams: JSON.parse(JSON.stringify(queryString.parse(this.props.location.search))),
        },
        page: {
          ...this.props.currentState.page,
          name: targetPage.name,
          handle: targetPage.handle,
          variables: this.state.pages?.[pageIdCorrespondingToHandleOnURL]?.variables ?? {},
          id: pageIdCorrespondingToHandleOnURL,
        },
      });
      this.setState(
        {
          pages: {
            ...this.state.pages,
            [currentPageId]: {
              ...this.state.pages?.[currentPageId],
              variables: {
                ...this.props.currentState?.page?.variables,
              },
            },
          },
          currentPageId: pageIdCorrespondingToHandleOnURL,
          handle: targetPage.handle,
          name: targetPage.name,
        },
        async () => {
          computeComponentState(this.state.appDefinition?.pages[this.state.currentPageId].components).then(async () => {
            // eslint-disable-next-line no-unsafe-optional-chaining
            const currentPageEvents = this.state.events.filter(
              (event) => event.target === 'page' && event.sourceId === this.state.currentPageId
            );

            await this.handleEvent('onPageLoad', currentPageEvents);
          });
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
      '#2f3c4c';
    const resolvedBackgroundColor = resolveReferences(bgColor, this.props.currentState);
    if (['#2f3c4c', '#F2F2F5', '#edeff5'].includes(resolvedBackgroundColor)) {
      return this.props.darkMode ? '#2f3c4c' : '#F2F2F5';
    }
    return resolvedBackgroundColor;
  };

  changeDarkMode = (newMode) => {
    this.props.setCurrentState({
      globals: {
        ...this.props.currentState.globals,
        theme: { name: newMode ? 'dark' : 'light' },
      },
    });
    this.setState({
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

  handleEvent = (eventName, events, options) => {
    const { appDefinition, currentPageId } = this.state;
    const viewerRef = {
      appDefinition: appDefinition,
      queryConfirmationList: this.props.queryConfirmationList,
      updateQueryConfirmationList: this.updateQueryConfirmationList,
      navigate: this.props.navigate,
      switchPage: this.switchPage,
      currentPageId: currentPageId,
    };
    onEvent(viewerRef, eventName, events, options, 'view');
  };

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
      deviceWindowWidth,
      defaultComponentStateComputed,
      dataQueries,
      errorAppId,
      errorVersionId,
      errorDetails,
      canvasWidth,
    } = this.state;

    const currentCanvasWidth = canvasWidth;

    const canvasMaxWidth = this.computeCanvasMaxWidth();

    const queryConfirmationList = this.props.queryConfirmationList;

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
        //checking if page is disabled
        if (
          pageArray.find((page) => page.handle === this.props.params.pageHandle)?.disabled &&
          this.state.currentPageId !== this.state.appDefinition?.homePageId && //Prevent page crashing when home page is disabled
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

        const viewerRef = {
          appDefinition: appDefinition,
          queryConfirmationList: this.props.queryConfirmationList,
          updateQueryConfirmationList: this.updateQueryConfirmationList,
          navigate: this.props.navigate,
          switchPage: this.switchPage,
          currentPageId: this.state.currentPageId,
        };

        return (
          <div className="viewer wrapper">
            <Confirm
              show={queryConfirmationList.length > 0}
              message={'Do you want to run this query?'}
              onConfirm={(queryConfirmationData) =>
                onQueryConfirmOrCancel(viewerRef, queryConfirmationData, true, 'view')
              }
              onCancel={() => onQueryConfirmOrCancel(viewerRef, queryConfirmationList[0], false, 'view')}
              queryConfirmationData={queryConfirmationList[0]}
              key={queryConfirmationList[0]?.queryName}
              darkMode={this.props.darkMode}
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
              />
              <div className="sub-section">
                <div className="main">
                  <div
                    className="canvas-container align-items-center"
                    style={{
                      background: this.computeCanvasBackgroundColor() || (!this.props.darkMode ? '#EBEBEF' : '#2E3035'),
                    }}
                  >
                    <div className="areas d-flex flex-rows">
                      {appDefinition?.showViewerNavigation && (
                        <ViewerNavigation
                          isMobileDevice={this.props.currentLayout === 'mobile'}
                          canvasBackgroundColor={this.computeCanvasBackgroundColor()}
                          pages={Object.entries(this.state.appDefinition?.pages) ?? []}
                          currentPageId={this.state?.currentPageId ?? this.state.appDefinition?.homePageId}
                          switchPage={this.switchPage}
                          darkMode={this.props.darkMode}
                        />
                      )}
                      <div className="flex-grow-1 d-flex justify-content-center">
                        <div
                          className="canvas-area"
                          style={{
                            width: currentCanvasWidth,
                            maxWidth: canvasMaxWidth,
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
                                  onEvent={this.handleEvent}
                                  mode="view"
                                  deviceWindowWidth={deviceWindowWidth}
                                  selectedComponent={this.state.selectedComponent}
                                  onComponentClick={(id, component) => {
                                    this.setState({
                                      selectedComponent: { id, component },
                                    });
                                    onComponentClick(this, id, component, 'view');
                                  }}
                                  onComponentOptionChanged={(component, optionName, value) => {
                                    return onComponentOptionChanged(component, optionName, value);
                                  }}
                                  onComponentOptionsChanged={onComponentOptionsChanged}
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
              </div>
            </DndProvider>
          </div>
        );
      }
    }
  }
}
const withStore = (Component) => (props) => {
  const currentState = useCurrentStateStore();
  const { currentLayout, queryConfirmationList } = useEditorStore(
    (state) => ({
      currentLayout: state?.currentLayout,
      queryConfirmationList: state?.queryConfirmationList,
    }),
    shallow
  );

  const { updateState } = useAppDataActions();

  return (
    <Component
      {...props}
      currentState={currentState}
      setCurrentState={currentState?.actions?.setCurrentState}
      currentLayout={currentLayout}
      updateState={updateState}
      queryConfirmationList={queryConfirmationList}
    />
  );
};

export const Viewer = withTranslation()(withStore(withRouter(ViewerComponent)));
