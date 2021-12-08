import React, { createRef } from 'react';
import { datasourceService, dataqueryService, appService, authenticationService } from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './Container';
import { CustomDragLayer } from './CustomDragLayer';
import { LeftSidebar } from './LeftSidebar';
import { componentTypes } from './Components/components';
import { Inspector } from './Inspector/Inspector';
import { DataSourceTypes } from './DataSourceManager/SourceComponents';
import { QueryManager } from './QueryManager';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { ManageAppUsers } from './ManageAppUsers';
import { SaveAndPreview } from './SaveAndPreview';
import {
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onEvent,
  onQueryConfirm,
  onQueryCancel,
  runQuery,
  setStateAsync,
  computeComponentState,
} from '@/_helpers/appUtils';
import { Confirm } from './Viewer/Confirm';
import ReactTooltip from 'react-tooltip';
import CommentNotifications from './CommentNotifications';
import { WidgetManager } from './WidgetManager';
import Fuse from 'fuse.js';
import config from 'config';
import queryString from 'query-string';

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
      };
    }

    this.state = {
      currentUser: authenticationService.currentUserValue,
      app: {},
      allComponentTypes: componentTypes,
      queryPaneHeight: '30%',
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
      appDefinition: {
        components: {},
        globalSettings: {
          hideHeader: false,
          canvasMaxWidth: 1292,
          canvasBackgroundColor: props.darkMode ? '#2f3c4c' : '#edeff5',
        },
      },
      currentState: {
        queries: {},
        components: {},
        globals: {
          currentUser: userVars,
          urlparams: JSON.parse(JSON.stringify(queryString.parse(props.location.search))),
        },
        errors: {},
      },
      apps: [],
      dataQueriesDefaultText: "You haven't created queries yet.",
      showQuerySearchField: false,
      isDeletingDataQuery: false,
      showHiddenOptionsForDataQueryId: null,
      showQueryConfirmation: false,
      socket: null,
    };
  }

  componentDidMount() {
    this.fetchApps(0);
    this.fetchApp();
    this.fetchDataSources();
    this.fetchDataQueries();
    config.COMMENT_FEATURE_ENABLE && this.initWebSocket();
    this.setState({
      currentSidebarTab: 2,
      selectedComponent: null,
    });
  }

  componentWillUnmount() {
    if (this.state.socket) {
      this.state.socket?.close();
    }
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

  fetchDataSources = () => {
    this.setState(
      {
        loadingDataSources: true,
      },
      () => {
        datasourceService.getAll(this.state.appId).then((data) =>
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
        dataqueryService.getAll(this.state.appId).then((data) => {
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
      const dataDefinition = data.definition || {};
      this.setState(
        {
          app: data,
          isLoading: false,
          editingVersion: data.editing_version,
          appDefinition: { ...this.state.appDefinition, ...dataDefinition },
          slug: data.slug,
        },
        () => {
          computeComponentState(this, this.state.appDefinition.components).then(() => {
            console.log('Default component state computed and set');
            this.runQueries(data.data_queries);
          });
        }
      );
    });
  };

  setAppDefinitionFromVersion = (version) => {
    this.appDefinitionChanged(version.definition || {});
    this.setState({
      editingVersion: version,
    });
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

  appDefinitionChanged = (newDefinition) => {
    this.setState({ appDefinition: newDefinition });
    computeComponentState(this, newDefinition.components);
  };

  handleInspectorView = (component) => {
    if (this.state.selectedComponent.hasOwnProperty('component')) {
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

  removeComponent = (component) => {
    let newDefinition = this.state.appDefinition;

    // Delete child components when parent is deleted
    const childComponents = Object.keys(newDefinition.components).filter(
      (key) => newDefinition.components[key].parent === component.id
    );
    childComponents.forEach((componentId) => {
      delete newDefinition.components[componentId];
    });

    delete newDefinition.components[component.id];
    this.appDefinitionChanged(newDefinition);
    this.handleInspectorView(component);
  };

  componentDefinitionChanged = (newDefinition) => {
    let _self = this;

    return setStateAsync(_self, {
      appDefinition: {
        ...this.state.appDefinition,
        components: {
          ...this.state.appDefinition.components,
          [newDefinition.id]: {
            ...this.state.appDefinition.components[newDefinition.id],
            component: newDefinition.component,
          },
        },
      },
    });
  };

  componentChanged = (newComponent) => {
    this.setState({
      appDefinition: {
        ...this.state.appDefinition,
        components: {
          ...this.state.appDefinition.components,
          [newComponent.id]: {
            ...this.state.appDefinition.components[newComponent.id],
            ...newComponent,
          },
        },
      },
    });
  };

  globalSettingsChanged = (key, value) => {
    const appDefinition = { ...this.state.appDefinition };

    appDefinition.globalSettings[key] = value;
    this.setState({
      appDefinition,
    });
  };

  saveApp = (id, attributes, notify = false) => {
    appService.saveApp(id, attributes).then(() => {
      if (notify) {
        toast.success('App saved sucessfully', { hideProgressBar: true, position: 'top-center' });
      }
    });
  };

  saveAppName = (id, name, notify = false) => {
    if (!name.trim()) {
      toast.warn("App name can't be empty or whitespace", {
        hideProgressBar: true,
        position: 'top-center',
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
          this.setState({ selectedDataSource: dataSource, showDataSourceManagerModal: true });
        }}
      >
        <td>
          <img
            src={`/assets/images/icons/editor/datasources/${sourceMeta.kind.toLowerCase()}.svg`}
            width="20"
            height="20"
          />{' '}
          {dataSource.name}
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
    this.setState({ showDataQueryDeletionConfirmation: false, isDeletingDataQuery: true });
    dataqueryService
      .del(this.state.selectedQuery.id)
      .then(() => {
        toast.success('Query Deleted', { hideProgressBar: true, position: 'bottom-center' });
        this.setState({ isDeletingDataQuery: false });
        this.dataQueriesChanged();
      })
      .catch(({ error }) => {
        this.setState({ isDeletingDataQuery: false });
        toast.error(error, { hideProgressBar: true, position: 'bottom-center' });
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
        className={'row query-row py-2 px-3' + (isSeletedQuery ? ' query-row-selected' : '')}
        key={dataQuery.id}
        onClick={() => this.setState({ editingQuery: true, selectedQuery: dataQuery })}
        role="button"
        onMouseEnter={() => this.setShowHiddenOptionsForDataQuery(dataQuery.id)}
        onMouseLeave={() => this.setShowHiddenOptionsForDataQuery(null)}
      >
        <div className="col">
          <img
            className="svg-icon"
            src={`/assets/images/icons/editor/datasources/${sourceMeta.kind.toLowerCase()}.svg`}
            width="20"
            height="20"
          />
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
              style={{ display: this.state.showHiddenOptionsForDataQueryId === dataQuery.id ? 'block' : 'none' }}
            >
              <div>
                <img src="/assets/images/icons/trash.svg" width="12" height="12" className="mx-1" />
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
              className="btn badge bg-azure-lt"
              onClick={() => {
                runQuery(this, dataQuery.id, dataQuery.name).then(() => {
                  toast.info(`Query (${dataQuery.name}) completed.`, {
                    hideProgressBar: true,
                    position: 'bottom-center',
                  });
                });
              }}
            >
              <div>
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
  };

  toggleQueryPaneHeight = () => {
    this.setState({
      queryPaneHeight: this.state.queryPaneHeight === '30%' ? '80%' : '30%',
    });
  };

  toggleQueryEditor = () => {
    this.setState((prev) => ({ showQueryEditor: !prev.showQueryEditor }));
    this.toolTipRefHide.current.style.display = this.state.showQueryEditor ? 'none' : 'flex';
    this.toolTipRefShow.current.style.display = this.state.showQueryEditor ? 'flex' : 'none';
  };

  toggleLeftSidebar = () => {
    this.setState({ showLeftSidebar: !this.state.showLeftSidebar });
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
        dataQueriesDefaultText: results.length || 'No Queries found.',
      });
    } else {
      this.fetchDataQueries();
    }
  };

  toggleQuerySearch = () => {
    this.setState((prev) => ({ showQuerySearchField: !prev.showQuerySearchField }));
  };

  onVersionDeploy = (versionId) => {
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

  toolTipRefHide = createRef();
  toolTipRefShow = createRef();

  getCanvasWidth = () => {
    const canvasBoundingRect = document.getElementsByClassName('canvas-area')[0].getBoundingClientRect();
    return canvasBoundingRect?.width;
  };

  renderLayoutIcon = (isDesktopSelected) => {
    return (
      <svg
        onClick={() => this.setState({ currentLayout: isDesktopSelected ? 'mobile' : 'desktop' })}
        width="74"
        height="28"
        viewBox="0 0 74 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="36" height="26" rx="1" fill={isDesktopSelected ? '#EEF3F9' : '#FFFFFC'} />
        <rect x="37" y="1" width="36" height="26" rx="1" fill={isDesktopSelected ? '#FFFFFC' : '#EEF3F9'} />
        <g clipPath="url(#clip0_392_5486)">
          <path
            d="M58.375 8H53.125C52.5039 8 52 8.50391 52 9.125V18.875C52 19.4961 52.5039 20 53.125 20H58.375C58.9961 20 59.5 19.4961 59.5 18.875V9.125C59.5 8.50391 58.9961 8 58.375 8ZM55.75 19.25C55.3352 19.25 55 18.9148 55 18.5C55 18.0852 55.3352 17.75 55.75 17.75C56.1648 17.75 56.5 18.0852 56.5 18.5C56.5 18.9148 56.1648 19.25 55.75 19.25ZM58.375 16.7188C58.375 16.8734 58.2484 17 58.0938 17H53.4062C53.2516 17 53.125 16.8734 53.125 16.7188V9.40625C53.125 9.25156 53.2516 9.125 53.4062 9.125H58.0938C58.2484 9.125 58.375 9.25156 58.375 9.40625V16.7188Z"
            fill={isDesktopSelected ? '#8092AC' : '#4D72FA'}
          />
        </g>
        <rect x="0.5" y="0.5" width="73" height="27" rx="3.5" stroke="#D2DDEC" />
        <path d="M37 1L37 27" stroke="#D2DDEC" strokeLinecap="round" />
        <path
          d="M17.2 18.2H14.2C13.8817 18.2 13.5765 18.0736 13.3515 17.8485C13.1264 17.6235 13 17.3183 13 17V9.2C13 8.54 13.54 8 14.2 8H23.8C24.1183 8 24.4235 8.12643 24.6485 8.35147C24.8736 8.57652 25 8.88174 25 9.2V17C25 17.3183 24.8736 17.6235 24.6485 17.8485C24.4235 18.0736 24.1183 18.2 23.8 18.2H20.8L23.2 19.4V20H14.8V19.4L17.2 18.2ZM14.2 9.2V15.8H23.8V9.2H14.2Z"
          fill={isDesktopSelected ? '#4D72FA' : '#8092AC'}
        />
        <defs>
          <clipPath id="clip0_392_5486">
            <rect width="7.5" height="12" fill="white" transform="translate(52 8)" />
          </clipPath>
        </defs>
      </svg>
    );
  };

  render() {
    const {
      currentSidebarTab,
      selectedComponent,
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
      showQueryEditor,
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
                    <svg width="92" height="18" viewBox="0 0 92 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M14.2649 0.31843V3.08636C14.2649 3.18308 14.1841 3.26209 14.0855 3.26209H8.94222V17.8241C8.94222 17.9209 8.86139 17.9998 8.76277 17.9998H5.48942C5.39066 17.9998 5.30998 17.9208 5.30998 17.8241V3.26209H0.179443C0.0806839 3.26209 0 3.18308 0 3.08636V0.31843C0 0.221856 0.0808285 0.1427 0.179443 0.1427H14.0855C14.1841 0.1427 14.2649 0.221856 14.2649 0.31843Z"
                        fill="#4D72FA"
                      />
                      <path
                        d="M27.909 8.00549C27.5285 7.13377 26.9937 6.36401 26.319 5.71547C25.6442 5.06692 24.8276 4.54865 23.8963 4.17255C22.9613 3.79645 21.9295 3.60486 20.8239 3.60486C19.7275 3.60486 18.701 3.79645 17.7714 4.17255C16.8435 4.54865 16.0307 5.06706 15.3559 5.71547C14.6793 6.36401 14.1464 7.13377 13.7714 8.00549C13.3962 8.8772 13.2061 9.82085 13.2061 10.8084C13.2061 11.7981 13.3981 12.7416 13.7785 13.6133C14.1572 14.485 14.6902 15.255 15.3614 15.9033C16.0326 16.5517 16.8419 17.0686 17.766 17.4394C18.6903 17.8119 19.7149 18 20.8115 18C21.924 18 22.9613 17.8119 23.8946 17.4394C24.8278 17.0686 25.646 16.5517 26.3243 15.9033C27.0045 15.255 27.5411 14.487 27.9162 13.6204C28.2913 12.7523 28.4833 11.8069 28.4833 10.8085C28.4833 9.82085 28.2894 8.87706 27.909 8.00549ZM20.851 14.9454C20.2821 14.9454 19.7436 14.8417 19.252 14.6378C18.7585 14.4342 18.3224 14.1457 17.9546 13.7818C17.5885 13.4183 17.2942 12.9771 17.0806 12.4727C16.8671 11.97 16.7576 11.406 16.7576 10.7961C16.7576 10.1968 16.8672 9.6362 17.0806 9.13181C17.2942 8.62741 17.5885 8.18801 17.9546 7.82423C18.3224 7.46045 18.7585 7.17569 19.2503 6.97532C19.7438 6.77509 20.2821 6.67314 20.851 6.67314C21.411 6.67314 21.9457 6.77679 22.4427 6.9807C22.9415 7.18631 23.3795 7.47108 23.7474 7.83132C24.1135 8.19156 24.4077 8.62911 24.6213 9.13181C24.8349 9.6362 24.9426 10.1968 24.9426 10.7961C24.9426 11.406 24.8349 11.9718 24.6213 12.4798C24.4076 12.9877 24.1133 13.4305 23.7455 13.7943C23.3794 14.158 22.9434 14.4428 22.4516 14.643C21.9581 14.8436 21.4198 14.9454 20.851 14.9454Z"
                        fill="#4D72FA"
                      />
                      <path
                        d="M45.1096 8.00549C44.7309 7.13377 44.1962 6.36401 43.5195 5.71547C42.8448 5.06692 42.03 4.54865 41.0968 4.17255C40.1637 3.79645 39.13 3.60486 38.0246 3.60486C36.93 3.60486 35.9015 3.79645 34.9722 4.17255C34.0443 4.54865 33.2314 5.06706 32.5567 5.71547C31.882 6.36387 31.3488 7.13377 30.9721 8.00549C30.597 8.8772 30.4067 9.82085 30.4067 10.8084C30.4067 11.7981 30.5988 12.7416 30.9793 13.6133C31.3598 14.485 31.8926 15.255 32.5621 15.9033C33.2334 16.5517 34.0426 17.0686 34.9667 17.4394C35.8911 17.8119 36.9157 18 38.0123 18C39.1247 18 40.162 17.8119 41.0952 17.4394C42.0302 17.0686 42.8467 16.5517 43.5267 15.9033C44.2069 15.255 44.7418 14.487 45.1169 13.6204C45.4935 12.7523 45.684 11.8069 45.684 10.8085C45.684 9.82085 45.4901 8.87706 45.1096 8.00549ZM38.0515 14.9454C37.4825 14.9454 36.9443 14.8417 36.4524 14.6378C35.9589 14.4342 35.523 14.1457 35.1551 13.7818C34.789 13.4183 34.4946 12.9788 34.281 12.4727C34.0673 11.9683 33.9597 11.4041 33.9597 10.7961C33.9597 10.1968 34.0673 9.6362 34.281 9.13181C34.4946 8.62741 34.789 8.18801 35.1551 7.82423C35.523 7.46045 35.9589 7.17569 36.4507 6.97532C36.9442 6.77509 37.4825 6.67314 38.0513 6.67314C38.6112 6.67314 39.148 6.77679 39.6449 6.9807C40.1421 7.18631 40.5799 7.47108 40.9479 7.83132C41.3139 8.19156 41.6083 8.62911 41.8218 9.13181C42.0355 9.6362 42.1431 10.1968 42.1431 10.7961C42.1431 11.406 42.0355 11.9718 41.8218 12.4798C41.6083 12.9894 41.3139 13.4305 40.946 13.7943C40.5799 14.158 40.1439 14.4428 39.6522 14.643C39.1588 14.8436 38.6205 14.9454 38.0515 14.9454Z"
                        fill="#4D72FA"
                      />
                      <path
                        d="M51.9371 0.31843V17.8242C51.9371 17.9211 51.8563 18 51.7576 18H48.5628C48.4639 18 48.3833 17.9209 48.3833 17.8242V0.31843C48.3833 0.221856 48.464 0.1427 48.5628 0.1427H51.7576C51.8563 0.1427 51.9371 0.221856 51.9371 0.31843Z"
                        fill="#4D72FA"
                      />
                      <path
                        d="M62.6565 0.318207V12.0842C62.6565 13.0473 62.5093 13.9047 62.2168 14.6325C61.9224 15.3669 61.4935 15.9925 60.9424 16.4935C60.3917 16.9925 59.7099 17.3741 58.9184 17.6235C58.1358 17.8731 57.2369 17.9996 56.2463 17.9996H54.17C54.0713 17.9996 53.9907 17.9206 53.9907 17.8239V15.0558C53.9907 14.9592 54.0714 14.8801 54.17 14.8801H56.2463C57.2495 14.8801 57.9709 14.6376 58.3908 14.1579C58.8215 13.6693 59.0385 12.968 59.0385 12.0701L59.0493 0.318064C59.0493 0.22149 59.1301 0.142334 59.2287 0.142334H62.4769C62.5758 0.142476 62.6565 0.221633 62.6565 0.318207Z"
                        fill="#4D72FA"
                      />
                      <path
                        d="M79.759 8.00549C79.3785 7.13377 78.8437 6.36401 78.1673 5.71547C77.4926 5.06692 76.6778 4.54865 75.7446 4.17255C74.8114 3.79645 73.7776 3.60486 72.6722 3.60486C71.5778 3.60486 70.551 3.79645 69.6214 4.17255C68.6919 4.54865 67.8789 5.06706 67.2042 5.71547C66.5295 6.36387 65.9962 7.13377 65.6215 8.00549C65.2446 8.8772 65.0542 9.82085 65.0542 10.8084C65.0542 11.7981 65.2445 12.74 65.6215 13.6064C65.9964 14.4745 66.5295 15.2426 67.2042 15.891C67.8789 16.5376 68.6919 17.058 69.6214 17.4341C70.551 17.81 71.5776 17.9999 72.6722 17.9999C73.5822 17.9999 74.4309 17.8733 75.1937 17.6238C75.9581 17.376 76.649 17.035 77.2521 16.617C77.8549 16.1969 78.379 15.7048 78.8097 15.1582C79.2384 14.61 79.5706 14.0299 79.7948 13.4306C79.8145 13.3779 79.8073 13.3182 79.7733 13.2708C79.7392 13.2233 79.6854 13.1951 79.6261 13.1951H76.1698C76.1035 13.1951 76.0442 13.2303 76.0119 13.2866C75.7139 13.8122 75.2726 14.2446 74.6983 14.5697C74.1257 14.8967 73.4527 15.0618 72.6991 15.0618C72.2235 15.0618 71.7533 14.9809 71.3012 14.821C70.8489 14.661 70.4307 14.4326 70.0573 14.1408C69.686 13.8509 69.3629 13.4924 69.0991 13.0724C68.8714 12.712 68.7025 12.3095 68.5966 11.8738H80.0729C80.1625 11.8738 80.238 11.8087 80.2506 11.7226C80.2685 11.6015 80.2846 11.4768 80.3027 11.3482C80.3223 11.2094 80.3311 11.0336 80.3311 10.8085C80.3314 9.82085 80.1396 8.87706 79.759 8.00549ZM72.6993 6.46767C73.2019 6.46767 73.6701 6.54328 74.0901 6.69438C74.5118 6.84547 74.8941 7.05816 75.2278 7.32706C75.5615 7.59767 75.8487 7.92293 76.0819 8.29535C76.2776 8.60646 76.4337 8.9456 76.5485 9.30754H68.7045C68.8212 8.94744 68.9808 8.60816 69.1836 8.29705C69.4259 7.92463 69.7238 7.59937 70.0702 7.33046C70.4165 7.05971 70.8149 6.84717 71.2545 6.69424C71.6924 6.54315 72.1787 6.46767 72.6993 6.46767Z"
                        fill="#4D72FA"
                      />
                      <path
                        d="M92 15.2512L91.973 17.8257C91.9711 17.9225 91.8922 17.9997 91.7936 17.9997H89.2041C88.4683 17.9997 87.7648 17.9241 87.1133 17.7749C86.4476 17.6236 85.8591 17.3407 85.3673 16.9347C84.8757 16.5269 84.4808 15.9644 84.1938 15.2632C83.9102 14.5674 83.7666 13.6659 83.7666 12.5849V7.31626H81.6868C81.5879 7.31626 81.5073 7.2371 81.5073 7.14053V4.72051C81.5073 4.64136 81.5611 4.57282 81.6382 4.55172L83.7075 3.98941L84.3319 0.147693C84.3463 0.0632969 84.4215 0 84.5096 0H87.1405C87.2391 0 87.3198 0.0791563 87.3198 0.17573V4.26172H91.4527C91.5515 4.26172 91.6322 4.34087 91.6322 4.43745V7.14039C91.6322 7.23696 91.5514 7.31612 91.4527 7.31612H87.3072V12.5584C87.3072 13.0699 87.3682 13.4936 87.4866 13.8187C87.6051 14.1402 87.7612 14.3949 87.955 14.5762C88.1472 14.7571 88.3766 14.8854 88.6369 14.9574C88.9061 15.0348 89.1986 15.0733 89.5074 15.0733H91.8206C91.869 15.0733 91.9139 15.0927 91.948 15.126C91.982 15.1597 92 15.2037 92 15.2512Z"
                        fill="#4D72FA"
                      />
                    </svg>
                  </Link>
                </h1>
                {this.state.app && (
                  <div className="app-name input-icon">
                    <input
                      type="text"
                      onFocus={(e) => this.setState({ oldName: e.target.value })}
                      onChange={(e) => this.onNameChanged(e.target.value)}
                      onBlur={(e) => this.saveAppName(this.state.app.id, e.target.value)}
                      className="form-control-plaintext form-control-plaintext-sm"
                      value={this.state.app.name}
                    />
                    <span className="input-icon-addon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M13.1667 3.11667L10.8833 0.833337C10.5853 0.553417 10.1948 0.392803 9.78611 0.382047C9.3774 0.371291 8.97899 0.511145 8.66667 0.775004L1.16667 8.275C0.897308 8.54664 0.72959 8.90267 0.69167 9.28334L0.333336 12.7583C0.322111 12.8804 0.337948 13.0034 0.379721 13.1187C0.421493 13.2339 0.488172 13.3385 0.575003 13.425C0.65287 13.5022 0.745217 13.5633 0.846748 13.6048C0.948279 13.6463 1.057 13.6673 1.16667 13.6667H1.24167L4.71667 13.35C5.09733 13.3121 5.45337 13.1444 5.725 12.875L13.225 5.375C13.5161 5.06748 13.6734 4.65709 13.6625 4.23378C13.6516 3.81047 13.4733 3.40876 13.1667 3.11667ZM4.56667 11.6833L2.06667 11.9167L2.29167 9.41667L7 4.76667L9.25 7.01667L4.56667 11.6833ZM10.3333 5.9L8.1 3.66667L9.725 2L12 4.275L10.3333 5.9Z"
                          fill="#8092AC"
                        />
                      </svg>
                    </span>
                  </div>
                )}
                {this.state.editingVersion && (
                  <small className="app-version-name">{`App version: ${this.state.editingVersion.name}`}</small>
                )}
                <div className="editor-buttons">
                  <span
                    className={`btn btn-light mx-2`}
                    onClick={this.toggleQueryEditor}
                    data-tip="Show query editor"
                    data-class="py-1 px-2"
                    ref={this.toolTipRefShow}
                    style={{ display: 'none', opacity: 0.5 }}
                  >
                    <img
                      style={{ transform: 'rotate(-90deg)' }}
                      src="/assets/images/icons/editor/sidebar-toggle.svg"
                      width="12"
                      height="12"
                    />
                  </span>
                </div>
                <div className="layout-buttons cursor-pointer">
                  {this.renderLayoutIcon(currentLayout === 'desktop')}
                </div>
                <div className="navbar-nav flex-row order-md-last">
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
                  <div className="nav-item dropdown d-none d-md-flex me-2">
                    <a
                      href={appLink}
                      target="_blank"
                      className={`btn btn-sm font-500 color-primary  ${app?.current_version_id ? '' : 'disabled'}`}
                      rel="noreferrer"
                    >
                      Launch
                    </a>
                  </div>
                  <div className="nav-item dropdown me-2">
                    {app.id && (
                      <SaveAndPreview
                        appId={app.id}
                        appName={app.name}
                        appDefinition={appDefinition}
                        app={app}
                        darkMode={this.props.darkMode}
                        onVersionDeploy={this.onVersionDeploy}
                        editingVersionId={this.state.editingVersion ? this.state.editingVersion.id : null}
                        setAppDefinitionFromVersion={this.setAppDefinitionFromVersion}
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
              queries={currentState.queries}
              components={currentState.components}
              globals={currentState.globals}
              appId={appId}
              darkMode={this.props.darkMode}
              dataSources={this.state.dataSources}
              dataSourcesChanged={this.dataSourcesChanged}
              onZoomChanged={this.onZoomChanged}
              toggleComments={this.toggleComments}
              switchDarkMode={this.props.switchDarkMode}
              globalSettingsChanged={this.globalSettingsChanged}
              globalSettings={appDefinition.globalSettings}
            />
            <div className="main main-editor-canvas" id="main-editor-canvas">
              <div
                className={`canvas-container align-items-center ${!showLeftSidebar && 'hide-sidebar'}`}
                style={{ transform: `scale(${zoomLevel})` }}
                onClick={() => this.switchSidebarTab(2)}
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
                        selectedComponent={selectedComponent || {}}
                        appLoading={isLoading}
                        onEvent={(eventName, options) => onEvent(this, eventName, options, 'edit')}
                        onComponentOptionChanged={(component, optionName, value) =>
                          onComponentOptionChanged(this, component, optionName, value)
                        }
                        onComponentOptionsChanged={(component, options) =>
                          onComponentOptionsChanged(this, component, options)
                        }
                        currentState={this.state.currentState}
                        configHandleClicked={this.configHandleClicked}
                        removeComponent={this.removeComponent}
                        onComponentClick={(id, component) => {
                          this.setState({ selectedComponent: { id, component } });
                          this.switchSidebarTab(1);
                        }}
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
                  height: showQueryEditor ? 0 : 40,
                  background: '#fff',
                  padding: '8px 4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h5 className="mb-0">QUERIES</h5>
                <span
                  onClick={this.props.toggleQueryEditor}
                  className="cursor-pointer m-1"
                  data-tip="Show query editor"
                >
                  <svg
                    style={{ transform: 'rotate(180deg)' }}
                    onClick={this.toggleQueryEditor}
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
                className="query-pane"
                style={{
                  height: showQueryEditor ? this.state.queryPaneHeight : 0,
                  width: !showLeftSidebar ? '85%' : '',
                  left: !showLeftSidebar ? '0' : '',
                }}
              >
                <div className="row main-row">
                  <div className="col-md-3 data-pane">
                    <div className="queries-container">
                      <div className="queries-header row mt-2">
                        <div className="col">
                          <h5 className="py-1 px-3 text-muted">QUERIES</h5>
                        </div>
                        <div className="col-auto px-3">
                          <button
                            className="btn btn-sm btn-light mx-2"
                            data-class="py-1 px-2"
                            data-tip="Search query"
                            onClick={this.toggleQuerySearch}
                          >
                            <img className="py-1" src="/assets/images/icons/lens.svg" width="17" height="17" />
                          </button>

                          <span
                            data-tip="Add new query"
                            data-class="py-1 px-2"
                            className="btn btn-sm btn-light btn-px-1 text-muted"
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
                            +
                          </span>
                        </div>
                      </div>

                      {showQuerySearchField && (
                        <div className="row mt-2 pt-1 px-2">
                          <div className="col-12">
                            <div className="queries-search">
                              <input
                                type="text"
                                className="form-control mb-2"
                                placeholder="Search…"
                                autoFocus
                                onChange={(e) => this.filterQueries(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {loadingDataQueries ? (
                        <div className="p-5">
                          <center>
                            <div className="spinner-border text-azure" role="status"></div>
                          </center>
                        </div>
                      ) : (
                        <div className="query-list">
                          <div>{dataQueries.map((query) => this.renderDataQuery(query))}</div>
                          {dataQueries.length === 0 && (
                            <div className="mt-5">
                              <center>
                                <span className="text-muted">{dataQueriesDefaultText}</span> <br />
                                <button
                                  className="btn btn-sm btn-outline-azure mt-3"
                                  onClick={() =>
                                    this.setState({ selectedQuery: {}, editingQuery: false, addingQuery: true })
                                  }
                                >
                                  create query
                                </button>
                              </center>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-9 query-definition-pane-wrapper">
                    {!loadingDataSources && (
                      <div className="query-definition-pane">
                        <div>
                          <QueryManager
                            toggleQueryEditor={this.toggleQueryEditor}
                            dataSources={dataSources}
                            toggleQueryPaneHeight={this.toggleQueryPaneHeight}
                            dataQueries={dataQueries}
                            mode={editingQuery ? 'edit' : 'create'}
                            selectedQuery={selectedQuery}
                            selectedDataSource={this.state.selectedDataSource}
                            dataQueriesChanged={this.dataQueriesChanged}
                            appId={appId}
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
                  {selectedComponent ? (
                    <Inspector
                      componentDefinitionChanged={this.componentDefinitionChanged}
                      dataQueries={dataQueries}
                      componentChanged={this.componentChanged}
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
        </DndProvider>
      </div>
    );
  }
}

export { Editor };
