/* eslint-disable import/no-named-as-default */
import React, { createRef } from 'react';
import { datasourceService, dataqueryService, appService, authenticationService, appVersionService } from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { computeComponentName } from '@/_helpers/utils';
import { defaults, cloneDeep, isEqual, isEmpty, debounce } from 'lodash';
import { Container } from './Container';
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
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { AppVersionsManager } from './AppVersionsManager';
import { SearchBoxComponent } from '@/_ui/Search';

setAutoFreeze(false);
enablePatches();
class Editor extends React.Component {
  constructor(props) {
    super(props);

    const appId = this.props.match.params.id;

    const currentUser = authenticationService.currentUserValue;
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
        canvasMaxWidth: 1292,
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
      socket: null,
      showInitVersionCreateModal: false,
      isCreatingInitVersion: false,
      initVersionName: 'v1',
      isSavingEditingVersion: false,
      showSaveDetail: false,
      hasAppDefinitionChanged: false,
      showCreateVersionModalPrompt: false,
    };

    this.autoSave = debounce(this.saveEditingVersion, 3000);

    // setup for closing versions dropdown on oustide click
    this.wrapperRef = React.createRef();
  }

  setWindowTitle(name) {
    document.title = name ? `${name} - Tooljet` : `Untitled App - Tooljet`;
  }

  componentDidMount() {
    this.fetchApps(0);
    this.fetchApp();
    this.initComponentVersioning();
    this.initEventListeners();
    config.COMMENT_FEATURE_ENABLE && this.initWebSocket();
    this.setState({
      currentSidebarTab: 2,
      selectedComponent: null,
    });
  }

  isVersionReleased = (version = this.state.editingVersion) => {
    if (isEmpty(version)) {
      return false;
    }
    return this.state.app.current_version_id === version.id;
  };

  closeCreateVersionModalPrompt = () => {
    this.setState({ showCreateVersionModalPrompt: false });
  };

  onMouseMove = (e) => {
    const componentTop = Math.round(this.queryPaneRef.current.getBoundingClientRect().top);
    const clientY = e.clientY;

    if ((clientY >= componentTop) & (clientY <= componentTop + 5)) {
      this.setState({
        isTopOfQueryPane: true,
      });
    } else {
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
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    if (this.state.socket) {
      this.state.socket?.close();
    }
    document.title = 'Tooljet - Dashboard';
  }

  getWebsocketUrl = () => {
    const re = /https?:\/\//g;
    if (re.test(config.apiUrl)) return config.apiUrl.replace(/(^\w+:|^)\/\//, '').replace('/api', '');

    return window.location.host;
  };

  initWebSocket = () => {
    // TODO: add retry policy
    const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${this.getWebsocketUrl()}`);

    const appId = this.props.match.params.id;

    // Connection opened
    socket.addEventListener('open', function (event) {
      console.log('connection established', event);
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));

      socket.send(
        JSON.stringify({
          event: 'authenticate',
          data: currentUser.auth_token,
        })
      );
      socket.send(
        JSON.stringify({
          event: 'subscribe',
          data: appId,
        })
      );
    });

    // Connection closed
    socket.addEventListener('close', function (event) {
      console.log('connection closed', event);
    });

    // Listen for possible errors
    socket.addEventListener('error', function (event) {
      console.log('WebSocket error: ', event);
    });

    this.setState({
      socket,
    });
  };

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
    this.appDefinitionChanged(defaults(version.definition, this.defaultDefinition), { skipAutoSave: true });
    this.setState({
      editingVersion: version,
    });

    this.fetchDataSources();
    this.fetchDataQueries();
  };

  dataSourcesChanged = () => {
    this.fetchDataSources();
  };

  dataQueriesChanged = () => {
    this.fetchDataQueries();
    this.setState({ addingQuery: false });
  };

  switchSidebarTab = (tabIndex) => {
    if (tabIndex === 2) {
      this.setState({ selectedComponent: null });
    }
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
      this.setState({
        appDefinition,
      });
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
      this.setState({
        appDefinition,
      });
    }
  };

  appDefinitionChanged = (newDefinition, opts = {}) => {
    produce(
      this.state.appDefinition,
      (draft) => {
        draft.components = newDefinition.components;
      },
      this.handleAddPatch
    );
    this.setState({ appDefinition: newDefinition }, () => {
      if (!opts.skipAutoSave) this.autoSave();
    });
    computeComponentState(this, newDefinition.components);
  };

  handleInspectorView = (component) => {
    if (this.state.selectedComponent?.hasOwnProperty('component')) {
      const { id: selectedComponentId } = this.state.selectedComponent;
      if (selectedComponentId === component.id) {
        this.setState({ selectedComponent: null });
        this.switchSidebarTab(2);
      }
    }
  };

  handleSlugChange = (newSlug) => {
    this.setState({ slug: newSlug });
  };

  handleClickOutsideAppVersionsDropdown = (event) => {
    if (this.wrapperRef && !this.wrapperRef.current.contains(event.target)) {
      this.setState({ showAppVersionsDropdown: false });
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
      this.handleInspectorView(component);
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

    return setStateAsync(_self, newDefinition);
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
        appDefinition,
      },
      () => {
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
        <div className="col">
          {sourceMeta.kind === 'runjs' ? (
            <RunjsIcon style={{ height: 25, width: 25 }} />
          ) : (
            getSvgIcon(sourceMeta.kind.toLowerCase(), 25, 25)
          )}
          <span className="p-3">{dataQuery.name}</span>
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
        <div className="col-auto">
          {isLoading === true ? (
            <div className="px-2">
              <div className="text-center spinner-border spinner-border-sm" role="status"></div>
            </div>
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

  configHandleClicked = (id, component) => {
    this.switchSidebarTab(1);
    this.setState({ selectedComponent: { id, component } });
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
    this.setState({
      app: {
        ...this.state.app,
        current_version_id: versionId,
      },
    });
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
  handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      // eslint-disable-next-line no-undef
      this.createInitVersion();
    }
  };
  createInitVersion = () => {
    const newVersionName = this.state.initVersionName;
    const appId = this.state.appId;

    if (!isEmpty(newVersionName?.trim())) {
      this.setState({ isCreatingInitVersion: true });
      appVersionService.create(appId, newVersionName).then(() => {
        this.setState({
          showInitVersionCreateModal: false,
          isCreatingInitVersion: false,
        });
        toast.success('Version Created');
        this.fetchApp();
      });
    } else {
      toast.error('The name of version should not be empty');
      this.setState({ isCreatingInitVersion: false });
    }
  };

  saveEditingVersion = () => {
    if (this.isVersionReleased()) {
      this.setState({ showCreateVersionModalPrompt: true });
    } else if (!isEmpty(this.state.editingVersion)) {
      this.setState({ isSavingEditingVersion: true, showSaveDetail: true });
      appVersionService.save(this.state.appId, this.state.editingVersion.id, this.state.appDefinition).then(() => {
        this.setState({ isSavingEditingVersion: false });
        setTimeout(() => this.setState({ showSaveDetail: false }), 3000);
      });
    }
  };

  renderInitVersionCreateModal = (showModal) => {
    return (
      <Modal
        contentClassName={this.props.darkMode ? 'theme-dark' : ''}
        show={showModal}
        size="md"
        backdrop="static"
        keyboard={true}
        enforceFocus={false}
        animation={false}
        centered={true}
        // eslint-disable-next-line no-undef
      >
        <Modal.Header>
          <Modal.Title>Create Version</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row m-2">
            <div className="col">
              <input
                type="text"
                className="form-control"
                placeholder="version name"
                defaultValue={this.state.initVersionName}
                onChange={(e) => this.setState({ initVersionName: e.target.value })}
                onKeyPress={(e) => this.handleKeyPress(e)}
              />
            </div>
          </div>

          <div className="row m-2">
            <div className="col">
              <small className="muted">Create a version to start building your app</small>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className={`${this.state.isCreatingInitVersion ? 'btn-loading' : ''}`}
            onClick={() => this.createInitVersion()}
          >
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  handleOnComponentOptionChanged = (component, optionName, value) => {
    onComponentOptionChanged(this, component, optionName, value);
  };

  handleOnComponentOptionsChanged = (component, options) => {
    onComponentOptionsChanged(this, component, options);
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

  handleEvent = (eventName, options) => onEvent(this, eventName, options, 'edit');

  render() {
    const {
      currentSidebarTab,
      selectedComponent = {},
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
      // showQueryEditor,
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
      showInitVersionCreateModal,
      isSavingEditingVersion,
      showSaveDetail,
      showCreateVersionModalPrompt,
      hoveredComponent,
    } = this.state;

    const appLink = slug ? `/applications/${slug}` : '';

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
        />
        <Confirm
          show={showDataQueryDeletionConfirmation}
          message={'Do you really want to delete this query?'}
          confirmButtonLoading={isDeletingDataQuery}
          onConfirm={() => this.executeDataQueryDeletion()}
          onCancel={() => this.cancelDeleteDataQuery()}
        />
        <DndProvider backend={HTML5Backend}>
          <div className="header">
            <header className="navbar navbar-expand-md navbar-light d-print-none">
              <div className="container-xl header-container">
                <button
                  className="navbar-toggler"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#navbar-menu"
                >
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
                {showSaveDetail && (
                  <div className="nav-auto-save">
                    <img src={'/assets/images/icons/editor/auto-save.svg'} width="25" height="25" />
                    <em className="small lh-base p-1">{isSavingEditingVersion ? 'Auto Saving..' : 'Auto Saved'}</em>
                  </div>
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

                <div className="layout-buttons cursor-pointer">
                  {this.renderLayoutIcon(currentLayout === 'desktop')}
                </div>
                <div className="navbar-nav flex-row order-md-last">
                  <div className="nav-item dropdown d-none d-md-flex me-2">
                    <a
                      href={appLink}
                      target="_blank"
                      className={`btn btn-sm font-500 color-primary  ${app?.current_version_id ? '' : 'disabled'}`}
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
                      />
                    )}
                  </div>
                </div>
              </div>
            </header>
          </div>
          <div className="sub-section">
            <LeftSidebar
              appVersionsId={this.state?.editingVersion?.id}
              errorLogs={currentState.errors}
              components={currentState.components}
              appId={appId}
              darkMode={this.props.darkMode}
              dataSources={this.state.dataSources}
              dataSourcesChanged={this.dataSourcesChanged}
              onZoomChanged={this.onZoomChanged}
              toggleComments={this.toggleComments}
              switchDarkMode={this.props.switchDarkMode}
              globalSettingsChanged={this.globalSettingsChanged}
              globalSettings={appDefinition.globalSettings}
              currentState={currentState}
            />
            <div className="main main-editor-canvas" id="main-editor-canvas">
              <div
                className={`canvas-container align-items-center ${!showLeftSidebar && 'hide-sidebar'}`}
                style={{ transform: `scale(${zoomLevel})` }}
                onClick={(e) => {
                  if (['real-canvas', 'modal'].includes(e.target.className)) {
                    this.switchSidebarTab(2);
                  }
                }}
              >
                <div
                  className="canvas-area"
                  style={{
                    width: currentLayout === 'desktop' ? '100%' : '450px',
                    maxWidth: +this.state.appDefinition.globalSettings.canvasMaxWidth,
                    backgroundColor: this.state.appDefinition.globalSettings.canvasBackgroundColor,
                  }}
                >
                  {defaultComponentStateComputed && (
                    <>
                      <Container
                        canvasWidth={this.getCanvasWidth()}
                        socket={this.state.socket}
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
                        selectedComponent={selectedComponent}
                        appLoading={isLoading}
                        onEvent={this.handleEvent}
                        onComponentOptionChanged={this.handleOnComponentOptionChanged}
                        onComponentOptionsChanged={this.handleOnComponentOptionsChanged}
                        currentState={this.state.currentState}
                        configHandleClicked={this.configHandleClicked}
                        handleUndo={this.handleUndo}
                        handleRedo={this.handleRedo}
                        removeComponent={this.removeComponent}
                        onComponentClick={this.handleComponentClick}
                        onComponentHover={this.handleComponentHover}
                        hoveredComponent={hoveredComponent}
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
                  <div className="col-3 data-pane">
                    <div className="queries-container">
                      <div className="queries-header row">
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
                              <h5 style={{ fontSize: '14px' }} className="py-1 px-3 mt-2 text-muted">
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
                  <div className="col-9 query-definition-pane-wrapper">
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
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="editor-sidebar">
              <div className="col-md-12">
                <div></div>
              </div>

              {currentSidebarTab === 1 && (
                <div className="pages-container">
                  {selectedComponent &&
                  !isEmpty(appDefinition.components) &&
                  !isEmpty(appDefinition.components[selectedComponent.id]) ? (
                    <Inspector
                      cloneComponent={this.cloneComponent}
                      componentDefinitionChanged={this.componentDefinitionChanged}
                      dataQueries={dataQueries}
                      removeComponent={this.removeComponent}
                      selectedComponentId={selectedComponent.id}
                      currentState={currentState}
                      allComponents={appDefinition.components}
                      key={selectedComponent.id}
                      switchSidebarTab={this.switchSidebarTab}
                      apps={apps}
                      darkMode={this.props.darkMode}
                    ></Inspector>
                  ) : (
                    <div className="mt-5 p-2">Please select a component to inspect</div>
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
                socket={this.state.socket}
                appVersionsId={this.state?.editingVersion?.id}
                toggleComments={this.toggleComments}
              />
            )}
          </div>
          {this.renderInitVersionCreateModal(showInitVersionCreateModal)}
        </DndProvider>
      </div>
    );
  }
}

export { Editor };
