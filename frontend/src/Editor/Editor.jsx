import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  appService,
  authenticationService,
  appVersionService,
  orgEnvironmentVariableService,
  appEnvironmentService,
  orgEnvironmentConstantService,
  appsService,
} from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import _, { cloneDeep, isEqual, isEmpty, debounce, omit, noop } from 'lodash';
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
const { produce, enablePatches, setAutoFreeze } = require('immer');
import { createWebsocketConnection } from '@/_helpers/websocketConnection';
import RealtimeCursors from '@/Editor/RealtimeCursors';
import { initEditorWalkThrough } from '@/_helpers/createWalkThrough';
import { EditorContextWrapper } from './Context/EditorContextWrapper';
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
import { useAppVersionStore, useAppVersionActions, useAppVersionState } from '@/_stores/appVersionStore';
import { useQueryPanelStore } from '@/_stores/queryPanelStore';
import { useCurrentStateStore, useCurrentState, getCurrentState } from '@/_stores/currentStateStore';
import { computeAppDiff, computeComponentPropertyDiff, isParamFromTableColumn, resetAllStores } from '@/_stores/utils';
import { setCookie } from '@/_helpers/cookie';
import { EMPTY_ARRAY, useEditorActions, useEditorStore } from '@/_stores/editorStore';
import { useAppDataActions, useAppInfo, useAppDataStore } from '@/_stores/appDataStore';
import { useMounted } from '@/_hooks/use-mount';
import EditorSelecto from './EditorSelecto';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';

import useDebouncedArrowKeyPress from '@/_hooks/useDebouncedArrowKeyPress';
import RightSidebarTabManager from './RightSidebarTabManager';
import { shallow } from 'zustand/shallow';

setAutoFreeze(false);
enablePatches();

function setWindowTitle(name) {
  document.title = name ? `${name} - Tooljet` : `My App - Tooljet`;
}

