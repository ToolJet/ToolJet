import React, { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import {
  appService,
  authenticationService,
  appVersionService,
  orgEnvironmentVariableService,
  orgEnvironmentConstantService,
  appsService,
} from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import _, { isEqual, isEmpty, debounce, omit, noop } from 'lodash';
import { Container } from './Container';
import { EditorKeyHooks } from './EditorKeyHooks';
import { CustomDragLayer } from './CustomDragLayer';
import { LeftSidebar } from './LeftSidebar';
import { componentTypes } from '@/AppBuilder/WidgetManager';
import { Inspector } from './Inspector/Inspector';
import QueryPanel from './QueryPanel/QueryPanel';
import {
  onEvent,
  onQueryConfirmOrCancel,
  runQuery,
  computeComponentState,
  cloneComponents,
  removeSelectedComponent,
  buildAppDefinition,
  buildComponentMetaDefinition,
  getAllChildComponents,
  runQueries,
  updateSuggestionsFromCurrentState,
} from '@/_helpers/appUtils';
import { Confirm } from './Viewer/Confirm';
// eslint-disable-next-line import/no-unresolved
import { Tooltip as ReactTooltip } from 'react-tooltip';
import CommentNotifications from './CommentNotifications';
import { WidgetManager } from './WidgetManager';
import config from 'config';
import queryString from 'query-string';
import { toast } from 'react-hot-toast';
const { produce, enablePatches, setAutoFreeze } = require('immer');
import { createWebsocketConnection } from '@/_helpers/websocketConnection';
import RealtimeCursors from '@/Editor/RealtimeCursors';
import { initEditorWalkThrough } from '@/_helpers/createWalkThrough';
import { EditorContextWrapper } from './Context/EditorContextWrapper';
import { withTranslation } from 'react-i18next';
import { v4 as uuid } from 'uuid';
import Skeleton from 'react-loading-skeleton';
import EditorHeader from './Header';
import { getWorkspaceId, isValidUUID, Constants } from '@/_helpers/utils';
import { fetchAndSetWindowTitle, pageTitles, defaultWhiteLabellingSettings } from '@white-label/whiteLabelling';
import '@/_styles/editor/react-select-search.scss';
import { withRouter } from '@/_hoc/withRouter';
import { ReleasedVersionError } from '@/AppBuilder/Header/ReleasedVersionError';
import { useDataSourcesStore } from '@/_stores/dataSourcesStore';
import { useDataQueriesStore } from '@/_stores/dataQueriesStore';
import { useAppVersionStore, useAppVersionActions } from '@/_stores/appVersionStore';
import { useQueryPanelStore } from '@/_stores/queryPanelStore';
import { useCurrentStateStore, getCurrentState } from '@/_stores/currentStateStore';
import {
  computeAppDiff,
  computeComponentPropertyDiff,
  findAllEntityReferences,
  isParamFromTableColumn,
  resetAllStores,
} from '@/_stores/utils';
import { setCookie } from '@/_helpers/cookie';
import { EMPTY_ARRAY, useEditorActions, useEditorStore } from '@/_stores/editorStore';
import { useAppDataActions, useAppDataStore } from '@/_stores/appDataStore';
import { useNoOfGrid } from '@/_stores/gridStore';
import { useMounted } from '@/_hooks/use-mount';
import EditorSelecto from './EditorSelecto';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import useDebouncedArrowKeyPress from '@/_hooks/useDebouncedArrowKeyPress';
import useConfirm from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/Confirm';
import { getQueryParams } from '@/_helpers/routes';
import RightSidebarTabManager from './RightSidebarTabManager';
import { shallow } from 'zustand/shallow';
import AutoLayoutAlert from './AutoLayoutAlert';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { useResolveStore } from '@/_stores/resolverStore';
import { dfs } from '@/_stores/handleReferenceTransactions';
import { decimalToHex, EditorConstants } from './editorConstants';
import {
  handleLowPriorityWork,
  updateCanvasBackground,
  clearAllQueuedTasks,
  checkAndExtractEntityId,
} from '@/_helpers/editorHelpers';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import cx from 'classnames';
import { resolveReferences } from '@/AppBuilder/CodeEditor/utils';

setAutoFreeze(false);
enablePatches();

const EditorComponent = (props) => {
  const { socket } = createWebsocketConnection(props?.params?.id);
  const mounted = useMounted();

  const {
    updateState,
    updateAppDefinitionDiff,
    updateAppVersion,
    setIsSaving,
    createAppVersionEventHandlers,
    autoUpdateEventStore,
  } = useAppDataActions();

  const {
    updateEditorState,
    updateQueryConfirmationList,
    setSelectedComponents,
    setCurrentPageId,
    updateComponentsNeedsUpdateOnNextRender,
    setCanvasWidth,
    setCanvasBackground,
  } = useEditorActions();

  const { setAppVersions } = useAppVersionActions();
  const { isVersionReleased, editingVersionId, releasedVersionId } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state?.isVersionReleased,
      editingVersionId: state?.editingVersion?.id,
      releasedVersionId: state?.releasedVersionId,
    }),
    shallow
  );
  const { confirm, ConfirmDialog } = useConfirm();

  const {
    appDefinition,
    currentLayout,
    canUndo,
    canRedo,
    isLoading,
    defaultComponentStateComputed,
    showComments,
    showLeftSidebar,
    queryConfirmationList,
    currentPageId,
    currentSessionId,
    canvasBackground,
  } = useEditorStore(
    (state) => ({
      appDefinition: state.appDefinition,
      currentLayout: state.currentLayout,
      canUndo: state.canUndo,
      canRedo: state.canRedo,
      isLoading: state.isLoading,
      defaultComponentStateComputed: state.defaultComponentStateComputed,
      showComments: state.showComments,
      showLeftSidebar: state.showLeftSidebar,
      queryConfirmationList: state.queryConfirmationList,
      currentPageId: state.currentPageId,
      currentSessionId: state.currentSessionId,
      canvasBackground: state.canvasBackground,
    }),
    shallow
  );

  const dataQueries = useDataQueriesStore((state) => state.dataQueries, shallow);
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
    areOthersOnSameVersionAndPage,
  } = useAppDataStore(
    (state) => ({
      isMaintenanceOn: state.isMaintenanceOn,
      appId: state.appId,
      app: state.app,
      appName: state.appName,
      slug: state.slug,
      currentUser: state.currentUser,
      currentVersionId: state.currentVersionId,
      appDefinitionDiff: state.appDefinitionDiff,
      appDiffOptions: state.appDiffOptions,
      events: state.events,
      areOthersOnSameVersionAndPage: state.areOthersOnSameVersionAndPage,
    }),
    shallow
  );

  const [zoomLevel, setZoomLevel] = useState(1);
  const [isQueryPaneDragging, setIsQueryPaneDragging] = useState(false);
  const [isQueryPaneExpanded, setIsQueryPaneExpanded] = useState(false); //!check where this is used
  const [editorMarginLeft, setEditorMarginLeft] = useState(0);
  const noOfGrids = useNoOfGrid();

  const [isDragging, setIsDragging] = useState(false);

  const [showPageDeletionConfirmation, setShowPageDeletionConfirmation] = useState(null);
  const [isDeletingPage, setIsDeletingPage] = useState(false);
  const { isAppDarkMode, appMode, onAppModeChange } = useAppDarkMode();

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [optsStack, setOptsStack] = useState({
    undo: [],
    redo: [],
  });
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
    useResolveStore.getState().actions.resetStore();
    const currentSession = authenticationService.currentSessionValue;
    const currentUser = currentSession?.current_user;

    // Subscribe to changes in the current session using RxJS observable pattern
    const subscription = authenticationService.currentSession.subscribe((currentSession) => {
      if (currentUser && (currentSession?.group_permissions || currentSession?.role)) {
        const userVars = {
          email: currentUser.email,
          firstName: currentUser.first_name,
          lastName: currentUser.last_name,
          groups: currentSession?.group_permissions
            ? ['all_users', ...currentSession.group_permissions.map((group) => group.name)]
            : ['all_users'],
          role: currentSession?.role?.name,
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
            ...getCurrentState().globals,
            theme: { name: props?.darkMode ? 'dark' : 'light' },
            urlparams: JSON.parse(JSON.stringify(queryString.parse(props.location.search))),
            currentUser: userVars,
            /* Constant value.it will only change for viewer */
            mode: {
              value: 'edit',
            },
          },
        });
      }
    });

    $componentDidMount();

    // 6. Unsubscribe from the observable when the component is unmounted
    return () => {
      document.title = defaultWhiteLabellingSettings.WHITE_LABEL_TEXT;
      socket && socket?.close();
      subscription.unsubscribe();
      if (config.ENABLE_MULTIPLAYER_EDITING) props?.provider?.disconnect();
      useEditorStore.getState().actions.setIsEditorActive(false);
      useCurrentStateStore.getState().actions.setEditorReady(false);
      useResolveStore.getState().actions.resetStore();
      prevAppDefinition.current = null;
      props.setEditorOrViewer('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastKeyPressTimestamp = useDebouncedArrowKeyPress(500); // 500 milliseconds delay

  useEffect(() => {
    const didAppDefinitionChanged = !_.isEqual(appDefinition, prevAppDefinition.current);

    if (didAppDefinitionChanged) {
      prevAppDefinition.current = appDefinition;
    }
    if (mounted && didAppDefinitionChanged && currentPageId) {
      const components = appDefinition?.pages[currentPageId]?.components || {};

      computeComponentState(components);

      if (appDiffOptions?.skipAutoSave === true || appDiffOptions?.entityReferenceUpdated === true) return;

      autoSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ appDefinition, currentPageId, dataQueries })]);

  useEffect(
    () => {
      const isEditorReady = useCurrentStateStore.getState().isEditorReady;
      const isResolverStoreReady = useResolveStore.getState().storeReady;
      if (isEditorReady && isResolverStoreReady) {
        const components = appDefinition?.pages?.[currentPageId]?.components || {};
        computeComponentState(components);
      }

      const isPageSwitched = useResolveStore.getState().isPageSwitched;

      if (isPageSwitched) {
        handleLowPriorityWork(() => {
          updateSuggestionsFromCurrentState();
          useResolveStore.getState().actions.pageSwitched(false);
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPageId]
  );

  useEffect(() => {
    // This effect runs when lastKeyPressTimestamp changes
    if (!appDiffOptions?.widgetMovedWithKeyboard) return;
    if (Date.now() - lastKeyPressTimestamp < 500) {
      updateEditorState({
        isUpdatingEditorStateInProcess: true,
      });
      autoSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ appDefinition, lastKeyPressTimestamp })]);

  useEffect(() => {
    if (!isEmpty(canvasContainerRef?.current)) {
      canvasContainerRef.current.scrollLeft += editorMarginLeft;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMarginLeft, canvasContainerRef?.current]);

  useEffect(() => {
    if (mounted) {
      useCurrentStateStore.getState().actions.setCurrentState({
        layout: currentLayout,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLayout, mounted]);

  useEffect(() => {
    updateEntityReferences(appDefinition, currentPageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  const handleYmapEventUpdates = () => {
    props.ymap?.set('eventHandlersUpdated', {
      currentVersionId: currentVersionId,
      currentSessionId: currentSessionId,
      update: true,
    });
  };

  const handleMessage = (event) => {
    const { data } = event;

    if (data?.type === 'redirectTo') {
      const redirectCookie = data?.payload['redirectPath'];
      setCookie('redirectPath', redirectCookie, 1);
    }
  };

  const getEditorRef = () => {
    const editorRef = {
      appDefinition: useEditorStore.getState().appDefinition,
      queryConfirmationList: useEditorStore.getState().queryConfirmationList,
      updateQueryConfirmationList: updateQueryConfirmationList,
      navigate: props.navigate,
      switchPage: switchPage,
      currentPageId: useEditorStore.getState().currentPageId,
    };
    return editorRef;
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

  const fetchOrgEnvironmentConstants = async (environmentId) => {
    try {
      const { constants } = await orgEnvironmentConstantService.getConstantsFromEnvironment(
        environmentId,
        Constants.Global
      );
      const orgConstants = {};

      constants.forEach((constant) => {
        orgConstants[constant.name] = constant.value;
      });

      useCurrentStateStore.getState().actions.setCurrentState({
        constants: orgConstants,
      });
    } catch (error) {
      toast.error('Failed to fetch organization environment constants', {
        position: 'top-center',
      });
    }
  };

  const initComponentVersioning = () => {
    updateEditorState({
      canUndo: false,
      canRedo: false,
    });
  };

  /**
   * Initializes real-time saving of application definitions if multiplayer editing is enabled.
   * Monitors changes in the 'appDef' property of the provided 'ymap' object and triggers a real-time save
   * when all conditions are met.
   */
  const initRealtimeSave = () => {
    // Check if multiplayer editing is enabled; if not, return early
    if (!config.ENABLE_MULTIPLAYER_EDITING) return null;

    // Observe changes in the 'appDef' property of the 'ymap' object
    props.ymap?.observeDeep(() => {
      const ymapUpdates = props.ymap?.get('appDef');
      const ymapEventHandlersUpdated = props.ymap?.get('eventHandlersUpdated');

      if (ymapUpdates) {
        // Check if there is a new session and if others are on the same version and page
        if (!ymapUpdates.currentSessionId || ymapUpdates.currentSessionId === currentSessionId) return;

        // Check if others are on the same version and page
        if (!ymapUpdates.areOthersOnSameVersionAndPage) return;

        // Check if the new application definition is different from the current one
        if (isEqual(appDefinition, ymapUpdates.newDefinition)) return;

        // Trigger real-time save with specific options

        realtimeSave(props.ymap?.get('appDef').newDefinition, {
          skipAutoSave: true,
          skipYmapUpdate: true,
          currentSessionId: ymapUpdates.currentSessionId,
          componentAdding: ymapUpdates?.opts?.componentAdded,
          componentDeleting: ymapUpdates?.opts?.componentDeleted,
        });
      }

      if (ymapEventHandlersUpdated?.update === true) {
        if (
          !ymapEventHandlersUpdated.currentSessionId ||
          ymapEventHandlersUpdated.currentSessionId === currentSessionId
        )
          return;

        if (!ymapEventHandlersUpdated.currentVersionId) return;

        autoUpdateEventStore(ymapEventHandlersUpdated.currentVersionId);
      }
    });
  };

  //! websocket events do not work
  const initEventListeners = () => {
    socket?.addEventListener('message', (event) => {
      const data = event.data.replace(/^"(.+(?="$))"$/, '$1');
      if (data === 'versionReleased') {
        //TODO update the released version id
      }
    });
  };

  const $componentDidMount = async () => {
    window.addEventListener('message', handleMessage);

    props.setEditorOrViewer('editor');
    await runForInitialLoad();
    await fetchOrgEnvironmentVariables();
    initComponentVersioning();
    initRealtimeSave();
    initEventListeners();
    updateEditorState({
      selectedComponents: [],
      scrollOptions: {
        container: canvasContainerRef.current,
        throttleTime: 30,
        threshold: 0,
      },
    });

    initEditorWalkThrough();
  };

  const fetchDataQueries = async (id, selectFirstQuery = false, runQueriesOnAppLoad = false) => {
    await useDataQueriesStore
      .getState()
      .actions.fetchDataQueries(id, selectFirstQuery, runQueriesOnAppLoad, getEditorRef());
  };

  const fetchDataSources = (id) => {
    useDataSourcesStore.getState().actions.fetchDataSources(id);
  };

  const fetchGlobalDataSources = () => {
    const { current_organization_id: organizationId } = currentUser;
    useDataSourcesStore.getState().actions.fetchGlobalDataSources(organizationId);
  };

  const toggleAppMaintenance = () => {
    const newState = !isMaintenanceOn;

    appsService.setMaintenance(appId, newState).then(() => {
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
      fetchDataSources(editingVersionId);
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
      fetchDataQueries(editingVersionId);
    }
  };

  const onNameChanged = (newName) => {
    app.name = newName;
    updateState({ appName: newName, app: app });
    updateState({ appName: newName });
    fetchAndSetWindowTitle({ page: pageTitles.EDITOR, appName: newName });
  };

  const onZoomChanged = (zoom) => {
    setZoomLevel(zoom);
  };

  const getCanvasWidth = () => {
    const windowWidth = window.innerWidth;
    const widthInPx = windowWidth - (EditorConstants.leftSideBarWidth + EditorConstants.rightSideBarWidth);
    if (appDefinition?.globalSettings?.canvasMaxWidthType === 'px') {
      return +appDefinition.globalSettings.canvasMaxWidth;
    }
    if (appDefinition?.globalSettings?.canvasMaxWidthType === '%') {
      return (widthInPx / 100) * +appDefinition.globalSettings.canvasMaxWidth;
    }
  };

  const computeCanvasContainerHeight = () => {
    // 45 = (height of header)
    // 85 = (the height of the query panel header when minimised) + (height of header)
    return `calc(${100}% - ${Math.max(useQueryPanelStore.getState().queryPanelHeight + 45, 85)}px)`;
  };

  const handleQueryPaneDragging = (bool) => setIsQueryPaneDragging(bool);
  const handleQueryPaneExpanding = (bool) => setIsQueryPaneExpanded(bool);

  const changeDarkMode = (newMode) => {
    if (appMode === 'auto') {
      useCurrentStateStore.getState().actions.setCurrentState({
        globals: {
          ...getCurrentState().globals,
          theme: { name: newMode ? 'dark' : 'light' },
        },
      });
    }
    props.switchDarkMode(newMode);
  };

  const handleEvent = React.useCallback((eventName, events, options) => {
    const latestEvents = useAppDataStore.getState().events;
    const filteredEvents = latestEvents.filter((event) => {
      const foundEvent = events.find((e) => e.id === event.id);
      return foundEvent && foundEvent.name === eventName;
    });

    try {
      return onEvent(getEditorRef(), eventName, filteredEvents, options, 'edit');
    } catch (error) {
      console.error(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunQuery = (queryId, queryName, additionalArgs = {}) => {
    const {
      confirmed = undefined,
      mode = 'edit',
      userSuppliedParameters = {},
      shouldSetPreviewData = false,
    } = additionalArgs;
    runQuery(getEditorRef(), queryId, queryName, confirmed, mode, userSuppliedParameters, shouldSetPreviewData);
  };

  const dataSourceModalHandler = () => {
    dataSourceModalRef.current.dataSourceModalToggleStateHandler();
  };

  const setSelectedComponent = React.useCallback((id, component, multiSelect = false) => {
    const isAlreadySelected = useEditorStore.getState()?.selectedComponents.find((component) => component.id === id);

    if (!isAlreadySelected) {
      setSelectedComponents([{ id, component }], multiSelect);
    }
  }, []);

  const onVersionRelease = (versionId) => {
    useAppVersionStore.getState().actions.updateReleasedVersionId(versionId);

    if (socket instanceof WebSocket && socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          event: 'events',
          data: { message: 'versionReleased', appId: appId },
        })
      );
    }
  };

  const computeCanvasBackgroundColor = () => {
    const canvasBackgroundColor = canvasBackground?.canvasBackgroundColor
      ? canvasBackground?.canvasBackgroundColor
      : '#edeff5';
    if (['#2f3c4c', '#edeff5'].includes(canvasBackgroundColor)) {
      return isAppDarkMode ? '#2f3c4c' : '#edeff5';
    }
    return canvasBackgroundColor;
  };

  const getPagesWithIds = () => {
    return Object.entries(appDefinition?.pages).map(([id, page]) => ({ ...page, id }));
  };

  const handleEditorMarginLeftChange = (value) => {
    setEditorMarginLeft(value);
  };

  const globalSettingsChanged = (globalOptions) => {
    const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    for (const [key, value] of Object.entries(globalOptions)) {
      if (value?.[1]?.a == undefined) newAppDefinition.globalSettings[key] = value;
      else {
        const hexCode = `${value?.[0]}${decimalToHex(value?.[1]?.a)}`;
        newAppDefinition.globalSettings[key] = hexCode;
      }
    }
    if (globalOptions?.canvasBackgroundColor || globalOptions?.backgroundFxQuery) {
      updateCanvasBackground(newAppDefinition.globalSettings, true);
    }

    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    appDefinitionChanged(newAppDefinition, {
      globalSettings: true,
    });
  };

  /* Only for the first load of an app. Should not use for any other cases */
  const runForInitialLoad = async () => {
    const appId = props?.id || props?.params?.slug;
    const appData = await appService.fetchApp(appId);
    const {
      name: appName,
      current_version_id,
      editing_version,
      organization_id: organizationId,
      slug,
      is_maintenance_on: isMaintenanceOn,
      is_public: isPublic,
      user_id: userId,
      events,
    } = appData;

    const startingPageHandle = props.params.pageHandle;
    fetchAndSetWindowTitle({ page: pageTitles.EDITOR, appName });
    useAppVersionStore.getState().actions.updateEditingVersion(editing_version);
    current_version_id && useAppVersionStore.getState().actions.updateReleasedVersionId(current_version_id);
    const environmentId = editing_version?.current_environment_id;
    await fetchOrgEnvironmentConstants(environmentId);
    updateState({
      slug,
      isMaintenanceOn,
      organizationId,
      isPublic,
      appName,
      userId,
      appId,
      events,
      currentVersionId: editing_version?.id,
      app: appData,
    });

    await useDataSourcesStore.getState().actions.fetchGlobalDataSources(organizationId);
    await fetchDataSources(editing_version?.id);

    await processNewAppDefinition(appData, startingPageHandle, false, ({ homePageId }) => {
      handleLowPriorityWork(() => {
        updateSuggestionsFromCurrentState();
        useResolveStore.getState().actions.updateLastUpdatedRefs(['constants', 'client']);
        commonLowPriorityActions(events, { homePageId });
      });
    });
  };

  const commonLowPriorityActions = (events, { homePageId }) => {
    const currentPageEvents = events.filter((event) => event.target === 'page' && event.sourceId === homePageId);
    const editorRef = getEditorRef();
    runQueries(useDataQueriesStore.getState().dataQueries, editorRef, true).then(() => {
      handleEvent('onPageLoad', currentPageEvents, {}, true);
    });
  };

  const processNewAppDefinition = async (data, startingPageHandle, versionSwitched = false, onComplete) => {
    useResolveStore.getState().actions.updateJSHints();
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
    onAppModeChange(appJson?.globalSettings?.appMode);

    useCurrentStateStore.getState().actions.setCurrentState({
      page: currentpageData,
    });
    updateEditorState({
      isLoading: false,
      appDefinition: appJson,
      isUpdatingEditorStateInProcess: false,
    });

    updateState({ components: appJson.pages[homePageId]?.components });

    if (versionSwitched) {
      props?.navigate(`/${getWorkspaceId()}/apps/${data.slug ?? appId}/${appJson.pages[homePageId]?.handle}`, {
        state: {
          isSwitchingPage: true,
        },
      });
    }

    Promise.all([await fetchDataQueries(data.editing_version?.id, true, true)])
      .then(async () => {
        await onEditorLoad(appJson, homePageId, versionSwitched);
        updateEntityReferences(appJson, homePageId);
      })
      .finally(async () => {
        const funcParams = { homePageId };
        typeof onComplete === 'function' && (await onComplete(funcParams));
      });
  };

  const setAppDefinitionFromVersion = (appData) => {
    const version = appData?.editing_version?.id;
    if (version?.id !== editingVersionId) {
      if (version?.id === currentVersionId) {
        updateEditorState({
          canUndo: false,
          canRedo: false,
        });
      }

      updateEditorState({
        isLoading: true,
      });
      clearAllQueuedTasks();
      useCurrentStateStore.getState().actions.initializeCurrentStateOnVersionSwitch();
      useCurrentStateStore.getState().actions.setEditorReady(false);
      useResolveStore.getState().actions.resetStore();

      const { editing_version, events } = appData;

      useAppVersionStore.getState().actions.updateEditingVersion(editing_version);
      updateState({
        events,
        currentVersionId: editing_version?.id,
        app: appData,
      });
      processNewAppDefinition(appData, null, true, ({ homePageId }) => {
        handleLowPriorityWork(async () => {
          updateSuggestionsFromCurrentState();
          await fetchDataSources(editing_version?.id);
          commonLowPriorityActions(events, homePageId);
        });
      });
      initComponentVersioning();
    }
  };

  const diffToPatches = (diffObj) => {
    return Object.keys(diffObj).reduce((patches, path) => {
      const value = diffObj[path];
      return [...patches, { path: path.split('.'), value, op: 'replace' }];
    }, []);
  };

  const appDefinitionChanged = useCallback(async (newDefinition, opts = {}) => {
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
    const appDefinition = useEditorStore.getState().appDefinition;
    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));
    const currentPageId = useEditorStore.getState().currentPageId;

    if (opts?.skipYmapUpdate && opts?.currentSessionId !== currentSessionId) {
      updatedAppDefinition = produce(copyOfAppDefinition, (draft) => {
        const _currentPageId = useEditorStore.getState().currentPageId;
        if (opts?.componentDeleting) {
          const currentPageComponentIds = Object.keys(copyOfAppDefinition.pages[_currentPageId]?.components);
          const newComponentIds = Object.keys(newDefinition.pages[_currentPageId]?.components);

          const finalComponents = _.omit(
            draft?.pages[_currentPageId]?.components,
            _.difference(currentPageComponentIds, newComponentIds)
          );

          draft.pages[_currentPageId].components = finalComponents;
        }

        const currentPageComponents = newDefinition.pages[_currentPageId]?.components;

        const finalComponents = _.merge(draft?.pages[_currentPageId]?.components, currentPageComponents);

        draft.pages[_currentPageId].components = finalComponents;
      });
    } else {
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
    }

    const diffPatches = diff(appDefinition, updatedAppDefinition);

    // Component deletion provides an undefined key and escaping it to update the deletion in the database
    if (!opts?.componentDeleted && !opts?.deletePageRequest) {
      removeUndefined(diffPatches);
    }

    const inversePatches = diff(updatedAppDefinition, appDefinition);
    const shouldUpdate = !_.isEmpty(diffPatches) && !isEqual(appDefinitionDiff, diffPatches);

    if (shouldUpdate) {
      const undoPatches = diffToPatches(inversePatches);

      if (
        opts?.componentAdded ||
        opts?.componentDefinitionChanged ||
        opts?.componentDeleted ||
        opts?.containerChanges
      ) {
        setUndoStack((prev) => [...prev, undoPatches]);
        setOptsStack((prev) => ({ ...prev, undo: [...prev.undo, opts] }));

        updateState({ components: updatedAppDefinition.pages[currentPageId]?.components });
      }

      updateAppDefinitionDiff(diffPatches);

      const isParamDiffFromTableColumn = opts?.containerChanges
        ? isParamFromTableColumn(diffPatches, updatedAppDefinition)
        : false;

      if (isParamDiffFromTableColumn) {
        opts.componentDefinitionChanged = true;
        opts.isParamFromTableColumn = true;
        delete opts.containerChanges;
      }

      updateState({
        appDiffOptions: opts,
      });

      let updatingEditorStateInProcess = true;

      if (opts?.widgetMovedWithKeyboard === true) {
        updatingEditorStateInProcess = false;
      }

      if (opts?.addNewPage) {
        updatedAppDefinition.pages[currentPageId] = {
          ...updatedAppDefinition.pages[currentPageId],
          components: {},
        };
      }

      updateEditorState({
        isUpdatingEditorStateInProcess: updatingEditorStateInProcess,
        appDefinition: updatedAppDefinition,
      });
    }
  }, []);

  const cloneEventsForClonedComponents = (componentUpdateDiff, operation, componentMap) => {
    function getKeyFromComponentMap(componentMap, newItem) {
      for (const key in componentMap) {
        if (componentMap.hasOwnProperty(key) && componentMap[key] === newItem) {
          return key;
        }
      }
      return null;
    }

    if (operation !== 'create') return;

    const newComponentIds = Object.keys(componentUpdateDiff);

    newComponentIds.forEach((componentId) => {
      const sourceComponentId = getKeyFromComponentMap(componentMap, componentId);
      if (!sourceComponentId) return;

      appVersionService
        .findAllEventsWithSourceId(appId, currentVersionId, sourceComponentId)
        .then((componentEvents) => {
          if (!componentEvents) return;
          componentEvents.forEach((event) => {
            const newEvent = {
              event: {
                ...event?.event,
              },
              eventType: event?.target,
              attachedTo: componentMap[event?.sourceId],
              index: event?.index,
            };

            createAppVersionEventHandlers(newEvent);
          });
        });
    });
  };

  const saveEditingVersion = (isUserSwitchedVersion = false) => {
    const editingVersion = useAppVersionStore.getState().editingVersion;
    if (isVersionReleased && !isUserSwitchedVersion) {
      updateEditorState({
        isUpdatingEditorStateInProcess: false,
      });
    } else if (!isEmpty(editingVersion) && !isEmpty(appDiffOptions) && appDefinition) {
      //! The computeComponentPropertyDiff function manages the calculation of differences in table columns by requiring complete column data. Without this complete data, the resulting JSON structure may be incorrect.
      const paramDiff = computeComponentPropertyDiff(appDefinitionDiff, appDefinition, appDiffOptions);
      const updateDiff = computeAppDiff(paramDiff, currentPageId, appDiffOptions, currentLayout);

      if (updateDiff['error']) {
        const platform = navigator?.userAgentData?.platform || navigator?.platform || 'unknown';
        const isPlatformMac = platform.toLowerCase().indexOf('mac') > -1;
        const toastMessage = `Unable to save changes! ${isPlatformMac ? '(⌘ + Z to undo)' : '(ctrl + Z to undo)'}`;

        toast(toastMessage, {
          icon: '🚫',
        });
        return updateEditorState({
          saveError: true,
          isUpdatingEditorStateInProcess: false,
        });
      }

      updateAppVersion(appId, editingVersion.id, currentPageId, updateDiff, isUserSwitchedVersion)
        .then(() => {
          const _editingVersion = {
            ...editingVersion,
            ...{ definition: appDefinition },
          };
          useAppVersionStore.getState().actions.updateEditingVersion(_editingVersion);

          if (config.ENABLE_MULTIPLAYER_EDITING) {
            props.ymap?.set('appDef', {
              newDefinition: appDefinition,
              editingVersionId: editingVersion.id,
              currentSessionId,
              areOthersOnSameVersionAndPage,
              opts: appDiffOptions,
            });
          }

          //Todo: Move this to a separate function or as a middleware of the api to createing a component
          if (updateDiff?.type === 'components' && updateDiff?.operation === 'create') {
            const componentsFromCurrentState = getCurrentState().components;
            const newComponentIds = Object.keys(updateDiff?.updateDiff);
            const newComponentsExposedData = {};
            const componentEntityArray = [];
            Object.values(componentsFromCurrentState).filter((component) => {
              if (newComponentIds.includes(component.id)) {
                const componentName = updateDiff?.updateDiff[component.id]?.name;
                newComponentsExposedData[componentName] = component;
                componentEntityArray.push({ id: component.id, name: componentName });
              }
            });

            useResolveStore.getState().actions.addEntitiesToMap(componentEntityArray);
            useResolveStore.getState().actions.addAppSuggestions({
              components: newComponentsExposedData,
            });
          }

          if (
            updateDiff?.type === 'components' &&
            updateDiff?.operation === 'delete' &&
            !appDiffOptions?.componentCut
          ) {
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
        .catch((e) => {
          const entityNotSaved =
            e?.data?.statusCode === 500 && e?.error
              ? checkAndExtractEntityId(e.error)
              : { entityId: null, message: 'App could not be saved.' };

          let errMessage = e?.data?.message || 'App could not be saved.';
          if (entityNotSaved.entityId) {
            const componentName =
              appDefinition.pages[currentPageId].components[entityNotSaved.entityId]?.component?.name;
            errMessage = `The component "${componentName}" could not be saved, so the last action is also not saved.`;
          }

          updateEditorState({
            saveError: true,
            isUpdatingEditorStateInProcess: false,
          });
          toast.error(errMessage);
        })
        .finally(() => {
          if (appDiffOptions?.cloningComponent) {
            cloneEventsForClonedComponents(
              updateDiff.updateDiff,
              updateDiff.operation,
              appDiffOptions?.cloningComponent
            );
          }

          updateState({
            appDiffOptions: {},
          });
        });
    }
    updateEditorState({
      saveError: false,
      isUpdatingEditorStateInProcess: false,
    });
  };

  const realtimeSave = debounce(appDefinitionChanged, 100);
  const autoSave = saveEditingVersion;

  function handlePaths(prevPatch, path = [], appJSON) {
    const paths = [...path];

    for (let key in prevPatch) {
      const type = typeof prevPatch[key];

      if (type === 'object' && !_.isEmpty(prevPatch[key])) {
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
      const undoDiff = diff(appDefinition, updatedAppDefinition);

      updateAppDefinitionDiff(undoDiff);
      setUndoStack((prev) => prev.slice(0, prev.length - 1));
      setRedoStack((prev) => [...prev, diffToPatches(_diffPatches)]);

      let undoOpts = optsStack.undo[optsStack.undo.length - 1];

      if (undoOpts?.componentDeleted) {
        undoOpts = {
          componentAdded: true,
        };
      } else if (undoOpts?.componentAdded) {
        undoOpts = {
          componentDeleted: true,
        };
      }

      updateState({
        appDiffOptions: undoOpts,
      });

      setOptsStack((prev) => ({
        ...prev,
        undo: [...prev.undo.slice(0, prev.undo.length - 1)],
        redo: [...prev.redo, optsStack.undo[optsStack.undo.length - 1]],
      }));

      updateEditorState({
        appDefinition: updatedAppDefinition,
        isUpdatingEditorStateInProcess: true,
      });
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const patchesToRedo = redoStack[redoStack.length - 1];

      const updatedAppDefinition = JSON.parse(JSON.stringify(appDefinition));

      handlePaths(patchesToRedo[0]?.value, [...patchesToRedo[0].path], updatedAppDefinition);
      removeUndefined(updatedAppDefinition);
      const _diffPatches = diff(updatedAppDefinition, appDefinition);
      const redoDiff = diff(appDefinition, updatedAppDefinition);
      updateAppDefinitionDiff(redoDiff);
      setRedoStack((prev) => prev.slice(0, prev.length - 1));
      setUndoStack((prev) => [...prev, diffToPatches(_diffPatches)]);

      updateState({
        appDiffOptions: optsStack.redo[optsStack.redo.length - 1],
      });

      setOptsStack((prev) => ({
        ...prev,
        undo: [...prev.undo, appDiffOptions],
        redo: [...prev.redo.slice(0, prev.redo.length - 1)],
      }));

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
    if (isVersionReleased) {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
      return;
    }

    if (appDefinition?.pages[currentPageId]?.components[componentDefinition.id]) {
      const updatedAppDefinition = JSON.parse(JSON.stringify(appDefinition));

      // Update the component definition in the copy
      updatedAppDefinition.pages[currentPageId].components[componentDefinition.id].component =
        componentDefinition.component;
      updateEditorState({
        isUpdatingEditorStateInProcess: true,
      });

      const diffPatches = diff(appDefinition, updatedAppDefinition);

      if (!isEmpty(diffPatches)) {
        appDefinitionChanged(updatedAppDefinition, { componentDefinitionChanged: true, ...props });
      }
    }
  };
  const removeComponent = React.useCallback((componentId) => {
    if (!isVersionReleased) {
      const appDefinition = useEditorStore.getState().appDefinition;
      let newDefinition = JSON.parse(JSON.stringify(appDefinition));
      const currentPageId = useEditorStore.getState().currentPageId;

      let childComponents = [];

      childComponents = getAllChildComponents(newDefinition.pages[currentPageId].components, componentId);

      childComponents.forEach(({ componentId }) => {
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

      const deleteFromMap = [componentId, ...childComponents.map(({ componentId }) => componentId)];
      const deletedComponentNames = deleteFromMap.map((id) => {
        return appDefinition.pages[currentPageId].components[id].component.name;
      });

      appDefinitionChanged(newDefinition, {
        componentDefinitionChanged: true,
        componentDeleted: true,
      });

      const allAppHints = useResolveStore.getState().suggestions.appHints ?? [];
      const allHintsAssociatedWithQuery = [];

      if (allAppHints.length > 0) {
        deletedComponentNames.forEach((componentName) => {
          return allAppHints.forEach((suggestion) => {
            if (suggestion?.hint.includes(componentName)) {
              allHintsAssociatedWithQuery.push(suggestion.hint);
            }
          });
        });
      }

      useResolveStore.getState().actions.removeEntitiesFromMap(deleteFromMap);
      useResolveStore.getState().actions.removeAppSuggestions(allHintsAssociatedWithQuery);
    } else {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
    }
  }, []);

  const moveComponents = (direction) => {
    const _appDefinition = JSON.parse(JSON.stringify(appDefinition));
    let newComponents = _appDefinition?.pages[currentPageId].components;
    const selectedComponents = useEditorStore.getState()?.selectedComponents;
    const componentsIds = [];
    for (const selectedComponent of selectedComponents) {
      componentsIds.push(selectedComponent.id);
      let top = newComponents[selectedComponent.id].layouts[currentLayout].top;
      let left = newComponents[selectedComponent.id].layouts[currentLayout].left;
      const width = newComponents[selectedComponent.id]?.layouts[currentLayout]?.width;

      switch (direction) {
        case 'ArrowLeft':
          left = left - 1;
          break;
        case 'ArrowRight':
          left = left + 1;
          break;
        case 'ArrowDown':
          top = top + 10;
          break;
        case 'ArrowUp':
          top = top - 10;
          break;
      }

      if (left < 0 || top < 0 || left + width > noOfGrids) {
        return;
      }

      const movedElement = document.getElementById(selectedComponent.id);
      const parentElm = movedElement.closest('.real-canvas');
      if (selectedComponent?.component?.parent && parentElm.clientHeight < top + movedElement.clientHeight) {
        return;
      }

      newComponents[selectedComponent.id].layouts[currentLayout].top = top;
      newComponents[selectedComponent.id].layouts[currentLayout].left = left;
    }

    _appDefinition.pages[currentPageId].components = newComponents;

    appDefinitionChanged(_appDefinition, { containerChanges: true, widgetMovedWithKeyboard: true });
  };

  const copyComponents = () =>
    cloneComponents(
      useEditorStore.getState()?.selectedComponents,
      appDefinition,
      currentPageId,
      appDefinitionChanged,
      false
    );

  const cutComponents = () => {
    if (isVersionReleased) {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();

      return;
    }

    cloneComponents(
      useEditorStore.getState()?.selectedComponents,
      appDefinition,
      currentPageId,
      appDefinitionChanged,
      false,
      true
    );
  };

  const cloningComponents = () => {
    if (isVersionReleased) {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
      return;
    }
    cloneComponents(
      useEditorStore.getState()?.selectedComponents,
      appDefinition,
      currentPageId,
      appDefinitionChanged,
      true,
      false
    );
  };

  const handleEditorEscapeKeyPress = () => {
    if (useEditorStore.getState()?.selectedComponents?.length > 0) {
      updateEditorState({
        selectedComponents: [],
      });
    }
  };

  const onEditorLoad = (appJson, pageId, isPageSwitchOrVersionSwitch = false) => {
    useCurrentStateStore.getState().actions.setEditorReady(true);

    const currentComponents = appJson?.pages?.[pageId]?.components;
    const currentDataQueries = useDataQueriesStore.getState().dataQueries;

    const referenceManager = useResolveStore.getState().referenceMapper;

    const newComponents = Object.keys(currentComponents).map((componentId) => {
      const component = currentComponents[componentId];

      if (isPageSwitchOrVersionSwitch || !referenceManager.get(componentId)) {
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

    useResolveStore.getState().actions.addEntitiesToMap([...newComponents, ...newDataQueries]);
    // useResolveStore.getState().actions.addEntitiesToMap(newDataQueries);
  };

  const updateEntityReferences = (appJson, pageId) => {
    const currentComponents = appJson?.pages?.[pageId]?.components;
    const globalSettings = appJson['globalSettings'];

    let dataQueries = JSON.parse(JSON.stringify(useDataQueriesStore.getState().dataQueries));
    let allEvents = JSON.parse(JSON.stringify(useAppDataStore.getState().events));

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
      const [_, error, resolvedCanvasBackgroundColor] = resolveReferences(newGlobalSettings?.backgroundFxQuery, {});

      const newAppDefinition = produce(appJson, (draft) => {
        draft.globalSettings = newGlobalSettings;
      });

      // Setting the canvas background to the editor store
      setCanvasBackground({
        backgroundFxQuery: newGlobalSettings?.backgroundFxQuery,
        canvasBackgroundColor: resolvedCanvasBackgroundColor || '',
      });

      updateEditorState({
        isUpdatingEditorStateInProcess: false,
        appDefinition: newAppDefinition,
      });
    } else {
      // Setting the canvas background to the editor store
      setCanvasBackground({
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
      const newAppDefinition = produce(appDefinition, (draft) => {
        draft.pages[pageId].components = newComponentDefinition;
      });

      handleLowPriorityWork(() => {
        updateEditorState({
          isUpdatingEditorStateInProcess: false,
          appDefinition: newAppDefinition,
        });
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

      updateState({
        events: newEvents,
      });
    }
  };

  const removeComponents = () => {
    const selectedComponents = useEditorStore.getState()?.selectedComponents;

    if (selectedComponents.length === 0) return;

    if (!isVersionReleased && selectedComponents?.length > 1) {
      let newDefinition = JSON.parse(JSON.stringify(appDefinition));

      const toDeleteComponents = removeSelectedComponent(
        currentPageId,
        newDefinition,
        selectedComponents,
        appDefinitionChanged
      );
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

      const allAppHints = useResolveStore.getState().suggestions.appHints ?? [];
      const allHintsAssociatedWithQuery = [];

      if (allAppHints.length > 0) {
        toDeleteComponents.forEach((id) => {
          const componentName = appDefinition.pages[currentPageId].components[id]?.component?.name;
          if (componentName) {
            allAppHints.forEach((suggestion) => {
              if (suggestion?.hint.includes(componentName)) {
                allHintsAssociatedWithQuery.push(suggestion.hint);
              }
            });
          }
        });
      }

      useResolveStore.getState().actions.removeEntitiesFromMap(toDeleteComponents);
      useResolveStore.getState().actions.removeAppSuggestions(allHintsAssociatedWithQuery);

      updateEditorState({ selectedComponents: [] });
    } else if (isVersionReleased) {
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

    if (name.length > 32) {
      toast.error('Page name cannot be more than 32 characters');
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
    updateEditorState({
      selectedComponents: [],
    });

    appDefinitionChanged(copyOfAppDefinition, {
      pageDefinitionChanged: true,
      addNewPage: true,
      switchPage: true,
      pageId: newPageId,
    });
    // props?.navigate(`/${getWorkspaceId()}/apps/${slug ?? appId}/${newHandle}`, {
    //   state: {
    //     isSwitchingPage: true,
    //   },
    // });

    const page = {
      id: newPageId,
      name,
      handle,
      variables: copyOfAppDefinition.pages[newPageId]?.variables ?? {},
    };

    const globals = {
      ...getCurrentState().globals,
    };
    useCurrentStateStore.getState().actions.setCurrentState({ globals, page });
  };

  const navigateToPage = (queryParams = [], handle) => {
    const appId = useAppDataStore.getState()?.appId;
    const queryParamsString = queryParams.map(([key, value]) => `${key}=${value}`).join('&');

    props?.navigate(`/${getWorkspaceId()}/apps/${slug ?? appId}/${handle}?${queryParamsString}`, {
      state: {
        isSwitchingPage: true,
      },
    });
  };

  const switchPage = async (pageId, queryParams = []) => {
    if (useEditorStore.getState().pageSwitchInProgress) {
      toast('Please wait, page switch in progress', {
        icon: '⚠️',
      });

      return;
    }

    await clearAllQueuedTasks();
    useResolveStore.getState().actions.resetStore();
    useEditorStore.getState().actions.setPageProgress(true);
    useCurrentStateStore.getState().actions.setEditorReady(false);
    // This are fetched from store to handle runQueriesOnAppLoad
    const currentPageId = useEditorStore.getState().currentPageId;
    const appDefinition = useEditorStore.getState().appDefinition;

    const pageHandle = useCurrentStateStore.getState().page?.handle;

    if (currentPageId === pageId && pageHandle === appDefinition?.pages[pageId]?.handle) {
      useEditorStore.getState().actions.setPageProgress(false);
      useCurrentStateStore.getState().actions.setEditorReady(true);
      return;
    }
    const { name, handle } = appDefinition.pages[pageId];

    if (!name || !handle) return;
    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    navigateToPage(queryParams, handle);

    const page = {
      id: pageId,
      name,
      handle,
      variables: copyOfAppDefinition.pages[pageId]?.variables ?? {},
    };

    const queryParamsString = queryParams.map(([key, value]) => `${key}=${value}`).join('&');
    const globals = {
      ...getCurrentState().globals,
      urlparams: JSON.parse(JSON.stringify(queryString.parse(queryParamsString))),
    };

    useCurrentStateStore.getState().actions.setCurrentState({ globals, page });
    useResolveStore.getState().actions.pageSwitched(true);

    await onEditorLoad(appDefinition, pageId, true);
    updateEntityReferences(appDefinition, pageId);

    setCurrentPageId(pageId);

    const currentPageEvents = useAppDataStore
      .getState()
      .events.filter((event) => event.target === 'page' && event.sourceId === page.id);

    handleEvent('onPageLoad', currentPageEvents);
    handleLowPriorityWork(
      () => {
        useEditorStore.getState().actions.setPageProgress(false);
        useResolveStore.getState().actions.updateJSHints();
      },
      null,
      true
    );
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
    const newCurrentPageId = isHomePage ? Object.keys(copyOfAppDefinition.pages)[0] : copyOfAppDefinition.homePageId;

    setCurrentPageId(newCurrentPageId);
    const toBeDeletedPage = copyOfAppDefinition.pages[pageId];

    const newAppDefinition = {
      ...copyOfAppDefinition,
      pages: omit(copyOfAppDefinition.pages, pageId),
    };

    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });
    setIsDeletingPage(false);

    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
      deletePageRequest: true,
    });

    toast.success(`${toBeDeletedPage.name} page deleted.`);
  };

  const disableEnablePage = ({ pageId, isDisabled }) => {
    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    newAppDefinition.pages[pageId].disabled = isDisabled ?? false;

    switchPage(pageId);
    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
    });
  };

  const turnOffAutoComputeLayout = ({ pageId, autoComputeLayout }) => {
    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    newAppDefinition.pages[pageId].autoComputeLayout = autoComputeLayout ?? false;

    switchPage(pageId);
    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
    });
  };

  const hidePage = (pageId) => {
    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    newAppDefinition.pages[pageId].hidden = true;

    switchPage(pageId);
    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
    });
  };

  const unHidePage = (pageId) => {
    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    newAppDefinition.pages[pageId].hidden = false;
    switchPage(pageId);
    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
    });
  };

  const clonePage = (pageId) => {
    setIsSaving(true);
    appVersionService
      .clonePage(appId, editingVersionId, pageId)
      .then(async (data) => {
        const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

        const pages = data.pages.reduce((acc, page) => {
          const currentComponents = buildComponentMetaDefinition(JSON.parse(JSON.stringify(page?.components)));

          page.components = currentComponents;

          acc[page.id] = page;

          return acc;
        }, {});

        const newAppDefinition = {
          ...copyOfAppDefinition,
          pages: {
            ...copyOfAppDefinition.pages,
            ...pages,
          },
        };
        updateState({
          events: data.events,
        });
        appDefinitionChanged(newAppDefinition);
        await onEditorLoad(newAppDefinition, pageId, false);
        updateEntityReferences(newAppDefinition, pageId);
      })
      .finally(() => setIsSaving(false));
  };

  const updateHomePage = (pageId) => {
    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));

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

    const newDefinition = JSON.parse(JSON.stringify(appDefinition));

    newDefinition.pages[pageId].handle = newHandle;

    appDefinitionChanged(newDefinition, {
      pageDefinitionChanged: true,
    });

    const queryParams = getQueryParams();
    navigateToPage(Object.entries(queryParams), newHandle);
  };

  const updateOnSortingPages = (newSortedPages) => {
    const pagesObj = newSortedPages.reduce((acc, page, index) => {
      acc[page.id] = {
        ...page,
        index: index + 1,
      };
      return acc;
    }, {});

    const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    newAppDefinition.pages = pagesObj;

    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
      pageSortingChanged: true,
    });
  };

  const showHideViewerNavigation = () => {
    const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    newAppDefinition.showViewerNavigation = !newAppDefinition.showViewerNavigation;

    appDefinitionChanged(newAppDefinition, {
      generalAppDefinitionChanged: true,
    });
  };

  async function turnOffAutoLayout() {
    const result = await confirm(
      'Once Auto Layout is disabled, you wont be able to turn if back on and the mobile layout won’t automatically align with desktop changes',
      'Turn off Auto Layout'
    );
    if (result) {
      turnOffAutoComputeLayout({ pageId: currentPageId, autoComputeLayout: false });
    }
  }

  const handleCanvasContainerMouseUp = (e) => {
    const selectedText = window.getSelection().toString();
    if (
      ['real-canvas', 'modal'].includes(e.target.className) &&
      useEditorStore.getState()?.selectedComponents?.length &&
      !selectedText
    ) {
      setSelectedComponents(EMPTY_ARRAY);
    }
  };

  const isEditorReady = useCurrentStateStore((state) => state.isEditorReady);

  if (isLoading && !isEditorReady) {
    return (
      <div className={cx('apploader', { 'dark-theme theme-dark': props.darkMode })}>
        <TJLoader />
      </div>
    );
  }

  const canvasWidth = getCanvasWidth() ?? useEditorStore.getState().editorCanvasWidth;
  if (typeof canvasWidth === 'number' && canvasWidth !== useEditorStore.getState().editorCanvasWidth) {
    setCanvasWidth(canvasWidth);
  }

  return (
    <HotkeysProvider initiallyActiveScopes={['editor']}>
      <div className="editor wrapper">
        <Confirm
          show={queryConfirmationList?.length > 0}
          message={`Do you want to run this query - ${queryConfirmationList[0]?.queryName}?`}
          onConfirm={(queryConfirmationData) => onQueryConfirmOrCancel(getEditorRef(), queryConfirmationData, true)}
          onCancel={() => onQueryConfirmOrCancel(getEditorRef(), queryConfirmationList[0])}
          queryConfirmationData={queryConfirmationList[0]}
          darkMode={props.darkMode}
          key={queryConfirmationList[0]?.queryName}
        />
        <Confirm
          show={showPageDeletionConfirmation?.isOpen ?? false}
          title={'Delete Page'}
          message={`Do you really want to delete ${showPageDeletionConfirmation?.pageName || 'this'} page?`}
          confirmButtonLoading={isDeletingPage}
          onConfirm={() => executeDeletepageRequest()}
          onCancel={() => cancelDeletePageRequest()}
          darkMode={props.darkMode}
        />
        {isVersionReleased && <ReleasedVersionError />}
        <EditorContextWrapper handleYmapEventUpdates={handleYmapEventUpdates}>
          <EditorHeader
            darkMode={props.darkMode}
            appDefinition={JSON.parse(JSON.stringify(appDefinition))}
            canUndo={canUndo}
            canRedo={canRedo}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            onNameChanged={onNameChanged}
            setAppDefinitionFromVersion={setAppDefinitionFromVersion}
            onVersionRelease={onVersionRelease}
            saveEditingVersion={saveEditingVersion}
            isMaintenanceOn={isMaintenanceOn}
            appName={appName}
            appId={appId}
            slug={slug}
          />
          <DndProvider backend={HTML5Backend}>
            <div className="sub-section">
              <LeftSidebar
                globalSettingsChanged={globalSettingsChanged}
                appId={appId}
                darkMode={props.darkMode}
                dataSourcesChanged={dataSourcesChanged}
                dataQueriesChanged={dataQueriesChanged}
                globalDataSourcesChanged={globalDataSourcesChanged}
                onZoomChanged={onZoomChanged}
                switchDarkMode={changeDarkMode}
                appDefinition={{
                  components: appDefinition?.pages[currentPageId]?.components ?? {},
                  pages: appDefinition?.pages ?? {},
                  homePageId: appDefinition?.homePageId ?? null,
                  showViewerNavigation: appDefinition?.showViewerNavigation,
                  globalSettings: appDefinition?.globalSettings ?? {},
                }}
                setSelectedComponent={setSelectedComponent}
                removeComponent={removeComponent}
                runQuery={(queryId, queryName, additionalArgs = {}) =>
                  handleRunQuery(queryId, queryName, additionalArgs)
                }
                ref={dataSourceModalRef}
                currentPageId={currentPageId}
                addNewPage={addNewPage}
                switchPage={switchPage}
                deletePage={deletePageRequest}
                renamePage={renamePage}
                clonePage={clonePage}
                hidePage={hidePage}
                unHidePage={unHidePage}
                disableEnablePage={disableEnablePage}
                updateHomePage={updateHomePage}
                updatePageHandle={updatePageHandle}
                showHideViewerNavigationControls={showHideViewerNavigation}
                updateOnSortingPages={updateOnSortingPages}
                setEditorMarginLeft={handleEditorMarginLeftChange}
                isMaintenanceOn={isMaintenanceOn}
                toggleAppMaintenance={toggleAppMaintenance}
              />
              {!showComments && (
                <EditorSelecto
                  selectionRef={selectionRef}
                  canvasContainerRef={canvasContainerRef}
                  setSelectedComponent={setSelectedComponent}
                  selectionDragRef={selectionDragRef}
                  appDefinition={appDefinition}
                  currentPageId={currentPageId}
                />
              )}
              <div
                className={`main main-editor-canvas ${isQueryPaneDragging || isDragging ? 'hide-scrollbar' : ''}`}
                id="main-editor-canvas"
              >
                <div
                  className={cx(
                    'canvas-container align-items-center',
                    { 'dark-theme theme-dark': isAppDarkMode },
                    { 'hide-sidebar': !showLeftSidebar }
                  )}
                  style={{
                    transform: `scale(${zoomLevel})`,
                    borderLeft:
                      (editorMarginLeft ? editorMarginLeft - 1 : editorMarginLeft) +
                      `px solid ${computeCanvasBackgroundColor()}`,
                    height: computeCanvasContainerHeight(),
                    background: !isAppDarkMode ? '#EBEBEF' : '#2E3035',
                  }}
                  onMouseUp={handleCanvasContainerMouseUp}
                  ref={canvasContainerRef}
                  onScroll={() => {
                    selectionRef.current?.checkScroll();
                  }}
                >
                  <div style={{ minWidth: `calc((100vw - 300px) - 48px)` }}>
                    <div
                      className="canvas-area"
                      style={{
                        width: currentLayout === 'desktop' ? '100%' : '450px',
                        maxWidth:
                          +appDefinition.globalSettings.canvasMaxWidth +
                          appDefinition.globalSettings.canvasMaxWidthType,

                        backgroundColor: computeCanvasBackgroundColor(),
                        transform: 'translateZ(0)', //Hack to make modal position respect canvas container, else it positions w.r.t window.
                      }}
                    >
                      {config.ENABLE_MULTIPLAYER_EDITING && (
                        <RealtimeCursors editingVersionId={editingVersionId} editingPageId={currentPageId} />
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
                        <div>
                          <Container
                            widthOfCanvas={canvasWidth}
                            socket={socket}
                            appDefinitionChanged={appDefinitionChanged}
                            snapToGrid={true}
                            darkMode={isAppDarkMode}
                            mode={
                              appDefinition.pages[currentPageId]?.autoComputeLayout && currentLayout === 'mobile'
                                ? 'view'
                                : 'edit'
                            }
                            zoomLevel={zoomLevel}
                            appLoading={isLoading}
                            onEvent={handleEvent}
                            setSelectedComponent={setSelectedComponent}
                            handleUndo={handleUndo}
                            handleRedo={handleRedo}
                            removeComponent={removeComponent}
                            onComponentClick={noop} // Prop is used in Viewer hence using a dummy function to prevent error in editor
                            currentPageId={currentPageId}
                          />
                          <CustomDragLayer
                            snapToGrid={true}
                            canvasWidth={canvasWidth}
                            onDragging={(isDragging) => setIsDragging(isDragging)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <AutoLayoutAlert
                    show={appDefinition.pages[currentPageId]?.autoComputeLayout && currentLayout === 'mobile'}
                    onClick={turnOffAutoLayout}
                  />
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
                  editorRef={getEditorRef()}
                />
                <ReactTooltip id="tooltip-for-add-query" className="tooltip" />
              </div>
              <div className={cx('editor-sidebar', { 'dark-theme theme-dark': props.darkMode })}>
                <EditorKeyHooks
                  moveComponents={moveComponents}
                  cloneComponents={cloningComponents}
                  copyComponents={copyComponents}
                  cutComponents={cutComponents}
                  handleEditorEscapeKeyPress={handleEditorEscapeKeyPress}
                  removeMultipleComponents={removeComponents}
                />
                <RightSidebarTabManager
                  inspectorTab={
                    <div className="pages-container">
                      <Inspector
                        moveComponents={moveComponents}
                        componentDefinitionChanged={componentDefinitionChanged}
                        removeComponent={removeComponent}
                        allComponents={appDefinition?.pages[currentPageId]?.components}
                        darkMode={props.darkMode}
                        pages={getPagesWithIds()}
                        cloneComponents={cloningComponents}
                      />
                    </div>
                  }
                  widgetManagerTab={
                    <WidgetManager
                      componentTypes={componentTypes}
                      zoomLevel={zoomLevel}
                      darkMode={props.darkMode}
                      disabled={appDefinition.pages[currentPageId]?.autoComputeLayout && currentLayout === 'mobile'}
                    />
                  }
                  allComponents={appDefinition.pages[currentPageId]?.components}
                />
              </div>
              {config.COMMENT_FEATURE_ENABLE && showComments && (
                <div className={cx({ 'dark-theme theme-dark': props.darkMode })}>
                  <CommentNotifications socket={socket} pageId={currentPageId} />
                </div>
              )}
            </div>
          </DndProvider>
        </EditorContextWrapper>
        <ConfirmDialog confirmButtonText="Turn off" darkMode={props.darkMode} />
      </div>
    </HotkeysProvider>
  );
};

export const Editor = withTranslation()(withRouter(EditorComponent));
