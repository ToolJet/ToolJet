import React from 'react';
import {
  appService,
  authenticationService,
  appVersionService,
  orgEnvironmentVariableService,
  orgEnvironmentConstantService,
} from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { defaults, cloneDeep, isEqual, isEmpty, debounce, omit } from 'lodash';
import { shallow } from 'zustand/shallow';
import { Container } from './Container';
import { EditorKeyHooks } from './EditorKeyHooks';
import { CustomDragLayer } from './CustomDragLayer';
import { LeftSidebar } from './LeftSidebar';
import { componentTypes } from './WidgetManager/components';
import { Inspector } from './Inspector/Inspector';
import QueryPanel from './QueryPanel/QueryPanel';
import {
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onEvent,
  onQueryConfirmOrCancel,
  runQuery,
  setStateAsync,
  computeComponentState,
  debuggerActions,
  cloneComponents,
  removeSelectedComponent,
  computeQueryState,
} from '@/_helpers/appUtils';
import { Confirm } from './Viewer/Confirm';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import CommentNotifications from './CommentNotifications';
import { WidgetManager } from './WidgetManager';
import config from 'config';
import queryString from 'query-string';
import { toast } from 'react-hot-toast';
const { produce, enablePatches, setAutoFreeze, applyPatches } = require('immer');
import { createWebsocketConnection } from '@/_helpers/websocketConnection';
import RealtimeCursors from '@/Editor/RealtimeCursors';
import { initEditorWalkThrough } from '@/_helpers/createWalkThrough';
import { EditorContextWrapper } from './Context/EditorContextWrapper';
import Selecto from 'react-selecto';
import { withTranslation } from 'react-i18next';
import { v4 as uuid } from 'uuid';
import Skeleton from 'react-loading-skeleton';
import EditorHeader from './Header';
import { getWorkspaceId } from '@/_helpers/utils';
import '@/_styles/editor/react-select-search.scss';
import { withRouter } from '@/_hoc/withRouter';
import { ReleasedVersionError } from './AppVersionsManager/ReleasedVersionError';
import { useDataSourcesStore } from '@/_stores/dataSourcesStore';
import { useDataQueriesStore } from '@/_stores/dataQueriesStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useEditorStore } from '@/_stores/editorStore';
import { useQueryPanelStore } from '@/_stores/queryPanelStore';
import { useAppDataStore } from '@/_stores/appDataStore';
import { useCurrentStateStore, useCurrentState } from '@/_stores/currentStateStore';
import { resetAllStores } from '@/_stores/utils';
import { setCookie } from '@/_helpers/cookie';

setAutoFreeze(false);
enablePatches();

class EditorComponent extends React.Component {
  constructor(props) {
    super(props);
    resetAllStores();
    const appId = this.props.params.id;

    useAppDataStore.getState().actions.setAppId(appId);
    useEditorStore.getState().actions.setIsEditorActive(true);
    const { socket } = createWebsocketConnection(appId);

    this.renameQueryNameId = React.createRef();

    this.socket = socket;

    const defaultPageId = uuid();

    this.subscription = null;

    this.defaultDefinition = {
      showViewerNavigation: true,
      homePageId: defaultPageId,
      pages: {
        [defaultPageId]: {
          components: {},
          handle: 'home',
          name: 'Home',
        },
      },
      globalSettings: {
        hideHeader: false,
        appInMaintenance: false,
        canvasMaxWidth: 1292,
        canvasMaxWidthType: 'px',
        canvasMaxHeight: 2400,
        canvasBackgroundColor: props.darkMode ? '#1B1B1F' : '#F9F9FB',
        backgroundFxQuery: '',
      },
    };

    this.dataSourceModalRef = React.createRef();
    this.canvasContainerRef = React.createRef();
    this.selectionRef = React.createRef();
    this.selectionDragRef = React.createRef();
    this.queryManagerPreferences = JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {};
    this.state = {
      currentUser: {},
      app: {},
      allComponentTypes: componentTypes,
      isLoading: true,
      users: null,
      appId,
      showLeftSidebar: true,
      zoomLevel: 1.0,
      deviceWindowWidth: 450,
      appDefinition: this.defaultDefinition,
      apps: [],
      queryConfirmationList: [],
      isSourceSelected: false,
      selectionInProgress: false,
      scrollOptions: {},
      currentPageId: defaultPageId,
      pages: {},
      selectedDataSource: null,
    };

    this.autoSave = debounce(this.saveEditingVersion, 3000);
    this.realtimeSave = debounce(this.appDefinitionChanged, 500);
  }

  setWindowTitle(name) {
    document.title = name ? `${name} - Tooljet` : `My App - Tooljet`;
  }

