/* eslint-disable import/no-named-as-default */
import React from 'react';
import cx from 'classnames';
import {
  datasourceService,
  dataqueryService,
  appService,
  authenticationService,
  appVersionService,
  orgEnvironmentVariableService,
} from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { defaults, cloneDeep, isEqual, isEmpty, debounce } from 'lodash';
import { Container } from './Container';
import { EditorKeyHooks } from './EditorKeyHooks';
import { CustomDragLayer } from './CustomDragLayer';
import { LeftSidebar } from './LeftSidebar';
import { componentTypes } from './WidgetManager/components';
import { Inspector } from './Inspector/Inspector';
import { DataSourceTypes } from './DataSourceManager/SourceComponents';
import { QueryManager, QueryPanel } from './QueryManager';
import { Link } from 'react-router-dom';
import { ManageAppUsers } from './ManageAppUsers';
import { ReleaseVersionButton } from './ReleaseVersionButton';
import {
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onEvent,
  onQueryConfirmOrCancel,
  runQuery,
  setStateAsync,
  computeComponentState,
  getSvgIcon,
  debuggerActions,
  cloneComponents,
  removeSelectedComponent,
} from '@/_helpers/appUtils';
import { Confirm } from './Viewer/Confirm';
import ReactTooltip from 'react-tooltip';
import CommentNotifications from './CommentNotifications';
import { WidgetManager } from './WidgetManager';
import Fuse from 'fuse.js';
import config from 'config';
import queryString from 'query-string';
import toast from 'react-hot-toast';
import produce, { enablePatches, setAutoFreeze, applyPatches } from 'immer';
import Logo from './Icons/logo.svg';
import EditIcon from './Icons/edit.svg';
import MobileSelectedIcon from './Icons/mobile-selected.svg';
import DesktopSelectedIcon from './Icons/desktop-selected.svg';
import { AppVersionsManager } from './AppVersionsManager';
import { SearchBoxComponent } from '@/_ui/Search';
import { createWebsocketConnection } from '@/_helpers/websocketConnection';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import RealtimeAvatars from './RealtimeAvatars';
import RealtimeCursors from '@/Editor/RealtimeCursors';
import { initEditorWalkThrough } from '@/_helpers/createWalkThrough';
import { EditorContextWrapper } from './Context/EditorContextWrapper';
// eslint-disable-next-line import/no-unresolved
import Selecto from 'react-selecto';
import { withTranslation } from 'react-i18next';
import { v4 as uuid } from 'uuid';

setAutoFreeze(false);
enablePatches();

class EditorComponent extends React.Component {
  constructor(props) {
    super(props);

    const appId = this.props.match.params.id;

    const currentUser = authenticationService.currentUserValue;

    const { socket } = createWebsocketConnection(appId);

    this.renameQueryNameId = React.createRef();
    this.newNameForQuery = React.createRef();

    this.socket = socket;
    let userVars = {};

    if (currentUser) {
      userVars = {
        email: currentUser.email,
        firstName: currentUser.first_name,
        lastName: currentUser.last_name,
        groups: currentUser?.group_permissions.map((group) => group.group),
      };
    }

    this.defaultDefinition = {
      components: {},
      globalSettings: {
        hideHeader: false,
        appInMaintenance: false,
        canvasMaxWidth: 1292,
        canvasMaxHeight: 2400,
        canvasBackgroundColor: props.darkMode ? '#2f3c4c' : '#edeff5',
        backgroundFxQuery: '',
      },
    };

    this.dataSourceModalRef = React.createRef();
    this.canvasContainerRef = React.createRef();
    this.selectionRef = React.createRef();
    this.selectionDragRef = React.createRef();

    this.state = {
      currentUser: authenticationService.currentUserValue,
      app: {},
      allComponentTypes: componentTypes,
      isLoading: true,
      users: null,
      appId,
      editingVersion: null,
      loadingDataSources: true,
      loadingDataQueries: true,
      showLeftSidebar: true,
      showComments: false,
      zoomLevel: 1.0,
      currentLayout: 'desktop',
      deviceWindowWidth: 450,
      appDefinition: this.defaultDefinition,
      currentState: {
        queries: {},
        components: {},
        globals: {
          currentUser: userVars,
          theme: { name: props.darkMode ? 'dark' : 'light' },
          urlparams: JSON.parse(JSON.stringify(queryString.parse(props.location.search))),
        },
        errors: {},
        variables: {},
        client: {},
        server: {},
      },
      apps: [],
      dataQueriesDefaultText: "You haven't created queries yet.",
      // showQuerySearchField: false,
      isDeletingDataQuery: false,
      queryConfirmationList: [],
      showCreateVersionModalPrompt: false,
      isSourceSelected: false,
      isSaving: false,
      isUnsavedQueriesAvailable: false,
      selectionInProgress: false,
      scrollOptions: {},
    };

    this.autoSave = debounce(this.saveEditingVersion, 3000);
    this.realtimeSave = debounce(this.appDefinitionChanged, 500);
  }

  setWindowTitle(name) {
    document.title = name ? `${name} - Tooljet` : `Untitled App - Tooljet`;
  }

  componentDidMount() {
    this.fetchApps(0);
    this.fetchApp();
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
      if (!isEqual(this.state.editingVersion?.id, this.props.ymap?.get('appDef').editingVersionId)) return;
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
      this.setState({
        currentState: {
          ...this.state.currentState,
          server: server_variables,
          client: client_variables,
        },
      });
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (!isEqual(prevState.appDefinition, this.state.appDefinition)) {
      computeComponentState(this, this.state.appDefinition.components);
    }
  }

  isVersionReleased = (version = this.state.editingVersion) => {
    if (isEmpty(version)) {
      return false;
    }
    return this.state.app.current_version_id === version.id;
  };

  closeCreateVersionModalPrompt = () => {
    this.setState({ isSaving: false, showCreateVersionModalPrompt: false });
  };

