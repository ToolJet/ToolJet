import React from 'react';
import cx from 'classnames';
import {
  // appsService,
  authenticationService,
  orgEnvironmentVariableService,
  customStylesService,
  appEnvironmentService,
  orgEnvironmentConstantService,
  dataqueryService,
  appService,
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
import { resolveReferences, isQueryRunnable, fetchAndSetWindowTitle, pageTitles } from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { Navigate } from 'react-router-dom';
import Spinner from '@/_ui/Spinner';
import { withRouter } from '@/_hoc/withRouter';
import { useEditorStore } from '@/_stores/editorStore';
import { setCookie } from '@/_helpers/cookie';
import { useDataQueriesStore } from '@/_stores/dataQueriesStore';
import { useCurrentStateStore } from '@/_stores/currentStateStore';
import { shallow } from 'zustand/shallow';
import { useAppDataActions, useAppDataStore } from '@/_stores/appDataStore';
import {
  getPreviewQueryParams,
  getQueryParams,
  redirectToErrorPage,
  redirectToSwitchOrArchivedAppPage,
} from '@/_helpers/routes';
import { ERROR_TYPES } from '@/_helpers/constants';
import { defaultWhiteLabellingSettings } from '@/_stores/utils';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';

class ViewerComponent extends React.Component {
  constructor(props) {
    super(props);

    const deviceWindowWidth = window.screen.width - 5;

    const slug = this.props.params.slug;
    this.subscription = null;

    this.state = {
      slug,
      deviceWindowWidth,
      currentUser: null,
      isLoading: true,
      users: null,
      appDefinition: { pages: {} },
      queryConfirmationList: [],
      isAppLoaded: false,
      environmentId: null,
      pages: {},
      homepage: null,
      organizationId: null,
    };
  }

  setFavicon = (whiteLabelFavicon) => {
    // Set favicon
    let links = document.querySelectorAll("link[rel='icon']");
    if (links.length === 0) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      document.getElementsByTagName('head')[0].appendChild(link);
      links = [link];
    }
    links.forEach((link) => {
      link.href = whiteLabelFavicon || defaultWhiteLabellingSettings.WHITE_LABEL_FAVICON;
    });
  };

  getViewerRef() {
    return {
      appDefinition: this.state.appDefinition,
      queryConfirmationList: this.props.queryConfirmationList,
      updateQueryConfirmationList: this.updateQueryConfirmationList,
      navigate: this.props.navigate,
      switchPage: this.switchPage,
      currentPageId: this.state.currentPageId,
      environmentId: this.state.environmentId,
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
        ssoUserInfo: currentUser.sso_user_info,
      };
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
          const exposedVariables =
            query.plugin?.manifestFile?.data?.source?.exposedVariables ||
            query.plugin?.manifest_file?.data?.source?.exposed_variables;

          queryState[query.name] = {
            ...exposedVariables,
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
      this.updateQueryConfirmationList(queryConfirmationList);
    }

    await this.fetchAndInjectCustomStyles(data.slug, data.is_public);
    const variables = await this.fetchOrgEnvironmentVariables(data.slug, data.is_public);
    const constants = await this.fetchOrgEnvironmentConstants(data.slug, data.is_public);

    /* Get current environment details from server, for released apps the environment will be production only (Release preview) */
    const environmentResult = await this.getEnvironmentDetails(data.is_public);
    const { environment } = environmentResult;

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
        environment: {
          id: environment.id,
          name: environment.name,
        },
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
    useEditorStore.getState().actions.toggleCurrentLayout(this.props?.currentLayout == 'mobile' ? 'mobile' : 'desktop');
    this.props.updateState({ events: data.events ?? [] });
    this.setState(
      {
        currentUser,
        currentSidebarTab: 2,
        canvasWidth:
          this.props.currentLayout === 'desktop'
            ? '100%'
            : this.props?.currentLayout === 'mobile'
            ? `${this.state.deviceWindowWidth}px`
            : '1292px',
        selectedComponent: null,
        dataQueries: dataQueries,
        currentPageId: currentPage.id,
        pages: {},
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
        runQuery(this.getViewerRef(), query.id, query.name, undefined, 'view');
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

    const environmentResult = await this.getEnvironmentDetails();
    const { environment } = environmentResult;

    if (variablesResult && Array.isArray(variablesResult)) {
      variablesResult.map((constant) => {
        const condition = (value) =>
          this.state.environmentId ? value.id === this.state.environmentId : value.id === environment?.id;
        const constantValue = constant.values.find(condition)['value'];
        orgConstants[constant.name] = constantValue;
      });

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

  fetchAndInjectCustomStyles = async (slug, isPublic) => {
    try {
      let data;
      if (!isPublic) {
        data = await customStylesService.getForAppViewerEditor(false);
      } else {
        data = await customStylesService.getForPublicApp(slug);
      }
      const styleEl = document.createElement('style');
      styleEl.appendChild(document.createTextNode(data.css));
      document.head.appendChild(styleEl);
    } catch (error) {
      console.log('Error fetching and injecting custom styles:', error);
    }
  };

  updateWhiteLabels = async (organizationId) => {
    try {
      const { actions } = useWhiteLabellingStore.getState();
      await actions.fetchWhiteLabelDetails(organizationId);
      const { whiteLabelFavicon } = useWhiteLabellingStore.getState();
      this.setFavicon(whiteLabelFavicon);
    } catch (error) {
      console.error('Unable to update white label settings', error);
    }
  };

  loadApplicationBySlug = async (slug, authentication_failed) => {
    try {
      const data = await appService.fetchAppBySlug(slug);

      this.setState({ organizationId: data?.organizationId });
      await this.updateWhiteLabels(data?.organizationId);
      const isAppPublic = data?.is_public;
      const preview = !!queryString.parse(this.props?.location?.search)?.version;
      if (authentication_failed && !isAppPublic) {
        return redirectToErrorPage(ERROR_TYPES.URL_UNAVAILABLE, {});
      }

      this.setStateForApp(data, true);
      this.setState({ appId: data.id });
      this.setStateForContainer(data);
      fetchAndSetWindowTitle({
        page: pageTitles.VIEWER,
        appName: data.name,
        preview,
      });
    } catch (error) {
      this.setState({
        isLoading: false,
      });

      if (error?.statusCode === 404) {
        // User is not authenticated. but the app url is wrong
        redirectToErrorPage(ERROR_TYPES.INVALID);
      } else if (error?.statusCode === 403) {
        redirectToErrorPage(ERROR_TYPES.RESTRICTED);
      } else if (error?.statusCode === 400) {
        redirectToSwitchOrArchivedAppPage(error?.data);
      } else if (error?.statusCode !== 401) {
        redirectToErrorPage(ERROR_TYPES.UNKNOWN);
      }
    }
  };

  loadApplicationByVersion = async (appId, versionId) => {
    try {
      const data = await appService.fetchAppByVersion(appId, versionId);
      this.setStateForApp(data);
      this.setStateForContainer(data, versionId);
      await this.updateWhiteLabels(data?.organizationId);
    } catch (error) {
      this.setState({
        isLoading: false,
      });
    }
  };

  updateQueryConfirmationList = (queryConfirmationList) =>
    useEditorStore.getState().actions.updateQueryConfirmationList(queryConfirmationList);

  setupViewer() {
    this.subscription = authenticationService.currentSession.subscribe((currentSession) => {
      const slug = this.props.params.slug;
      const appId = this.props.id;
      const versionId = this.props.versionId;
      const environmentId = this.props.environmentId;

      if (currentSession?.load_app && slug) {
        if (currentSession?.group_permissions) {
          this.setState({ environmentId });
          useAppDataStore.getState().actions.setAppId(appId);

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
            versionId,
          });
          versionId ? this.loadApplicationByVersion(appId, versionId) : this.loadApplicationBySlug(slug);
        } else if (currentSession?.authentication_failed) {
          this.loadApplicationBySlug(slug, true);
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

    const shouldShowPage = handleOnURL ? this.validatePageHandle(handleOnURL) : true;

    if (!shouldShowPage) return this.switchPage(this.state.appDefinition.homePageId);

    const pageIdCorrespondingToHandleOnURL =
      handleOnURL && shouldShowPage ? this.findPageIdFromHandle(handleOnURL) : this.state.appDefinition.homePageId;
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
            const currentPageEvents = this.state.events.filter(
              (event) => event.target === 'page' && event.sourceId === this.state.currentPageId
            );

            await this.handleEvent('onPageLoad', currentPageEvents);
          });
        }
      );
    }
  }

  validatePageHandle(handle) {
    const allPages = this.state.appDefinition.pages;
    return Object.values(allPages).some((page) => page.handle === handle && !page.disabled);
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
    /* Keep default query params for preview */
    const defaultParams = getPreviewQueryParams();

    if (this.state.currentPageId === id) return;

    const { handle } = this.state.appDefinition.pages[id];

    const queryParamsString = queryParams.map(([key, value]) => `${key}=${value}`).join('&');

    const navigationParams = {
      env: defaultParams.env,
      version: defaultParams.version,
    };

    //! For basic plan, env is undefined so we need to remove it from the url
    const envParams = navigationParams.env ? `env=${navigationParams.env}` : '';
    const versionParams = navigationParams.version ? `version=${navigationParams.version}` : '';

    const navigationParamsString = `${envParams}${envParams && versionParams ? '&' : ''}${versionParams}`;

    this.props.navigate(
      `/applications/${this.state.slug}/${handle}?${!_.isEmpty(defaultParams) ? navigationParamsString : ''}${
        queryParamsString ? `${!_.isEmpty(defaultParams) ? '&' : ''}${queryParamsString}` : ''
      }`,
      {
        state: {
          isSwitchingPage: true,
        },
      }
    );
  };

  handleEvent = (eventName, events, options) => {
    return onEvent(this.getViewerRef(), eventName, events, options, 'view');
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

  formCustomPageSelectorClass = () => {
    const handle = this.state.appDefinition?.pages[this.state.currentPageId]?.handle;
    return `_tooljet-page-${handle}`;
  };

  getEnvironmentDetails = () => {
    const queryParams = { slug: this.props.params.slug };
    return appEnvironmentService.getEnvironment(this.state.environmentId, queryParams);
  };

  render() {
    const {
      appDefinition,
      isLoading,
      isAppLoaded,
      deviceWindowWidth,
      defaultComponentStateComputed,
      dataQueries,
      canvasWidth,
      organizationId,
    } = this.state;

    const currentCanvasWidth = canvasWidth;
    const queryConfirmationList = this.props?.queryConfirmationList ?? [];
    const canvasMaxWidth = this.computeCanvasMaxWidth();
    const pages =
      Object.entries(_.cloneDeep(appDefinition)?.pages)
        .map(([id, page]) => ({ id, ...page }))
        .sort((a, b) => a.index - b.index) || [];

    if (this.state.app?.isLoading) {
      return (
        <div className={cx('tooljet-logo-loader', { 'theme-dark': this.props.darkMode })}>
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
        const pageArray = Object.values(this.state.appDefinition?.pages || {});
        const { env, version, ...restQueryParams } = getQueryParams();
        const queryParamsString = Object.keys(restQueryParams)
          .map((key) => `${key}=${restQueryParams[key]}`)
          .join('&');
        const constructTheURL = (homeHandle) =>
          `/applications/${this.state.slug}/${homeHandle}${env && version ? `?env=${env}&version=${version}` : ''}`;
        //checking if page is disabled
        if (
          pageArray.find((page) => page.handle === this.props.params.pageHandle)?.disabled &&
          this.state.currentPageId !== this.state.appDefinition?.homePageId && //Prevent page crashing when home page is disabled
          this.state.appDefinition?.pages?.[this.state.appDefinition?.homePageId]
        ) {
          const homeHandle = this.state.appDefinition?.pages?.[this.state.appDefinition?.homePageId]?.handle;
          return <Navigate to={constructTheURL(homeHandle)} replace />;
        }

        //checking if page exists
        if (
          !pageArray.find((page) => page.handle === this.props.params.pageHandle) &&
          this.state.appDefinition?.pages?.[this.state.appDefinition?.homePageId]
        ) {
          const homeHandle = this.state.appDefinition?.pages?.[this.state.appDefinition?.homePageId]?.handle;

          return (
            <Navigate
              to={`${constructTheURL(homeHandle)}${
                this.props.params.pageHandle ? '' : `${env && version ? '&' : '?'}${queryParamsString}`
              }`}
              replace
            />
          );
        }

        return (
          <div className="viewer wrapper">
            <Confirm
              show={queryConfirmationList.length > 0}
              message={'Do you want to run this query?'}
              onConfirm={(queryConfirmationData) =>
                onQueryConfirmOrCancel(this.getViewerRef(), queryConfirmationData, true, 'view')
              }
              onCancel={() => onQueryConfirmOrCancel(this.getViewerRef(), queryConfirmationList[0], false, 'view')}
              queryConfirmationData={queryConfirmationList[0]}
              key={queryConfirmationList[0]?.queryName}
            />
            <DndProvider backend={HTML5Backend}>
              <ViewerNavigation.Header
                showHeader={!appDefinition.globalSettings?.hideHeader && isAppLoaded}
                appName={this.state.app?.name ?? null}
                changeDarkMode={this.changeDarkMode}
                darkMode={this.props.darkMode}
                pages={pages}
                currentPageId={this.state?.currentPageId ?? this.state.appDefinition?.homePageId}
                switchPage={this.switchPage}
                organizationId={organizationId}
              />
              <div className="sub-section">
                <div className="main">
                  <div
                    className="canvas-container page-container align-items-center"
                    style={{
                      background: this.computeCanvasBackgroundColor() || (!this.props.darkMode ? '#EBEBEF' : '#2E3035'),
                    }}
                  >
                    <div className={`areas d-flex flex-rows app-${this.props.id}`}>
                      {appDefinition?.showViewerNavigation && (
                        <ViewerNavigation
                          isMobileDevice={this.props.currentLayout === 'mobile'}
                          canvasBackgroundColor={this.computeCanvasBackgroundColor()}
                          pages={pages}
                          currentPageId={this.state?.currentPageId ?? this.state.appDefinition?.homePageId}
                          switchPage={this.switchPage}
                          darkMode={this.props.darkMode}
                        />
                      )}
                      <div className="flex-grow-1 d-flex justify-content-center">
                        <div
                          className={`canvas-area ${this.formCustomPageSelectorClass()}`}
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
