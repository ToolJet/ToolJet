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
  licenseService,
} from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './Container';
import { Confirm } from './Viewer/Confirm';
import {
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onComponentClick,
  onQueryConfirmOrCancel,
  onEvent,
  runQuery,
  computeComponentState,
  buildAppDefinition,
  checkIfLicenseNotValid,
  updateSuggestionsFromCurrentState,
} from '@/_helpers/appUtils';
import queryString from 'query-string';
import ViewerLogoIcon from './Icons/viewer-logo.svg';
import { DataSourceTypes } from './DataSourceManager/SourceComponents';
import { resolveReferences, isQueryRunnable, isValidUUID, Constants } from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { Navigate } from 'react-router-dom';
import Spinner from '@/_ui/Spinner';
import { withRouter } from '@/_hoc/withRouter';
import { flushComponentsToRender, useEditorActions, useEditorStore } from '@/_stores/editorStore';
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
import { useAppVersionStore } from '@/_stores/appVersionStore';
import ViewerSidebarNavigation from './Viewer/ViewerSidebarNavigation';
import MobileHeader from './Viewer/MobileHeader';
import DesktopHeader from './Viewer/DesktopHeader';
import './Viewer/viewer.scss';
import { useResolveStore } from '@/_stores/resolverStore';
import { findComponentsWithReferences, handleLowPriorityWork } from '@/_helpers/editorHelpers';
import { findAllEntityReferences } from '@/_stores/utils';
import { dfs } from '@/_stores/handleReferenceTransactions';
import { useEnvironmentsAndVersionsStore } from '../_stores/environmentsAndVersionsStore';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import TooljetBanner from './Viewer/TooljetBanner';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { fetchAndSetWindowTitle, pageTitles } from '@white-label/whiteLabelling';
import { distinctUntilChanged } from 'rxjs';

