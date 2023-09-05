import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  appService,
  authenticationService,
  appVersionService,
  orgEnvironmentVariableService,
  appEnvironmentService,
} from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import _, {
  defaults,
  cloneDeep,
  isEqual,
  isEmpty,
  debounce,
  omit,
  update,
  difference,
  isNull,
  isUndefined,
} from 'lodash';
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
  buildAppDefinition,
  buildComponentMetaDefinition,
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
import { useAppVersionStore, useAppVersionActions } from '@/_stores/appVersionStore';
import { useQueryPanelStore } from '@/_stores/queryPanelStore';
import { useCurrentStateStore, useCurrentState } from '@/_stores/currentStateStore';
import { computeAppDiff, resetAllStores } from '@/_stores/utils';
import { setCookie } from '@/_helpers/cookie';
import { shallow } from 'zustand/shallow';
import { useEditorActions, useEditorState, useEditorStore } from '@/_stores/editorStore';
import { useAppDataActions, useAppInfo } from '@/_stores/appDataStore';
import { useMounted } from '@/_hooks/use-mount';

// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';

setAutoFreeze(false);
enablePatches();

function setWindowTitle(name) {
  document.title = name ? `${name} - Tooljet` : `My App - Tooljet`;
}

const decimalToHex = (alpha) => (alpha === 0 ? '00' : Math.round(255 * alpha).toString(16));

