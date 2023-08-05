import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { appService, authenticationService, appVersionService, orgEnvironmentVariableService } from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import _, { defaults, cloneDeep, isEqual, isEmpty, debounce, omit, update, difference } from 'lodash';
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
  computeComponentState,
  debuggerActions,
  cloneComponents,
  removeSelectedComponent,
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
import { useDataQueries, useDataQueriesStore } from '@/_stores/dataQueriesStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useQueryPanelStore } from '@/_stores/queryPanelStore';
import { useCurrentStateStore, useCurrentState } from '@/_stores/currentStateStore';
import { resetAllStores } from '@/_stores/utils';
import { setCookie } from '@/_helpers/cookie';
import { shallow } from 'zustand/shallow';
import { useEditorActions, useEditorState, useEditorStore } from '@/_stores/editorStore';
import { useAppDataActions, useAppDataStore, useAppInfo } from '@/_stores/appDataStore';
import { useMounted } from '@/_hooks/use-mount';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';

setAutoFreeze(false);
enablePatches();

function setWindowTitle(name) {
  document.title = name ? `${name} - Tooljet` : `My App - Tooljet`;
}

const decimalToHex = (alpha) => (alpha === 0 ? '00' : Math.round(255 * alpha).toString(16));

const defaultDefinition = (darkMode) => {
  const defaultPageId = uuid();
  return {
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
      canvasBackgroundColor: darkMode ? '#2f3c4c' : '#edeff5',
      backgroundFxQuery: '',
    },
  };
};