  onVersionDelete = () => {
    this.fetchApp(this.props.params.pageHandle);
  };
  getCurrentOrganizationDetails() {
    const currentSession = authenticationService.currentSessionValue;
    const currentUser = currentSession?.current_user;
    this.subscription = authenticationService.currentSession.subscribe((currentSession) => {
      if (currentUser && currentSession?.group_permissions) {
        const userVars = {
          email: currentUser.email,
          firstName: currentUser.first_name,
          lastName: currentUser.last_name,
          groups: currentSession.group_permissions?.map((group) => group.group),
        };
        this.setState({ currentUser });
        useCurrentStateStore.getState().actions.setCurrentState({
          globals: {
            ...this.props.currentState.globals,
            currentUser: userVars,
          },
        });
      }
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

  async componentDidMount() {
    window.addEventListener('message', this.handleMessage);
    await this.getCurrentOrganizationDetails();
    this.autoSave();
    this.fetchApps(0);
    this.fetchApp(this.props.params.pageHandle);
    this.fetchOrgEnvironmentConstants(); // for ce
    this.fetchOrgEnvironmentVariables();
    this.initComponentVersioning();
    this.initRealtimeSave();
    this.initEventListeners();
    this.setState({
      currentSidebarTab: 2,
      selectedComponents: [],
      scrollOptions: {
        container: this.canvasContainerRef.current,
        throttleTime: 30,
        threshold: 0,
      },
    });

    const globals = {
      ...this.props.currentState.globals,
      theme: { name: this.props.darkMode ? 'dark' : 'light' },
      urlparams: JSON.parse(JSON.stringify(queryString.parse(this.props.location.search))),
      /* Constant value.it will only change for viewer */
      mode: {
        value: 'edit',
      },
    };
    const page = {
      ...this.props.currentState.page,
      handle: this.props.pageHandle,
      variables: {},
    };
    useCurrentStateStore.getState().actions.setCurrentState({ globals, page });

    this.appDataStoreListner = useAppDataStore.subscribe(({ isSaving } = {}) => {
      if (isSaving !== this.state.isSaving) {
        this.setState({ isSaving });
      }
    });

    this.dataQueriesStoreListner = useDataQueriesStore.subscribe(({ dataQueries }) => {
      computeQueryState(dataQueries, this);
    }, shallow);
  }

  /**
   * When a new update is received over-the-websocket connection
   * the useEffect in Container.jsx is triggered, but already appDef had been updated
   * to avoid ymap observe going into a infinite loop a check is added where if the
   * current appDef is equal to the newAppDef then we do not trigger a realtimeSave
   */
  initRealtimeSave = () => {
    if (!config.ENABLE_MULTIPLAYER_EDITING) return null;

    this.props.ymap?.observe(() => {
      if (!isEqual(this.props.editingVersion?.id, this.props.ymap?.get('appDef').editingVersionId)) return;
      if (isEqual(this.state.appDefinition, this.props.ymap?.get('appDef').newDefinition)) return;

      this.realtimeSave(this.props.ymap?.get('appDef').newDefinition, { skipAutoSave: true, skipYmapUpdate: true });
    });
  };

  fetchOrgEnvironmentVariables = () => {
    orgEnvironmentVariableService.getVariables().then((data) => {
      const client_variables = {};
      const server_variables = {};
      data.variables.map((variable) => {
        if (variable.variable_type === 'server') {
          server_variables[variable.variable_name] = 'HiddenEnvironmentVariable';
        } else {
          client_variables[variable.variable_name] = variable.value;
        }
      });

      useCurrentStateStore.getState().actions.setCurrentState({
        server: server_variables,
        client: client_variables,
      });
    });
  };

  fetchOrgEnvironmentConstants = () => {
    //! for @ee: get the constants from  `getConstantsFromEnvironment ` -- '/organization-constants/:environmentId'
    orgEnvironmentConstantService.getAll().then(({ constants }) => {
      const orgConstants = {};
      constants.map((constant) => {
        const constantValue = constant.values.find((value) => value.environmentName === 'production')['value'];
        orgConstants[constant.name] = constantValue;
      });

      useCurrentStateStore.getState().actions.setCurrentState({
        constants: orgConstants,
      });
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (!isEqual(prevState.appDefinition, this.state.appDefinition)) {
      computeComponentState(this, this.state.appDefinition.pages[this.state.currentPageId]?.components);
    }

    if (!isEqual(prevState.editorMarginLeft, this.state.editorMarginLeft)) {
      this.canvasContainerRef.current.scrollLeft += this.state.editorMarginLeft;
    }
  }

  initEventListeners() {
    this.socket?.addEventListener('message', (event) => {
      const data = event.data.replace(/^"(.+(?="$))"$/, '$1');
      if (data === 'versionReleased') {
        this.fetchApp();
        // } else if (data === 'dataQueriesChanged') {                //Commented since this need additional BE changes to work.
        //   this.fetchDataQueries(this.state.editingVersion?.id);    //Also needs revamping to exclude notifying the client of their own changes.
      } else if (data === 'dataSourcesChanged') {
        this.fetchDataSources(this.props.editingVersion?.id);
      }
    });
  }

  componentWillUnmount() {
    document.title = 'Tooljet - Dashboard';
    this.socket && this.socket?.close();
    this.subscription && this.subscription.unsubscribe();
    if (config.ENABLE_MULTIPLAYER_EDITING) this.props?.provider?.disconnect();
    this.appDataStoreListner && this.appDataStoreListner();
    this.dataQueriesStoreListner && this.dataQueriesStoreListner();
    useEditorStore.getState().actions.setIsEditorActive(false);
  }

  // 1. When we receive an undoable action – we can always undo but cannot redo anymore.
  // 2. Whenever you perform an undo – you can always redo and keep doing undo as long as we have a patch for it.
  // 3. Whenever you redo – you can always undo and keep doing redo as long as we have a patch for it.
  initComponentVersioning = () => {
    this.currentVersion = {
      [this.state.currentPageId]: -1,
    };
    this.currentVersionChanges = {};
    this.noOfVersionsSupported = 100;
    this.canUndo = false;
    this.canRedo = false;
  };

  fetchDataSources = (id) => {
    useDataSourcesStore.getState().actions.fetchDataSources(id);
  };

  fetchGlobalDataSources = () => {
    const { current_organization_id: organizationId } = this.state.currentUser;
    useDataSourcesStore.getState().actions.fetchGlobalDataSources(organizationId);
  };

  fetchDataQueries = async (id, selectFirstQuery = false, runQueriesOnAppLoad = false) => {
    await useDataQueriesStore.getState().actions.fetchDataQueries(id, selectFirstQuery, runQueriesOnAppLoad, this);
  };

  toggleAppMaintenance = () => {
    const newState = !this.state.app.is_maintenance_on;

    // eslint-disable-next-line no-unused-vars
    appService.setMaintenance(this.state.app.id, newState).then((data) => {
      this.setState({
        app: {
          ...this.state.app,
          is_maintenance_on: newState,
        },
      });

      if (newState) {
        toast.success('Application is on maintenance.');
      } else {
        toast.success('Application maintenance is completed');
      }
    });
  };

  fetchApps = (page) => {
    appService.getAll(page).then((data) =>
      this.setState({
        apps: data.apps,
      })
    );
  };

  fetchApp = (startingPageHandle) => {
    const appId = this.props.params.id;

    const callBack = async (data) => {
      let dataDefinition = defaults(data.definition, this.defaultDefinition);

      const pages = Object.entries(dataDefinition.pages).map(([pageId, page]) => ({ id: pageId, ...page }));
      const startingPageId = pages.filter((page) => page.handle === startingPageHandle)[0]?.id;
      const homePageId = startingPageId ?? dataDefinition.homePageId;

      useCurrentStateStore.getState().actions.setCurrentState({
        page: {
          handle: dataDefinition.pages[homePageId]?.handle,
          name: dataDefinition.pages[homePageId]?.name,
          id: homePageId,
          variables: {},
        },
      });
      useAppVersionStore.getState().actions.updateEditingVersion(data.editing_version);
      useAppVersionStore.getState().actions.updateReleasedVersionId(data.current_version_id);
      this.setState(
        {
          app: data,
          isLoading: false,
          appDefinition: dataDefinition,
          slug: data.slug,
          currentPageId: homePageId,
        },

        async () => {
          computeComponentState(this, this.state.appDefinition.pages[homePageId]?.components ?? {}).then(async () => {
            this.setWindowTitle(data.name);
            useEditorStore.getState().actions.setShowComments(!!queryString.parse(this.props.location.search).threadId);
          });
        }
      );
      useCurrentStateStore.getState().actions.setCurrentState({
        page: {
          handle: dataDefinition.pages[homePageId]?.handle,
          name: dataDefinition.pages[homePageId]?.name,
          id: homePageId,
          variables: {},
        },
      });

      this.fetchDataSources(data.editing_version?.id);
      await this.fetchDataQueries(data.editing_version?.id, true, true);
      this.fetchGlobalDataSources();
      initEditorWalkThrough();
      for (const event of dataDefinition.pages[homePageId]?.events ?? []) {
        await this.handleEvent(event.eventId, event);
      }
    };

    this.setState(
      {
        isLoading: true,
      },
      () => {
        appService.getApp(appId).then(callBack);
      }
    );
  };

  setAppDefinitionFromVersion = (version, shouldWeEditVersion = true) => {
    if (version?.id !== this.props.editingVersion?.id) {
      this.appDefinitionChanged(defaults(version.definition, this.defaultDefinition), {
        skipAutoSave: true,
        skipYmapUpdate: true,
        versionChanged: true,
      });
      if (version?.id === this.state.app?.current_version_id) {
        (this.canUndo = false), (this.canRedo = false);
      }
      useAppDataStore.getState().actions.setIsSaving(false);
      useAppVersionStore.getState().actions.updateEditingVersion(version);

      shouldWeEditVersion && this.saveEditingVersion(true);
      this.fetchDataSources(this.props.editingVersion?.id);
      this.fetchDataQueries(this.props.editingVersion?.id, true);
      this.initComponentVersioning();
    }
  };

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
   */
  dataSourcesChanged = () => {
    if (this.socket instanceof WebSocket && this.socket?.readyState === WebSocket.OPEN) {
      this.socket?.send(
        JSON.stringify({
          event: 'events',
          data: { message: 'dataSourcesChanged', appId: this.state.appId },
        })
      );
    } else {
      this.fetchDataSources(this.props.editingVersion?.id);
    }
  };

  globalDataSourcesChanged = () => {
    this.fetchGlobalDataSources();
  };

  dataQueriesChanged = (options) => {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
     */
    if (this.socket instanceof WebSocket && this.socket?.readyState === WebSocket.OPEN) {
      this.socket?.send(
        JSON.stringify({
          event: 'events',
          data: { message: 'dataQueriesChanged', appId: this.state.appId },
        })
      );
    }
    options?.isReloadSelf && this.fetchDataQueries(this.props.editingVersion?.id, true);
  };

  switchSidebarTab = (tabIndex) => {
    this.setState({
      currentSidebarTab: tabIndex,
    });
  };

  filterComponents = (event) => {
    const searchText = event.currentTarget.value;
    let filteredComponents = this.state.allComponentTypes;

    if (searchText !== '') {
      filteredComponents = this.state.allComponentTypes.filter(
        (e) => e.name.toLowerCase() === searchText.toLowerCase()
      );
    }

    this.setState({ componentTypes: filteredComponents });
  };

  handleAddPatch = (patches, inversePatches) => {
    if (isEmpty(patches) && isEmpty(inversePatches)) return;
    if (isEqual(patches, inversePatches)) return;

    const currentPage = this.state.currentPageId;
    const currentVersion = this.currentVersion[currentPage] ?? -1;

    this.currentVersionChanges[currentPage] = this.currentVersionChanges[currentPage] ?? {};

    this.currentVersionChanges[currentPage][currentVersion] = {
      redo: patches,
      undo: inversePatches,
    };

    this.canUndo = this.currentVersionChanges[currentPage].hasOwnProperty(currentVersion);
    this.canRedo = this.currentVersionChanges[currentPage].hasOwnProperty(currentVersion + 1);

    this.currentVersion[currentPage] = currentVersion + 1;

    delete this.currentVersionChanges[currentPage][currentVersion + 1];
    delete this.currentVersionChanges[currentPage][currentVersion - this.noOfVersionsSupported];
  };

  handleUndo = () => {
    if (this.canUndo) {
      let currentVersion = this.currentVersion[this.state.currentPageId];

      const appDefinition = applyPatches(
        this.state.appDefinition,
        this.currentVersionChanges[this.state.currentPageId][currentVersion - 1].undo
      );

      this.canUndo = this.currentVersionChanges[this.state.currentPageId].hasOwnProperty(currentVersion - 1);
      this.canRedo = true;
      this.currentVersion[this.state.currentPageId] = currentVersion - 1;

      if (!appDefinition) return;
      useAppDataStore.getState().actions.setIsSaving(true);
      this.setState(
        {
          appDefinition,
        },
        () => {
          this.props.ymap?.set('appDef', {
            newDefinition: appDefinition,
            editingVersionId: this.props.editingVersion?.id,
          });

          this.autoSave();
        }
      );
    }
  };

  handleRedo = () => {
    if (this.canRedo) {
      let currentVersion = this.currentVersion[this.state.currentPageId];

      const appDefinition = applyPatches(
        this.state.appDefinition,
        this.currentVersionChanges[this.state.currentPageId][currentVersion].redo
      );

      this.canUndo = true;
      this.canRedo = this.currentVersionChanges[this.state.currentPageId].hasOwnProperty(currentVersion + 1);
      this.currentVersion[this.state.currentPageId] = currentVersion + 1;

      if (!appDefinition) return;
      useAppDataStore.getState().actions.setIsSaving(true);
      this.setState(
        {
          appDefinition,
        },
        () => {
          this.props.ymap?.set('appDef', {
            newDefinition: appDefinition,
            editingVersionId: this.props.editingVersion?.id,
          });

          this.autoSave();
        }
      );
    }
  };

  appDefinitionChanged = (newDefinition, opts = {}) => {
    let currentPageId = this.state.currentPageId;
    if (isEqual(this.state.appDefinition, newDefinition)) return;
    if (config.ENABLE_MULTIPLAYER_EDITING && !opts.skipYmapUpdate) {
      this.props.ymap?.set('appDef', {
        newDefinition,
        editingVersionId: this.props.editingVersion?.id,
      });
    }

    if (opts?.versionChanged) {
      currentPageId = newDefinition.homePageId;
      useAppDataStore.getState().actions.setIsSaving(true);
      this.setState(
        {
          currentPageId: currentPageId,
          appDefinition: newDefinition,
          appDefinitionLocalVersion: uuid(),
        },
        () => {
          if (!opts.skipAutoSave) this.autoSave();
          this.switchPage(currentPageId);
        }
      );
      return;
    }

    produce(
      this.state.appDefinition,
      (draft) => {
        draft.pages[currentPageId].components = newDefinition.pages[currentPageId]?.components ?? {};
      },
      this.handleAddPatch
    );
    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition: newDefinition,
        appDefinitionLocalVersion: uuid(),
      },
      () => {
        if (!opts.skipAutoSave) this.autoSave();
      }
    );
  };

  handleInspectorView = () => {
    this.switchSidebarTab(2);
  };

  handleSlugChange = (newSlug) => {
    this.setState({ slug: newSlug });
  };

  removeComponents = () => {
    if (!this.props.isVersionReleased && this.state?.selectedComponents?.length > 1) {
      let newDefinition = cloneDeep(this.state.appDefinition);
      const selectedComponents = this.state?.selectedComponents;

      removeSelectedComponent(this.state.currentPageId, newDefinition, selectedComponents);
      const platform = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';
      if (platform.toLowerCase().indexOf('mac') > -1) {
        toast('Selected components deleted! (⌘ + Z to undo)', {
          icon: '🗑️',
        });
      } else {
        toast('Selected components deleted! (ctrl + Z to undo)', {
          icon: '🗑️',
        });
      }
      this.appDefinitionChanged(newDefinition, {
        skipAutoSave: this.props.isVersionReleased,
      });
      this.handleInspectorView();
    } else if (this.props.isVersionReleased) {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
    }
  };

  removeComponent = (component) => {
    const currentPageId = this.state.currentPageId;
    if (!this.props.isVersionReleased) {
      let newDefinition = cloneDeep(this.state.appDefinition);
      // Delete child components when parent is deleted

      let childComponents = [];

      if (newDefinition.pages[currentPageId].components?.[component.id].component.component === 'Tabs') {
        childComponents = Object.keys(newDefinition.pages[currentPageId].components).filter((key) =>
          newDefinition.pages[currentPageId].components[key].parent?.startsWith(component.id)
        );
      } else {
        childComponents = Object.keys(newDefinition.pages[currentPageId].components).filter(
          (key) => newDefinition.pages[currentPageId].components[key].parent === component.id
        );
      }

      childComponents.forEach((componentId) => {
        delete newDefinition.pages[currentPageId].components[componentId];
      });

      delete newDefinition.pages[currentPageId].components[component.id];
      const platform = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';
      if (platform.toLowerCase().indexOf('mac') > -1) {
        toast('Component deleted! (⌘ + Z to undo)', {
          icon: '🗑️',
        });
      } else {
        toast('Component deleted! (ctrl + Z to undo)', {
          icon: '🗑️',
        });
      }
      this.appDefinitionChanged(newDefinition, {
        skipAutoSave: this.props.isVersionReleased,
      });
      this.handleInspectorView();
    } else {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
    }
  };

  componentDefinitionChanged = (componentDefinition) => {
    if (this.props.isVersionReleased) {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
      return;
    }
    let _self = this;
    const currentPageId = this.state.currentPageId;

    if (this.state.appDefinition?.pages[currentPageId].components[componentDefinition.id]) {
      const newDefinition = {
        appDefinition: produce(this.state.appDefinition, (draft) => {
          draft.pages[currentPageId].components[componentDefinition.id].component = componentDefinition.component;
        }),
      };

      produce(
        this.state.appDefinition,
        (draft) => {
          draft.pages[currentPageId].components[componentDefinition.id].component = componentDefinition.component;
        },
        this.handleAddPatch
      );
      setStateAsync(_self, newDefinition).then(() => {
        computeComponentState(_self, _self.state.appDefinition.pages[currentPageId].components);
        useAppDataStore.getState().actions.setIsSaving(true);
        this.setState({ appDefinitionLocalVersion: uuid() });
        this.autoSave();
        this.props.ymap?.set('appDef', {
          newDefinition: newDefinition.appDefinition,
          editingVersionId: this.props.editingVersion?.id,
        });
      });
    }
  };

  handleEditorEscapeKeyPress = () => {
    if (this.state?.selectedComponents?.length > 0) {
      this.setState({ selectedComponents: [] });
      this.handleInspectorView();
    }
  };

  moveComponents = (direction) => {
    let appDefinition = JSON.parse(JSON.stringify(this.state.appDefinition));
    let newComponents = appDefinition.pages[this.state.currentPageId].components;

    for (const selectedComponent of this.state.selectedComponents) {
      newComponents = produce(newComponents, (draft) => {
        let top = draft[selectedComponent.id].layouts[this.props.currentLayout].top;
        let left = draft[selectedComponent.id].layouts[this.props.currentLayout].left;

        const gridWidth = (1 * 100) / 43; // width of the canvas grid in percentage

        switch (direction) {
          case 'ArrowLeft':
            left = left - gridWidth;
            break;
          case 'ArrowRight':
            left = left + gridWidth;
            break;
          case 'ArrowDown':
            top = top + 10;
            break;
          case 'ArrowUp':
            top = top - 10;
            break;
        }

        draft[selectedComponent.id].layouts[this.props.currentLayout].top = top;
        draft[selectedComponent.id].layouts[this.props.currentLayout].left = left;
      });
    }
    appDefinition.pages[this.state.currentPageId].components = newComponents;
    this.appDefinitionChanged(appDefinition);
  };

  cutComponents = () => {
    if (this.props.isVersionReleased) {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();

      return;
    }
    cloneComponents(this, this.appDefinitionChanged, false, true);
  };

  copyComponents = () => cloneComponents(this, this.appDefinitionChanged, false);

  cloneComponents = () => {
    if (this.props.isVersionReleased) {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
      return;
    }
    cloneComponents(this, this.appDefinitionChanged, true);
  };

  decimalToHex = (alpha) => (alpha === 0 ? '00' : Math.round(255 * alpha).toString(16));

  globalSettingsChanged = (key, value) => {
    const appDefinition = { ...this.state.appDefinition };
    if (value?.[1]?.a == undefined) appDefinition.globalSettings[key] = value;
    else {
      const hexCode = `${value?.[0]}${this.decimalToHex(value?.[1]?.a)}`;
      appDefinition.globalSettings[key] = hexCode;
    }
    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition,
      },
      () => {
        this.props.ymap?.set('appDef', {
          newDefinition: appDefinition,
          editingVersionId: this.props.editingVersion?.id,
        });
        this.autoSave();
      }
    );
  };

