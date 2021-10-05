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
  onComponentClick,
  onEvent,
  onQueryConfirm,
  onQueryCancel,
  runQuery,
  setStateAsync,
  computeComponentState,
} from '@/_helpers/appUtils';
import { Confirm } from './Viewer/Confirm';
import ReactTooltip from 'react-tooltip';
import { WidgetManager } from './WidgetManager';
import Fuse from 'fuse.js';
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
      zoomLevel: 1.0,
      currentLayout: 'desktop',
      scaleValue: 1,
      deviceWindowWidth: 450,
      appDefinition: {
        components: {},
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
    };
  }

  componentDidMount() {
    const appId = this.props.match.params.id;
    this.fetchApps(0);

    appService.getApp(appId).then((data) => {
      const dataDefinition = data.definition || { components: {} };
      this.setState(
        {
          app: data,
          isLoading: false,
          editingVersion: data.editing_version,
          appDefinition: { ...this.state.appDefinition, ...dataDefinition },
          slug: data.slug,
        },
        () => {
          data.data_queries.forEach((query) => {
            if (query.options.runOnPageLoad) {
              runQuery(this, query.id, query.name);
            }
          });

          computeComponentState(this, this.state.appDefinition.components);
        }
      );
    });

    this.fetchDataSources();
    this.fetchDataQueries();

    this.setState({
      currentSidebarTab: 2,
      selectedComponent: null,
    });
  }

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

  fetchApps = (page) => {
    appService.getAll(page).then((data) =>
      this.setState({
        apps: data.apps,
        isLoading: false,
      })
    );
  };

  setAppDefinitionFromVersion = (version) => {
    this.appDefinitionChanged(version.definition || { components: {} });
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
    if (tabIndex == 2) {
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

  saveApp = (id, attributes, notify = false) => {
    appService.saveApp(id, attributes).then(() => {
      if (notify) {
        toast.success('App saved sucessfully', { hideProgressBar: true, position: 'top-center' });
      }
    });
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
    this.setState({ showQueryEditor: !this.state.showQueryEditor });
    this.toolTipRefHide.current.style.display = this.state.showQueryEditor ? 'none' : 'flex';
    this.toolTipRefShow.current.style.display = this.state.showQueryEditor ? 'flex' : 'none';
  };

  toggleLeftSidebar = () => {
    this.setState({ showLeftSidebar: !this.state.showLeftSidebar });
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
    this.setState({ showQuerySearchField: !this.state.showQuerySearchField });
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

  toolTipRefHide = createRef(null);
  toolTipRefShow = createRef(null);

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
      scaleValue,
      dataQueriesDefaultText,
      showQuerySearchField,
      showDataQueryDeletionConfirmation,
      isDeletingDataQuery,
      apps,
      defaultComponentStateComputed,
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
                <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                  <Link to={'/'} className="">
                    <img src="/assets/images/logo.svg" width="99" height="30" className="navbar-brand-image" />
                  </Link>
                  <a href="/"></a>
                </h1>
                {this.state.app && (
                  <input
                    type="text"
                    style={{ width: '200px', left: '80px', position: 'absolute' }}
                    onChange={(e) => this.onNameChanged(e.target.value)}
                    onBlur={(e) => this.saveApp(this.state.app.id, { name: e.target.value })}
                    className="form-control-plaintext form-control-plaintext-sm"
                    value={this.state.app.name}
                  />
                )}
                <small>{this.state.editingVersion && `Editing version: ${this.state.editingVersion.name}`}</small>
                <div className="editor-buttons">
                  <span
                    className={`btn btn-light mx-2`}
                    onClick={this.toggleQueryEditor}
                    data-tip="Hide query editor"
                    data-class="py-1 px-2"
                    ref={this.toolTipRefHide}
                  >
                    <img
                      style={{ transform: 'rotate(-90deg)' }}
                      src="/assets/images/icons/editor/sidebar-toggle.svg"
                      width="12"
                      height="12"
                    />
                  </span>
                  <span
                    className={`btn btn-default mx-2`}
                    onClick={this.toggleQueryEditor}
                    data-tip="Show query editor"
                    data-class="py-1 px-2"
                    ref={this.toolTipRefShow}
                    style={{ display: 'none' }}
                  >
                    <img
                      style={{ transform: 'rotate(-90deg)' }}
                      src="/assets/images/icons/editor/sidebar-toggle.svg"
                      width="12"
                      height="12"
                    />
                  </span>
                </div>
                <div className="layout-buttons">
                  <div className="btn-group" role="group" aria-label="Basic example">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => this.setState({ currentLayout: 'desktop' })}
                      disabled={currentLayout === 'desktop'}
                    >
                      <img src="/assets/images/icons/editor/desktop.svg" width="12" height="12" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => this.setState({ currentLayout: 'mobile' })}
                      disabled={currentLayout === 'mobile'}
                    >
                      <img src="/assets/images/icons/editor/mobile.svg" width="12" height="12" />
                    </button>
                  </div>
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
                      className={`btn btn-sm ${app?.current_version_id ? '' : 'disabled'}`}
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
                      />
                    )}
                  </div>
                </div>
              </div>
            </header>
          </div>
          <div className="sub-section">
            <LeftSidebar
              errorLogs={currentState.errors}
              queries={currentState.queries}
              components={currentState.components}
              globals={currentState.globals}
              appId={appId}
              darkMode={this.props.darkMode}
              dataSources={this.state.dataSources}
              dataSourcesChanged={this.dataSourcesChanged}
              onZoomChanged={this.onZoomChanged}
              switchDarkMode={this.props.switchDarkMode}
            />
            <div className="main">
              <div
                className={`canvas-container align-items-center ${!showLeftSidebar && 'hide-sidebar'}`}
                style={{ transform: `scale(${zoomLevel})` }}
                onClick={() => this.switchSidebarTab(2)}
              >
                <div className="canvas-area" style={{ width: currentLayout === 'desktop' ? '1292px' : '450px' }}>
                  {defaultComponentStateComputed && (
                    <Container
                      appDefinition={appDefinition}
                      appDefinitionChanged={this.appDefinitionChanged}
                      snapToGrid={true}
                      darkMode={this.props.darkMode}
                      mode={'edit'}
                      zoomLevel={zoomLevel}
                      currentLayout={currentLayout}
                      deviceWindowWidth={deviceWindowWidth}
                      selectedComponent={selectedComponent || {}}
                      scaleValue={scaleValue}
                      appLoading={isLoading}
                      onEvent={(eventName, options) => onEvent(this, eventName, options)}
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
                        onComponentClick(this, id, component);
                      }}
                    />
                  )}
                  <CustomDragLayer snapToGrid={true} currentLayout={currentLayout} />
                </div>
              </div>
              <div
                className="query-pane"
                style={{
                  height: showQueryEditor ? this.state.queryPaneHeight : '0px',
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
                            dataSources={dataSources}
                            toggleQueryPaneHeight={this.toggleQueryPaneHeight}
                            dataQueries={dataQueries}
                            mode={editingQuery ? 'edit' : 'create'}
                            selectedQuery={selectedQuery}
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
                ></WidgetManager>
              )}
            </div>
          </div>
        </DndProvider>
      </div>
    );
  }
}

export { Editor };
