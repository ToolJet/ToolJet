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

    const pageHandle = this.props.match.params.pageHandle ?? 'home';

    const currentUser = authenticationService.currentUserValue;

    const { socket } = createWebsocketConnection(appId);

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
      pages: {
        [pageHandle]: {
          components: {},
        },
      },
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
      queryPanelHeight: 70,
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
          page: {
            handle: pageHandle,
          },
        },
        errors: {},
        variables: {},
        client: {},
        server: {},
      },
      apps: [],
      dataQueriesDefaultText: "You haven't created queries yet.",
      showQuerySearchField: false,
      isDeletingDataQuery: false,
      showHiddenOptionsForDataQueryId: null,
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
      computeComponentState(
        this,
        this.state.appDefinition.pages[this.state.currentState.globals.page.handle]?.components
      );
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
                showQuerySearchField: false,
              });
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

          computeComponentState(
            this,
            this.state.appDefinition.pages[this.state.currentState.globals.page.handle]?.components ?? {}
          ).then(() => {
            this.runQueries(data.data_queries);
          });
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
    const pageHandle = this.state.currentState.globals.page.handle;
    if (isEqual(this.state.appDefinition, newDefinition)) return;
    if (config.ENABLE_MULTIPLAYER_EDITING && !opts.skipYmapUpdate) {
      this.props.ymap?.set('appDef', { newDefinition, editingVersionId: this.state.editingVersion?.id });
    }

    produce(
      this.state.appDefinition,
      (draft) => {
        draft.pages[pageHandle].components = newDefinition.pages[pageHandle]?.components ?? {};
      },
      this.handleAddPatch
    );
    this.setState({ isSaving: true, appDefinition: newDefinition, appDefinitionLocalVersion: uuid() }, () => {
      if (!opts.skipAutoSave) this.autoSave();
    });
    computeComponentState(this, newDefinition.pages[pageHandle]?.components ?? {});
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

      toast('Selected components deleted! (⌘Z to undo)', {
        icon: '🗑️',
      });
      this.appDefinitionChanged(newDefinition, {
        skipAutoSave: this.isVersionReleased(),
      });
      this.handleInspectorView();
    } else if (this.isVersionReleased()) {
      this.setState({ showCreateVersionModalPrompt: true });
    }
  };

  removeComponent = (component) => {
    const pageHandle = this.state.currentState.globals.page.handle;
    if (!this.isVersionReleased()) {
      let newDefinition = cloneDeep(this.state.appDefinition);
      // Delete child components when parent is deleted

      let childComponents = [];

      if (newDefinition.pages[pageHandle].components?.[component.id].component.component === 'Tabs') {
        childComponents = Object.keys(newDefinition.components).filter((key) =>
          newDefinition.components[key].parent?.startsWith(component.id)
        );
      } else {
        childComponents = Object.keys(newDefinition.components).filter(
          (key) => newDefinition.components[key].parent === component.id
        );
      }

      childComponents.forEach((componentId) => {
        delete newDefinition.pages[pageHandle].components[componentId];
      });

      delete newDefinition.pages[pageHandle].components[component.id];
      toast('Component deleted! (⌘Z to undo)', {
        icon: '🗑️',
      });
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
    const pageHandle = this.state.currentState.globals.page.handle;

    if (this.state.appDefinition?.pages[pageHandle].components[componentDefinition.id]) {
      const newDefinition = {
        appDefinition: produce(this.state.appDefinition, (draft) => {
          draft.pages[pageHandle].components[componentDefinition.id].component = componentDefinition.component;
        }),
      };

      produce(
        this.state.appDefinition,
        (draft) => {
          draft.pages[pageHandle].components[componentDefinition.id].component = componentDefinition.component;
        },
        this.handleAddPatch
      );
      setStateAsync(_self, newDefinition).then(() => {
        computeComponentState(_self, _self.state.appDefinition.pages[pageHandle].components);
        this.setState({ isSaving: true, appDefinitionLocalVersion: uuid() });
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
    let newComponents = appDefinition.pages[this.state.currentState.globals.page.handle].components;

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
    appDefinition.pages[this.state.currentState.globals.page.handle].components = newComponents;
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

  setShowHiddenOptionsForDataQuery = (dataQueryId) => {
    this.setState({ showHiddenOptionsForDataQueryId: dataQueryId });
  };

  renderDataQuery = (dataQuery) => {
    const sourceMeta = this.getSourceMetaData(dataQuery);
    const icon = getSvgIcon(sourceMeta.kind.toLowerCase(), 25, 25, dataQuery?.plugin?.icon_file?.data);

    let isSeletedQuery = false;
    if (this.state.selectedQuery) {
      isSeletedQuery = dataQuery.id === this.state.selectedQuery.id;
    }
    const isQueryBeingDeleted = this.state.isDeletingDataQuery && isSeletedQuery;
    const { currentState } = this.state;

    const isLoading = currentState.queries[dataQuery.name] ? currentState.queries[dataQuery.name].isLoading : false;

    return (
      <div
        className={
          'row query-row mb-1 py-2 px-3' +
          (isSeletedQuery ? ' query-row-selected' : '') +
          (this.props.darkMode ? ' dark' : '')
        }
        key={dataQuery.id}
        onClick={() => this.setState({ editingQuery: true, selectedQuery: dataQuery })}
        role="button"
        onMouseEnter={() => this.setShowHiddenOptionsForDataQuery(dataQuery.id)}
        onMouseLeave={() => this.setShowHiddenOptionsForDataQuery(null)}
      >
        <div className="col-auto" style={{ width: '28px' }}>
          {icon}
        </div>
        <div className="col">
          <OverlayTrigger
            trigger={['hover', 'focus']}
            placement="top"
            delay={{ show: 800, hide: 100 }}
            overlay={<Tooltip id="button-tooltip">{dataQuery.name}</Tooltip>}
          >
            <div className="px-3 query-name">{dataQuery.name}</div>
          </OverlayTrigger>
        </div>
        <div className="col-auto mx-1">
          {isQueryBeingDeleted ? (
            <div className="px-2">
              <div className="text-center spinner-border spinner-border-sm" role="status"></div>
            </div>
          ) : (
            <button
              className="btn badge bg-azure-lt"
              onClick={this.deleteDataQuery}
              style={{
                display: this.state.showHiddenOptionsForDataQueryId === dataQuery.id ? 'block' : 'none',
                marginTop: '3px',
              }}
            >
              <div>
                <img src="assets/images/icons/query-trash-icon.svg" width="12" height="12" className="mx-1" />
              </div>
            </button>
          )}
        </div>
        <div className="col-auto" style={{ width: '28px' }}>
          {isLoading === true ? (
            <center>
              <div className="pt-1">
                <div className="text-center spinner-border spinner-border-sm" role="status"></div>
              </div>
            </center>
          ) : (
            <button
              style={{ marginTop: '3px' }}
              className="btn badge bg-light-1"
              onClick={() => {
                runQuery(this, dataQuery.id, dataQuery.name);
              }}
            >
              <div className={`query-icon ${this.props.darkMode && 'dark'}`}>
                <img src="assets/images/icons/editor/play.svg" width="8" height="8" className="mx-1" />
              </div>
            </button>
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

  toggleQueryEditor = () => {
    this.setState(() => ({
      queryPanelHeight: this.state.queryPanelHeight === 100 ? 30 : 100,
    }));
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

  toggleQuerySearch = () => {
    this.setState((prev) => ({
      showQuerySearchField: !prev.showQuerySearchField,
    }));
  };

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
      showQuerySearchField: false,
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
    const pageHandle = this.state.currentState.globals.page.handle;
    this.setState({ selectionInProgress: false });
    e.selected.forEach((el, index) => {
      const id = el.getAttribute('widgetid');
      const component = this.state.appDefinition.pages[pageHandle].components[id].component;
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
    const newAppDefinition = {
      ...this.state.appDefinition,
      pages: {
        ...this.state.appDefinition.pages,
        [handle]: {
          name,
          components: {},
        },
      },
    };

    this.setState(
      {
        isSaving: true,
        appDefinition: newAppDefinition,
        appDefinitionLocalVersion: uuid(),
        currentState: {
          ...this.state.currentState,
          globals: {
            ...this.state.currentState.globals,
            page: {
              name,
              handle,
            },
          },
        },
      },
      () => {
        this.autoSave();
      }
    );

    computeComponentState(this, newAppDefinition.pages[handle]?.components ?? {});
  };

  switchPage = (handle) => {
    const { name } = this.state.appDefinition.pages[handle];

    this.props.history.push(`/apps/${this.state.appId}/${handle}`);

    this.setState({
      currentState: {
        ...this.state.currentState,
        globals: {
          ...this.state.currentState.globals,
          page: {
            name,
            handle,
          },
        },
      },
    });
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
      queryPanelHeight,
      showLeftSidebar,
      currentState,
      isLoading,
      zoomLevel,
      currentLayout,
      deviceWindowWidth,
      dataQueriesDefaultText,
      showQuerySearchField,
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
                  components: appDefinition.pages[this.state.currentState.globals.page.handle]?.components ?? {},
                  queries: dataQueries,
                  selectedComponent: selectedComponents ? selectedComponents[selectedComponents.length - 1] : {},
                  pages: appDefinition.pages,
                }}
                setSelectedComponent={this.setSelectedComponent}
                removeComponent={this.removeComponent}
                runQuery={(queryId, queryName) => runQuery(this, queryId, queryName)}
                toggleAppMaintenance={this.toggleAppMaintenance}
                is_maintenance_on={this.state.app.is_maintenance_on}
                ref={this.dataSourceModalRef}
                isSaving={this.state.isSaving}
                isUnsavedQueriesAvailable={this.state.isUnsavedQueriesAvailable}
                pageHandle={this.state.currentState.globals.page.handle}
                addNewPage={this.addNewPage}
                switchPage={this.switchPage}
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
                <div
                  className="query-pane"
                  style={{
                    height: 40,
                    background: '#fff',
                    padding: '8px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h5 className="mb-0">QUERIES</h5>
                  <span onClick={this.toggleQueryEditor} className="cursor-pointer m-1" data-tip="Show query editor">
                    <svg
                      style={{ transform: 'rotate(180deg)' }}
                      width="18"
                      height="10"
                      viewBox="0 0 18 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 1L9 9L17 1"
                        stroke="#61656F"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
                <QueryPanel queryPanelHeight={queryPanelHeight}>
                  <div className="row main-row">
                    <div className="data-pane">
                      <div className="queries-container">
                        <div className="queries-header row" style={{ marginLeft: '1.5px' }}>
                          {showQuerySearchField && (
                            <div className="col-12 p-1">
                              <div className="queries-search px-1">
                                <SearchBoxComponent
                                  onChange={this.filterQueries}
                                  callback={this.toggleQuerySearch}
                                  placeholder={this.props.t('editor.searchQueries', 'Search queries')}
                                />
                              </div>
                            </div>
                          )}

                          {!showQuerySearchField && (
                            <>
                              <div className="col">
                                <h5
                                  style={{ fontSize: '14px', marginLeft: ' 6px' }}
                                  className="py-1 px-3 mt-2 text-muted"
                                >
                                  {this.props.t('editor.queries', 'Queries')}
                                </h5>
                              </div>

                              <div className="col-auto mx-1">
                                <span
                                  className={`query-btn mx-1 ${this.props.darkMode ? 'dark' : ''}`}
                                  data-class="py-1 px-0"
                                  onClick={this.toggleQuerySearch}
                                >
                                  <img
                                    className="py-1 mt-2"
                                    src="assets/images/icons/lens.svg"
                                    width="24"
                                    height="24"
                                  />
                                </span>

                                <span
                                  className={`query-btn mx-3 ${this.props.darkMode ? 'dark' : ''}`}
                                  data-tip="Add new query"
                                  data-class="py-1 px-2"
                                  onClick={() =>
                                    this.setState({
                                      options: {},
                                      selectedDataSource: null,
                                      selectedQuery: {},
                                      editingQuery: false,
                                      addingQuery: true,
                                      isSourceSelected: false,
                                    })
                                  }
                                >
                                  <img className="mt-2" src="assets/images/icons/plus.svg" width="24" height="24" />
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {loadingDataQueries ? (
                          <div className="p-5">
                            <center>
                              <div className="spinner-border" role="status"></div>
                            </center>
                          </div>
                        ) : (
                          <div className="query-list p-1 mt-1">
                            <div>{this.state.filterDataQueries.map((query) => this.renderDataQuery(query))}</div>
                            {this.state.filterDataQueries.length === 0 && (
                              <div className="mt-5">
                                <center>
                                  <span className="mute-text">{dataQueriesDefaultText}</span> <br />
                                  <button
                                    className={`button-family-secondary mt-3 ${this.props.darkMode && 'dark'}`}
                                    onClick={() =>
                                      this.setState({
                                        options: {},
                                        selectedDataSource: null,
                                        selectedQuery: {},
                                        editingQuery: false,
                                        addingQuery: true,
                                      })
                                    }
                                  >
                                    {this.props.t('editor.createQuery', 'Create query')}
                                  </button>
                                </center>
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
                            toggleQueryEditor={this.toggleQueryEditor}
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
                            queryPanelHeight={queryPanelHeight}
                            currentState={currentState}
                            darkMode={this.props.darkMode}
                            apps={apps}
                            allComponents={
                              appDefinition.pages[this.state.currentState.globals.page.handle]?.components ?? {}
                            }
                            isSourceSelected={this.state.isSourceSelected}
                            isQueryPaneDragging={this.state.isQueryPaneDragging}
                            runQuery={this.runQuery}
                            dataSourceModalHandler={this.dataSourceModalHandler}
                            setStateOfUnsavedQueries={this.setStateOfUnsavedQueries}
                            appDefinition={appDefinition}
                            editorState={this}
                            showQueryConfirmation={queryConfirmationList.length > 0}
                            loadingDataSources={loadingDataSources}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
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
                    !isEmpty(appDefinition.pages[this.state.currentState.globals.page.handle]?.components) &&
                    !isEmpty(
                      appDefinition.pages[this.state.currentState.globals.page.handle]?.components[
                        selectedComponents[0].id
                      ]
                    ) ? (
                      <Inspector
                        moveComponents={this.moveComponents}
                        componentDefinitionChanged={this.componentDefinitionChanged}
                        dataQueries={dataQueries}
                        removeComponent={this.removeComponent}
                        selectedComponentId={selectedComponents[0].id}
                        currentState={currentState}
                        allComponents={appDefinition.pages[this.state.currentState.globals.page.handle]?.components}
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