  initEventListeners() {
    this.socket?.addEventListener('message', (event) => {
      if (event.data === 'versionReleased') this.fetchApp();
      else if (event.data === 'dataQueriesChanged') this.fetchDataQueries();
      else if (event.data === 'dataSourcesChanged') this.fetchDataSources();
    });
  }

  componentWillUnmount() {
    document.title = 'Tooljet - Dashboard';
    this.socket && this.socket?.close();
    if (config.ENABLE_MULTIPLAYER_EDITING) this.props?.provider?.disconnect();
  }

  // 1. When we receive an undoable action – we can always undo but cannot redo anymore.
  // 2. Whenever you perform an undo – you can always redo and keep doing undo as long as we have a patch for it.
  // 3. Whenever you redo – you can always undo and keep doing redo as long as we have a patch for it.
  initComponentVersioning = () => {
    this.currentVersion = -1;
    this.currentVersionChanges = {};
    this.noOfVersionsSupported = 100;
    this.canUndo = false;
    this.canRedo = false;
  };

  fetchDataSources = () => {
    this.setState(
      {
        loadingDataSources: true,
      },
      () => {
        datasourceService.getAll(this.state.appId, this.state.editingVersion?.id).then((data) =>
          this.setState({
            dataSources: data.data_sources,
            loadingDataSources: false,
          })
        );
      }
    );
  };

  fetchDataQueries = () => {
    this.setState(
      {
        loadingDataQueries: true,
      },
      () => {
        dataqueryService.getAll(this.state.appId, this.state.editingVersion?.id).then((data) => {
          this.setState(
            {
              allDataQueries: data.data_queries,
              dataQueries: data.data_queries,
              filterDataQueries: data.data_queries,
              loadingDataQueries: false,
              app: {
                ...this.state.app,
                data_queries: data.data_queries,
              },
            },
            () => {
              let queryState = {};
              data.data_queries.forEach((query) => {
                if (query.plugin_id) {
                  queryState[query.name] = {
                    ...query.plugin.manifest_file.data.source.exposedVariables,
                    kind: query.plugin.manifest_file.data.source.kind,
                    ...this.state.currentState.queries[query.name],
                  };
                } else {
                  queryState[query.name] = {
                    ...DataSourceTypes.find((source) => source.kind === query.kind).exposedVariables,
                    kind: DataSourceTypes.find((source) => source.kind === query.kind).kind,
                    ...this.state.currentState.queries[query.name],
                  };
                }
              });

              // Select first query by default
              let selectedQuery =
                data.data_queries.find((dq) => dq.id === this.state.selectedQuery?.id) || data.data_queries[0];
              let editingQuery = selectedQuery ? true : false;

              this.setState({
                selectedQuery,
                editingQuery,
                currentState: {
                  ...this.state.currentState,
                  queries: {
                    ...queryState,
                  },
                },
                // showQuerySearchField: false,
              });
              this.runQueries(data.data_queries);
            }
          );
        });
      }
    );
  };