const EditorComponent = (props) => {
  const { socket } = createWebsocketConnection(props?.params?.id);
  const mounted = useMounted();

  const { updateState } = useAppDataActions();
  const { updateEditorState, updateQueryConfirmationList } = useEditorActions();
  const {
    noOfVersionsSupported,
    appDefinition,
    selectedComponents,
    currentLayout,
    canUndo,
    canRedo,
    isSaving,
    saveError,
    scrollOptions,
    currentSidebarTab,
    isLoading,
    defaultComponentStateComputed,
    currentVersion,
    showLeftSidebar,
    queryConfirmationList,
  } = useEditorState();

  const dataQueries = useDataQueries();

  const { isMaintenanceOn, appId, app, currentUser, currentVersionId } = useAppInfo();

  const [currentVersionChanges, setCurrentVersionChanges] = useState({});
  const [currentPageId, setCurrentPageId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isQueryPaneDragging, setIsQueryPaneDragging] = useState(false);
  const [isQueryPaneExpanded, setIsQueryPaneExpanded] = useState(false);
  const [selectionInProgress, setSelectionInProgress] = useState(false);
  const [hoveredComponent, setHoveredComponent] = useState(null);
  const [editorMarginLeft, setEditorMarginLeft] = useState(0);

  const [isDragging, setIsDragging] = useState(false);

  // refs
  const canvasContainerRef = useRef(null);
  const dataSourceModalRef = useRef(null);
  const selectionDragRef = useRef(null);
  const selectionRef = useRef(null);

  const prevAppDefinition = useRef(appDefinition);

  useLayoutEffect(() => {
    resetAllStores();
  }, []);

  useEffect(() => {
    updateState({ isLoading: true });
    // 1. Get the current session and current user from the authentication service
    const currentSession = authenticationService.currentSessionValue;
    const currentUser = currentSession?.current_user;

    // 2. Subscribe to changes in the current session using RxJS observable pattern
    const subscription = authenticationService.currentSession.subscribe((currentSession) => {
      // 3. Check if the current user and group permissions are available
      if (currentUser && currentSession?.group_permissions) {
        // 4. Prepare user details in a format suitable for the application
        const userVars = {
          email: currentUser.email,
          firstName: currentUser.first_name,
          lastName: currentUser.last_name,
          groups: currentSession.group_permissions?.map((group) => group.group),
        };

        const appUserDetails = {
          ...currentUser,
          current_organization_id: currentSession.current_organization_id,
        };

        updateState({
          currentUser: appUserDetails,
        });

        useCurrentStateStore.getState().actions.setCurrentState({
          globals: {
            ...props.currentState.globals,
            currentUser: userVars,
          },
        });
      }
    });

    $componentDidMount();

    // 6. Unsubscribe from the observable when the component is unmounted
    return () => {
      document.title = 'Tooljet - Dashboard';
      socket && socket?.close();
      subscription.unsubscribe();
      if (config.ENABLE_MULTIPLAYER_EDITING) props?.provider?.disconnect();
      useEditorStore.getState().actions.setIsEditorActive(false);
      prevAppDefinition.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ref to store the previous appDefinition for comparison

  useEffect(() => {
    if (currentUser?.current_organization_id) {
      fetchGlobalDataSources();
    }
  }, [JSON.stringify(currentUser?.current_organization_id)]);

  // Handle appDefinition updates
  useEffect(() => {
    const didAppDefinitionChanged = !_.isEqual(appDefinition, prevAppDefinition.current);

    if (didAppDefinitionChanged) {
      prevAppDefinition.current = appDefinition;
    }

    if (mounted && didAppDefinitionChanged && currentPageId) {
      const components = appDefinition?.pages[currentPageId]?.components || {};

      computeComponentState(components);

      if (isSaving) {
        autoSave();
      }
    }
  }, [JSON.stringify({ appDefinition, currentPageId, dataQueries })]);

  const editorRef = {
    appDefinition: appDefinition,
    queryConfirmationList: queryConfirmationList,
    updateQueryConfirmationList: updateQueryConfirmationList,
    navigate: props.navigate,
  };

  const handleMessage = (event) => {
    const { data } = event;

    if (data?.type === 'redirectTo') {
      const redirectCookie = data?.payload['redirectPath'];
      setCookie('redirectPath', redirectCookie, 1);
    }
  };

  const fetchApps = async (page) => {
    const { apps } = await appService.getAll(page);

    updateState({ apps: apps.map((app) => ({ id: app.id, name: app.name, slug: app.slug })) });
  };

  const fetchOrgEnvironmentVariables = () => {
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

  // 1. When we receive an undoable action – we can always undo but cannot redo anymore.
  // 2. Whenever you perform an undo – you can always redo and keep doing undo as long as we have a patch for it.
  // 3. Whenever you redo – you can always undo and keep doing redo as long as we have a patch for it.
  const initComponentVersioning = () => {
    const currentVersion = {
      [currentPageId]: -1,
    };
    setCurrentVersionChanges({});
    updateEditorState({
      canUndo: false,
      canRedo: false,
      currentVersion,
    });
  };

  /**
   * When a new update is received over-the-websocket connection
   * the useEffect in Container.jsx is triggered, but already appDef had been updated
   * to avoid ymap observe going into a infinite loop a check is added where if the
   * current appDef is equal to the newAppDef then we do not trigger a realtimeSave
   */
  const initRealtimeSave = () => {
    if (!config.ENABLE_MULTIPLAYER_EDITING) return null;

    props.ymap?.observe(() => {
      if (!isEqual(props.editingVersion?.id, props.ymap?.get('appDef').editingVersionId)) return;
      if (isEqual(appDefinition, props.ymap?.get('appDef').newDefinition)) return;

      realtimeSave(props.ymap?.get('appDef').newDefinition, { skipAutoSave: true, skipYmapUpdate: true });
    });
  };

  const initEventListeners = () => {
    socket?.addEventListener('message', (event) => {
      const data = event.data.replace(/^"(.+(?="$))"$/, '$1');
      if (data === 'versionReleased') fetchApp();
      else if (data === 'dataQueriesChanged') {
        fetchDataQueries(props.editingVersion?.id);
      } else if (data === 'dataSourcesChanged') {
        fetchDataSources(props.editingVersion?.id);
      }
    });
  };

  const $componentDidMount = async () => {
    window.addEventListener('message', handleMessage);

    await fetchApps(0);
    await fetchApp(props.params.pageHandle);
    await fetchOrgEnvironmentVariables();
    initComponentVersioning();
    initRealtimeSave();
    initEventListeners();
    updateEditorState({
      currentSidebarTab: 2,
      selectedComponents: [],
      scrollOptions: {
        container: canvasContainerRef.current,
        throttleTime: 30,
        threshold: 0,
      },
    });

    const globals = {
      ...props.currentState.globals,
      theme: { name: props?.darkMode ? 'dark' : 'light' },
      urlparams: JSON.parse(JSON.stringify(queryString.parse(props.location.search))),
    };
    const page = {
      ...props?.currentState?.page,
      handle: props?.pageHandle,
      variables: {},
    };
    updateState({ appId: props?.params?.id });
    useCurrentStateStore.getState().actions.setCurrentState({ globals, page });
  };

  const fetchDataQueries = async (id, selectFirstQuery = false, runQueriesOnAppLoad = false) => {
    await useDataQueriesStore.getState().actions.fetchDataQueries(id, selectFirstQuery, runQueriesOnAppLoad, editorRef);
  };

  const fetchDataSources = (id) => {
    useDataSourcesStore.getState().actions.fetchDataSources(id);
  };

  const fetchGlobalDataSources = () => {
    const { current_organization_id: organizationId } = currentUser;
    useDataSourcesStore.getState().actions.fetchGlobalDataSources(organizationId);
  };

  const onVersionDelete = () => {
    fetchApp(props.params.pageHandle);
  };

  const toggleAppMaintenance = () => {
    const newState = !isMaintenanceOn;

    appService.setMaintenance(appId, newState).then(() => {
      updateState({
        isMaintenanceOn: newState,
      });

      if (newState) {
        toast.success('Application is on maintenance.');
      } else {
        toast.success('Application maintenance is completed');
      }
    });
  };

  const dataSourcesChanged = () => {
    if (socket instanceof WebSocket && socket?.readyState === WebSocket.OPEN) {
      socket?.send(
        JSON.stringify({
          event: 'events',
          data: { message: 'dataSourcesChanged', appId: appId },
        })
      );
    } else {
      fetchDataSources(props.editingVersion?.id);
    }
  };

  const globalDataSourcesChanged = () => {
    fetchGlobalDataSources();
  };

  const dataQueriesChanged = () => {
    if (socket instanceof WebSocket && socket?.readyState === WebSocket.OPEN) {
      socket?.send(
        JSON.stringify({
          event: 'events',
          data: { message: 'dataQueriesChanged', appId: appId },
        })
      );
    } else {
      fetchDataQueries(props.editingVersion?.id);
    }
  };

  const switchSidebarTab = (tabIndex) => {
    updateEditorState({
      currentSidebarTab: tabIndex,
    });
  };

  const handleInspectorView = () => {
    switchSidebarTab(2);
  };

  const onNameChanged = (newName) => {
    updateState({ appName: newName });
    setWindowTitle(newName);
  };

  const onZoomChanged = (zoom) => {
    setZoomLevel(zoom);
  };

  const [canvasWidth, setCanvasWidth] = useState(1092);

  const getCanvasWidth = () => {
    const canvasBoundingRect = document.getElementsByClassName('canvas-area')[0]?.getBoundingClientRect();

    const _canvasWidth = canvasBoundingRect?.width;

    if (_canvasWidth) {
      setCanvasWidth(_canvasWidth);
    }
  };

  const computeCanvasContainerHeight = () => {
    // 45 = (height of header)
    // 85 = (the height of the query panel header when minimised) + (height of header)
    return `calc(${100}% - ${Math.max(useQueryPanelStore.getState().queryPanelHeight + 45, 85)}px)`;
  };

  const handleQueryPaneDragging = (bool) => setIsQueryPaneDragging(bool);
  const handleQueryPaneExpanding = (bool) => setIsQueryPaneExpanded(bool);

  //! Needs attention
  const handleOnComponentOptionChanged = (component, optionName, value) => {
    return onComponentOptionChanged(component, optionName, value);
  };

  const handleOnComponentOptionsChanged = (component, options) => {
    return onComponentOptionsChanged(component, options);
  };

  const handleComponentClick = (id, component) => {
    updateEditorState({
      selectedComponent: { id, component },
    });
    switchSidebarTab(1);
  };

  const handleComponentHover = (id) => {
    if (selectionInProgress) return;
    setHoveredComponent(id);
  };

  const sideBarDebugger = {
    error: (data) => {
      debuggerActions.error(data);
    },
    flush: () => {
      debuggerActions.flush();
    },
    generateErrorLogs: (errors) => debuggerActions.generateErrorLogs(errors),
  };

  const changeDarkMode = (newMode) => {
    useCurrentStateStore.getState().actions.setCurrentState({
      globals: {
        ...props.currentState.globals,
        theme: { name: newMode ? 'dark' : 'light' },
      },
    });
    props.switchDarkMode(newMode);
  };

  //! Needs attention
  const handleEvent = (eventName, options) => onEvent(editorRef, eventName, options, 'edit');

  const handleRunQuery = (queryId, queryName) => runQuery(editorRef, queryId, queryName);

  const dataSourceModalHandler = () => {
    dataSourceModalRef.current.dataSourceModalToggleStateHandler();
  };

  const onAreaSelectionStart = (e) => {
    const isMultiSelect = e.inputEvent.shiftKey || selectedComponents.length > 0;
    setSelectionInProgress(true);
    const prevSelectedComponents = [...selectedComponents];
    updateEditorState({
      selectedComponents: [...(isMultiSelect ? prevSelectedComponents : [])],
    });
  };

  const onAreaSelection = (e) => {
    e.added.forEach((el) => {
      el.classList.add('resizer-select');
    });
    if (selectionInProgress) {
      e.removed.forEach((el) => {
        el.classList.remove('resizer-select');
      });
    }
  };

  const onAreaSelectionEnd = (e) => {
    setSelectionInProgress(false);
    e.selected.forEach((el, index) => {
      const id = el.getAttribute('widgetid');
      const component = appDefinition?.pages[currentPageId].components[id].component;
      const isMultiSelect = e.inputEvent.shiftKey || (!e.isClick && index != 0);
      setSelectedComponent(id, component, isMultiSelect);
    });
  };

  const setSelectedComponent = (id, component, multiSelect = false) => {
    if (selectedComponents.length === 0 || !multiSelect) {
      switchSidebarTab(1);
    } else {
      switchSidebarTab(2);
    }

    const isAlreadySelected = selectedComponents.find((component) => component.id === id);

    if (!isAlreadySelected) {
      const prevSelectedComponents = [...selectedComponents];
      updateEditorState({
        selectedComponents: [...(multiSelect ? prevSelectedComponents : []), { id, component }],
      });
    }
  };

  const onVersionRelease = (versionId) => {
    useAppVersionStore.getState().actions.updateReleasedVersionId(versionId);

    updateState({
      currentVersionId: versionId,
    });

    socket.send(
      JSON.stringify({
        event: 'events',
        data: { message: 'versionReleased', appId: appId },
      })
    );
  };

  const computeCanvasBackgroundColor = () => {
    //!Global settings needs to be out
    const { canvasBackgroundColor } = appDefinition?.globalSettings ?? '#edeff5';
    if (['#2f3c4c', '#edeff5'].includes(canvasBackgroundColor)) {
      return props.darkMode ? '#2f3c4c' : '#edeff5';
    }
    return canvasBackgroundColor;
  };

  const onAreaSelectionDragStart = (e) => {
    if (e.inputEvent.target.getAttribute('id') !== 'real-canvas') {
      selectionDragRef.current = true;
    } else {
      selectionDragRef.current = false;
    }
  };

  const onAreaSelectionDrag = (e) => {
    if (selectionDragRef.current) {
      e.stop();
      selectionInProgress && setSelectionInProgress(false);
    }
  };

  const onAreaSelectionDragEnd = () => {
    selectionDragRef.current = false;
    selectionInProgress && setSelectionInProgress(false);
  };

  const getPagesWithIds = () => {
    //! Needs attention
    return Object.entries(appDefinition?.pages).map(([id, page]) => ({ ...page, id }));
  };

  const handleEditorMarginLeftChange = (value) => setEditorMarginLeft(value);

  const globalSettingsChanged = (key, value) => {
    if (value?.[1]?.a == undefined) appDefinition.globalSettings[key] = value;
    else {
      const hexCode = `${value?.[0]}${decimalToHex(value?.[1]?.a)}`;
      appDefinition.globalSettings[key] = hexCode;
    }

    updateEditorState({
      isSaving: true,
      appDefinition,
    });

    props.ymap?.set('appDef', {
      newDefinition: appDefinition,
      editingVersionId: props.editingVersion?.id,
    });
    // autoSave();
  };

  //!--------
  const fetchApp = async (startingPageHandle) => {
    const _appId = props?.params?.id;

    const callBack = async (data) => {
      useAppVersionStore.getState().actions.updateEditingVersion(data.editing_version);
      useAppVersionStore.getState().actions.updateReleasedVersionId(data.current_version_id);
      await fetchDataSources(data.editing_version?.id);
      await fetchDataQueries(data.editing_version?.id, true, true);

      let dataDefinition = data.definition ?? defaults(data.definition, defaultDefinition(props.darkMode));

      const pages = Object.entries(dataDefinition.pages).map(([pageId, page]) => ({ id: pageId, ...page }));
      const startingPageId = pages.filter((page) => page.handle === startingPageHandle)[0]?.id;
      const homePageId = !startingPageHandle || startingPageId === 'null' ? dataDefinition.homePageId : startingPageId;

      setCurrentPageId(homePageId);

      updateState({
        app: data,
        slug: data.slug,
        isMaintenanceOn: data?.is_maintenance_on,
        organizationId: data?.organization_id,
        isPublic: data?.is_public,
        appName: data?.name,
        userId: data?.user_id,
        appId: data?.id,
      });

      useCurrentStateStore.getState().actions.setCurrentState({
        page: {
          handle: dataDefinition.pages[homePageId]?.handle,
          name: dataDefinition.pages[homePageId]?.name,
          id: homePageId,
          variables: {},
        },
      });

      updateEditorState({
        isLoading: false,
        appDefinition: dataDefinition,
      });

      for (const event of dataDefinition.pages[homePageId]?.events ?? []) {
        await handleEvent(event.eventId, event);
      }
      getCanvasWidth();
    };

    updateState({
      isLoading: true,
    });

    await appService
      .getApp(_appId)
      .then(callBack)
      .finally(() => initEditorWalkThrough());
  };

  // !--------
  const setAppDefinitionFromVersion = (version, shouldWeEditVersion = true) => {
    console.log('---arpit [setAppFromVersion]--', version);
    if (version?.id !== props.editingVersion?.id) {
      appDefinitionChanged(defaults(version.definition, defaultDefinition(props.darkMode)), {
        skipAutoSave: true,
        skipYmapUpdate: true,
        versionChanged: true,
      });
      if (version?.id === currentVersionId) {
        updateEditorState({
          canUndo: false,
          canRedo: false,
        });
      }
      useAppVersionStore.getState().actions.updateEditingVersion(version);

      updateEditorState({
        isSaving: false,
      });

      shouldWeEditVersion && saveEditingVersion(true);
      fetchDataSources(props.editingVersion?.id);
      fetchDataQueries(props.editingVersion?.id, true);
      initComponentVersioning();
    }
  };

  const appDefinitionChanged = (newDefinition, opts = {}) => {
    if (config.ENABLE_MULTIPLAYER_EDITING && !opts.skipYmapUpdate) {
      props.ymap?.set('appDef', {
        newDefinition,
        editingVersionId: props.editingVersion?.id,
      });
    }

    if (opts?.versionChanged) {
      setCurrentPageId(newDefinition.homePageId);

      return new Promise((resolve) => {
        updateEditorState({
          isSaving: true,
        });

        resolve();
      });
    }

    // Create a new copy of appDefinition with lodash's cloneDeep
    const updatedAppDefinition = _.cloneDeep(appDefinition);

    if (_.isEmpty(updatedAppDefinition)) return;

    const currentPageComponents = newDefinition.pages[currentPageId]?.components;

    updatedAppDefinition.pages[currentPageId].components = currentPageComponents;

    const diffPatches = diff(appDefinition, updatedAppDefinition);

    console.log('--arpit | appDefinitionChanged func() | diffPatches', {
      diffPatches,
    });

    if (!_.isEmpty(diffPatches)) {
      updateEditorState({
        isSaving: true,
        appDefinition: updatedAppDefinition,
      });
      computeComponentState(updatedAppDefinition.pages[currentPageId]?.components);
    }

    // if (!opts.skipAutoSave) autoSave();
  };

  const saveEditingVersion = (isUserSwitchedVersion = false) => {
    console.log('---arpit [saving - editionversion]--');
    if (props.isVersionReleased && !isUserSwitchedVersion) {
      updateEditorState({
        isSaving: false,
      });
    } else if (!isEmpty(props?.editingVersion)) {
      appVersionService
        .save(appId, props.editingVersion?.id, { definition: appDefinition }, isUserSwitchedVersion)
        .then(() => {
          const _editingVersion = {
            ...props.editingVersion,
            ...{ definition: appDefinition },
          };
          useAppVersionStore.getState().actions.updateEditingVersion(_editingVersion);
          updateEditorState({
            saveError: false,
            isSaving: false,
          });
        })
        .catch(() => {
          updateEditorState({
            saveError: true,
            isSaving: false,
          });
          toast.error('App could not save.');
        });
    }

    updateEditorState({
      saveError: false,
      isSaving: false,
    });
  };

  const realtimeSave = debounce(appDefinitionChanged, 500);
  const autoSave = debounce(saveEditingVersion, 3000);

  const handleAddPatch = (patches, inversePatches) => {
    if (isEmpty(patches) && isEmpty(inversePatches)) return;
    if (isEqual(patches, inversePatches)) return;

    const currentPage = currentPageId;
    const _currentVersion = currentVersion[currentPage] ?? -1;

    let _currentVersionChanges = {};

    _currentVersionChanges[currentPage] = currentVersionChanges[currentPage] ?? {};

    _currentVersionChanges[currentPage][_currentVersion] = {
      redo: patches,
      undo: inversePatches,
    };

    setCurrentVersionChanges(_currentVersionChanges);

    const _canUndo = _currentVersionChanges[currentPage].hasOwnProperty(_currentVersion);
    const _canRedo = _currentVersionChanges[currentPage].hasOwnProperty(_currentVersion + 1);

    _currentVersion[currentPage] = currentVersion + 1;

    delete _currentVersionChanges[currentPage][_currentVersion + 1];
    delete _currentVersionChanges[currentPage][_currentVersion - noOfVersionsSupported];

    setCurrentVersionChanges(_currentVersionChanges);

    updateEditorState({
      canUndo: _canUndo,
      canRedo: _canRedo,
      currentVersion: _currentVersion,
    });
  };

  const handleUndo = () => {
    if (canUndo) {
      let _currentVersion = currentVersion[currentPageId];

      const _appDefinition = applyPatches(appDefinition, currentVersionChanges[currentPageId][currentVersion - 1].undo);

      const _canUndo = currentVersionChanges[currentPageId].hasOwnProperty(currentVersion - 1);
      const _canRedo = true;
      _currentVersion[currentPageId] = _currentVersion - 1;

      if (!_appDefinition) return;

      updateEditorState({
        appDefinition: _appDefinition,
        canUndo: _canUndo,
        canRedo: _canRedo,
        currentVersion: _currentVersion,
        isSaving: true,
      });

      props.ymap?.set('appDef', {
        newDefinition: appDefinition,
        editingVersionId: props.editingVersion?.id,
      });

      // autoSave();
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      let _currentVersion = currentVersion[currentPageId];

      const _appDefinition = applyPatches(appDefinition, currentVersionChanges[currentPageId][currentVersion].redo);

      const _canUndo = true;
      const _canRedo = currentVersionChanges[currentPageId].hasOwnProperty(currentVersion + 1);
      _currentVersion[currentPageId] = currentVersion + 1;

      if (!_appDefinition) return;

      updateEditorState({
        appDefinition: _appDefinition,
        canUndo: _canUndo,
        canRedo: _canRedo,
        currentVersion: _currentVersion,
        isSaving: true,
      });

      props.ymap?.set('appDef', {
        newDefinition: appDefinition,
        editingVersionId: props.editingVersion?.id,
      });

      // autoSave();
    }
  };

  const componentDefinitionChanged = (componentDefinition, props) => {
    if (props?.isVersionReleased) {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
      return;
    }

    if (appDefinition?.pages[currentPageId]?.components[componentDefinition.id]) {
      // Create a new copy of appDefinition with lodash's cloneDeep
      const updatedAppDefinition = _.cloneDeep(appDefinition);

      // Update the component definition in the copy
      updatedAppDefinition.pages[currentPageId].components[componentDefinition.id].component =
        componentDefinition.component;

      updateEditorState({
        isSaving: true,
      });

      const diffPatches = diff(appDefinition, updatedAppDefinition);

      if (!isEmpty(diffPatches)) {
        // handleAddPatch(diffPatches, diff(updatedAppDefinition, appDefinition));
        appDefinitionChanged(updatedAppDefinition, { skipAutoSave: true, componentDefinitionChanged: true });
      }
    }

    // Other actions can be performed here if needed, like autoSave, ymap, etc.
    // computeComponentState(updatedAppDefinition.pages[currentPageId]?.components);
    // autoSave();
    // props.ymap?.set('appDef', {
    //   newDefinition: updatedAppDefinition,
    //   editingVersionId: props.editingVersion?.id,
    // });
    // }
  };

  const removeComponent = (component) => {
    if (!props.isVersionReleased) {
      let newDefinition = cloneDeep(appDefinition);
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
      appDefinitionChanged(newDefinition, {
        skipAutoSave: props.isVersionReleased,
      });
      handleInspectorView();
    } else {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
    }
  };

  const moveComponents = (direction) => {
    const gridWidth = (1 * 100) / 43; // width of the canvas grid in percentage
    const _appDefinition = _.cloneDeep(appDefinition);
    let newComponents = _appDefinition?.pages[currentPageId].components;

    for (const selectedComponent of selectedComponents) {
      let top = newComponents[selectedComponent.id].layouts[props.currentLayout].top;
      let left = newComponents[selectedComponent.id].layouts[props.currentLayout].left;

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

      newComponents[selectedComponent.id].layouts[props.currentLayout].top = top;
      newComponents[selectedComponent.id].layouts[props.currentLayout].left = left;
    }

    _appDefinition.pages[currentPageId].components = newComponents;

    appDefinitionChanged(_appDefinition);
  };

  const copyComponents = () =>
    cloneComponents(selectedComponents, appDefinition, currentPageId, appDefinitionChanged, false);

  const cutComponents = () => {
    if (props.isVersionReleased) {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();

      return;
    }

    cloneComponents(selectedComponents, appDefinition, currentPageId, appDefinitionChanged, false);
  };

  const handleEditorEscapeKeyPress = () => {
    if (selectedComponents?.length > 0) {
      updateEditorState({
        selectedComponents: [],
      });
      handleInspectorView();
    }
  };

  const removeComponents = () => {
    if (!props.isVersionReleased && selectedComponents?.length > 1) {
      let newDefinition = cloneDeep(appDefinition);

      removeSelectedComponent(currentPageId, newDefinition, selectedComponents);
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
      appDefinitionChanged(newDefinition, {
        skipAutoSave: props.isVersionReleased,
      });
      handleInspectorView();
    } else if (props.isVersionReleased) {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
    }
  };

  // !-------

  const currentState = props?.currentState;
  const editingVersion = props?.editingVersion;
  const appVersionPreviewLink = editingVersion
    ? `/applications/${app.id}/versions/${editingVersion.id}/${currentState.page.handle}`
    : '';
  const deviceWindowWidth = 450;

  if (!appDefinition?.homePageId) {
    return (
      <div className="editor wrapper">
        <div className="editor__loading">
          <div className="editor__loading__spinner">{/* <Spinner /> */}</div>
          <div className="editor__loading__text">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor wrapper">
      {props.isVersionReleased && <ReleasedVersionError />}
      <EditorContextWrapper>
        <EditorHeader
          darkMode={props.darkMode}
          globalSettingsChanged={globalSettingsChanged}
          appDefinition={appDefinition}
          toggleAppMaintenance={toggleAppMaintenance}
          editingVersion={editingVersion}
          app={app}
          appVersionPreviewLink={appVersionPreviewLink}
          canUndo={canUndo}
          canRedo={canRedo}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          isSaving={isSaving}
          saveError={saveError}
          onNameChanged={onNameChanged}
          setAppDefinitionFromVersion={setAppDefinitionFromVersion}
          onVersionRelease={onVersionRelease}
          saveEditingVersion={saveEditingVersion}
          onVersionDelete={onVersionDelete}
        />
        <DndProvider backend={HTML5Backend}>
          <div className="sub-section">
            <LeftSidebar
              errorLogs={currentState.errors}
              components={currentState.components}
              appId={appId}
              darkMode={props.darkMode}
              dataSourcesChanged={dataSourcesChanged}
              dataQueriesChanged={dataQueriesChanged}
              globalDataSourcesChanged={globalDataSourcesChanged}
              onZoomChanged={onZoomChanged}
              switchDarkMode={changeDarkMode}
              debuggerActions={sideBarDebugger}
              appDefinition={{
                components: appDefinition?.pages[currentPageId]?.components ?? {},
                selectedComponent: selectedComponents ? selectedComponents[selectedComponents.length - 1] : {},
                pages: appDefinition?.pages,
                homePageId: appDefinition.homePageId,
                showViewerNavigation: appDefinition.showViewerNavigation,
              }}
              setSelectedComponent={setSelectedComponent}
              removeComponent={removeComponent}
              runQuery={(queryId, queryName) => handleRunQuery(queryId, queryName)}
              ref={dataSourceModalRef}
              isSaving={isSaving}
              currentPageId={currentPageId}
              // addNewPage={addNewPage}
              // switchPage={switchPage}
              // deletePage={deletePageRequest}
              // renamePage={renamePage}
              // clonePage={clonePage}
              // hidePage={hidePage}
              // unHidePage={unHidePage}
              // updateHomePage={updateHomePage}
              // updatePageHandle={updatePageHandle}
              // updateOnPageLoadEvents={updateOnPageLoadEvents}
              // showHideViewerNavigationControls={showHideViewerNavigation}
              // updateOnSortingPages={updateOnSortingPages}
              setEditorMarginLeft={handleEditorMarginLeftChange}
            />
            {!props.showComments && (
              <Selecto
                dragContainer={'.canvas-container'}
                selectableTargets={['.react-draggable']}
                hitRate={0}
                selectByClick={true}
                toggleContinueSelect={['shift']}
                ref={selectionRef}
                scrollOptions={scrollOptions}
                onSelectStart={onAreaSelectionStart}
                onSelectEnd={onAreaSelectionEnd}
                onSelect={onAreaSelection}
                onDragStart={onAreaSelectionDragStart}
                onDrag={onAreaSelectionDrag}
                onDragEnd={onAreaSelectionDragEnd}
                onScroll={(e) => {
                  canvasContainerRef.current.scrollBy(e.direction[0] * 10, e.direction[1] * 10);
                }}
              />
            )}
            <div
              className={`main main-editor-canvas ${isQueryPaneDragging || isDragging ? 'hide-scrollbar' : ''}`}
              id="main-editor-canvas"
            >
              <div
                className={`canvas-container align-items-center ${!showLeftSidebar && 'hide-sidebar'}`}
                style={{
                  transform: `scale(${zoomLevel})`,
                  borderLeft:
                    (editorMarginLeft ? editorMarginLeft - 1 : editorMarginLeft) +
                    `px solid ${computeCanvasBackgroundColor()}`,
                  height: computeCanvasContainerHeight(),
                  background: !props.darkMode && '#f4f6fa',
                }}
                onMouseUp={(e) => {
                  if (['real-canvas', 'modal'].includes(e.target.className)) {
                    updateEditorState({
                      currentSidebarTab: 2,
                      selectedComponents: [],
                    });
                    setHoveredComponent(null);
                  }
                }}
                ref={canvasContainerRef}
                onScroll={() => {
                  selectionRef.current.checkScroll();
                }}
              >
                <div style={{ minWidth: `calc((100vw - 300px) - 48px)` }}>
                  <div
                    className="canvas-area"
                    style={{
                      width: currentLayout === 'desktop' ? '100%' : '450px',
                      maxWidth:
                        +appDefinition.globalSettings.canvasMaxWidth + appDefinition.globalSettings.canvasMaxWidthType,

                      backgroundColor: computeCanvasBackgroundColor(),
                      transform: 'translateZ(0)', //Hack to make modal position respect canvas container, else it positions w.r.t window.
                    }}
                  >
                    {config.ENABLE_MULTIPLAYER_EDITING && (
                      <RealtimeCursors editingVersionId={editingVersion?.id} editingPageId={currentPageId} />
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
                          canvasWidth={canvasWidth}
                          socket={socket}
                          appDefinition={appDefinition}
                          appDefinitionChanged={appDefinitionChanged}
                          snapToGrid={true}
                          darkMode={props.darkMode}
                          mode={'edit'}
                          zoomLevel={zoomLevel}
                          deviceWindowWidth={deviceWindowWidth}
                          selectedComponents={selectedComponents}
                          appLoading={isLoading}
                          onEvent={handleEvent}
                          onComponentOptionChanged={handleOnComponentOptionChanged}
                          onComponentOptionsChanged={handleOnComponentOptionsChanged}
                          setSelectedComponent={setSelectedComponent}
                          handleUndo={handleUndo}
                          handleRedo={handleRedo}
                          removeComponent={removeComponent}
                          onComponentClick={handleComponentClick}
                          onComponentHover={handleComponentHover}
                          hoveredComponent={hoveredComponent}
                          sideBarDebugger={sideBarDebugger}
                          currentPageId={currentPageId}
                        />
                        <CustomDragLayer
                          snapToGrid={true}
                          canvasWidth={canvasWidth}
                          onDragging={(isDragging) => setIsDragging(isDragging)}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
              <QueryPanel
                onQueryPaneDragging={handleQueryPaneDragging}
                handleQueryPaneExpanding={handleQueryPaneExpanding}
                dataQueriesChanged={dataQueriesChanged}
                fetchDataQueries={fetchDataQueries}
                darkMode={props.darkMode}
                allComponents={appDefinition?.pages[currentPageId]?.components ?? {}}
                appId={appId}
                appDefinition={appDefinition}
                dataSourceModalHandler={dataSourceModalHandler}
                editorRef={editorRef}
              />
              <ReactTooltip id="tooltip-for-add-query" className="tooltip" />
            </div>
            <div className="editor-sidebar">
              <EditorKeyHooks
                moveComponents={moveComponents}
                cloneComponents={cloneComponents}
                copyComponents={copyComponents}
                cutComponents={cutComponents}
                handleEditorEscapeKeyPress={handleEditorEscapeKeyPress}
                removeMultipleComponents={removeComponents}
              />

              {currentSidebarTab === 1 && (
                <div className="pages-container">
                  {selectedComponents.length === 1 &&
                  !isEmpty(appDefinition?.pages[currentPageId]?.components) &&
                  !isEmpty(appDefinition?.pages[currentPageId]?.components[selectedComponents[0].id]) ? (
                    <Inspector
                      moveComponents={moveComponents}
                      componentDefinitionChanged={componentDefinitionChanged}
                      removeComponent={removeComponent}
                      selectedComponentId={selectedComponents[0].id}
                      allComponents={appDefinition?.pages[currentPageId]?.components}
                      key={selectedComponents[0].id}
                      switchSidebarTab={switchSidebarTab}
                      darkMode={props.darkMode}
                      pages={getPagesWithIds()}
                    ></Inspector>
                  ) : (
                    <center className="mt-5 p-2">
                      {props.t('editor.inspectComponent', 'Please select a component to inspect')}
                    </center>
                  )}
                </div>
              )}

              {currentSidebarTab === 2 && (
                <WidgetManager
                  componentTypes={componentTypes}
                  zoomLevel={zoomLevel}
                  darkMode={props.darkMode}
                ></WidgetManager>
              )}
            </div>
            {config.COMMENT_FEATURE_ENABLE && props.showComments && (
              <CommentNotifications socket={socket} pageId={currentPageId} />
            )}
          </div>
        </DndProvider>
      </EditorContextWrapper>
    </div>
  );
};

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

export const EditorFunc = withTranslation()(withRouter(withStore(EditorComponent)));