const EditorComponent = (props) => {
  const { socket } = createWebsocketConnection(props?.params?.id);
  const mounted = useMounted();

  const { updateState, updateAppDefinitionDiff, updateAppVersion } = useAppDataActions();
  const { updateEditorState, updateQueryConfirmationList } = useEditorActions();

  const { setAppVersions } = useAppVersionActions();

  const {
    noOfVersionsSupported,
    appDefinition,
    selectedComponents,
    currentLayout,
    canUndo,
    canRedo,
    isUpdatingEditorStateInProcess,
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

  const {
    isMaintenanceOn,
    appId,
    app,
    appName,
    slug,
    currentUser,
    currentVersionId,
    appDefinitionDiff,
    appDiffOptions,
    events,
  } = useAppInfo();

  const [currentPageId, setCurrentPageId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isQueryPaneDragging, setIsQueryPaneDragging] = useState(false);
  const [isQueryPaneExpanded, setIsQueryPaneExpanded] = useState(false);
  const [selectionInProgress, setSelectionInProgress] = useState(false);
  const [hoveredComponent, setHoveredComponent] = useState(null);
  const [editorMarginLeft, setEditorMarginLeft] = useState(0);

  const [isDragging, setIsDragging] = useState(false);

  const [showPageDeletionConfirmation, setShowPageDeletionConfirmation] = useState(null);
  const [isDeletingPage, setIsDeletingPage] = useState(false);

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (isUpdatingEditorStateInProcess) {
        autoSave();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const initComponentVersioning = () => {
    const currentVersion = {
      [currentPageId]: -1,
    };

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

    await fetchApp(props.params.pageHandle, true);

    await fetchApps(0);
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

    updateState({ appId: props?.params?.id });
    useCurrentStateStore.getState().actions.setCurrentState({ globals });

    getCanvasWidth();
    initEditorWalkThrough();
  };

  const fetchDataQueries = async (id, selectFirstQuery = false, runQueriesOnAppLoad = false) => {
    await useDataQueriesStore.getState().actions.fetchDataQueries(id, selectFirstQuery, runQueriesOnAppLoad);
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
  const handleEvent = (eventName, event, options) => onEvent(editorRef, eventName, event, options, 'edit');

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

  const globalSettingsChanged = (globalOptions) => {
    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));
    const newAppDefinition = _.cloneDeep(copyOfAppDefinition);

    for (const [key, value] of Object.entries(globalOptions)) {
      if (value?.[1]?.a == undefined) newAppDefinition.globalSettings[key] = value;
      else {
        const hexCode = `${value?.[0]}${decimalToHex(value?.[1]?.a)}`;
        newAppDefinition.globalSettings[key] = hexCode;
      }
    }

    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    appDefinitionChanged(newAppDefinition, {
      globalSettings: true,
    });

    // props.ymap?.set('appDef', {
    //   newDefinition: appDefinition,
    //   editingVersionId: props.editingVersion?.id,
    // });
    // autoSave();
  };

  //!--------
  const callBack = async (data, startingPageHandle) => {
    useAppVersionStore.getState().actions.updateEditingVersion(data.editing_version);
    useAppVersionStore.getState().actions.updateReleasedVersionId(data.current_version_id);

    const appVersions = await appEnvironmentService.getVersionsByEnvironment(data?.id);
    setAppVersions(appVersions.appVersions);

    updateState({
      slug: data.slug,
      isMaintenanceOn: data?.is_maintenance_on,
      organizationId: data?.organization_id,
      isPublic: data?.is_public,
      appName: data?.name,
      userId: data?.user_id,
      appId: data?.id,
      events: data.events,
      currentVersionId: data?.editing_version?.id,
    });

    const appDefData = buildAppDefinition(data);

    const appJson = appDefData;
    const pages = data.pages;

    const startingPageId = pages.filter((page) => page.handle === startingPageHandle)[0]?.id;
    const homePageId = !startingPageId || startingPageId === 'null' ? appJson.homePageId : startingPageId;

    const currentpageData = {
      handle: appJson.pages[homePageId]?.handle,
      name: appJson.pages[homePageId]?.name,
      id: homePageId,
      variables: {},
    };

    setCurrentPageId(homePageId);

    useCurrentStateStore.getState().actions.setCurrentState({
      page: currentpageData,
    });

    updateEditorState({
      isLoading: false,
      appDefinition: appJson,
      isUpdatingEditorStateInProcess: false,
    });

    await fetchDataSources(data.editing_version?.id);
    await fetchDataQueries(data.editing_version?.id, true, true);

    const currentPageEvents = data.events.filter((event) => event.target === 'page' && event.sourceId === homePageId);

    for (const currentEvent of currentPageEvents ?? []) {
      await handleEvent(currentEvent.name, currentPageEvents);
    }
  };

  //****** */

  const fetchApp = async (startingPageHandle, onMount = false) => {
    const _appId = props?.params?.id;

    if (!onMount) {
      await appService.getApp(_appId).then((data) => callBack(data, startingPageHandle));
    } else {
      callBack(app, startingPageHandle);
    }
  };

  // !--------
  const setAppDefinitionFromVersion = (appData, shouldWeEditVersion = true) => {
    const version = appData?.editing_version?.id;
    if (version?.id !== props.editingVersion?.id) {
      // !Need to fix this
      // appDefinitionChanged(defaults(version.definition, defaultDefinition(props.darkMode)), {
      //   skipAutoSave: true,
      //   skipYmapUpdate: true,
      //   versionChanged: true,
      // });
      if (version?.id === currentVersionId) {
        updateEditorState({
          canUndo: false,
          canRedo: false,
        });
      }

      updateEditorState({
        isLoading: true,
      });

      callBack(appData);

      initComponentVersioning();
    }
  };

  const diffToPatches = (diffObj) => {
    return Object.keys(diffObj).reduce((patches, path) => {
      const value = diffObj[path];
      return [...patches, { path: path.split('.'), value, op: 'replace' }];
    }, []);
  };

  const appDefinitionChanged = async (newDefinition, opts = {}) => {
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
          isUpdatingEditorStateInProcess: true,
        });

        resolve();
      });
    }

    let updatedAppDefinition;
    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    updatedAppDefinition = produce(copyOfAppDefinition, (draft) => {
      if (_.isEmpty(draft)) return;

      if (opts?.containerChanges || opts?.componentDefinitionChanged) {
        const currentPageComponents = newDefinition.pages[currentPageId]?.components;

        draft.pages[currentPageId].components = currentPageComponents;
      }

      if (opts?.pageDefinitionChanged) {
        draft.pages = newDefinition.pages;
      }

      if (opts?.homePageChanged) {
        draft.homePageId = newDefinition.homePageId;
      }

      if (opts?.generalAppDefinitionChanged || opts?.globalSettings || isEmpty(opts)) {
        Object.assign(draft, newDefinition);
      }
    });

    const diffPatches = diff(appDefinition, updatedAppDefinition);

    const inversePatches = diff(updatedAppDefinition, appDefinition);
    const shouldUpdate = !_.isEmpty(diffPatches) && !isEqual(appDefinitionDiff, diffPatches);

    if (shouldUpdate) {
      const undoPatches = diffToPatches(inversePatches);

      setUndoStack((prev) => [...prev, undoPatches]);

      updateAppDefinitionDiff(diffPatches);

      updateState({
        appDiffOptions: opts,
      });
      updateEditorState({
        isUpdatingEditorStateInProcess: true,
        appDefinition: updatedAppDefinition,
      });

      computeComponentState(updatedAppDefinition.pages[currentPageId]?.components);
      props.ymap?.set('appDef', {
        newDefinition: updatedAppDefinition,
        editingVersionId: props.editingVersion?.id,
      });
    }
  };

  const saveEditingVersion = (isUserSwitchedVersion = false) => {
    if (props.isVersionReleased && !isUserSwitchedVersion) {
      updateEditorState({
        isUpdatingEditorStateInProcess: false,
      });
    } else if (!isEmpty(props?.editingVersion)) {
      const updateDiff = computeAppDiff(appDefinitionDiff, currentPageId, appDiffOptions);

      updateAppVersion(appId, props.editingVersion?.id, currentPageId, updateDiff, isUserSwitchedVersion)
        .then(() => {
          const _editingVersion = {
            ...props.editingVersion,
            ...{ definition: appDefinition },
          };
          useAppVersionStore.getState().actions.updateEditingVersion(_editingVersion);

          if (updateDiff?.type === 'components' && updateDiff?.operation === 'delete') {
            const appEvents = Array.isArray(events) && events.length > 0 ? JSON.parse(JSON.stringify(events)) : [];

            const updatedEvents = appEvents.filter((event) => {
              return !updateDiff?.updateDiff.includes(event.sourceId);
            });

            updateState({
              events: updatedEvents,
            });
          }

          updateEditorState({
            saveError: false,
            isUpdatingEditorStateInProcess: false,
          });
        })
        .catch(() => {
          updateEditorState({
            saveError: true,
            isUpdatingEditorStateInProcess: false,
          });
          toast.error('App could not save.');
        });
    }

    updateEditorState({
      saveError: false,
      isUpdatingEditorStateInProcess: false,
    });
  };

  const realtimeSave = debounce(appDefinitionChanged, 500);
  const autoSave = debounce(saveEditingVersion, 200);

  function handlePaths(prevPatch, path = [], appJSON) {
    const paths = [...path];

    for (let key in prevPatch) {
      const type = typeof prevPatch[key];

      if (type === 'object') {
        handlePaths(prevPatch[key], [...paths, key], appJSON);
      } else {
        const currentpath = [...paths, key].join('.');
        _.update(appJSON, currentpath, () => prevPatch[key]);
      }
    }
  }
  function removeUndefined(obj) {
    Object.keys(obj).forEach((key) => {
      if (obj[key] && typeof obj[key] === 'object') removeUndefined(obj[key]);
      else if (obj[key] === undefined) delete obj[key];
    });

    return obj;
  }

  const handleUndo = () => {
    if (canUndo) {
      const patchesToUndo = undoStack[undoStack.length - 1];

      const updatedAppDefinition = JSON.parse(JSON.stringify(appDefinition));

      handlePaths(patchesToUndo[0]?.value, [...patchesToUndo[0].path], updatedAppDefinition);

      removeUndefined(updatedAppDefinition);

      const _diffPatches = diff(updatedAppDefinition, appDefinition);

      setUndoStack((prev) => prev.slice(0, prev.length - 1));
      setRedoStack((prev) => [...prev, diffToPatches(_diffPatches)]);

      updateEditorState({
        appDefinition: updatedAppDefinition,
        currentSidebarTab: 2,
        isUpdatingEditorStateInProcess: true,
      });
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const patchesToRedo = redoStack[redoStack.length - 1];

      const updatedAppDefinition = JSON.parse(JSON.stringify(appDefinition));

      handlePaths(patchesToRedo[0]?.value, [...patchesToRedo[0].path], updatedAppDefinition);

      const _diffPatches = diff(updatedAppDefinition, appDefinition);

      setRedoStack((prev) => prev.slice(0, prev.length - 1));
      setUndoStack((prev) => [...prev, diffToPatches(_diffPatches)]);

      updateEditorState({
        appDefinition: updatedAppDefinition,
        isUpdatingEditorStateInProcess: true,
      });
    }
  };

  useEffect(() => {
    updateEditorState({
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(undoStack), JSON.stringify(redoStack)]);

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
        isUpdatingEditorStateInProcess: true,
      });

      const diffPatches = diff(appDefinition, updatedAppDefinition);

      if (!isEmpty(diffPatches)) {
        appDefinitionChanged(updatedAppDefinition, { skipAutoSave: true, componentDefinitionChanged: true, ...props });
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

  const removeComponent = (componentId) => {
    if (!props.isVersionReleased) {
      let newDefinition = cloneDeep(appDefinition);
      // Delete child components when parent is deleted

      let childComponents = [];

      if (newDefinition.pages[currentPageId].components?.[componentId].component.component === 'Tabs') {
        childComponents = Object.keys(newDefinition.pages[currentPageId].components).filter((key) =>
          newDefinition.pages[currentPageId].components[key].parent?.startsWith(componentId)
        );
      } else {
        childComponents = Object.keys(newDefinition.pages[currentPageId].components).filter(
          (key) => newDefinition.pages[currentPageId].components[key].parent === componentId
        );
      }

      childComponents.forEach((componentId) => {
        delete newDefinition.pages[currentPageId].components[componentId];
      });

      delete newDefinition.pages[currentPageId].components[componentId];
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
        componentDefinitionChanged: true,
        componentDeleted: true,
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
    if (!props.isVersionReleased && selectedComponents?.length >= 1) {
      let newDefinition = cloneDeep(appDefinition);

      removeSelectedComponent(currentPageId, newDefinition, selectedComponents, appDefinitionChanged);
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
      // appDefinitionChanged(newDefinition);
      handleInspectorView();
    } else if (props.isVersionReleased) {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
    }
  };

  //Page actions
  const renamePage = (pageId, newName) => {
    if (Object.entries(appDefinition.pages).some(([pId, { name }]) => newName === name && pId !== pageId)) {
      return toast.error('Page name already exists');
    }
    if (newName.trim().length === 0) {
      toast.error('Page name cannot be empty');
      return;
    }

    setCurrentPageId(pageId);

    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    copyOfAppDefinition.pages[pageId].name = newName;

    appDefinitionChanged(copyOfAppDefinition, { pageDefinitionChanged: true });
  };

  const addNewPage = ({ name, handle }) => {
    // check for unique page handles
    const pageExists = Object.values(appDefinition.pages).some((page) => page.name === name);

    if (pageExists) {
      toast.error('Page name already exists');
      return;
    }

    const pageHandles = Object.values(appDefinition.pages).map((page) => page.handle);

    let newHandle = handle;
    // If handle already exists, finds a unique handle by incrementing a number until it is not found in the array of existing page handles.
    for (let handleIndex = 1; pageHandles.includes(newHandle); handleIndex++) {
      newHandle = `${handle}-${handleIndex}`;
    }

    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));
    const newPageId = uuid();

    copyOfAppDefinition.pages[newPageId] = {
      id: newPageId,
      name,
      handle: newHandle,
      components: {},
      index: Object.keys(copyOfAppDefinition.pages).length + 1,
    };

    setCurrentPageId(newPageId);

    appDefinitionChanged(copyOfAppDefinition, {
      pageDefinitionChanged: true,
      addNewPage: true,
      switchPage: true,
      pageId: newPageId,
    });
  };

  const switchPage = (pageId, queryParams = []) => {
    // document.getElementById('real-canvas').scrollIntoView();
    if (currentPageId === pageId && currentState.page.handle === appDefinition?.pages[pageId]?.handle) {
      return;
    }
    const { name, handle } = appDefinition.pages[pageId];

    if (!name || !handle) return;

    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));
    const queryParamsString = queryParams.map(([key, value]) => `${key}=${value}`).join('&');

    props?.navigate(`/${getWorkspaceId()}/apps/${appId}/${handle}?${queryParamsString}`);

    const { globals: existingGlobals } = currentState;

    const page = {
      id: pageId,
      name,
      handle,
      variables: copyOfAppDefinition.pages[pageId]?.variables ?? {},
    };

    const globals = {
      ...existingGlobals,
      urlparams: JSON.parse(JSON.stringify(queryString.parse(queryParamsString))),
    };
    useCurrentStateStore.getState().actions.setCurrentState({ globals, page });

    setCurrentPageId(pageId);
    handleInspectorView();

    const currentPageEvents = events.filter((event) => event.target === 'page' && event.sourceId === page.id);

    (async () => {
      for (const currentEvent of currentPageEvents ?? []) {
        await handleEvent(currentEvent.name, currentPageEvents);
      }
    })();
  };

  const deletePageRequest = (pageId, isHomePage = false, pageName = '') => {
    setShowPageDeletionConfirmation({
      isOpen: true,
      pageId,
      isHomePage,
      pageName,
    });
  };

  const cancelDeletePageRequest = () => {
    setShowPageDeletionConfirmation({
      isOpen: false,
      pageId: null,
      isHomePage: false,
      pageName: null,
    });
  };

  const executeDeletepageRequest = () => {
    const pageId = showPageDeletionConfirmation.pageId;
    const isHomePage = showPageDeletionConfirmation.isHomePage;
    if (Object.keys(appDefinition.pages).length === 1) {
      toast.error('You cannot delete the only page in your app.');
      return;
    }

    setIsDeletingPage({
      isDeletingPage: true,
    });

    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    const toBeDeletedPage = copyOfAppDefinition.pages[pageId];

    const newAppDefinition = {
      ...copyOfAppDefinition,
      pages: omit(copyOfAppDefinition.pages, pageId),
    };

    const newCurrentPageId = isHomePage ? Object.keys(copyOfAppDefinition.pages)[0] : copyOfAppDefinition.homePageId;

    setCurrentPageId(newCurrentPageId);
    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });
    setIsDeletingPage(false);

    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
      deletePageRequest: true,
    });

    toast.success(`${toBeDeletedPage.name} page deleted.`);

    switchPage(newCurrentPageId);
  };

  const hidePage = (pageId) => {
    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    const newAppDefinition = _.cloneDeep(copyOfAppDefinition);

    newAppDefinition.pages[pageId].hidden = true;

    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
    });
  };

  const unHidePage = (pageId) => {
    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    const newAppDefinition = _.cloneDeep(copyOfAppDefinition);

    newAppDefinition.pages[pageId].hidden = false;

    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
    });
  };

  const clonePage = (pageId) => {
    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const currentPage = copyOfAppDefinition.pages[pageId];
    const newPageId = uuid();
    let newPageName = `${currentPage.name} (copy)`;
    let newPageHandle = `${currentPage.handle}-copy`;
    let i = 1;
    while (
      !isNull(copyOfAppDefinition.pages[pageId]?.pages) &&
      !isUndefined(copyOfAppDefinition.pages[pageId]?.pages) &&
      Object.values(copyOfAppDefinition.pages[pageId]?.pages)?.some((page) => page.handle === newPageHandle)
    ) {
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
      ...copyOfAppDefinition,
      pages: {
        ...copyOfAppDefinition.pages,
        [newPageId]: newPage,
      },
    };

    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
    });
  };

  const updateHomePage = (pageId) => {
    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    const newAppDefinition = _.cloneDeep(copyOfAppDefinition);

    newAppDefinition.homePageId = pageId;

    appDefinitionChanged(newAppDefinition, {
      homePageChanged: true,
    });
  };

  const updatePageHandle = (pageId, newHandle) => {
    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const pageExists = Object.values(copyOfAppDefinition.pages).some((page) => page.handle === newHandle);

    if (pageExists) {
      toast.error('Page with same handle already exists');
      return;
    }

    if (newHandle.trim().length === 0) {
      toast.error('Page handle cannot be empty');
      return;
    }

    const newDefinition = _.cloneDeep(copyOfAppDefinition);

    newDefinition.pages[pageId].handle = newHandle;

    appDefinitionChanged(newDefinition, {
      pageDefinitionChanged: true,
    });
  };

  const updateOnSortingPages = (newSortedPages) => {
    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));
    const pagesObj = newSortedPages.reduce((acc, page, index) => {
      acc[page.id] = {
        ...page,
        index: index + 1,
      };
      return acc;
    }, {});

    const newAppDefinition = _.cloneDeep(copyOfAppDefinition);

    newAppDefinition.pages = pagesObj;

    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
      pageSortingChanged: true,
    });
  };

  const showHideViewerNavigation = () => {
    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));
    const newAppDefinition = _.cloneDeep(copyOfAppDefinition);

    newAppDefinition.showViewerNavigation = !newAppDefinition.showViewerNavigation;

    appDefinitionChanged(newAppDefinition, {
      generalAppDefinitionChanged: true,
    });
  };

  // !-------

  const currentState = props?.currentState;
  const editingVersion = props?.editingVersion;
  const appVersionPreviewLink = editingVersion
    ? `/applications/${app.id}/versions/${editingVersion.id}/${currentState.page.handle}`
    : '';
  const deviceWindowWidth = 450;

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="editor wrapper">
      <Confirm
        show={showPageDeletionConfirmation?.isOpen ?? false}
        title={'Delete Page'}
        message={`Do you really want to delete ${showPageDeletionConfirmation?.pageName || 'this'} page?`}
        confirmButtonLoading={isDeletingPage}
        onConfirm={() => executeDeletepageRequest()}
        onCancel={() => cancelDeletePageRequest()}
        darkMode={props.darkMode}
      />
      {props.isVersionReleased && <ReleasedVersionError />}
      <EditorContextWrapper>
        <EditorHeader
          darkMode={props.darkMode}
          globalSettingsChanged={globalSettingsChanged}
          appDefinition={_.cloneDeep(appDefinition)}
          toggleAppMaintenance={toggleAppMaintenance}
          editingVersion={editingVersion}
          app={app}
          appVersionPreviewLink={appVersionPreviewLink}
          canUndo={canUndo}
          canRedo={canRedo}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          saveError={saveError}
          onNameChanged={onNameChanged}
          setAppDefinitionFromVersion={setAppDefinitionFromVersion}
          onVersionRelease={onVersionRelease}
          saveEditingVersion={saveEditingVersion}
          onVersionDelete={onVersionDelete}
          isMaintenanceOn={isMaintenanceOn}
          appName={appName}
          appId={appId}
          slug={slug}
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
                pages: appDefinition?.pages ?? {},
                homePageId: appDefinition?.homePageId ?? null,
                showViewerNavigation: appDefinition?.showViewerNavigation,
              }}
              setSelectedComponent={setSelectedComponent}
              removeComponent={removeComponent}
              runQuery={(queryId, queryName) => handleRunQuery(queryId, queryName)}
              ref={dataSourceModalRef}
              isSaving={isUpdatingEditorStateInProcess}
              currentPageId={currentPageId}
              addNewPage={addNewPage}
              switchPage={switchPage}
              deletePage={deletePageRequest}
              renamePage={renamePage}
              clonePage={clonePage}
              hidePage={hidePage}
              unHidePage={unHidePage}
              updateHomePage={updateHomePage}
              updatePageHandle={updatePageHandle}
              showHideViewerNavigationControls={showHideViewerNavigation}
              updateOnSortingPages={updateOnSortingPages}
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