  onNameChanged = (newName) => {
    this.setState({
      app: { ...this.state.app, name: newName },
    });
    this.setWindowTitle(newName);
  };

  setSelectedComponent = (id, component, multiSelect = false) => {
    if (this.state.selectedComponents.length === 0 || !multiSelect) {
      this.switchSidebarTab(1);
    } else {
      this.switchSidebarTab(2);
    }

    const isAlreadySelected = this.state.selectedComponents.find((component) => component.id === id);

    if (!isAlreadySelected) {
      this.setState((prevState) => {
        return {
          selectedComponents: [...(multiSelect ? prevState.selectedComponents : []), { id, component }],
        };
      });
    }
  };

  onVersionRelease = (versionId) => {
    useAppVersionStore.getState().actions.updateReleasedVersionId(versionId);
    this.setState(
      {
        app: {
          ...this.state.app,
          current_version_id: versionId,
        },
      },
      () => {
        this.socket.send(
          JSON.stringify({
            event: 'events',
            data: { message: 'versionReleased', appId: this.state.appId },
          })
        );
      }
    );
  };

  onZoomChanged = (zoom) => {
    this.setState({
      zoomLevel: zoom,
    });
  };

  getCanvasWidth = () => {
    const canvasBoundingRect = document.getElementsByClassName('canvas-area')[0].getBoundingClientRect();
    return canvasBoundingRect?.width;
  };