const decimalToHex = (alpha) => (alpha === 0 ? '00' : Math.round(255 * alpha).toString(16));

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

  const { updateEditorState, updateQueryConfirmationList, setSelectedComponents, setCurrentPageId } =
    useEditorActions();

  const { setAppVersions } = useAppVersionActions();
  const { isVersionReleased, editingVersionId, releasedVersionId } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state?.isVersionReleased,
      editingVersionId: state?.editingVersion?.id,
      releasedVersionId: state?.releasedVersionId,
    }),
    shallow
  );
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

  const currentState = useCurrentState();

  const [zoomLevel, setZoomLevel] = useState(1);
  const [isQueryPaneDragging, setIsQueryPaneDragging] = useState(false);
  const [isQueryPaneExpanded, setIsQueryPaneExpanded] = useState(false); //!check where this is used
  const [editorMarginLeft, setEditorMarginLeft] = useState(0);

  const [isDragging, setIsDragging] = useState(false);

  const [showPageDeletionConfirmation, setShowPageDeletionConfirmation] = useState(null);
  const [isDeletingPage, setIsDeletingPage] = useState(false);

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
  const prevEventsStoreRef = useRef(events);

  useLayoutEffect(() => {
    resetAllStores();
  }, []);

  useEffect(() => {
    updateState({ isLoading: true });

    const currentSession = authenticationService.currentSessionValue;
    const currentUser = currentSession?.current_user;

    // Subscribe to changes in the current session using RxJS observable pattern
    const subscription = authenticationService.currentSession.subscribe((currentSession) => {
      if (currentUser && currentSession?.group_permissions) {
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
            ...currentState.globals,
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
      document.title = 'Tooljet - Dashboard';
      socket && socket?.close();
      subscription.unsubscribe();
      if (config.ENABLE_MULTIPLAYER_EDITING) props?.provider?.disconnect();
      useEditorStore.getState().actions.setIsEditorActive(false);
      prevAppDefinition.current = null;
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

      if (useEditorStore.getState().isUpdatingEditorStateInProcess) {
        autoSave();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ appDefinition, currentPageId, dataQueries })]);

  useEffect(
    () => {
      const components = appDefinition?.pages?.[currentPageId]?.components || {};
      computeComponentState(components);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPageId]
  );

  useEffect(() => {
    // This effect runs when lastKeyPressTimestamp changes
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
  }, [currentLayout, mounted]);

  useEffect(() => {
    if (mounted && JSON.stringify(prevEventsStoreRef.current) !== JSON.stringify(events)) {
      props.ymap?.set('eventHandlersUpdated', {
        updated: true,
        currentVersionId: currentVersionId,
        currentSessionId: currentSessionId,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ events })]);

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

  const fetchOrgEnvironmentConstants = () => {
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

        const ymapOpts = ymapUpdates?.opts;

        realtimeSave(props.ymap?.get('appDef').newDefinition, {
          skipAutoSave: true,
          skipYmapUpdate: true,
          currentSessionId: ymapUpdates.currentSessionId,
          componentAdding: ymapUpdates?.opts?.componentAdded,
          componentDeleting: ymapUpdates?.opts?.componentDeleted,
        });
      }

      if (ymapEventHandlersUpdated) {
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
      if (data === 'versionReleased') fetchApp();
      // else if (data === 'dataQueriesChanged') {
      //   fetchDataQueries(editingVersion?.id);
      // } else if (data === 'dataSourcesChanged') {
      //   fetchDataSources(editingVersion?.id);
      // }
    });
  };

  const $componentDidMount = async () => {
    window.addEventListener('message', handleMessage);

    await fetchApp(props.params.pageHandle, true);
    await fetchApps(0);
    await fetchOrgEnvironmentVariables();
    await fetchOrgEnvironmentConstants();
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

    getCanvasWidth();
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

  const onVersionDelete = () => {
    fetchApp(props.params.pageHandle);
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
    updateState({ appName: newName });
    setWindowTitle(newName);
  };

  const onZoomChanged = (zoom) => {
    setZoomLevel(zoom);
  };

  const getCanvasWidth = () => {
    const canvasBoundingRect = document.getElementsByClassName('canvas-area')[0]?.getBoundingClientRect();

    const _canvasWidth = canvasBoundingRect?.width;
    return _canvasWidth;
  };
  const computeCanvasContainerHeight = () => {
    // 45 = (height of header)
    // 85 = (the height of the query panel header when minimised) + (height of header)
    return `calc(${100}% - ${Math.max(useQueryPanelStore.getState().queryPanelHeight + 45, 85)}px)`;
  };

  const handleQueryPaneDragging = (bool) => setIsQueryPaneDragging(bool);
  const handleQueryPaneExpanding = (bool) => setIsQueryPaneExpanded(bool);

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
        ...currentState.globals,
        theme: { name: newMode ? 'dark' : 'light' },
      },
    });
    props.switchDarkMode(newMode);
  };

  const handleEvent = (eventName, event, options) => {
    return onEvent(getEditorRef(), eventName, event, options, 'edit');
  };

  const handleRunQuery = (queryId, queryName) => runQuery(getEditorRef(), queryId, queryName);

  const dataSourceModalHandler = () => {
    dataSourceModalRef.current.dataSourceModalToggleStateHandler();
  };

  const setSelectedComponent = (id, component, multiSelect = false) => {
    const isAlreadySelected = useEditorStore.getState()?.selectedComponents.find((component) => component.id === id);

    if (!isAlreadySelected) {
      setSelectedComponents([{ id, component }], multiSelect);
    }
  };

  const onVersionRelease = (versionId) => {
    useAppVersionStore.getState().actions.updateReleasedVersionId(versionId);

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

  const getPagesWithIds = () => {
    //! Needs attention
    return Object.entries(appDefinition?.pages).map(([id, page]) => ({ ...page, id }));
  };

  const handleEditorMarginLeftChange = (value) => {
    setEditorMarginLeft(value);
  };

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
  };

  const callBack = async (data, startingPageHandle, versionSwitched = false) => {
    setWindowTitle(data.name);
    useAppVersionStore.getState().actions.updateEditingVersion(data.editing_version);
    if (!releasedVersionId || !versionSwitched) {
      useAppVersionStore.getState().actions.updateReleasedVersionId(data.current_version_id);
    }

    const appVersions = await appEnvironmentService.getVersionsByEnvironment(data?.id);
    setAppVersions(appVersions.appVersions);
    const currentOrgId = data?.organization_id || data?.organizationId;

    updateState({
      slug: data.slug,
      isMaintenanceOn: data?.is_maintenance_on,
      organizationId: currentOrgId,
      isPublic: data?.is_public || data?.isPublic,
      appName: data?.name,
      userId: data?.user_id,
      appId: data?.id,
      events: data.events,
      currentVersionId: data?.editing_version?.id,
      app: data,
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

    if (versionSwitched) {
      props?.navigate(`/${getWorkspaceId()}/apps/${data.slug ?? appId}/${appJson.pages[homePageId]?.handle}`, {
        state: {
          isSwitchingPage: true,
        },
      });
    }

    await useDataSourcesStore.getState().actions.fetchGlobalDataSources(data?.organization_id);
    await fetchDataSources(data.editing_version?.id);
    await fetchDataQueries(data.editing_version?.id, true, true);
    const currentPageEvents = data.events.filter((event) => event.target === 'page' && event.sourceId === homePageId);

    await handleEvent('onPageLoad', currentPageEvents, {}, true);
  };

  const fetchApp = async (startingPageHandle, onMount = false) => {
    const _appId = props?.params?.id || props?.params?.slug;

    if (!onMount) {
      await appService.fetchApp(_appId).then((data) => callBack(data, startingPageHandle));
    } else {
      callBack(app, startingPageHandle);
    }
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

      callBack(appData, null, true);
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
    const copyOfAppDefinition = JSON.parse(JSON.stringify(useEditorStore.getState().appDefinition));

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
        // else if (opts?.componentAdding) {
        //   const currentPageComponents = newDefinition.pages[_currentPageId]?.components;

        //   const finalComponents = _.merge(draft?.pages[_currentPageId]?.components, currentPageComponents);

        //   draft.pages[_currentPageId].components = finalComponents;
        // } else {
        //   Object.assign(draft, newDefinition);
        // }
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

      updateEditorState({
        isUpdatingEditorStateInProcess: updatingEditorStateInProcess,
        appDefinition: updatedAppDefinition,
      });
    }
  };

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
    } else if (!isEmpty(editingVersion)) {
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
        .catch(() => {
          updateEditorState({
            saveError: true,
            isUpdatingEditorStateInProcess: false,
          });
          toast.error('App could not save.');
        })
        .finally(() => {
          updateState({
            appDiffOptions: {},
          });
        })
        .finally(() => {
          if (appDiffOptions?.cloningComponent) {
            cloneEventsForClonedComponents(
              updateDiff.updateDiff,
              updateDiff.operation,
              appDiffOptions?.cloningComponent
            );
          }
        });
    }
    updateEditorState({
      saveError: false,
      isUpdatingEditorStateInProcess: false,
    });
  };

  const realtimeSave = debounce(appDefinitionChanged, 100);
  const autoSave = debounce(saveEditingVersion, 150);

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
  };
  const removeComponent = (componentId) => {
    if (!isVersionReleased) {
      let newDefinition = cloneDeep(appDefinition);

      let childComponents = [];

      if (newDefinition.pages[currentPageId].components?.[componentId].component.component === 'Tabs') {
        childComponents = Object.keys(newDefinition.pages[currentPageId].components).filter((key) =>
          newDefinition.pages[currentPageId].components[key].component.parent?.startsWith(componentId)
        );
      } else {
        childComponents = Object.keys(newDefinition.pages[currentPageId].components).filter(
          (key) => newDefinition.pages[currentPageId].components[key].component.parent === componentId
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
    } else {
      useAppVersionStore.getState().actions.enableReleasedVersionPopupState();
    }
  };

  const moveComponents = (direction) => {
    const gridWidth = (1 * 100) / 43; // width of the canvas grid in percentage
    const _appDefinition = _.cloneDeep(appDefinition);
    let newComponents = _appDefinition?.pages[currentPageId].components;
    const selectedComponents = useEditorStore.getState()?.selectedComponents;

    for (const selectedComponent of selectedComponents) {
      let top = newComponents[selectedComponent.id].layouts[currentLayout].top;
      let left = newComponents[selectedComponent.id].layouts[currentLayout].left;

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

  const removeComponents = () => {
    const selectedComponents = useEditorStore.getState()?.selectedComponents;
    if (!isVersionReleased && selectedComponents?.length > 1) {
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
    props?.navigate(`/${getWorkspaceId()}/apps/${slug ?? appId}/${newHandle}`, {
      state: {
        isSwitchingPage: true,
      },
    });

    const page = {
      id: newPageId,
      name,
      handle,
      variables: copyOfAppDefinition.pages[newPageId]?.variables ?? {},
    };

    const globals = {
      ...currentState.globals,
    };
    useCurrentStateStore.getState().actions.setCurrentState({ globals, page });
  };

  const switchPage = (pageId, queryParams = []) => {
    // This are fetched from store to handle runQueriesOnAppLoad
    const currentPageId = useEditorStore.getState().currentPageId;
    const appDefinition = useEditorStore.getState().appDefinition;
    const appId = useAppDataStore.getState()?.appId;
    const pageHandle = getCurrentState().pageHandle;

    if (currentPageId === pageId && pageHandle === appDefinition?.pages[pageId]?.handle) {
      return;
    }
    const { name, handle } = appDefinition.pages[pageId];

    if (!name || !handle) return;
    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));
    const queryParamsString = queryParams.map(([key, value]) => `${key}=${value}`).join('&');

    props?.navigate(`/${getWorkspaceId()}/apps/${slug ?? appId}/${handle}?${queryParamsString}`, {
      state: {
        isSwitchingPage: true,
      },
    });

    const page = {
      id: pageId,
      name,
      handle,
      variables: copyOfAppDefinition.pages[pageId]?.variables ?? {},
    };

    const globals = {
      ...currentState.globals,
      urlparams: JSON.parse(JSON.stringify(queryString.parse(queryParamsString))),
    };
    useCurrentStateStore.getState().actions.setCurrentState({ globals, page });

    setCurrentPageId(pageId);

    const currentPageEvents = events.filter((event) => event.target === 'page' && event.sourceId === page.id);

    handleEvent('onPageLoad', currentPageEvents);
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

  const disableEnablePage = ({ pageId, isDisabled }) => {
    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    const newAppDefinition = _.cloneDeep(copyOfAppDefinition);

    newAppDefinition.pages[pageId].disabled = isDisabled ?? false;

    switchPage(pageId);
    appDefinitionChanged(newAppDefinition, {
      pageDefinitionChanged: true,
    });
  };

  const hidePage = (pageId) => {
    updateEditorState({
      isUpdatingEditorStateInProcess: true,
    });

    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    const newAppDefinition = _.cloneDeep(copyOfAppDefinition);

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

    const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

    const newAppDefinition = _.cloneDeep(copyOfAppDefinition);

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
      .then((data) => {
        const copyOfAppDefinition = JSON.parse(JSON.stringify(appDefinition));

        const pages = data.pages.reduce((acc, page) => {
          const currentComponents = buildComponentMetaDefinition(_.cloneDeep(page?.components));

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
      })
      .finally(() => setIsSaving(false));
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

  const handleCanvasContainerMouseUp = (e) => {
    if (
      ['real-canvas', 'modal'].includes(e.target.className) &&
      useEditorStore.getState()?.selectedComponents?.length
    ) {
      setSelectedComponents(EMPTY_ARRAY);
    }
  };

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
      <EditorContextWrapper>
        <EditorHeader
          darkMode={props.darkMode}
          appDefinition={_.cloneDeep(appDefinition)}
          canUndo={canUndo}
          canRedo={canRedo}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          // saveError={saveError}
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
              globalSettingsChanged={globalSettingsChanged}
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
                pages: appDefinition?.pages ?? {},
                homePageId: appDefinition?.homePageId ?? null,
                showViewerNavigation: appDefinition?.showViewerNavigation,
                globalSettings: appDefinition?.globalSettings ?? {},
              }}
              setSelectedComponent={setSelectedComponent}
              removeComponent={removeComponent}
              runQuery={(queryId, queryName) => handleRunQuery(queryId, queryName)}
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
                className={`canvas-container align-items-center ${!showLeftSidebar && 'hide-sidebar'}`}
                style={{
                  transform: `scale(${zoomLevel})`,
                  borderLeft:
                    (editorMarginLeft ? editorMarginLeft - 1 : editorMarginLeft) +
                    `px solid ${computeCanvasBackgroundColor()}`,
                  height: computeCanvasContainerHeight(),
                  background: !props.darkMode ? '#EBEBEF' : '#2E3035',
                }}
                onMouseUp={handleCanvasContainerMouseUp}
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
                      <>
                        <Container
                          canvasWidth={getCanvasWidth()}
                          socket={socket}
                          appDefinition={appDefinition}
                          appDefinitionChanged={appDefinitionChanged}
                          snapToGrid={true}
                          darkMode={props.darkMode}
                          mode={'edit'}
                          zoomLevel={zoomLevel}
                          deviceWindowWidth={deviceWindowWidth}
                          appLoading={isLoading}
                          onEvent={handleEvent}
                          onComponentOptionChanged={handleOnComponentOptionChanged}
                          onComponentOptionsChanged={handleOnComponentOptionsChanged}
                          setSelectedComponent={setSelectedComponent}
                          handleUndo={handleUndo}
                          handleRedo={handleRedo}
                          removeComponent={removeComponent}
                          onComponentClick={noop} // Prop is used in Viewer hence using a dummy function to prevent error in editor
                          sideBarDebugger={sideBarDebugger}
                          currentPageId={currentPageId}
                        />
                        <CustomDragLayer
                          snapToGrid={true}
                          canvasWidth={getCanvasWidth()}
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
                editorRef={getEditorRef()}
              />
              <ReactTooltip id="tooltip-for-add-query" className="tooltip" />
            </div>
            <div className="editor-sidebar">
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
                    />
                  </div>
                }
                widgetManagerTab={
                  <WidgetManager componentTypes={componentTypes} zoomLevel={zoomLevel} darkMode={props.darkMode} />
                }
                allComponents={appDefinition.pages[currentPageId]?.components}
              />
            </div>
            {config.COMMENT_FEATURE_ENABLE && showComments && (
              <CommentNotifications socket={socket} pageId={currentPageId} />
            )}
          </div>
        </DndProvider>
      </EditorContextWrapper>
    </div>
  );
};

export const Editor = withTranslation()(withRouter(EditorComponent));