  runQueries = (queries) => {
    queries.forEach((query) => {
      if (query.options.runOnPageLoad) {
        runQuery(this, query.id, query.name);
      }
    });
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
        isLoading: false,
      })
    );
  };

  fetchApp = () => {
    const appId = this.props.match.params.id;

    appService.getApp(appId).then(async (data) => {
      const dataDefinition = defaults(data.definition, this.defaultDefinition);
      this.setState(
        {
          app: data,
          isLoading: false,
          editingVersion: data.editing_version,
          appDefinition: dataDefinition,
          slug: data.slug,
        },
        async () => {
          if (isEmpty(this.state.editingVersion)) await this.createInitVersion(appId);

          computeComponentState(this, this.state.appDefinition.components);
          this.setWindowTitle(data.name);
          this.setState({
            showComments: !!queryString.parse(this.props.location.search).threadId,
          });
        }
      );

      this.fetchDataSources();
      this.fetchDataQueries();
    });
  };

  createInitVersion = async (appId) => {
    return appVersionService
      .create(appId, 'v1')
      .then(() => {
        initEditorWalkThrough();
        this.fetchApp();
      })
      .catch((err) => {
        toast.success(err?.error ?? 'Version creation failed');
      });
  };

  setAppDefinitionFromVersion = (version) => {
    this.appDefinitionChanged(defaults(version.definition, this.defaultDefinition), {
      skipAutoSave: true,
      skipYmapUpdate: true,
    });
    this.setState({
      editingVersion: version,
      isSaving: false,
    });

    this.saveEditingVersion();
    this.fetchDataSources();
    this.fetchDataQueries();
    this.initComponentVersioning();
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
      this.fetchDataSources();
    }
  };

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
   */
  dataQueriesChanged = () => {
    this.setState({ addingQuery: false }, () => {
      if (this.socket instanceof WebSocket && this.socket?.readyState === WebSocket.OPEN) {
        this.socket?.send(
          JSON.stringify({
            event: 'events',
            data: { message: 'dataQueriesChanged', appId: this.state.appId },
          })
        );
      } else {
        this.fetchDataQueries();
      }
    });
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
    this.currentVersion++;
    this.currentVersionChanges[this.currentVersion] = {
      redo: patches,
      undo: inversePatches,
    };

    this.canUndo = this.currentVersionChanges.hasOwnProperty(this.currentVersion);
    this.canRedo = this.currentVersionChanges.hasOwnProperty(this.currentVersion + 1);

    delete this.currentVersionChanges[this.currentVersion + 1];
    delete this.currentVersionChanges[this.currentVersion - this.noOfVersionsSupported];
  };

  handleUndo = () => {
    if (this.canUndo) {
      const appDefinition = applyPatches(
        this.state.appDefinition,
        this.currentVersionChanges[this.currentVersion--].undo
      );

      this.canUndo = this.currentVersionChanges.hasOwnProperty(this.currentVersion);
      this.canRedo = true;

      if (!appDefinition) return;
      this.setState(
        {
          appDefinition,
        },
        () => {
          this.props.ymap?.set('appDef', {
            newDefinition: appDefinition,
            editingVersionId: this.state.editingVersion?.id,
          });
        }
      );
    }
  };

  handleRedo = () => {
    if (this.canRedo) {
      const appDefinition = applyPatches(
        this.state.appDefinition,
        this.currentVersionChanges[++this.currentVersion].redo
      );

      this.canUndo = true;
      this.canRedo = this.currentVersionChanges.hasOwnProperty(this.currentVersion + 1);

      if (!appDefinition) return;
      this.setState(
        {
          appDefinition,
        },
        () => {
          this.props.ymap?.set('appDef', {
            newDefinition: appDefinition,
            editingVersionId: this.state.editingVersion?.id,
          });
        }
      );
    }
  };

  appDefinitionChanged = (newDefinition, opts = {}) => {
    if (isEqual(this.state.appDefinition, newDefinition)) return;
    if (config.ENABLE_MULTIPLAYER_EDITING && !opts.skipYmapUpdate) {
      this.props.ymap?.set('appDef', { newDefinition, editingVersionId: this.state.editingVersion?.id });
    }

    produce(
      this.state.appDefinition,
      (draft) => {
        draft.components = newDefinition.components;
      },
      this.handleAddPatch
    );
    this.setState({ isSaving: true, appDefinition: newDefinition, appDefinitionLocalVersion: uuid() }, () => {
      if (!opts.skipAutoSave) this.autoSave();
    });
    computeComponentState(this, newDefinition.components);
  };

  handleInspectorView = () => {
    this.switchSidebarTab(2);
  };

  handleSlugChange = (newSlug) => {
    this.setState({ slug: newSlug });
  };

  removeComponents = () => {
    if (!this.isVersionReleased() && this.state?.selectedComponents?.length > 1) {
      let newDefinition = cloneDeep(this.state.appDefinition);
      const selectedComponents = this.state?.selectedComponents;

      removeSelectedComponent(newDefinition, selectedComponents);
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
        skipAutoSave: this.isVersionReleased(),
      });
      this.handleInspectorView();
    } else if (this.isVersionReleased()) {
      this.setState({ showCreateVersionModalPrompt: true });
    }
  };

  removeComponent = (component) => {
    if (!this.isVersionReleased()) {
      let newDefinition = cloneDeep(this.state.appDefinition);
      // Delete child components when parent is deleted

      let childComponents = [];

      if (newDefinition.components[component.id].component.component === 'Tabs') {
        childComponents = Object.keys(newDefinition.components).filter((key) =>
          newDefinition.components[key].parent?.startsWith(component.id)
        );
      } else {
        childComponents = Object.keys(newDefinition.components).filter(
          (key) => newDefinition.components[key].parent === component.id
        );
      }

      childComponents.forEach((componentId) => {
        delete newDefinition.components[componentId];
      });

      delete newDefinition.components[component.id];
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
        skipAutoSave: this.isVersionReleased(),
      });
      this.handleInspectorView();
    } else {
      this.setState({ showCreateVersionModalPrompt: true });
    }
  };

  componentDefinitionChanged = (componentDefinition) => {
    let _self = this;

    if (this.state.appDefinition?.components[componentDefinition.id]) {
      const newDefinition = {
        appDefinition: produce(this.state.appDefinition, (draft) => {
          draft.components[componentDefinition.id].component = componentDefinition.component;
        }),
      };

      produce(
        this.state.appDefinition,
        (draft) => {
          draft.components[componentDefinition.id].component = componentDefinition.component;
        },
        this.handleAddPatch
      );
      setStateAsync(_self, newDefinition).then(() => {
        computeComponentState(_self, _self.state.appDefinition.components);
        this.setState({ isSaving: true });
        this.autoSave();
        this.props.ymap?.set('appDef', {
          newDefinition: newDefinition.appDefinition,
          editingVersionId: this.state.editingVersion?.id,
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
    let newComponents = appDefinition.components;

    for (const selectedComponent of this.state.selectedComponents) {
      newComponents = produce(newComponents, (draft) => {
        let top = draft[selectedComponent.id].layouts[this.state.currentLayout].top;
        let left = draft[selectedComponent.id].layouts[this.state.currentLayout].left;

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

        draft[selectedComponent.id].layouts[this.state.currentLayout].top = top;
        draft[selectedComponent.id].layouts[this.state.currentLayout].left = left;
      });
    }
    appDefinition.components = newComponents;
    this.appDefinitionChanged(appDefinition);
  };

  cutComponents = () => cloneComponents(this, this.appDefinitionChanged, false, true);

  copyComponents = () => cloneComponents(this, this.appDefinitionChanged, false);

  cloneComponents = () => cloneComponents(this, this.appDefinitionChanged, true);

  decimalToHex = (alpha) => (alpha === 0 ? '00' : Math.round(255 * alpha).toString(16));

  globalSettingsChanged = (key, value) => {
    const appDefinition = { ...this.state.appDefinition };
    if (value?.[1]?.a == undefined) appDefinition.globalSettings[key] = value;
    else {
      const hexCode = `${value?.[0]}${this.decimalToHex(value?.[1]?.a)}`;
      appDefinition.globalSettings[key] = hexCode;
    }
    this.setState(
      {
        isSaving: true,
        appDefinition,
      },
      () => {
        this.props.ymap?.set('appDef', {
          newDefinition: appDefinition,
          editingVersionId: this.state.editingVersion?.id,
        });
        this.autoSave();
      }
    );
  };

  saveApp = (id, attributes, notify = false) => {
    appService.saveApp(id, attributes).then(() => {
      if (notify) {
        toast.success('App saved sucessfully');
      }
    });
  };

  saveAppName = (id, name, notify = false) => {
    if (!name.trim()) {
      toast("App name can't be empty or whitespace", {
        icon: '🚨',
      });

      this.setState({
        app: { ...this.state.app, name: this.state.oldName },
      });

      return;
    }
    this.saveApp(id, { name }, notify);
  };

  getSourceMetaData = (dataSource) => {
    if (dataSource.plugin_id) {
      return dataSource.plugin?.manifest_file?.data.source;
    }

    return DataSourceTypes.find((source) => source.kind === dataSource.kind);
  };

  renderDataSource = (dataSource) => {
    const sourceMeta = this.getSourceMetaData(dataSource);
    const icon = getSvgIcon(sourceMeta.kind.toLowerCase(), 25, 25, dataSource?.plugin?.icon_file?.data);

    return (
      <tr
        role="button"
        key={dataSource.name}
        onClick={() => {
          this.setState({
            selectedDataSource: dataSource,
            showDataSourceManagerModal: true,
          });
        }}
      >
        <td>
          {icon} {dataSource.name}
        </td>
      </tr>
    );
  };

  deleteDataQuery = () => {
    this.setState({ showDataQueryDeletionConfirmation: true });
  };
  createInputFieldToRenameQuery = (id) => {
    this.renameQueryNameId.current = id;
    this.setState({ renameQueryName: true });
  };

  updateQueryName = () => {
    if (this.newNameForQuery.current) {
      dataqueryService
        .update(this.state.selectedQuery.id, this.newNameForQuery.current)
        .then(() => {
          toast.success('Query Name Updated');
          this.setState({
            renameQueryName: false,
          });
          this.newNameForQuery.current = null;
          this.renameQueryNameId.current = null;
          this.dataQueriesChanged();
        })
        .catch(({ error }) => {
          this.setState({ renameQueryName: false });
          this.newNameForQuery.current = null;
          this.renameQueryNameId.current = null;
          toast.error(error);
        });
    } else {
      this.setState({ renameQueryName: false });
      this.renameQueryNameId.current = null;
    }
  };

  cancelDeleteDataQuery = () => {
    this.setState({ showDataQueryDeletionConfirmation: false });
  };

  executeDataQueryDeletion = () => {
    this.setState({
      showDataQueryDeletionConfirmation: false,
      isDeletingDataQuery: true,
    });
    dataqueryService
      .del(this.state.selectedQuery.id)
      .then(() => {
        toast.success('Query Deleted');
        this.setState({ isDeletingDataQuery: false });
        this.dataQueriesChanged();
      })
      .catch(({ error }) => {
        this.setState({ isDeletingDataQuery: false });
        toast.error(error);
      });
  };

  selectQuery = (dataQuery, mode = 'edit') => {
    if (mode === 'edit') {
      return this.setState({ editingQuery: true, selectedQuery: dataQuery, addingQuery: false });
    }
    this.setState({ editingQuery: false, selectedQuery: dataQuery, addingQuery: true });
  };

  renderDataQuery = (dataQuery) => {
    const sourceMeta = this.getSourceMetaData(dataQuery);
    const icon = getSvgIcon(sourceMeta.kind.toLowerCase(), 25, 25, dataQuery?.plugin?.icon_file?.data);

    let isSeletedQuery = false;
    if (this.state.selectedQuery) {
      isSeletedQuery = dataQuery.id === this.state.selectedQuery.id;
    }
    const isQueryBeingDeleted = this.state.isDeletingDataQuery && isSeletedQuery;
    // const { currentState } = this.state;

    // const isLoading = currentState.queries[dataQuery.name] ? currentState.queries[dataQuery.name].isLoading : false;
    return (
      <div
        className={
          'row query-row' + (isSeletedQuery ? ' query-row-selected' : '') + (this.props.darkMode ? ' dark' : '')
        }
        style={{
          border:
            this.state?.renameQueryName && this.renameQueryNameId?.current === dataQuery.id ? '1px solid blue' : '',
        }}
        key={dataQuery.id}
        onClick={() => this.selectQuery(dataQuery)}
        role="button"
      >
        <div className="col-auto query-icon d-flex">{icon}</div>
        <div className="col" style={{ fontWeight: '500' }}>
          <OverlayTrigger
            trigger={['hover', 'focus']}
            placement="top"
            delay={{ show: 800, hide: 100 }}
            overlay={<Tooltip id="button-tooltip">{dataQuery.name}</Tooltip>}
          >
            {this.state?.renameQueryName && this.renameQueryNameId?.current === dataQuery.id ? (
              <input
                className={`query-name border-0 bg-transparent ${this.props.darkMode && 'text-white'}`}
                type="text"
                defaultValue={dataQuery.name}
                autoFocus={true}
                onBlur={() => {
                  this.updateQueryName();
                }}
                onChange={({ target }) => {
                  this.newNameForQuery.current = target.value;
                  debounce(() => this.updateQueryName(), 1000)();
                }}
              />
            ) : (
              <div className="query-name">{dataQuery.name}</div>
            )}
          </OverlayTrigger>
        </div>
        <div className="col-auto">
          <span className="rename-query" onClick={() => this.createInputFieldToRenameQuery(dataQuery.id)}>
            <div className="d-flex">
              <svg width="12.67" height="12.67" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.7087 1.40712C14.29 0.826221 15.0782 0.499893 15.9 0.499893C16.7222 0.499893 17.5107 0.82651 18.0921 1.40789C18.6735 1.98928 19.0001 2.7778 19.0001 3.6C19.0001 4.42197 18.6737 5.21028 18.0926 5.79162C18.0924 5.79178 18.0928 5.79145 18.0926 5.79162L16.8287 7.06006C16.7936 7.11191 16.753 7.16118 16.7071 7.20711C16.6621 7.25215 16.6138 7.292 16.563 7.32665L9.70837 14.2058C9.52073 14.3942 9.26584 14.5 9 14.5H6C5.44772 14.5 5 14.0523 5 13.5V10.5C5 10.2342 5.10585 9.97927 5.29416 9.79163L12.1733 2.93697C12.208 2.88621 12.2478 2.83794 12.2929 2.79289C12.3388 2.74697 12.3881 2.70645 12.4399 2.67132L13.7079 1.40789C13.7082 1.40763 13.7084 1.40738 13.7087 1.40712ZM13.0112 4.92545L7 10.9153V12.5H8.58474L14.5745 6.48876L13.0112 4.92545ZM15.9862 5.07202L14.428 3.51376L15.1221 2.82211C15.3284 2.6158 15.6082 2.49989 15.9 2.49989C16.1918 2.49989 16.4716 2.6158 16.6779 2.82211C16.8842 3.02842 17.0001 3.30823 17.0001 3.6C17.0001 3.89177 16.8842 4.17158 16.6779 4.37789L15.9862 5.07202ZM0.87868 5.37868C1.44129 4.81607 2.20435 4.5 3 4.5H4C4.55228 4.5 5 4.94772 5 5.5C5 6.05228 4.55228 6.5 4 6.5H3C2.73478 6.5 2.48043 6.60536 2.29289 6.79289C2.10536 6.98043 2 7.23478 2 7.5V16.5C2 16.7652 2.10536 17.0196 2.29289 17.2071C2.48043 17.3946 2.73478 17.5 3 17.5H12C12.2652 17.5 12.5196 17.3946 12.7071 17.2071C12.8946 17.0196 13 16.7652 13 16.5V15.5C13 14.9477 13.4477 14.5 14 14.5C14.5523 14.5 15 14.9477 15 15.5V16.5C15 17.2957 14.6839 18.0587 14.1213 18.6213C13.5587 19.1839 12.7957 19.5 12 19.5H3C2.20435 19.5 1.44129 19.1839 0.87868 18.6213C0.31607 18.0587 0 17.2957 0 16.5V7.5C0 6.70435 0.31607 5.94129 0.87868 5.37868Z"
                  fill="#11181C"
                />
              </svg>
            </div>
          </span>
        </div>
        <div className="col-auto">
          {isQueryBeingDeleted ? (
            <div className="px-2">
              <div className="text-center spinner-border spinner-border-sm" role="status"></div>
            </div>
          ) : (
            <span className="delete-query" onClick={this.deleteDataQuery}>
              <div className="d-flex">
                <svg width="12" height="13.3" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.58579 0.585786C5.96086 0.210714 6.46957 0 7 0H11C11.5304 0 12.0391 0.210714 12.4142 0.585786C12.7893 0.960859 13 1.46957 13 2V4H15.9883C15.9953 3.99993 16.0024 3.99993 16.0095 4H17C17.5523 4 18 4.44772 18 5C18 5.55228 17.5523 6 17 6H16.9201L15.9997 17.0458C15.9878 17.8249 15.6731 18.5695 15.1213 19.1213C14.5587 19.6839 13.7957 20 13 20H5C4.20435 20 3.44129 19.6839 2.87868 19.1213C2.32687 18.5695 2.01223 17.8249 2.00035 17.0458L1.07987 6H1C0.447715 6 0 5.55228 0 5C0 4.44772 0.447715 4 1 4H1.99054C1.9976 3.99993 2.00466 3.99993 2.0117 4H5V2C5 1.46957 5.21071 0.960859 5.58579 0.585786ZM3.0868 6L3.99655 16.917C3.99885 16.9446 4 16.9723 4 17C4 17.2652 4.10536 17.5196 4.29289 17.7071C4.48043 17.8946 4.73478 18 5 18H13C13.2652 18 13.5196 17.8946 13.7071 17.7071C13.8946 17.5196 14 17.2652 14 17C14 16.9723 14.0012 16.9446 14.0035 16.917L14.9132 6H3.0868ZM11 4H7V2H11V4ZM6.29289 10.7071C5.90237 10.3166 5.90237 9.68342 6.29289 9.29289C6.68342 8.90237 7.31658 8.90237 7.70711 9.29289L9 10.5858L10.2929 9.29289C10.6834 8.90237 11.3166 8.90237 11.7071 9.29289C12.0976 9.68342 12.0976 10.3166 11.7071 10.7071L10.4142 12L11.7071 13.2929C12.0976 13.6834 12.0976 14.3166 11.7071 14.7071C11.3166 15.0976 10.6834 15.0976 10.2929 14.7071L9 13.4142L7.70711 14.7071C7.31658 15.0976 6.68342 15.0976 6.29289 14.7071C5.90237 14.3166 5.90237 13.6834 6.29289 13.2929L7.58579 12L6.29289 10.7071Z"
                    fill="#DB4324"
                  />
                </svg>
              </div>
            </span>
          )}
        </div>
      </div>
    );
  };

  onNameChanged = (newName) => {
    this.setState({
      app: { ...this.state.app, name: newName },
    });
    this.setWindowTitle(newName);
  };

  toggleComments = () => {
    this.setState({ showComments: !this.state.showComments });
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

  filterQueries = (value) => {
    if (value) {
      const fuse = new Fuse(this.state.allDataQueries, { keys: ['name'] });
      const results = fuse.search(value);
      let filterDataQueries = [];
      results.every((result) => {
        if (result.item.name === value) {
          filterDataQueries = [];
          filterDataQueries.push(result.item);
          return false;
        }
        filterDataQueries.push(result.item);
        return true;
      });
      this.setState({
        filterDataQueries,
        dataQueriesDefaultText: 'No Queries found.',
      });
    } else {
      this.fetchDataQueries();
    }
  };

  // toggleQuerySearch = () => {
  //   this.setState((prev) => ({
  //     showQuerySearchField: !prev.showQuerySearchField,
  //   }));
  // };

  onVersionRelease = (versionId) => {
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

  getCanvasHeight = () => {
    const canvasBoundingRect = document.getElementsByClassName('canvas-area')[0].getBoundingClientRect();
    return canvasBoundingRect?.height;
  };

  computeCanvasBackgroundColor = () => {
    const { canvasBackgroundColor } = this.state.appDefinition?.globalSettings ?? '#edeff5';
    if (['#2f3c4c', '#edeff5'].includes(canvasBackgroundColor)) {
      return this.props.darkMode ? '#2f3c4c' : '#edeff5';
    }
    return canvasBackgroundColor;
  };

  renderLayoutIcon = (isDesktopSelected) => {
    if (isDesktopSelected)
      return (
        <span
          onClick={() =>
            this.setState({
              currentLayout: isDesktopSelected ? 'mobile' : 'desktop',
            })
          }
          data-cy="change-layout-button"
        >
          <DesktopSelectedIcon />
        </span>
      );

    return (
      <span
        onClick={() =>
          this.setState({
            currentLayout: isDesktopSelected ? 'mobile' : 'desktop',
          })
        }
        data-cy="change-layout-button"
      >
        <MobileSelectedIcon />
      </span>
    );
  };

  saveEditingVersion = () => {
    if (this.isVersionReleased()) {
      this.setState({ isSaving: false, showCreateVersionModalPrompt: true });
    } else if (!isEmpty(this.state.editingVersion)) {
      appVersionService
        .save(this.state.appId, this.state.editingVersion.id, { definition: this.state.appDefinition })
        .then(() => {
          this.setState(
            {
              saveError: false,
              editingVersion: {
                ...this.state.editingVersion,
                ...{ definition: this.state.appDefinition },
              },
            },
            () => {
              this.setState({
                isSaving: false,
              });
            }
          );
        })
        .catch(() => {
          this.setState({ saveError: true, isSaving: false }, () => {
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
    this.setState({
      currentState: {
        ...this.state.currentState,
        globals: {
          ...this.state.currentState.globals,
          theme: { name: newMode ? 'dark' : 'light' },
        },
      },
      // showQuerySearchField: false,
    });
    this.props.switchDarkMode(newMode);
  };

  setStateOfUnsavedQueries = (state) => {
    this.setState({
      isUnsavedQueriesAvailable: state,
    });
  };

  handleEvent = (eventName, options) => onEvent(this, eventName, options, 'edit');

  runQuery = (queryId, queryName) => runQuery(this, queryId, queryName);

  dataSourceModalHandler = () => {
    this.dataSourceModalRef.current.dataSourceModalToggleStateHandler();
  };

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
    this.setState({ selectionInProgress: false });
    e.selected.forEach((el, index) => {
      const id = el.getAttribute('widgetid');
      const component = this.state.appDefinition.components[id].component;
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

  render() {
    const {
      currentSidebarTab,
      selectedComponents = [],
      appDefinition,
      appId,
      slug,
      dataSources,
      loadingDataQueries,
      dataQueries,
      loadingDataSources,
      addingQuery,
      selectedQuery,
      editingQuery,
      app,
      showLeftSidebar,
      currentState,
      isLoading,
      zoomLevel,
      currentLayout,
      deviceWindowWidth,
      // dataQueriesDefaultText,
      // showQuerySearchField,
      showDataQueryDeletionConfirmation,
      isDeletingDataQuery,
      apps,
      defaultComponentStateComputed,
      showComments,
      editingVersion,
      showCreateVersionModalPrompt,
      hoveredComponent,
      queryConfirmationList,
    } = this.state;

    const appVersionPreviewLink = editingVersion ? `/applications/${app.id}/versions/${editingVersion.id}` : '';

    return (
      <div className="editor wrapper">
        <ReactTooltip type="dark" effect="solid" eventOff="click" delayShow={250} />
        {/* This is for viewer to show query confirmations */}
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
          show={showDataQueryDeletionConfirmation}
          message={'Do you really want to delete this query?'}
          confirmButtonLoading={isDeletingDataQuery}
          onConfirm={() => this.executeDataQueryDeletion()}
          onCancel={() => this.cancelDeleteDataQuery()}
          darkMode={this.props.darkMode}
        />
        <div className="header">
          <header className="navbar navbar-expand-md navbar-light d-print-none">
            <div className="container-xl header-container">
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
                <span className="navbar-toggler-icon"></span>
              </button>
              <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0">
                <Link to={'/'} data-cy="editor-page-logo">
                  <Logo />
                </Link>
              </h1>
              {this.state.app && (
                <div className={`app-name input-icon ${this.props.darkMode ? 'dark' : ''}`}>
                  <input
                    type="text"
                    onFocus={(e) => this.setState({ oldName: e.target.value })}
                    onChange={(e) => this.onNameChanged(e.target.value)}
                    onBlur={(e) => this.saveAppName(this.state.app.id, e.target.value)}
                    className="form-control-plaintext form-control-plaintext-sm"
                    value={this.state.app.name}
                    data-cy="app-name-input"
                  />
                  <span className="input-icon-addon">
                    <EditIcon />
                  </span>
                </div>
              )}
              <span
                className={cx('autosave-indicator', {
                  'autosave-indicator-saving': this.state.isSaving,
                  'text-danger': this.state.saveError,
                  'd-none': this.isVersionReleased(),
                })}
                data-cy="autosave-indicator"
              >
                {this.state.isSaving
                  ? 'Saving...'
                  : this.state.saveError
                  ? 'Could not save changes'
                  : 'All changes are saved'}
              </span>
              {config.ENABLE_MULTIPLAYER_EDITING && <RealtimeAvatars />}
              {editingVersion && (
                <AppVersionsManager
                  appId={appId}
                  editingVersion={editingVersion}
                  releasedVersionId={app.current_version_id}
                  setAppDefinitionFromVersion={this.setAppDefinitionFromVersion}
                  showCreateVersionModalPrompt={showCreateVersionModalPrompt}
                  closeCreateVersionModalPrompt={this.closeCreateVersionModalPrompt}
                />
              )}
              <div className="navbar-nav flex-row order-md-last release-buttons">
                <div className="nav-item dropdown d-none d-md-flex me-2">
                  <Link
                    to={appVersionPreviewLink}
                    target="_blank"
                    className="btn btn-sm font-500 color-primary border-0"
                    rel="noreferrer"
                    data-cy="preview-link-button"
                  >
                    {this.props.t('editor.preview', 'Preview')}
                  </Link>
                </div>
                <div className="nav-item dropdown d-none d-md-flex me-2">
                  {app.id && (
                    <ManageAppUsers
                      app={app}
                      slug={slug}
                      darkMode={this.props.darkMode}
                      handleSlugChange={this.handleSlugChange}
                    />
                  )}
                </div>
                <div className="nav-item dropdown me-2">
                  {app.id && (
                    <ReleaseVersionButton
                      isVersionReleased={this.isVersionReleased()}
                      appId={app.id}
                      appName={app.name}
                      onVersionRelease={this.onVersionRelease}
                      editingVersion={editingVersion}
                      fetchApp={this.fetchApp}
                      saveEditingVersion={this.saveEditingVersion}
                    />
                  )}
                </div>
              </div>
            </div>
          </header>
        </div>
        <DndProvider backend={HTML5Backend}>
          <EditorContextWrapper>
            <div className="sub-section">
              <LeftSidebar
                appVersionsId={this.state?.editingVersion?.id}
                errorLogs={currentState.errors}
                components={currentState.components}
                appId={appId}
                darkMode={this.props.darkMode}
                dataSources={this.state.dataSources}
                dataSourcesChanged={this.dataSourcesChanged}
                dataQueriesChanged={this.dataQueriesChanged}
                onZoomChanged={this.onZoomChanged}
                toggleComments={this.toggleComments}
                switchDarkMode={this.changeDarkMode}
                globalSettingsChanged={this.globalSettingsChanged}
                globalSettings={appDefinition.globalSettings}
                currentState={currentState}
                debuggerActions={this.sideBarDebugger}
                appDefinition={{
                  components: appDefinition.components,
                  queries: dataQueries,
                  selectedComponent: selectedComponents ? selectedComponents[selectedComponents.length - 1] : {},
                }}
                setSelectedComponent={this.setSelectedComponent}
                removeComponent={this.removeComponent}
                runQuery={(queryId, queryName) => runQuery(this, queryId, queryName)}
                toggleAppMaintenance={this.toggleAppMaintenance}
                is_maintenance_on={this.state.app.is_maintenance_on}
                ref={this.dataSourceModalRef}
                isSaving={this.state.isSaving}
                isUnsavedQueriesAvailable={this.state.isUnsavedQueriesAvailable}
              />
              {!showComments && (
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
                ></Selecto>
              )}
              <div className="main main-editor-canvas" id="main-editor-canvas">
                <div
                  className={`canvas-container align-items-center ${!showLeftSidebar && 'hide-sidebar'}`}
                  style={{ transform: `scale(${zoomLevel})` }}
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
                  <div
                    className="canvas-area"
                    style={{
                      width: currentLayout === 'desktop' ? '100%' : '450px',
                      minHeight: +this.state.appDefinition.globalSettings.canvasMaxHeight,
                      maxWidth: +this.state.appDefinition.globalSettings.canvasMaxWidth,
                      maxHeight: +this.state.appDefinition.globalSettings.canvasMaxHeight,
                      backgroundColor: this.computeCanvasBackgroundColor(),
                    }}
                  >
                    {config.ENABLE_MULTIPLAYER_EDITING && (
                      <RealtimeCursors editingVersionId={this.state?.editingVersion?.id} />
                    )}
                    {defaultComponentStateComputed && (
                      <>
                        <Container
                          canvasWidth={this.getCanvasWidth()}
                          canvasHeight={this.getCanvasHeight()}
                          socket={this.socket}
                          showComments={showComments}
                          appVersionsId={this.state?.editingVersion?.id}
                          appDefinition={appDefinition}
                          appDefinitionChanged={this.appDefinitionChanged}
                          snapToGrid={true}
                          darkMode={this.props.darkMode}
                          mode={'edit'}
                          zoomLevel={zoomLevel}
                          currentLayout={currentLayout}
                          deviceWindowWidth={deviceWindowWidth}
                          selectedComponents={selectedComponents}
                          appLoading={isLoading}
                          onEvent={this.handleEvent}
                          onComponentOptionChanged={this.handleOnComponentOptionChanged}
                          onComponentOptionsChanged={this.handleOnComponentOptionsChanged}
                          currentState={this.state.currentState}
                          setSelectedComponent={this.setSelectedComponent}
                          handleUndo={this.handleUndo}
                          handleRedo={this.handleRedo}
                          removeComponent={this.removeComponent}
                          onComponentClick={this.handleComponentClick}
                          onComponentHover={this.handleComponentHover}
                          hoveredComponent={hoveredComponent}
                          sideBarDebugger={this.sideBarDebugger}
                          dataQueries={dataQueries}
                        />
                        <CustomDragLayer
                          snapToGrid={true}
                          currentLayout={currentLayout}
                          canvasWidth={this.getCanvasWidth()}
                        />
                      </>
                    )}
                  </div>
                </div>
                <QueryPanel>
                  {({ toggleQueryEditor, createQueryButtonState }) => (
                    <div className="row main-row d-flex" style={{ fontFamily: 'Roboto' }}>
                      <div className="data-pane" style={{ flex: '0 0 249px' }}>
                        <div className={`queries-container ${this.props.darkMode && 'theme-dark'}`}>
                          <div className="queries-header row d-flex align-items-center justify-content-between">
                            <div className="col-7">
                              <div className={`queries-search ${this.props.darkMode && 'theme-dark'}`}>
                                <SearchBoxComponent
                                  onChange={this.filterQueries}
                                  placeholder={this.props.t('globals.search', 'Search')}
                                />
                              </div>
                            </div>
                            <div
                              className="col-auto d-flex align-items-center py-1 rounded default-secondary-button"
                              role="button"
                              onClick={() => {
                                createQueryButtonState.isClicked = true;
                                this.setState({
                                  options: {},
                                  selectedDataSource: null,
                                  selectedQuery: {},
                                  editingQuery: false,
                                  addingQuery: true,
                                  isSourceSelected: false,
                                });
                              }}
                            >
                              <span
                                className={`query-btn d-flex align-items-center justify-content-end`}
                                data-tip="Add new query"
                                data-class=""
                              >
                                <svg
                                  width="10.67"
                                  height="10.67"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8 15.25C7.71667 15.25 7.47917 15.1542 7.2875 14.9625C7.09583 14.7708 7 14.5333 7 14.25V9H1.75C1.46667 9 1.22917 8.90417 1.0375 8.7125C0.845833 8.52083 0.75 8.28333 0.75 8C0.75 7.71667 0.845833 7.47917 1.0375 7.2875C1.22917 7.09583 1.46667 7 1.75 7H7V1.75C7 1.46667 7.09583 1.22917 7.2875 1.0375C7.47917 0.845833 7.71667 0.75 8 0.75C8.28333 0.75 8.52083 0.845833 8.7125 1.0375C8.90417 1.22917 9 1.46667 9 1.75V7H14.25C14.5333 7 14.7708 7.09583 14.9625 7.2875C15.1542 7.47917 15.25 7.71667 15.25 8C15.25 8.28333 15.1542 8.52083 14.9625 8.7125C14.7708 8.90417 14.5333 9 14.25 9H9V14.25C9 14.5333 8.90417 14.7708 8.7125 14.9625C8.52083 15.1542 8.28333 15.25 8 15.25Z"
                                    fill="#3E63DD"
                                  />
                                </svg>
                              </span>
                              <span>Add</span>
                            </div>
                          </div>

                          {loadingDataQueries ? (
                            <div className="p-5">
                              <center>
                                <div className="spinner-border" role="status"></div>
                              </center>
                            </div>
                          ) : (
                            <div className="query-list mt-1">
                              <div>{this.state.filterDataQueries.map((query) => this.renderDataQuery(query))}</div>
                              {this.state.filterDataQueries.length === 0 && (
                                <div className=" d-flex  flex-column align-items-center justify-content-start">
                                  <img src="assets/images/icons/no-queries-added.svg" alt="" />
                                  <span className="mute-text pt-3">No queries added</span> <br />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="query-definition-pane-wrapper">
                        <div className="query-definition-pane">
                          <div>
                            <QueryManager
                              toggleQueryEditor={toggleQueryEditor}
                              dataSources={dataSources}
                              dataQueries={dataQueries}
                              mode={editingQuery ? 'edit' : 'create'}
                              selectedQuery={selectedQuery}
                              selectedDataSource={this.state.selectedDataSource}
                              dataQueriesChanged={this.dataQueriesChanged}
                              appId={appId}
                              editingVersionId={editingVersion?.id}
                              addingQuery={addingQuery}
                              editingQuery={editingQuery}
                              currentState={currentState}
                              darkMode={this.props.darkMode}
                              apps={apps}
                              allComponents={appDefinition.components}
                              isSourceSelected={this.state.isSourceSelected}
                              runQuery={this.runQuery}
                              dataSourceModalHandler={this.dataSourceModalHandler}
                              setStateOfUnsavedQueries={this.setStateOfUnsavedQueries}
                              editorState={this}
                              showQueryConfirmation={queryConfirmationList.length > 0}
                              loadingDataSources={loadingDataSources}
                              createQueryButtonState={createQueryButtonState}
                              selectQuery={this.selectQuery}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </QueryPanel>
              </div>
              <div className="editor-sidebar">
                <div className="editor-actions col-md-12">
                  <div className="m-auto undo-redo-buttons">
                    <svg
                      onClick={this.handleUndo}
                      xmlns="http://www.w3.org/2000/svg"
                      className={cx('cursor-pointer icon icon-tabler icon-tabler-arrow-back-up', {
                        disabled: !this.canUndo,
                      })}
                      width="44"
                      data-tip="undo"
                      height="44"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke={this.props.darkMode ? '#fff' : '#2c3e50'}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none">
                        <title>undo</title>
                      </path>
                      <path d="M9 13l-4 -4l4 -4m-4 4h11a4 4 0 0 1 0 8h-1" fill="none">
                        <title>undo</title>
                      </path>
                    </svg>
                    <svg
                      title="redo"
                      data-tip="redo"
                      onClick={this.handleRedo}
                      xmlns="http://www.w3.org/2000/svg"
                      className={cx('cursor-pointer icon icon-tabler icon-tabler-arrow-forward-up', {
                        disabled: !this.canRedo,
                      })}
                      width="44"
                      height="44"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke={this.props.darkMode ? '#fff' : '#2c3e50'}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none">
                        <title>redo</title>
                      </path>
                      <path d="M15 13l4 -4l-4 -4m4 4h-11a4 4 0 0 0 0 8h1" />
                    </svg>
                  </div>
                  <div className="layout-buttons cursor-pointer">
                    {this.renderLayoutIcon(currentLayout === 'desktop')}
                  </div>
                </div>

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
                    !isEmpty(appDefinition.components) &&
                    !isEmpty(appDefinition.components[selectedComponents[0].id]) ? (
                      <Inspector
                        moveComponents={this.moveComponents}
                        componentDefinitionChanged={this.componentDefinitionChanged}
                        dataQueries={dataQueries}
                        removeComponent={this.removeComponent}
                        selectedComponentId={selectedComponents[0].id}
                        currentState={currentState}
                        allComponents={appDefinition.components}
                        key={selectedComponents[0].id}
                        switchSidebarTab={this.switchSidebarTab}
                        apps={apps}
                        darkMode={this.props.darkMode}
                        handleEditorEscapeKeyPress={this.handleEditorEscapeKeyPress}
                        appDefinitionLocalVersion={this.state.appDefinitionLocalVersion}
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
                    currentLayout={currentLayout}
                    darkMode={this.props.darkMode}
                  ></WidgetManager>
                )}
              </div>
              {config.COMMENT_FEATURE_ENABLE && showComments && (
                <CommentNotifications
                  socket={this.socket}
                  appVersionsId={this.state?.editingVersion?.id}
                  toggleComments={this.toggleComments}
                />
              )}
            </div>
          </EditorContextWrapper>
        </DndProvider>
      </div>
    );
  }
}

export const Editor = withTranslation()(EditorComponent);