  computeCanvasBackgroundColor = () => {
    const { canvasBackgroundColor } = this.state.appDefinition?.globalSettings ?? '#F9F9FB';
    if (['#1B1B1F', '#F9F9FB'].includes(canvasBackgroundColor)) {
      return this.props.darkMode ? '#1B1B1F' : '#F9F9FB';
    }
    return canvasBackgroundColor;
  };

  computeCanvasContainerHeight = () => {
    // 45 = (height of header)
    // 85 = (the height of the query panel header when minimised) + (height of header)
    return `calc(${100}% - ${Math.max(useQueryPanelStore.getState().queryPanelHeight + 45, 85)}px)`;
  };

  handleQueryPaneDragging = (isQueryPaneDragging) => this.setState({ isQueryPaneDragging });
  handleQueryPaneExpanding = (isQueryPaneExpanded) => this.setState({ isQueryPaneExpanded });

  saveEditingVersion = (isUserSwitchedVersion = false) => {
    if (this.props.isVersionReleased && !isUserSwitchedVersion) {
      useAppDataStore.getState().actions.setIsSaving(false);
    } else if (!isEmpty(this.props?.editingVersion)) {
      appVersionService
        .save(
          this.state.appId,
          this.props.editingVersion?.id,
          { definition: this.state.appDefinition },
          isUserSwitchedVersion
        )
        .then(() => {
          const _editingVersion = {
            ...this.props.editingVersion,
            ...{ definition: this.state.appDefinition },
          };
          useAppVersionStore.getState().actions.updateEditingVersion(_editingVersion);
          this.setState(
            {
              saveError: false,
            },
            () => {
              useAppDataStore.getState().actions.setIsSaving(false);
            }
          );
        })
        .catch(() => {
          useAppDataStore.getState().actions.setIsSaving(false);
          this.setState({ saveError: true }, () => {
            toast.error('App could not save.');
          });
        });
    }
  };