class ViewerComponent extends React.Component {
  constructor(props) {
    super(props);

    const deviceWindowWidth = window.screen.width - 5;

    const slug = this.props.params.slug;
    this.subscription = null;
    this.props?.setEditorOrViewer;
    this.canvasRef = React.createRef();
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
      isSidebarPinned: localStorage.getItem('isPagesSidebarPinned') === 'false' ? false : true,
      isSidebarHovered: false,
      canvasAreaWidth: null,
    };
  }

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
    const appMode = data.globalSettings?.appMode || data?.editing_version?.globalSettings?.appMode;
    useAppVersionStore.getState().actions.updateEditingVersion(data.editing_version);
    useAppVersionStore.getState().actions.updateReleasedVersionId(data.currentVersionId);
    useEditorStore.getState().actions.setAppMode(appMode);
    this.setState({
      app: data,
      isLoading: false,
      isAppLoaded: true,
      appDefinition: { ...appDefData },
      pages: appDefData.pages,
    });

    useEditorStore.getState().actions.updateEditorState({
      appDefinition: appDefData,
    });
    useResolveStore.getState().actions.resetStore();
  };

  onViewerLoadUpdateEntityReferences = (pageId, loadType) => {
    const appDefData = useEditorStore.getState().appDefinition;
    const appJson = JSON.parse(JSON.stringify(appDefData));
    const currentPageId = pageId ?? this.state.currentPageId;
    const currentComponents = appJson.pages[currentPageId].components;
    let dataQueries = JSON.parse(JSON.stringify(useDataQueriesStore.getState().dataQueries));
    let allEvents = JSON.parse(JSON.stringify(useAppDataStore.getState().events));
    const globalSettings = appJson['globalSettings'];

    const entittyReferencesInGlobalSettings = findAllEntityReferences(globalSettings, [])?.filter(
      (entity) => entity && isValidUUID(entity)
    );

    const entityReferencesInComponentDefinitions = findAllEntityReferences(currentComponents, [])?.filter(
      (entity) => entity && isValidUUID(entity)
    );

    const entityReferencesInQueryOptions = findAllEntityReferences(dataQueries, [])?.filter(
      (entity) => entity && isValidUUID(entity)
    );

    const entityReferencesInEvents = findAllEntityReferences(allEvents, [])?.filter(
      (entity) => entity && isValidUUID(entity)
    );

    const manager = useResolveStore.getState().referenceMapper;

    if (Array.isArray(entittyReferencesInGlobalSettings) && entittyReferencesInGlobalSettings?.length > 0) {
      let newGlobalSettings = JSON.parse(JSON.stringify(globalSettings));
      entittyReferencesInGlobalSettings.forEach((entity) => {
        const entityrefExists = manager.has(entity);

        if (entityrefExists) {
          const value = manager.get(entity);
          newGlobalSettings = dfs(newGlobalSettings, entity, value);
        }
      });

      const newAppDefinition = {
        ...appJson,
        globalSettings: {
          ...appJson.globalSettings,
          newGlobalSettings,
        },
      };

      useEditorStore.getState().actions.setCanvasBackground({
        backgroundFxQuery: newGlobalSettings?.backgroundFxQuery,
        canvasBackgroundColor: newGlobalSettings?.canvasBackgroundColor,
      });

      useEditorStore.getState().actions.updateEditorState({
        isUpdatingEditorStateInProcess: false,
        appDefinition: newAppDefinition,
      });
    } else {
      // Setting the canvas background to the editor store
      useEditorStore.getState().actions.setCanvasBackground({
        backgroundFxQuery: globalSettings?.backgroundFxQuery,
        canvasBackgroundColor: globalSettings?.canvasBackgroundColor,
      });
    }

    if (Array.isArray(entityReferencesInComponentDefinitions) && entityReferencesInComponentDefinitions?.length > 0) {
      let newComponentDefinition = JSON.parse(JSON.stringify(currentComponents));

      entityReferencesInComponentDefinitions.forEach((entity) => {
        const entityrefExists = manager.has(entity);

        if (entityrefExists) {
          const value = manager.get(entity);

          newComponentDefinition = dfs(newComponentDefinition, entity, value);
        }
      });

      const appDefinition = useEditorStore.getState().appDefinition;
      const newAppDefinition = {
        ...appDefinition,
        pages: {
          ...appDefinition.pages,
          [currentPageId]: {
            ...appDefinition.pages[currentPageId],
            components: newComponentDefinition,
          },
        },
      };

      useEditorStore.getState().actions.updateEditorState({
        isUpdatingEditorStateInProcess: false,
        appDefinition: newAppDefinition,
      });

      this.setState({
        appDefinition: newAppDefinition,
      });
    }

    if (Array.isArray(entityReferencesInQueryOptions) && entityReferencesInQueryOptions?.length > 0) {
      let newQueryOptions = {};
      dataQueries?.forEach((query) => {
        newQueryOptions[query.id] = query.options;
        ``;
      });

      entityReferencesInQueryOptions.forEach((entity) => {
        const entityrefExists = manager.has(entity);

        if (entityrefExists) {
          const value = manager.get(entity);
          newQueryOptions = dfs(newQueryOptions, entity, value);
        }
      });

      dataQueries = dataQueries.map((query) => {
        const queryId = query.id;
        const dqOptions = newQueryOptions[queryId];

        return {
          ...query,
          options: dqOptions,
        };
      });

      useDataQueriesStore.getState().actions.setDataQueries(dataQueries, 'mappingUpdate');
    }

    if (Array.isArray(entityReferencesInEvents) && entityReferencesInEvents?.length > 0) {
      let newEvents = JSON.parse(JSON.stringify(allEvents));

      entityReferencesInEvents.forEach((entity) => {
        const entityrefExists = manager.has(entity);

        if (entityrefExists) {
          const value = manager.get(entity);
          newEvents = dfs(newEvents, entity, value);
        }
      });

      this.props.updateState({
        events: newEvents,
      });
    }

    computeComponentState(currentComponents).then(async () => {
      this.setState({ initialComputationOfStateDone: true, defaultComponentStateComputed: true });
      useCurrentStateStore.getState().actions.setEditorReady(true);

      if (loadType === 'appload') {
        updateSuggestionsFromCurrentState();
        this.runQueries(dataQueries);
      }

      const currentPageEvents = this.state.events.filter(
        (event) => event.target === 'page' && event.sourceId === this.state.currentPageId
      );

      await this.handleEvent('onPageLoad', currentPageEvents);
    });
  };

  setStateForContainer = async (data, appVersionId) => {
    const appDefData = this.state.appDefinition;

    const currentUser = this.state.currentUser;
    let userVars = {};
    const currentSessionValue = authenticationService.currentSessionValue;
    if (currentUser) {
      userVars = {
        email: currentUser.email,
        firstName: currentUser.first_name,
        lastName: currentUser.last_name,
        groups: currentSessionValue?.group_permissions
          ? ['All Users', ...currentSessionValue.group_permissions.map((group) => group.name)]
          : ['All Users'],
        role: currentSessionValue?.role?.name,
        ssoUserInfo: currentUser.sso_user_info,
        ...(currentUser?.metadata && !_.isEmpty(currentUser.metadata) ? { metadata: currentUser.metadata } : {}),
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
    const referencesManager = useResolveStore.getState().referenceMapper;
    const newQueries = dataQueries
      .map((dq) => {
        if (!referencesManager.get(dq.id)) {
          return {
            id: dq.id,
            name: dq.name,
          };
        }
      })
      .filter((c) => c !== undefined);

    useResolveStore.getState().actions.addEntitiesToMap(newQueries);

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
            id: query.id,
          };
        } else {
          const dataSourceTypeDetail = DataSourceTypes.find((source) => source.kind === query.kind);
          queryState[query.name] = {
            ...dataSourceTypeDetail.exposedVariables,
            ...this.props.currentState.queries[query.name],
            id: query.id,
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
    const environmentResult = await this.getEnvironmentDetails(this.state.environmentId);
    const { environment } = environmentResult;

    const pages = data.pages;
    const homePageId = appVersionId ? data.editing_version.homePageId : data?.homePageId;
    const startingPageHandle = this.props?.params?.pageHandle;
    const currentPageId = pages.filter((page) => page.handle === startingPageHandle)[0]?.id ?? homePageId;
    const currentPage = pages.find((page) => page.id === currentPageId);

    useDataQueriesStore.getState().actions.setDataQueries(dataQueries);
    useEditorStore.getState().actions.updateEditorState({
      currentPageId: currentPageId,
    });
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
    const currentPageComponents = appDefData?.pages[currentPage.id]?.components;

    if (currentPageComponents && !_.isEmpty(currentPageComponents)) {
      const referenceManager = useResolveStore.getState().referenceMapper;

      const newComponents = Object.keys(currentPageComponents).map((componentId) => {
        const component = currentPageComponents[componentId];

        if (!referenceManager.get(componentId)) {
          return {
            id: componentId,
            name: component.component.name,
          };
        }
      });

      useResolveStore.getState().actions.addEntitiesToMap(newComponents);
    }

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
        this.onViewerLoadUpdateEntityReferences(currentPage.id, 'appload');
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
      const { constants } = await orgEnvironmentConstantService.getConstantsFromApp(slug);
      variablesResult = constants;
    } else {
      const { constants } = await orgEnvironmentConstantService.getConstantsFromPublicApp(slug);
      variablesResult = constants;
    }
    const environmentResult = await this.getEnvironmentDetails(this.state.environmentId);
    const { environment } = environmentResult;
    if (variablesResult && Array.isArray(variablesResult)) {
      variablesResult.forEach((constant) => {
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

  loadApplicationBySlug = (slug, authentication_failed) => {
    appService
      .fetchAppBySlug(slug)
      .then((data) => {
        const isAppPublic = data?.is_public;
        const preview = !!queryString.parse(this.props?.location?.search)?.version;
        if (authentication_failed && !isAppPublic) {
          return redirectToErrorPage(ERROR_TYPES.URL_UNAVAILABLE, {});
        }
        useCurrentStateStore.getState().actions.initializeCurrentStateOnVersionSwitch();
        this.setStateForApp(data, true);
        this.setState({ appId: data.id });
        this.setStateForContainer(data);
        fetchAndSetWindowTitle({
          page: pageTitles.VIEWER,
          appName: data.name,
          preview,
        });
      })
      .catch((error) => {
        this.setState({
          isLoading: false,
        });
        if (error?.statusCode === 404) {
          /* User is not authenticated. but the app url is wrong or of archived workspace */
          redirectToErrorPage(ERROR_TYPES.INVALID);
        } else if (error?.statusCode === 403) {
          redirectToErrorPage(ERROR_TYPES.RESTRICTED);
        } else if (error?.statusCode === 400) {
          redirectToSwitchOrArchivedAppPage(error?.data);
        } else if (error?.statusCode !== 401) {
          redirectToErrorPage(ERROR_TYPES.UNKNOWN);
        }
      });
  };

  loadApplicationByVersion = async (appId, versionId) => {
    await appService
      .fetchAppByVersion(appId, versionId)
      .then((data) => {
        fetchAndSetWindowTitle({
          page: pageTitles.VIEWER,
          appName: data.name,
          preview: true,
        });
        this.setStateForApp(data);
        this.setStateForContainer(data, versionId);
        const preview = !!queryString.parse(this.props?.location?.search)?.version;
        fetchAndSetWindowTitle({
          page: pageTitles.VIEWER,
          appName: data.name,
          preview,
        });
      })
      .catch(() => {
        this.setState({
          isLoading: false,
        });
      });
  };

  setAppDefinitionFromVersion = (data) => {
    this.setState({
      isLoading: true,
    });
    this.loadApplicationByVersion(this.props.id, data.editing_version.id);
  };

  handleAppEnvironmentChanged = async (newData) => {
    const { selectedEnvironment, selectedVersionDef } = newData;
    const { id: environmentId } = selectedEnvironment;
    this.setState({ environmentId });
    if (selectedVersionDef) {
      this.setAppDefinitionFromVersion(selectedVersionDef);
    } else {
      this.loadApplicationByVersion(this.props.id, useAppVersionStore.getState().editingVersion.id);
    }
  };

  updateQueryConfirmationList = (queryConfirmationList) =>
    useEditorStore.getState().actions.updateQueryConfirmationList(queryConfirmationList);

  setupViewer() {
    this.subscription = authenticationService.currentSession
      .pipe(
        distinctUntilChanged((prev, curr) => {
          // Instance id is updated after page load, this custom comparison avoids instance_id in the comparison and prevent loadApplication from being called multiple times
          const clonedPrevState = { ...prev };
          const clonedCurrState = { ...curr };
          delete clonedPrevState.instance_id;
          delete clonedCurrState.instance_id;
          return JSON.stringify(clonedCurrState) === JSON.stringify(clonedPrevState);
        })
      )
      .subscribe(async (currentSession) => {
        const slug = this.props.params.slug;
        const appId = this.props.id;
        const versionId = this.props.versionId;
        const environmentId = this.props.environmentId;

        if (currentSession?.load_app && slug) {
          if (currentSession?.group_permissions || currentSession?.role) {
            this.setState({ environmentId });
            useAppDataStore.getState().actions.setAppId(appId);
            const currentUser = currentSession.current_user;
            const currentSessionValue = authenticationService.currentSessionValue;
            const userVars = {
              email: currentUser.email,
              firstName: currentUser.first_name,
              lastName: currentUser.last_name,
              groups: currentSessionValue?.group_permissions
                ? ['All Users', ...currentSessionValue.group_permissions.map((group) => group.name)]
                : ['All Users'],
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
              environmentId,
            });
            useEnvironmentsAndVersionsStore.getState().actions.setPreviewInitialEnvironmentId(environmentId);
            licenseService.getFeatureAccess().then((data) => {
              useEditorStore.getState().actions.updateFeatureAccess(data);
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
    window.addEventListener('resize', this.setCanvasAreaWidth);
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        this.setState({ canvasAreaWidth: width });
      }
    });

    if (this.canvasRef.current) {
      this.resizeObserver.observe(this.canvasRef.current);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.params.slug && this.props.params.slug !== prevProps.params.slug) {
      this.setState({ isLoading: true });
      this.loadApplicationBySlug(this.props.params.slug);
    }
    if (prevProps.currentLayout !== this.props.currentLayout) {
      if (this.props.id && useAppVersionStore.getState()?.editingVersion?.id) {
        this.loadApplicationByVersion(this.props.id, useAppVersionStore.getState().editingVersion.id);
      }
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
          computeComponentState(this.state.appDefinition?.pages[this.state.currentPageId].components);
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

  setCanvasAreaWidth = () => {
    this.setState({ canvasAreaWidth: this.getCanvasWidth() });
  };

  computeCanvasBackgroundColor = () => {
    const bgColor =
      (this.props.canvasBackground?.backgroundFxQuery || this.props.canvasBackground?.canvasBackgroundColor) ??
      '#2f3c4c';
    const resolvedBackgroundColor = resolveReferences(bgColor);
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
    useCurrentStateStore.getState().actions.setEditorReady(false);
    useResolveStore.getState().actions.resetStore();

    const handle = this.state?.appDefinition?.pages?.[id]?.handle;

    const queryParamsString = queryParams.map(([key, value]) => `${key}=${value}`).join('&');

    const navigationParams = {
      env: defaultParams.env,
      version: defaultParams.version,
    };

    //! For basic plan, env is undefined so we need to remove it from the url
    const navigationParamsString = navigationParams.env
      ? `env=${navigationParams.env}&version=${navigationParams.version}`
      : '' + navigationParams.version
      ? `version=${navigationParams.version}`
      : '';

    useEditorStore.getState().actions.updateEditorState({
      currentPageId: id,
    });

    const currentPageComponents = this.state.appDefinition?.pages[id]?.components;

    if (currentPageComponents && !_.isEmpty(currentPageComponents)) {
      const referenceManager = useResolveStore.getState().referenceMapper;
      const currentDataQueries = useDataQueriesStore.getState().dataQueries;
      const newComponents = Object.keys(currentPageComponents).map((componentId) => {
        const component = currentPageComponents[componentId];

        if (!referenceManager.get(componentId)) {
          return {
            id: componentId,
            name: component.component.name,
          };
        }
      });
      const newDataQueries = currentDataQueries.map((dq) => {
        if (!referenceManager.get(dq.id)) {
          return {
            id: dq.id,
            name: dq.name,
          };
        }
      });

      try {
        useResolveStore.getState().actions.addEntitiesToMap(newComponents);
        useResolveStore.getState().actions.addEntitiesToMap(newDataQueries);
      } catch (error) {
        console.error(error);
      }
    }

    const toNavigate = `/applications/${this.state.slug}/${handle}?${
      !_.isEmpty(defaultParams) ? navigationParamsString : ''
    }${queryParamsString ? `${!_.isEmpty(defaultParams) ? '&' : ''}${queryParamsString}` : ''}`;

    this.props.navigate(toNavigate, {
      state: {
        isSwitchingPage: true,
      },
    });

    useResolveStore.getState().actions.pageSwitched(true);
    this.onViewerLoadUpdateEntityReferences(id, 'page-switch');
  };

  toggleSidebarPinned = () => {
    this.setState({ isSidebarPinned: !this.state.isSidebarPinned });
    localStorage.setItem('isPagesSidebarPinned', JSON.stringify(!this.state.isSidebarPinned));
  };

  handleEvent = (eventName, events, options) => {
    const latestEvents = useAppDataStore.getState().events;

    const filteredEvents = latestEvents.filter((event) => {
      const foundEvent = events.find((e) => e.id === event.id);
      return foundEvent && foundEvent.name === eventName;
    });

    try {
      return onEvent(this.getViewerRef(), eventName, filteredEvents, options, 'view');
    } catch (error) {
      console.error(error);
    }
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
    this.resizeObserver.disconnect();
    window.removeEventListener('resize', this.setCanvasAreaWidth);
  }

  formCustomPageSelectorClass = () => {
    const handle = this.state.appDefinition?.pages[this.state.currentPageId]?.handle;
    return `_tooljet-page-${handle}`;
  };

  getEnvironmentDetails = (environmentId) => {
    const queryParams = { slug: this.props.params.slug };
    return appEnvironmentService.getEnvironment(environmentId, queryParams);
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
      isSidebarPinned,
      canvasAreaWidth,
    } = this.state;

    const currentCanvasWidth = canvasWidth;
    const queryConfirmationList = this.props?.queryConfirmationList ?? [];
    const canvasMaxWidth = this.computeCanvasMaxWidth();
    const pages =
      Object.entries(deepClone(appDefinition)?.pages)
        .map(([id, page]) => ({ id, ...page }))
        .sort((a, b) => a.index - b.index) || [];
    const isMobilePreviewMode = this.props.versionId && this.props.currentLayout === 'mobile';
    const isLicenseNotValid = checkIfLicenseNotValid();

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
    } else if (this.state.app?.is_maintenance_on) {
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
        <div
          className={cx('viewer wrapper', {
            'mobile-layout': this.props.currentLayout,
            'theme-dark dark-theme': this.props.darkMode,
          })}
        >
          <Confirm
            show={queryConfirmationList.length > 0}
            message={'Do you want to run this query'}
            onConfirm={(queryConfirmationData) =>
              onQueryConfirmOrCancel(this.getViewerRef(), queryConfirmationData, true, 'view')
            }
            onCancel={() => onQueryConfirmOrCancel(this.getViewerRef(), queryConfirmationList[0], false, 'view')}
            queryConfirmationData={queryConfirmationList[0]}
            key={queryConfirmationList[0]?.queryName}
            darkMode={this.props.darkMode}
          />
          <DndProvider backend={HTML5Backend}>
            {this.props.currentLayout !== 'mobile' && (
              <DesktopHeader
                showHeader={!appDefinition.globalSettings?.hideHeader && isAppLoaded}
                isAppLoaded={isAppLoaded}
                appName={this.state.app?.name ?? null}
                changeDarkMode={this.changeDarkMode}
                darkMode={this.props.darkMode}
                pages={pages}
                currentPageId={this.state?.currentPageId ?? this.state.appDefinition?.homePageId}
                switchPage={this.switchPage}
                setAppDefinitionFromVersion={this.setAppDefinitionFromVersion}
                showViewerNavigation={appDefinition?.showViewerNavigation}
                handleAppEnvironmentChanged={this.handleAppEnvironmentChanged}
              />
            )}
            {/* Render following mobile header only when its in preview mode and not in launched app */}
            {this.props.currentLayout === 'mobile' && !isMobilePreviewMode && (
              <MobileHeader
                showHeader={!appDefinition.globalSettings?.hideHeader && isAppLoaded}
                appName={this.state.app?.name ?? null}
                changeDarkMode={this.changeDarkMode}
                darkMode={this.props.darkMode}
                pages={pages}
                currentPageId={this.state?.currentPageId ?? this.state.appDefinition?.homePageId}
                switchPage={this.switchPage}
                setAppDefinitionFromVersion={this.setAppDefinitionFromVersion}
                showViewerNavigation={appDefinition?.showViewerNavigation}
                handleAppEnvironmentChanged={this.handleAppEnvironmentChanged}
              />
            )}
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
                      <ViewerSidebarNavigation
                        showHeader={!appDefinition.globalSettings?.hideHeader && isAppLoaded}
                        isMobileDevice={this.props.currentLayout === 'mobile'}
                        pages={pages}
                        currentPageId={this.state?.currentPageId ?? this.state.appDefinition?.homePageId}
                        switchPage={this.switchPage}
                        darkMode={this.props.darkMode}
                        isSidebarPinned={isSidebarPinned}
                        toggleSidebarPinned={this.toggleSidebarPinned}
                      />
                    )}
                    <div
                      className={cx('flex-grow-1 d-flex justify-content-center canvas-box', {
                        close: !isSidebarPinned,
                      })}
                      style={{
                        backgroundColor: isMobilePreviewMode ? '#ACB2B9' : 'unset',
                        marginLeft:
                          appDefinition?.showViewerNavigation && this.props.currentLayout !== 'mobile'
                            ? '210px'
                            : 'auto',
                      }}
                    >
                      <div
                        className={`canvas-area ${this.formCustomPageSelectorClass()}`}
                        ref={this.canvasRef}
                        style={{
                          width: isMobilePreviewMode ? '450px' : currentCanvasWidth,
                          maxWidth: isMobilePreviewMode ? '450px' : canvasMaxWidth,
                          backgroundColor: this.computeCanvasBackgroundColor(),
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {this.props.currentLayout === 'mobile' && isMobilePreviewMode && (
                          <MobileHeader
                            showHeader={!appDefinition.globalSettings?.hideHeader && isAppLoaded}
                            appName={this.state.app?.name ?? null}
                            changeDarkMode={this.changeDarkMode}
                            darkMode={this.props.darkMode}
                            pages={pages}
                            currentPageId={this.state?.currentPageId ?? this.state.appDefinition?.homePageId}
                            switchPage={this.switchPage}
                            setAppDefinitionFromVersion={this.setAppDefinitionFromVersion}
                            showViewerNavigation={appDefinition?.showViewerNavigation}
                            handleAppEnvironmentChanged={this.handleAppEnvironmentChanged}
                          />
                        )}

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
                                onEvent={this.handleEvent}
                                mode="view"
                                deviceWindowWidth={isMobilePreviewMode ? '450px' : deviceWindowWidth}
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
                                widthOfCanvas={canvasAreaWidth}
                                dataQueries={dataQueries}
                                currentPageId={this.state.currentPageId}
                                darkMode={this.props.darkMode}
                              />
                            )}
                          </>
                        )}
                      </div>
                      {isLicenseNotValid && isAppLoaded && <TooljetBanner isDarkMode={this.props.darkMode} />}
                      {/* Following div is a hack to prevent showing mobile drawer navigation coming from left*/}
                      {isMobilePreviewMode && <div className="hide-drawer-transition" style={{ right: 0 }}></div>}
                      {isMobilePreviewMode && <div className="hide-drawer-transition" style={{ left: 0 }}></div>}
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
const withStore = (Component) => (props) => {
  const currentState = useCurrentStateStore();
  const { currentLayout, queryConfirmationList, currentPageId, appDefinition, canvasBackground } = useEditorStore(
    (state) => ({
      currentLayout: state?.currentLayout,
      queryConfirmationList: state?.queryConfirmationList,
      currentPageId: state?.currentPageId,
      appDefinition: state?.appDefinition,
      canvasBackground: state.canvasBackground,
    }),
    shallow
  );
  const { selectedEnvironment } = useEnvironmentsAndVersionsStore(
    (state) => ({
      appVersionEnvironment: state?.appVersionEnvironment,
      selectedEnvironment: state?.selectedEnvironment,
    }),
    shallow
  );

  const { updateComponentsNeedsUpdateOnNextRender } = useEditorActions();
  const { updateState } = useAppDataActions();

  const lastUpdatedRef = useResolveStore((state) => state.lastUpdatedRefs, shallow);

  async function batchUpdateComponents(componentIds) {
    if (componentIds.length === 0) return;

    let updatedComponentIds = [];

    for (let i = 0; i < componentIds.length; i += 10) {
      const batch = componentIds.slice(i, i + 10);
      batch.forEach((id) => {
        updatedComponentIds.push(id);
      });

      updateComponentsNeedsUpdateOnNextRender(batch);
      // Delay to allow UI to process
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    flushComponentsToRender(updatedComponentIds);
  }

  React.useEffect(() => {
    const isPageSwitched = useResolveStore.getState().isPageSwitched;

    if (isPageSwitched) {
      const currentComponentsDef = appDefinition?.pages?.[currentPageId]?.components || {};
      const currentComponents = Object.keys(currentComponentsDef);
      handleLowPriorityWork(() => {
        updateSuggestionsFromCurrentState();
        useResolveStore.getState().actions.pageSwitched(false);
      });

      setTimeout(() => {
        if (currentComponents.length > 0) {
          batchUpdateComponents(currentComponents);
        }
      }, 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnvironment, currentPageId]);

  React.useEffect(() => {
    if (lastUpdatedRef.length > 0) {
      const currentComponents = appDefinition?.pages?.[currentPageId]?.components || {};
      const componentIdsWithReferences = findComponentsWithReferences(currentComponents, lastUpdatedRef);

      if (componentIdsWithReferences.length > 0) {
        setTimeout(() => {
          batchUpdateComponents(componentIdsWithReferences);
        }, 400);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdatedRef]);

  const { isAppDarkMode } = useAppDarkMode();
  return (
    <Component
      {...props}
      currentState={currentState}
      setCurrentState={currentState?.actions?.setCurrentState}
      currentLayout={currentLayout}
      updateState={updateState}
      queryConfirmationList={queryConfirmationList}
      currentAppVersionEnvironment={selectedEnvironment}
      darkMode={isAppDarkMode}
      canvasBackground={canvasBackground}
    />
  );
};

export const Viewer = withTranslation()(withStore(withRouter(ViewerComponent)));
