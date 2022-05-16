/* eslint-disable import/no-named-as-default */
import React, { createRef } from 'react';
import cx from 'classnames';
import { datasourceService, dataqueryService, appService, authenticationService, appVersionService } from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { computeComponentName } from '@/_helpers/utils';
import { defaults, cloneDeep, isEqual, isEmpty, debounce } from 'lodash';
import { Container } from './Container';
import { EditorKeyHooks } from './EditorKeyHooks';
import { CustomDragLayer } from './CustomDragLayer';
import { LeftSidebar } from './LeftSidebar';
import { componentTypes } from './Components/components';
import { Inspector } from './Inspector/Inspector';
import { DataSourceTypes } from './DataSourceManager/SourceComponents';
import { QueryManager } from './QueryManager';
import { Link } from 'react-router-dom';
import { ManageAppUsers } from './ManageAppUsers';
import { ReleaseVersionButton } from './ReleaseVersionButton';
import {
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onEvent,
  onQueryConfirm,
  onQueryCancel,
  runQuery,
  setStateAsync,
  computeComponentState,
  getSvgIcon,
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
import RunjsIcon from './Icons/runjs.svg';
import EditIcon from './Icons/edit.svg';
import MobileSelectedIcon from './Icons/mobile-selected.svg';
import DesktopSelectedIcon from './Icons/desktop-selected.svg';
import Spinner from '@/_ui/Spinner';
import { AppVersionsManager } from './AppVersionsManager';
import { SearchBoxComponent } from '@/_ui/Search';
import { createWebsocketConnection } from '@/_helpers/websocketConnection';
import { Cursor } from './Cursor';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import RealtimeAvatars from './RealtimeAvatars';
import InitVersionCreateModal from './InitVersionCreateModal';

setAutoFreeze(false);
enablePatches();

class Editor extends React.Component {
  constructor(props) {
    super(props);

    const appId = this.props.match.params.id;

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
      components: {},
      globalSettings: {
        hideHeader: false,
        appInMaintenance: false,
        canvasMaxWidth: 1292,
        canvasMaxHeight: 2400,
        canvasBackgroundColor: props.darkMode ? '#2f3c4c' : '#edeff5',
      },
    };

    this.state = {
      currentUser: authenticationService.currentUserValue,
      app: {},
      allComponentTypes: componentTypes,
      isQueryPaneDragging: false,
      queryPaneHeight: 70,
      isTopOfQueryPane: false,
      isLoading: true,
      users: null,
      appId,
      editingVersion: null,
      loadingDataSources: true,
      loadingDataQueries: true,
      showQueryEditor: true,
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
      },
      apps: [],
      dataQueriesDefaultText: "You haven't created queries yet.",
      showQuerySearchField: false,
      isDeletingDataQuery: false,
      showHiddenOptionsForDataQueryId: null,
      showQueryConfirmation: false,
      showInitVersionCreateModal: false,
      showCreateVersionModalPrompt: false,
      isSourceSelected: false,
      isSaving: false,
      saveError: false,
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
    this.initComponentVersioning();
    this.initRealtimeSave();
    this.initEventListeners();
    this.setState({
      currentSidebarTab: 2,
      selectedComponents: [],
    });
  }

  /**
   * When a new update is received over-the-websocket connection
   * the useEffect in Container.jsx is trigged, but already appDef had been updated
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

  componentDidUpdate(prevProps, prevState) {
    if (!isEqual(prevState.appDefinition, this.state.appDefinition)) {
      computeComponentState(this, this.state.appDefinition.components);
    }

    if (config.ENABLE_MULTIPLAYER_EDITING) {
      if (this.props.othersOnSameVersion.length !== prevProps.othersOnSameVersion.length) {
        ReactTooltip.rebuild();
      }
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

  onMouseMove = (e) => {
    const componentTop = Math.round(this.queryPaneRef.current.getBoundingClientRect().top);
    const clientY = e.clientY;

    if ((clientY >= componentTop) & (clientY <= componentTop + 5)) {
      this.setState({
        isTopOfQueryPane: true,
      });
    } else if (this.state.isTopOfQueryPane) {
      this.setState({
        isTopOfQueryPane: false,
      });
    }

    if (this.state.isQueryPaneDragging) {
      let queryPaneHeight = (clientY / window.innerHeight) * 100;

      if (queryPaneHeight > 95) queryPaneHeight = 100;
      if (queryPaneHeight < 4.5) queryPaneHeight = 4.5;

      this.setState({
        queryPaneHeight,
      });
    }
  };

  onMouseDown = () => {
    this.state.isTopOfQueryPane &&
      this.setState({
        isQueryPaneDragging: true,
      });
  };

  onMouseUp = () => {
    this.setState({
      isQueryPaneDragging: false,
    });
  };

  initEventListeners() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    this.socket?.addEventListener('message', (event) => {
      if (event.data === 'versionReleased') this.fetchApp();
      else if (event.data === 'dataQueriesChanged') this.fetchDataQueries();
      else if (event.data === 'dataSourcesChanged') this.fetchDataSources();
    });
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.title = 'Tooljet - Dashboard';
    this.socket && this.socket?.close();
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
              dataQueries: data.data_queries,
              loadingDataQueries: false,
              app: {
                ...this.state.app,
                data_queries: data.data_queries,
              },
            },
            () => {
              let queryState = {};
              data.data_queries.forEach((query) => {
                queryState[query.name] = {
                  ...DataSourceTypes.find((source) => source.kind === query.kind).exposedVariables,
                  kind: DataSourceTypes.find((source) => source.kind === query.kind).kind,
                  ...this.state.currentState.queries[query.name],
                };
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

    appService.getApp(appId).then((data) => {
      const dataDefinition = defaults(data.definition, this.defaultDefinition);
      this.setState(
        {
          app: data,
          isLoading: false,
          editingVersion: data.editing_version,
          appDefinition: dataDefinition,
          slug: data.slug,
        },
        () => {
          this.setState({
            showInitVersionCreateModal: isEmpty(this.state.editingVersion),
          });

          computeComponentState(this, this.state.appDefinition.components).then(() => {
            console.log('Default component state computed and set');
            this.runQueries(data.data_queries);
          });
          this.setWindowTitle(data.name);
        }
      );

      this.fetchDataSources();
      this.fetchDataQueries();
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

    this.fetchDataSources();
    this.fetchDataQueries();
    this.initComponentVersioning();
  };

  dataSourcesChanged = () => {
    if (this.socket instanceof WebSocket) {
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

  dataQueriesChanged = () => {
    this.setState({ addingQuery: false }, () => {
      if (this.socket instanceof WebSocket) {
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
    this.setState({ isSaving: true, appDefinition: newDefinition }, () => {
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

      selectedComponents.forEach((component) => {
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
      });

      toast('Selected components deleted! (⌘Z to undo)', {
        icon: '🗑️',
      });
      this.appDefinitionChanged(newDefinition, {
        skipAutoSave: this.isVersionReleased(),
      });
      this.handleInspectorView();
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
      toast('Component deleted! (⌘Z to undo)', {
        icon: '🗑️',
      });
      this.appDefinitionChanged(newDefinition, {
        skipAutoSave: this.isVersionReleased(),
      });
      this.handleInspectorView();
    }
  };

  componentDefinitionChanged = (componentDefinition) => {
    let _self = this;

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

  cloneComponent = (newComponent) => {
    const appDefinition = JSON.parse(JSON.stringify(this.state.appDefinition));

    newComponent.component.name = computeComponentName(newComponent.component.component, appDefinition.components);

    appDefinition.components[newComponent.id] = newComponent;
    this.appDefinitionChanged(appDefinition);
  };

  globalSettingsChanged = (key, value) => {
    const appDefinition = { ...this.state.appDefinition };
    appDefinition.globalSettings[key] = value;
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

  renderDataSource = (dataSource) => {
    const sourceMeta = DataSourceTypes.find((source) => source.kind === dataSource.kind);
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
          {getSvgIcon(sourceMeta.kind.toLowerCase(), 25, 25)} {dataSource.name}
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
    const sourceMeta = DataSourceTypes.find((source) => source.kind === dataQuery.kind);

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
          {sourceMeta.kind === 'runjs' ? (
            <RunjsIcon style={{ height: 25, width: 25 }} />
          ) : (
            getSvgIcon(sourceMeta.kind.toLowerCase(), 25, 25)
          )}
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
                <img src="/assets/images/icons/query-trash-icon.svg" width="12" height="12" className="mx-1" />
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
                runQuery(this, dataQuery.id, dataQuery.name).then(() => {
                  toast(`Query (${dataQuery.name}) completed.`, {
                    icon: '🚀',
                  });
                });
              }}
            >
              <div className={`query-icon ${this.props.darkMode && 'dark'}`}>
                <img src="/assets/images/icons/editor/play.svg" width="8" height="8" className="mx-1" />
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
    this.setState((prev) => ({
      showQueryEditor: !prev.showQueryEditor,
      queryPaneHeight: this.state.queryPaneHeight === 100 ? 30 : 100,
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
      const fuse = new Fuse(this.state.dataQueries, { keys: ['name'] });
      const results = fuse.search(value);
      this.setState({
        dataQueries: results.map((result) => result.item),
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

  queryPaneRef = createRef();

  getCanvasWidth = () => {
    const canvasBoundingRect = document.getElementsByClassName('canvas-area')[0].getBoundingClientRect();
    return canvasBoundingRect?.width;
  };

  getCanvasHeight = () => {
    const canvasBoundingRect = document.getElementsByClassName('canvas-area')[0].getBoundingClientRect();
    return canvasBoundingRect?.height;
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
        .save(this.state.appId, this.state.editingVersion.id, this.state.appDefinition)
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
    this.setState({
      hoveredComponent: id,
    });
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

  handleEvent = (eventName, options) => onEvent(this, eventName, options, 'edit');

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
      showQueryConfirmation,
      queryPaneHeight,
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
    } = this.state;

    const appVersionPreviewLink = editingVersion ? `/applications/${app.id}/versions/${editingVersion.id}` : '';

    return (
      <div className="editor wrapper">
        <ReactTooltip type="dark" effect="solid" eventOff="click" delayShow={250} />
        {/* This is for viewer to show query confirmations */}
        <Confirm
          show={showQueryConfirmation}
          message={'Do you want to run this query?'}
          onConfirm={(queryConfirmationData) => onQueryConfirm(this, queryConfirmationData)}
          onCancel={() => onQueryCancel(this)}
          queryConfirmationData={this.state.queryConfirmationData}
          darkMode={this.props.darkMode}
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
                <Link to={'/'}>
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
                {this.state.isSaving ? <Spinner size="small" /> : 'All changes are saved'}
              </span>
              {config.ENABLE_MULTIPLAYER_EDITING && (
                <RealtimeAvatars
                  updatePresence={this.props.updatePresence}
                  editingVersionId={this.state?.editingVersion?.id}
                  self={this.props.self}
                />
              )}
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
                  <a
                    href={appVersionPreviewLink}
                    target="_blank"
                    className={`btn btn-sm font-500 color-primary border-0  ${
                      app?.current_version_id ? '' : 'disabled'
                    }`}
                    rel="noreferrer"
                  >
                    Preview
                  </a>
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
            />
            <div className="main main-editor-canvas" id="main-editor-canvas">
              <div
                className={`canvas-container align-items-center ${!showLeftSidebar && 'hide-sidebar'}`}
                style={{ transform: `scale(${zoomLevel})` }}
                onClick={(e) => {
                  if (['real-canvas', 'modal'].includes(e.target.className)) {
                    this.setState({ selectedComponents: [], currentSidebarTab: 2 });
                  }
                }}
              >
                <div
                  className="canvas-area"
                  style={{
                    width: currentLayout === 'desktop' ? '100%' : '450px',
                    minHeight: +this.state.appDefinition.globalSettings.canvasMaxHeight,
                    maxWidth: +this.state.appDefinition.globalSettings.canvasMaxWidth,
                    maxHeight: +this.state.appDefinition.globalSettings.canvasMaxHeight,
                    backgroundColor: this.state.appDefinition.globalSettings.canvasBackgroundColor,
                  }}
                >
                  {this.props?.othersOnSameVersion?.map(({ id, presence }) => {
                    if (!presence) return null;
                    return (
                      <Cursor key={id} name={presence.firstName} color={presence.color} x={presence.x} y={presence.y} />
                    );
                  })}
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
              <div
                ref={this.queryPaneRef}
                onTouchEnd={this.onMouseUp}
                onMouseDown={this.onMouseDown}
                className="query-pane"
                style={{
                  height: `calc(100% - ${this.state.queryPaneHeight}%)`,
                  width: !showLeftSidebar ? '85%' : '',
                  left: !showLeftSidebar ? '0' : '',
                  cursor: this.state.isQueryPaneDragging || this.state.isTopOfQueryPane ? 'row-resize' : 'default',
                }}
              >
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
                                placeholder={'Search queries'}
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
                                Queries
                              </h5>
                            </div>

                            <div className="col-auto mx-1">
                              <span
                                className={`query-btn mx-1 ${this.props.darkMode ? 'dark' : ''}`}
                                data-class="py-1 px-0"
                                onClick={this.toggleQuerySearch}
                              >
                                <img className="py-1 mt-2" src="/assets/images/icons/lens.svg" width="24" height="24" />
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
                                <img className="mt-2" src="/assets/images/icons/plus.svg" width="24" height="24" />
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
                          <div>{dataQueries.map((query) => this.renderDataQuery(query))}</div>
                          {dataQueries.length === 0 && (
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
                                  {'Create query'}
                                </button>
                              </center>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="query-definition-pane-wrapper">
                    {!loadingDataSources && (
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
                            queryPaneHeight={queryPaneHeight}
                            currentState={currentState}
                            darkMode={this.props.darkMode}
                            apps={apps}
                            allComponents={appDefinition.components}
                            isSourceSelected={this.state.isSourceSelected}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                handleEditorEscapeKeyPress={this.handleEditorEscapeKeyPress}
                removeMultipleComponents={this.removeComponents}
              />

              {currentSidebarTab === 1 && (
                <div className="pages-container">
                  {selectedComponents.length === 1 &&
                  !isEmpty(appDefinition.components) &&
                  !isEmpty(appDefinition.components[selectedComponents[0].id]) ? (
                    <Inspector
                      cloneComponent={this.cloneComponent}
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
                    ></Inspector>
                  ) : (
                    <center className="mt-5 p-2">Please select a component to inspect</center>
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
          <InitVersionCreateModal
            showModal={this.state.showInitVersionCreateModal}
            hideModal={() => this.setState({ showInitVersionCreateModal: false })}
            fetchApp={this.fetchApp}
            darkMode={this.props.darkMode}
            appId={this.state.appId}
          />
        </DndProvider>
      </div>
    );
  }
}

export { Editor };