  handleOnComponentOptionChanged = (component, optionName, value) => {
    return onComponentOptionChanged(this, component, optionName, value);
  };

  handleOnComponentOptionsChanged = (component, options) => {
    return onComponentOptionsChanged(this, component, options);
  };

  handleComponentClick = (id, component) => {
    this.setState({
      selectedComponent: { id, component },
    });
    this.switchSidebarTab(1);
  };

  handleComponentHover = (id) => {
    if (this.state.selectionInProgress) return;
    this.setState({
      hoveredComponent: id,
    });
  };

  sideBarDebugger = {
    error: (data) => {
      debuggerActions.error(this, data);
    },
    flush: () => {
      debuggerActions.flush(this);
    },
    generateErrorLogs: (errors) => debuggerActions.generateErrorLogs(errors),
  };

  changeDarkMode = (newMode) => {
    useCurrentStateStore.getState().actions.setCurrentState({
      globals: {
        ...this.props.currentState.globals,
        theme: { name: newMode ? 'dark' : 'light' },
      },
    });
    this.props.switchDarkMode(newMode);
  };

  handleEvent = (eventName, options) => onEvent(this, eventName, options, 'edit');

  runQuery = (queryId, queryName) => runQuery(this, queryId, queryName);

  onAreaSelectionStart = (e) => {
    const isMultiSelect = e.inputEvent.shiftKey || this.state.selectedComponents.length > 0;
    this.setState((prevState) => {
      return {
        selectionInProgress: true,
        selectedComponents: [...(isMultiSelect ? prevState.selectedComponents : [])],
      };
    });
  };

  onAreaSelection = (e) => {
    e.added.forEach((el) => {
      el.classList.add('resizer-select');
    });
    if (this.state.selectionInProgress) {
      e.removed.forEach((el) => {
        el.classList.remove('resizer-select');
      });
    }
  };

  onAreaSelectionEnd = (e) => {
    const currentPageId = this.state.currentPageId;
    this.setState({ selectionInProgress: false });
    e.selected.forEach((el, index) => {
      const id = el.getAttribute('widgetid');
      const component = this.state.appDefinition.pages[currentPageId].components[id].component;
      const isMultiSelect = e.inputEvent.shiftKey || (!e.isClick && index != 0);
      this.setSelectedComponent(id, component, isMultiSelect);
    });
  };

  onAreaSelectionDragStart = (e) => {
    if (e.inputEvent.target.getAttribute('id') !== 'real-canvas') {
      this.selectionDragRef.current = true;
    } else {
      this.selectionDragRef.current = false;
    }
  };

  onAreaSelectionDrag = (e) => {
    if (this.selectionDragRef.current) {
      e.stop();
      this.state.selectionInProgress && this.setState({ selectionInProgress: false });
    }
  };

  onAreaSelectionDragEnd = () => {
    this.selectionDragRef.current = false;
    this.state.selectionInProgress && this.setState({ selectionInProgress: false });
  };

  addNewPage = ({ name, handle }) => {
    // check for unique page handles
    const pageExists = Object.values(this.state.appDefinition.pages).some((page) => page.name === name);

    if (pageExists) {
      toast.error('Page name already exists');
      return;
    }

    const pageHandles = Object.values(this.state.appDefinition.pages).map((page) => page.handle);

    let newHandle = handle;
    // If handle already exists, finds a unique handle by incrementing a number until it is not found in the array of existing page handles.
    for (let handleIndex = 1; pageHandles.includes(newHandle); handleIndex++) {
      newHandle = `${handle}-${handleIndex}`;
    }

    const newAppDefinition = {
      ...this.state.appDefinition,
      pages: {
        ...this.state.appDefinition.pages,
        [uuid()]: {
          name,
          handle: newHandle,
          components: {},
        },
      },
    };

    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition: newAppDefinition,
        appDefinitionLocalVersion: uuid(),
      },
      () => {
        const newPageId = cloneDeep(Object.keys(newAppDefinition.pages)).pop();
        this.switchPage(newPageId);
        this.autoSave();
      }
    );
  };

  deletePageRequest = (pageId, isHomePage = false, pageName = '') => {
    this.setState({
      showPageDeletionConfirmation: {
        isOpen: true,
        pageId,
        isHomePage,
        pageName,
      },
    });
  };

  cancelDeletePageRequest = () => {
    this.setState({
      showPageDeletionConfirmation: {
        isOpen: false,
        pageId: null,
        isHomePage: false,
        pageName: null,
      },
    });
  };

  executeDeletepageRequest = () => {
    const pageId = this.state.showPageDeletionConfirmation.pageId;
    const isHomePage = this.state.showPageDeletionConfirmation.isHomePage;
    if (Object.keys(this.state.appDefinition.pages).length === 1) {
      toast.error('You cannot delete the only page in your app.');
      return;
    }

    this.setState({
      isDeletingPage: true,
    });

    const toBeDeletedPage = this.state.appDefinition.pages[pageId];

    const newAppDefinition = {
      ...this.state.appDefinition,
      pages: omit(this.state.appDefinition.pages, pageId),
    };

    const newCurrentPageId = isHomePage
      ? Object.keys(this.state.appDefinition.pages)[0]
      : this.state.appDefinition.homePageId;

    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        currentPageId: newCurrentPageId,
        appDefinition: newAppDefinition,
        appDefinitionLocalVersion: uuid(),
        isDeletingPage: false,
      },
      () => {
        toast.success(`${toBeDeletedPage.name} page deleted.`);

        this.switchPage(newCurrentPageId);
        this.autoSave();
      }
    );
  };

  updateHomePage = (pageId) => {
    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition: {
          ...this.state.appDefinition,
          homePageId: pageId,
        },
        appDefinitionLocalVersion: uuid(),
      },
      () => {
        this.autoSave();
      }
    );
  };

  clonePage = (pageId) => {
    const currentPage = this.state.appDefinition.pages[pageId];
    const newPageId = uuid();
    let newPageName = `${currentPage.name} (copy)`;
    let newPageHandle = `${currentPage.handle}-copy`;
    let i = 1;
    while (Object.values(this.state.appDefinition.pages).some((page) => page.handle === newPageHandle)) {
      newPageName = `${currentPage.name} (copy ${i})`;
      newPageHandle = `${currentPage.handle}-copy-${i}`;
      i++;
    }

    const newPageData = cloneDeep(currentPage);
    const oldToNewIdMapping = {};
    if (!isEmpty(currentPage?.components)) {
      newPageData.components = Object.keys(newPageData.components).reduce((acc, key) => {
        const newComponentId = uuid();
        acc[newComponentId] = newPageData.components[key];
        acc[newComponentId].id = newComponentId;
        oldToNewIdMapping[key] = newComponentId;
        return acc;
      }, {});

      Object.values(newPageData.components).map((comp) => {
        if (comp.parent) {
          let newParentId = oldToNewIdMapping[comp.parent];
          if (newParentId) {
            comp.parent = newParentId;
          } else {
            const oldParentId = Object.keys(oldToNewIdMapping).find(
              (parentId) =>
                comp.parent.startsWith(parentId) &&
                ['Tabs', 'Calendar'].includes(currentPage?.components[parentId]?.component?.component)
            );
            const childTabId = comp.parent.split('-').at(-1);
            comp.parent = `${oldToNewIdMapping[oldParentId]}-${childTabId}`;
          }
        }
        return comp;
      });
    }

    const newPage = {
      ...newPageData,
      name: newPageName,
      handle: newPageHandle,
    };

    const newAppDefinition = {
      ...this.state.appDefinition,
      pages: {
        ...this.state.appDefinition.pages,
        [newPageId]: newPage,
      },
    };

    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition: newAppDefinition,
        appDefinitionLocalVersion: uuid(),
      },
      () => {
        this.autoSave();
      }
    );
  };

  updatePageHandle = (pageId, newHandle) => {
    const pageExists = Object.values(this.state.appDefinition.pages).some((page) => page.handle === newHandle);

    if (pageExists) {
      toast.error('Page with same handle already exists');
      return;
    }

    if (newHandle.trim().length === 0) {
      toast.error('Page handle cannot be empty');
      return;
    }

    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition: {
          ...this.state.appDefinition,
          pages: {
            ...this.state.appDefinition.pages,
            [pageId]: {
              ...this.state.appDefinition.pages[pageId],
              handle: newHandle,
            },
          },
        },
        appDefinitionLocalVersion: uuid(),
      },
      () => {
        toast.success('Page handle updated successfully');
        this.switchPage(pageId);
        this.autoSave();
      }
    );
  };

  updateOnPageLoadEvents = (pageId, events) => {
    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition: {
          ...this.state.appDefinition,
          pages: {
            ...this.state.appDefinition.pages,
            [pageId]: {
              ...this.state.appDefinition.pages[pageId],
              events,
            },
          },
        },
        appDefinitionLocalVersion: uuid(),
      },
      () => {
        this.autoSave();
      }
    );
  };

  showHideViewerNavigation = () => {
    const newAppDefinition = {
      ...this.state.appDefinition,
      showViewerNavigation: !this.state.appDefinition.showViewerNavigation,
    };

    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition: newAppDefinition,
        appDefinitionLocalVersion: uuid(),
      },
      () => this.autoSave()
    );
  };

  renamePage = (pageId, newName) => {
    if (Object.entries(this.state.appDefinition.pages).some(([pId, { name }]) => newName === name && pId !== pageId)) {
      return toast.error('Page name already exists');
    }
    if (newName.trim().length === 0) {
      toast.error('Page name cannot be empty');
      return;
    }

    const newAppDefinition = {
      ...this.state.appDefinition,
      pages: {
        ...this.state.appDefinition.pages,
        [pageId]: {
          ...this.state.appDefinition.pages[pageId],
          name: newName,
        },
      },
    };

    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition: newAppDefinition,
        appDefinitionLocalVersion: uuid(),
      },
      () => {
        this.autoSave();
      }
    );
  };

  hidePage = (pageId) => {
    const newAppDefinition = {
      ...this.state.appDefinition,
      pages: {
        ...this.state.appDefinition.pages,
        [pageId]: {
          ...this.state.appDefinition.pages[pageId],
          hidden: true,
        },
      },
    };

    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition: newAppDefinition,
        appDefinitionLocalVersion: uuid(),
      },
      () => {
        this.autoSave();
      }
    );
  };

  unHidePage = (pageId) => {
    const newAppDefinition = {
      ...this.state.appDefinition,
      pages: {
        ...this.state.appDefinition.pages,
        [pageId]: {
          ...this.state.appDefinition.pages[pageId],
          hidden: false,
        },
      },
    };

    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition: newAppDefinition,
        appDefinitionLocalVersion: uuid(),
      },
      () => {
        this.autoSave();
      }
    );
  };

  switchPage = (pageId, queryParams = []) => {
    document.getElementById('real-canvas').scrollIntoView();
    if (
      this.state.currentPageId === pageId &&
      this.props.currentState.page.handle === this.state.appDefinition?.pages[pageId]?.handle
    ) {
      return;
    }
    const { name, handle, events } = this.state.appDefinition.pages[pageId];
    const currentPageId = this.state.currentPageId;

    if (!name || !handle) return;

    const queryParamsString = queryParams.map(([key, value]) => `${key}=${value}`).join('&');

    this.props.navigate(`/${getWorkspaceId()}/apps/${this.state.appId}/${handle}?${queryParamsString}`);

    const { globals: existingGlobals } = this.props.currentState;

    const page = {
      id: pageId,
      name,
      handle,
      variables: this.state.pages?.[pageId]?.variables ?? {},
    };

    const globals = {
      ...existingGlobals,
      urlparams: JSON.parse(JSON.stringify(queryString.parse(queryParamsString))),
    };
    useCurrentStateStore.getState().actions.setCurrentState({ globals, page });
    this.setState(
      {
        pages: {
          ...this.state.pages,
          [currentPageId]: {
            ...(this.state.pages?.[currentPageId] ?? {}),
            variables: {
              ...(this.props.currentState?.page?.variables ?? {}),
            },
          },
        },
        currentPageId: pageId,
      },
      () => {
        // Move this callback to zustand
        computeComponentState(this, this.state.appDefinition.pages[pageId]?.components ?? {}).then(async () => {
          for (const event of events ?? []) {
            await this.handleEvent(event.eventId, event);
          }
        });
      }
    );
  };

  updateOnSortingPages = (newSortedPages) => {
    const pagesObj = newSortedPages.reduce((acc, page) => {
      acc[page.id] = this.state.appDefinition.pages[page.id];
      return acc;
    }, {});

    const newAppDefinition = {
      ...this.state.appDefinition,
      pages: pagesObj,
    };

    useAppDataStore.getState().actions.setIsSaving(true);
    this.setState(
      {
        appDefinition: newAppDefinition,
        appDefinitionLocalVersion: uuid(),
      },
      () => {
        this.autoSave();
      }
    );
  };

  getPagesWithIds = () => {
    return Object.entries(this.state.appDefinition.pages).map(([id, page]) => ({ ...page, id }));
  };

  getCanvasMinWidth = () => {
    /**
     * minWidth will be min(default canvas min width, user set max width). Done to avoid conflict between two
     * default canvas min width = calc((total view width - width component editor side bar) - width of editor sidebar on left)
     **/
    const defaultCanvasMinWidth = `calc((100vw - 300px) - 48px)`;
    const canvasMaxWidthType = this.state.appDefinition.globalSettings.canvasMaxWidthType || 'px';
    const canvasMaxWidth = this.state.appDefinition.globalSettings.canvasMaxWidth;
    const currentLayout = this.state.currentLayout;

    const userSetMaxWidth = currentLayout === 'desktop' ? `${+canvasMaxWidth + canvasMaxWidthType}` : '450px';

    if (this.state.appDefinition.globalSettings.canvasMaxWidth && canvasMaxWidthType !== '%') {
      return `min(${defaultCanvasMinWidth}, ${userSetMaxWidth})`;
    } else {
      return defaultCanvasMinWidth;
    }
  };

  handleEditorMarginLeftChange = (value) => this.setState({ editorMarginLeft: value });

  render() {
    const {
      currentSidebarTab,
      selectedComponents = [],
      appDefinition,
      appId,
      slug,
      app,
      showLeftSidebar,
      isLoading,
      zoomLevel,
      deviceWindowWidth,
      apps,
      defaultComponentStateComputed,
      hoveredComponent,
      queryConfirmationList,
    } = this.state;
    const currentState = this.props?.currentState;
    const editingVersion = this.props?.editingVersion;
    const appVersionPreviewLink = editingVersion
      ? `/applications/${app.id}/versions/${editingVersion.id}/${currentState.page.handle}`
      : '';
    return (
      <div className="editor wrapper">
        <Confirm
          show={queryConfirmationList.length > 0}
          message={`Do you want to run this query - ${queryConfirmationList[0]?.queryName}?`}
          onConfirm={(queryConfirmationData) => onQueryConfirmOrCancel(this, queryConfirmationData, true)}
          onCancel={() => onQueryConfirmOrCancel(this, queryConfirmationList[0])}
          queryConfirmationData={queryConfirmationList[0]}
          darkMode={this.props.darkMode}
          key={queryConfirmationList[0]?.queryName}
        />
        <Confirm
          show={this.state.showPageDeletionConfirmation?.isOpen ?? false}
          title={'Delete Page'}
          message={`Do you really want to delete ${this.state.showPageDeletionConfirmation?.pageName || 'this'} page?`}
          confirmButtonLoading={this.state.isDeletingPage}
          onConfirm={() => this.executeDeletepageRequest()}
          onCancel={() => this.cancelDeletePageRequest()}
          darkMode={this.props.darkMode}
        />
        {this.props.isVersionReleased && <ReleasedVersionError />}
        <EditorContextWrapper>
          <EditorHeader
            darkMode={this.props.darkMode}
            globalSettingsChanged={this.globalSettingsChanged}
            appDefinition={appDefinition}
            toggleAppMaintenance={this.toggleAppMaintenance}
            editingVersion={editingVersion}
            app={app}
            appVersionPreviewLink={appVersionPreviewLink}
            slug={slug}
            appId={appId}
            canUndo={this.canUndo}
            canRedo={this.canRedo}
            handleUndo={this.handleUndo}
            handleRedo={this.handleRedo}
            isSaving={this.state.isSaving}
            saveError={this.state.saveError}
            onNameChanged={this.onNameChanged}
            setAppDefinitionFromVersion={this.setAppDefinitionFromVersion}
            handleSlugChange={this.handleSlugChange}
            onVersionRelease={this.onVersionRelease}
            saveEditingVersion={this.saveEditingVersion}
            onVersionDelete={this.onVersionDelete}
            currentUser={this.state.currentUser}
          />
          <DndProvider backend={HTML5Backend}>
            <div className="sub-section">
              <LeftSidebar
                globalSettingsChanged={this.globalSettingsChanged}
                toggleAppMaintenance={this.toggleAppMaintenance}
                app={app}
                errorLogs={currentState.errors}
                components={currentState.components}
                appId={appId}
                darkMode={this.props.darkMode}
                dataSourcesChanged={this.dataSourcesChanged}
                dataQueriesChanged={this.dataQueriesChanged}
                globalDataSourcesChanged={this.globalDataSourcesChanged}
                onZoomChanged={this.onZoomChanged}
                switchDarkMode={this.changeDarkMode}
                debuggerActions={this.sideBarDebugger}
                appDefinition={{
                  components: appDefinition.pages[this.state.currentPageId]?.components ?? {},
                  selectedComponent: selectedComponents ? selectedComponents[selectedComponents.length - 1] : {},
                  pages: this.state.appDefinition.pages,
                  homePageId: this.state.appDefinition.homePageId,
                  showViewerNavigation: this.state.appDefinition.showViewerNavigation,
                  globalSettings: this.state.appDefinition.globalSettings,
                }}
                setSelectedComponent={this.setSelectedComponent}
                removeComponent={this.removeComponent}
                runQuery={(queryId, queryName) => runQuery(this, queryId, queryName)}
                ref={this.dataSourceModalRef}
                isSaving={this.state.isSaving}
                currentPageId={this.state.currentPageId}
                addNewPage={this.addNewPage}
                switchPage={this.switchPage}
                deletePage={this.deletePageRequest}
                renamePage={this.renamePage}
                clonePage={this.clonePage}
                hidePage={this.hidePage}
                unHidePage={this.unHidePage}
                updateHomePage={this.updateHomePage}
                updatePageHandle={this.updatePageHandle}
                updateOnPageLoadEvents={this.updateOnPageLoadEvents}
                showHideViewerNavigationControls={this.showHideViewerNavigation}
                updateOnSortingPages={this.updateOnSortingPages}
                apps={apps}
                setEditorMarginLeft={this.handleEditorMarginLeftChange}
              />

              {!this.props.showComments && (
                <Selecto
                  dragContainer={'.canvas-container'}
                  selectableTargets={['.react-draggable']}
                  hitRate={0}
                  selectByClick={true}
                  toggleContinueSelect={['shift']}
                  ref={this.selectionRef}
                  scrollOptions={this.state.scrollOptions}
                  onSelectStart={this.onAreaSelectionStart}
                  onSelectEnd={this.onAreaSelectionEnd}
                  onSelect={this.onAreaSelection}
                  onDragStart={this.onAreaSelectionDragStart}
                  onDrag={this.onAreaSelectionDrag}
                  onDragEnd={this.onAreaSelectionDragEnd}
                  onScroll={(e) => {
                    this.canvasContainerRef.current.scrollBy(e.direction[0] * 10, e.direction[1] * 10);
                  }}
                />
              )}
              <div
                className={`main main-editor-canvas ${
                  this.state.isQueryPaneDragging || this.state.isDragging ? 'hide-scrollbar' : ''
                }`}
                id="main-editor-canvas"
              >
                <div
                  className={`canvas-container align-items-center ${!showLeftSidebar && 'hide-sidebar'}`}
                  style={{
                    transform: `scale(${zoomLevel})`,
                    borderLeft:
                      (this.state.editorMarginLeft ? this.state.editorMarginLeft - 1 : this.state.editorMarginLeft) +
                      `px solid ${this.computeCanvasBackgroundColor()}`,
                    height: this.computeCanvasContainerHeight(),
                    background: !this.props.darkMode ? '#EBEBEF' : '#2E3035',
                  }}
                  onMouseUp={(e) => {
                    if (['real-canvas', 'modal'].includes(e.target.className)) {
                      this.setState({ selectedComponents: [], currentSidebarTab: 2, hoveredComponent: false });
                    }
                  }}
                  ref={this.canvasContainerRef}
                  onScroll={() => {
                    this.selectionRef.current.checkScroll();
                  }}
                >
                  <div style={{ minWidth: `calc((100vw - 300px) - 48px)` }}>
                    <div
                      className="canvas-area"
                      style={{
                        width: this.props.currentLayout === 'desktop' ? '100%' : '450px',
                        maxWidth:
                          +this.state.appDefinition.globalSettings.canvasMaxWidth +
                          this.state.appDefinition.globalSettings.canvasMaxWidthType,
                        /**
                         * minWidth will be min(default canvas min width, user set max width). Done to avoid conflict between two
                         * default canvas min width = calc(((screen width - width component editor side bar) - width of editor sidebar on left) - width of left sidebar popover)
                         **/
                        // minWidth: this.state.editorMarginLeft ? this.getCanvasMinWidth() : 'auto',
                        backgroundColor: this.computeCanvasBackgroundColor(),
                        transform: 'translateZ(0)', //Hack to make modal position respect canvas container, else it positions w.r.t window.
                      }}
                    >
                      {config.ENABLE_MULTIPLAYER_EDITING && (
                        <RealtimeCursors
                          editingVersionId={editingVersion?.id}
                          editingPageId={this.state.currentPageId}
                        />
                      )}
                      {isLoading && (
                        <div className="apploader">
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
                            </div>
                          </div>
                        </div>
                      )}
                      {defaultComponentStateComputed && (
                        <>
                          <Container
                            canvasWidth={this.getCanvasWidth()}
                            socket={this.socket}
                            appDefinition={appDefinition}
                            appDefinitionChanged={this.appDefinitionChanged}
                            snapToGrid={true}
                            darkMode={this.props.darkMode}
                            mode={'edit'}
                            zoomLevel={zoomLevel}
                            deviceWindowWidth={deviceWindowWidth}
                            selectedComponents={selectedComponents}
                            appLoading={isLoading}
                            onEvent={this.handleEvent}
                            onComponentOptionChanged={this.handleOnComponentOptionChanged}
                            onComponentOptionsChanged={this.handleOnComponentOptionsChanged}
                            setSelectedComponent={this.setSelectedComponent}
                            handleUndo={this.handleUndo}
                            handleRedo={this.handleRedo}
                            removeComponent={this.removeComponent}
                            onComponentClick={this.handleComponentClick}
                            onComponentHover={this.handleComponentHover}
                            hoveredComponent={hoveredComponent}
                            sideBarDebugger={this.sideBarDebugger}
                            currentPageId={this.state.currentPageId}
                          />
                          <CustomDragLayer
                            snapToGrid={true}
                            canvasWidth={this.getCanvasWidth()}
                            onDragging={(isDragging) => this.setState({ isDragging })}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <QueryPanel
                  onQueryPaneDragging={this.handleQueryPaneDragging}
                  handleQueryPaneExpanding={this.handleQueryPaneExpanding}
                  dataQueriesChanged={this.dataQueriesChanged}
                  fetchDataQueries={this.fetchDataQueries}
                  darkMode={this.props.darkMode}
                  apps={apps}
                  allComponents={appDefinition.pages[this.state.currentPageId]?.components ?? {}}
                  appId={appId}
                  appDefinition={appDefinition}
                  editorRef={this}
                />
                <ReactTooltip id="tooltip-for-add-query" className="tooltip" />
              </div>
              <div className="editor-sidebar">
                <EditorKeyHooks
                  moveComponents={this.moveComponents}
                  cloneComponents={this.cloneComponents}
                  copyComponents={this.copyComponents}
                  cutComponents={this.cutComponents}
                  handleEditorEscapeKeyPress={this.handleEditorEscapeKeyPress}
                  removeMultipleComponents={this.removeComponents}
                />

                {currentSidebarTab === 1 && (
                  <div className="pages-container">
                    {selectedComponents.length === 1 &&
                    !isEmpty(appDefinition.pages[this.state.currentPageId]?.components) &&
                    !isEmpty(appDefinition.pages[this.state.currentPageId]?.components[selectedComponents[0].id]) ? (
                      <Inspector
                        moveComponents={this.moveComponents}
                        componentDefinitionChanged={this.componentDefinitionChanged}
                        removeComponent={this.removeComponent}
                        selectedComponentId={selectedComponents[0].id}
                        allComponents={appDefinition.pages[this.state.currentPageId]?.components}
                        key={selectedComponents[0].id}
                        switchSidebarTab={this.switchSidebarTab}
                        apps={apps}
                        darkMode={this.props.darkMode}
                        appDefinitionLocalVersion={this.state.appDefinitionLocalVersion}
                        pages={this.getPagesWithIds()}
                      ></Inspector>
                    ) : (
                      <center className="mt-5 p-2">
                        {this.props.t('editor.inspectComponent', 'Please select a component to inspect')}
                      </center>
                    )}
                  </div>
                )}

                {currentSidebarTab === 2 && (
                  <WidgetManager
                    componentTypes={componentTypes}
                    zoomLevel={zoomLevel}
                    darkMode={this.props.darkMode}
                  ></WidgetManager>
                )}
              </div>
              {config.COMMENT_FEATURE_ENABLE && this.props.showComments && (
                <CommentNotifications socket={this.socket} pageId={this.state.currentPageId} />
              )}
            </div>
          </DndProvider>
        </EditorContextWrapper>
      </div>
    );
  }
}

const withStore = (Component) => (props) => {
  const { showComments, currentLayout } = useEditorStore(
    (state) => ({
      showComments: state?.showComments,
      currentLayout: state?.currentLayout,
    }),
    shallow
  );
  const { isVersionReleased, editingVersion } = useAppVersionStore(
    (state) => ({ isVersionReleased: state.isVersionReleased, editingVersion: state.editingVersion }),
    shallow
  );

  const currentState = useCurrentState();

  return (
    <Component
      {...props}
      isVersionReleased={isVersionReleased}
      editingVersion={editingVersion}
      currentState={currentState}
      showComments={showComments}
      currentLayout={currentLayout}
    />
  );
};

export const Editor = withTranslation()(withRouter(withStore(EditorComponent)));
