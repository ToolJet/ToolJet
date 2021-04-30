import React from 'react';
import {
  datasourceService, dataqueryService, appService, authenticationService
} from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './Container';
import { CustomDragLayer } from './CustomDragLayer';
import { DraggableBox } from './DraggableBox';
import { componentTypes } from './Components/components';
import { Inspector } from './Inspector/Inspector';
import ReactJson from 'react-json-view';
import { DataSourceManager } from './DataSourceManager';
import { DataSourceTypes } from './DataSourceManager/DataSourceTypes';
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
  runQuery
} from '@/_helpers/appUtils';
import { Confirm } from './Viewer/Confirm';
import ReactTooltip from 'react-tooltip';
import { Resizable } from 're-resizable';
import Skeleton from 'react-loading-skeleton';

class Editor extends React.Component {
  constructor(props) {
    super(props);

    const appId = this.props.match.params.id;

    this.state = {
      currentUser: authenticationService.currentUserValue,
      allComponentTypes: componentTypes,
      queryPaneHeight: '30%',
      isLoading: true,
      users: null,
      appId,
      loadingDataSources: true,
      loadingDataQueries: true,
      showQueryEditor: true,
      showLeftSidebar: true,
      appDefinition: {
        components: null
      },
      currentState: {
        queries: {},
        components: {},
        globals: {
          current_user: {},
          urlparams: {}
        }
      }
    };
  }

  componentDidMount() {
    const appId = this.props.match.params.id;

    appService.getApp(appId).then((data) => this.setState(
      {
        app: data,
        isLoading: false,
        appDefinition: { ...this.state.appDefinition, ...data.definition }
      },
      () => {
        data.data_queries.forEach((query) => {
          if (query.options.runOnPageLoad) {
            runQuery(this, query.id, query.name);
          }
        });
      }
    ));

    this.fetchDataSources();
    this.fetchDataQueries();

    this.setState({
      appId,
      currentSidebarTab: 2,
      selectedComponent: null
    });
  }

  fetchDataSources = () => {
    this.setState(
      {
        loadingDataSources: true
      },
      () => {
        datasourceService.getAll(this.state.appId).then((data) => this.setState({
          dataSources: data.data_sources,
          loadingDataSources: false
        }));
      }
    );
  };

  fetchDataQueries = () => {
    this.setState(
      {
        loadingDataQueries: true
      },
      () => {
        dataqueryService.getAll(this.state.appId).then((data) => {
          this.setState(
            {
              dataQueries: data.data_queries,
              loadingDataQueries: false
            },
            () => {
              let queryState = {};
              data.data_queries.forEach((query) => {
                queryState[query.name] = DataSourceTypes.find((source) => source.kind === query.kind).exposedVariables;
              });

              // Select first query by default
              let selectedQuery = null;
              let editingQuery = false;
              if (data.data_queries.length > 0) {
                selectedQuery = data.data_queries[0];
                editingQuery = true;
              }

              this.setState({
                selectedQuery,
                editingQuery,
                currentState: {
                  ...this.state.currentState,
                  queries: {
                    ...queryState,
                    ...this.state.currentState.queries
                  }
                }
              });
            }
          );
        });
      }
    );
  };

  computeComponentState = (components) => {
    let componentState = {};
    Object.keys(components).forEach((key) => {
      const component = components[key];
      const componentMeta = componentTypes.find((comp) => component.component.component === comp.component);
      componentState[component.component.name] = componentMeta.exposedVariables;
    });

    this.setState({
      currentState: {
        ...this.state.currentState,
        components: {
          ...componentState,
          ...this.state.currentState.components
        }
      }
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
    this.setState({
      currentSidebarTab: tabIndex
    });
  };

  renderComponentCard = (component, index) => {
    return <DraggableBox key={index} index={index} component={component} />;
  };

  filterComponents = (event) => {
    const searchText = event.currentTarget.value;
    let filteredComponents = this.state.allComponentTypes;

    if (searchText !== '') {
      filteredComponents = this.state.allComponentTypes.filter((e) => e.name.toLowerCase() === searchText.toLowerCase());
    }

    this.setState({ componentTypes: filteredComponents });
  };

  appDefinitionChanged = (newDefinition) => {
    console.log('currentDefinition', this.state.appDefinition);
    console.log('newDefinition', newDefinition);

    this.setState({ appDefinition: newDefinition });
    this.computeComponentState(newDefinition.components);
  };

  removeComponent = (component) => {
    let newDefinition = this.state.appDefinition;
    delete newDefinition.components[component.id];
    this.appDefinitionChanged(newDefinition);
    this.switchSidebarTab(2);
  };

  componentDefinitionChanged = (newDefinition) => {
    console.log('new component definition', newDefinition);
    console.log('app definition', this.state.appDefinition);
    this.setState({
      appDefinition: {
        ...this.state.appDefinition,
        components: {
          ...this.state.appDefinition.components,
          [newDefinition.id]: {
            ...this.state.appDefinition.components[newDefinition.id],
            component: newDefinition.component
          }
        }
      }
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
          console.log('dss', dataSource);
          this.setState({ selectedDataSource: dataSource, showDataSourceManagerModal: true });
        }}
      >
        <td>
          <img src={sourceMeta.icon} width="20" height="20" /> {dataSource.name}
        </td>
      </tr>
    );
  };

  renderDataQuery = (dataQuery) => {
    const sourceMeta = DataSourceTypes.find((source) => source.kind === dataQuery.kind);

    let isSeletedQuery = false;
    if (this.state.selectedQuery) {
      isSeletedQuery = dataQuery.id === this.state.selectedQuery.id;
    }

    return (
      <tr
        className={'query-row' + (isSeletedQuery ? ' query-row-selected' : '')}
        key={dataQuery.name}
        onClick={() => this.setState({ editingQuery: true, selectedQuery: dataQuery })}
        role="button"
      >
        <td>
          <img src={sourceMeta.icon} width="20" height="20" />
          <span className="p-3">{dataQuery.name}</span>
        </td>
      </tr>
    );
  };

  onNameChanged = (newName) => {
    this.setState({
      app: { ...this.state.app, name: newName }
    });
  };

  toggleQueryPaneHeight = () => {
    this.setState({
      queryPaneHeight: this.state.queryPaneHeight === '30%' ? '80%' : '30%'
    });
  };

  renderVariables = (type, name, variables) => {
    return (
      <div className="mb-2">
        <ReactJson
          src={variables}
          name={name}
          style={{ fontSize: '0.75rem' }}
          enableClipboard={false}
          displayDataTypes={false}
          collapsed={true}
          sortKeys={true}
        />
      </div>
    );
  };

  renderQueryVariables = (query) => {
    const dataSourceMeta = DataSourceTypes.find((source) => query.kind === source.kind);
    const exposedVariables = dataSourceMeta.exposedVariables;

    return this.renderVariables('queries', query.name, exposedVariables);
  };

  renderComponentVariables = (id, component) => {
    const componentType = component.component.component;
    const componentMeta = componentTypes.find((comp) => componentType === comp.component);
    const exposedVariables = componentMeta.exposedVariables;

    return this.renderVariables('components', component.component.name, exposedVariables);
  };

  toggleQueryEditor = () => {
    this.setState({ showQueryEditor: !this.state.showQueryEditor });
  };

  toggleLeftSidebar = () => {
    this.setState({ showLeftSidebar: !this.state.showLeftSidebar });
  };

  render() {
    const {
      currentSidebarTab,
      selectedComponent,
      appDefinition,
      appId,
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
      isLoading
    } = this.state;

    const appLink = `/applications/${appId}`;

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
                    <img src="/images/logo.svg" width="110" height="32" className="navbar-brand-image" />
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
                <div className="editor-buttons">
                  <span
                    className="btn btn-light mx-2"
                    onClick={this.toggleLeftSidebar}
                    data-tip={showLeftSidebar ? 'Hide left sidebar' : 'Show left sidebar'}
                  >
                    <img src="https://www.svgrepo.com/show/315785/sidebar-open.svg" width="12" height="12" />
                  </span>
                  <span
                    className="btn btn-light mx-2"
                    onClick={this.toggleQueryEditor}
                    data-tip={showQueryEditor ? 'Hide query editor' : 'Show query editor'}
                  >
                    <img
                      style={{ transform: 'rotate(-90deg)' }}
                      src="https://www.svgrepo.com/show/315785/sidebar-open.svg"
                      width="12"
                      height="12"
                    />
                  </span>
                </div>
                <div className="navbar-nav flex-row order-md-last">
                  <div className="nav-item dropdown d-none d-md-flex me-3">
                    <ManageAppUsers appId={appId} />
                  </div>
                  <div className="nav-item dropdown d-none d-md-flex me-3">
                    <a href={appLink} target="_blank" className="btn btn-sm" rel="noreferrer">
                      Launch
                    </a>
                  </div>
                  <div className="nav-item dropdown me-2">
                    {this.state.app && (
                      <SaveAndPreview appId={appId} appName={app.name} appDefinition={appDefinition} app={app} />
                    )}
                  </div>
                </div>
              </div>
            </header>
          </div>
          <div className="sub-section">
            <Resizable
              minWidth={showLeftSidebar ? '12%' : '0%'}
              style={{
                position: 'fixed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0f0f0',
                zIndex: '200'
              }}
              maxWidth={showLeftSidebar ? '30%' : '0%'}
              defaultSize={{
                width: '12%',
                height: '99%'
              }}
            >
              <div className="left-sidebar">
                <div className="variables-container p-3">
                  <div className="col-md-12">
                    <div className="mb-2">
                      <ReactJson
                        style={{ fontSize: '0.7rem' }}
                        enableClipboard={false}
                        src={{
                          currentUser: {
                            name: '',
                            email: ''
                          }
                        }}
                        name={'globals'}
                        displayDataTypes={false}
                        collapsed={true}
                        sortKeys={true}
                        indentWidth={1}
                      />
                    </div>

                    <div className="mb-2">
                      <ReactJson
                        src={currentState.components}
                        name={'components'}
                        style={{ fontSize: '0.7rem' }}
                        enableClipboard={false}
                        displayDataTypes={false}
                        collapsed={true}
                        sortKeys={true}
                        indentWidth={0.5}
                      />
                    </div>

                    <div className="mb-2">
                      <ReactJson
                        src={currentState.queries}
                        name={'queries'}
                        style={{ fontSize: '0.7rem' }}
                        enableClipboard={false}
                        displayDataTypes={false}
                        collapsed={true}
                        sortKeys={true}
                        indentWidth={1}
                      />
                    </div>
                  </div>
                </div>

                <div className="datasources-container w-100 mt-3">
                  <div className="row m-2 datasources-header ">
                    <div className="col-md-9">
                      <h5 className="p-1 text-muted">DATASOURCES</h5>
                    </div>
                    <div className="col-md-3">
                      <span
                        className="btn btn-light btn-sm"
                        data-tip="Add new datasource"
                        onClick={() => this.setState({ showDataSourceManagerModal: true, selectedDataSource: null })}
                      >
                        +
                      </span>
                      {this.state.showDataSourceManagerModal && (
                        <DataSourceManager
                          appId={appId}
                          hideModal={() => this.setState({ showDataSourceManagerModal: false })}
                          dataSourcesChanged={this.dataSourcesChanged}
                          showDataSourceManagerModal={this.state.showDataSourceManagerModal}
                          selectedDataSource={this.state.selectedDataSource}
                        />
                      )}
                    </div>
                  </div>
                  {loadingDataSources ? (
                    <div className="m-3">
                      <Skeleton count={8} />
                    </div>
                  ) : (
                    <div className="m-2">
                      <div className="table-responsive">
                        <table className="table table-vcenter table-nowrap">
                          <tbody>{this.state.dataSources.map((source) => this.renderDataSource(source))}</tbody>
                        </table>
                        {dataSources.length === 0 && (
                          <center className="p-2">
                            You haven&apos;t added data sources yet. <br />
                            <button
                              className="btn btn-sm btn-light mt-3"
                              onClick={() => this.setState({ showDataSourceManagerModal: true, selectedDataSource: null })
                              }
                            >
                              Add datasource
                            </button>
                          </center>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Resizable>
            <div className="main">
              <div className="canvas-container align-items-center">
                <div className="canvas-area">
                  <Container
                    appDefinition={appDefinition}
                    appDefinitionChanged={this.appDefinitionChanged}
                    snapToGrid={true}
                    mode={'edit'}
                    appLoading={isLoading}
                    onEvent={(eventName, options) => onEvent(this, eventName, options)}
                    onComponentOptionChanged={(component, optionName, value) => onComponentOptionChanged(this, component, optionName, value)
                    }
                    onComponentOptionsChanged={(component, options) => onComponentOptionsChanged(this, component, options)
                    }
                    currentState={this.state.currentState}
                    onComponentClick={(id, component) => {
                      this.setState({ selectedComponent: { id, component } });
                      this.switchSidebarTab(1);
                      onComponentClick(this, id, component);
                    }}
                  />
                  <CustomDragLayer snapToGrid={true} />
                </div>
              </div>
              <div
                className="query-pane"
                style={{
                  height: showQueryEditor ? this.state.queryPaneHeight : '0px',
                  width: !showLeftSidebar ? '85%' : '',
                  left: !showLeftSidebar ? '0' : ''
                }}
              >
                <div className="row main-row">
                  <div className="col-md-3 data-pane">
                    <div className="queries-container">
                      <div className="queries-header row m-2">
                        <div className="col">
                          <h5 className="p-1 text-muted">QUERIES</h5>
                        </div>
                        <div className="col-auto">
                          {/* {<button className="btn btn-sm btn-light mx-2">
                                                        <img className="p-1" src="https://www.svgrepo.com/show/13682/search.svg" width="17" height="17"/>
                                                    </button>} */}

                          <span
                            data-tip="Add new query"
                            className="btn btn-sm btn-light"
                            onClick={() => this.setState({ selectedQuery: {}, editingQuery: false, addingQuery: true })}
                          >
                            +
                          </span>
                        </div>
                      </div>

                      {loadingDataQueries ? (
                        <div className="m-3">
                          <Skeleton count={8} />
                        </div>
                      ) : (
                        <div className="m-2">
                          <div className="table-responsive">
                            <table className="table table-vcenter table-nowrap">
                              <tbody>{dataQueries.map((query) => this.renderDataQuery(query))}</tbody>
                            </table>
                          </div>
                          {dataQueries.length === 0 && (
                            <div>
                              <center>
                                You haven&apos;t created queries yet. <br />
                                <button
                                  className="btn btn-sm btn-light mt-3"
                                  onClick={() => this.setState({ selectedQuery: {}, editingQuery: false, addingQuery: true })
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
                  <div className="col-md-9">
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
                            runQuery={(queryId, queryName) => {
                              runQuery(this, queryId, queryName).then(() => {
                                toast.info(`Query (${queryName}) completed.`, {
                                  hideProgressBar: true,
                                  position: 'bottom-center'
                                });
                              });
                            }}
                            addingQuery={addingQuery}
                            editingQuery={editingQuery}
                            queryPaneHeight={queryPaneHeight}
                            currentState={currentState}
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
                <div>
                  <ul className="nav nav-tabs" data-bs-toggle="tabs">
                    <li className="nav-item col-md-6">
                      <a
                        onClick={() => this.switchSidebarTab(1)}
                        className={currentSidebarTab === 1 ? 'nav-link active' : 'nav-link'}
                        data-bs-toggle="tab"
                      >
                        <img
                          src="https://www.svgrepo.com/show/308964/search-look-inspect-magnifying-glass.svg"
                          width="16"
                          height="16"
                        />
                        &nbsp; Inspect
                      </a>
                    </li>
                    <li className="nav-item col-md-6">
                      <a
                        onClick={() => this.switchSidebarTab(2)}
                        className={currentSidebarTab === 2 ? 'nav-link active' : 'nav-link'}
                        data-bs-toggle="tab"
                      >
                        <img src="https://www.svgrepo.com/show/274200/insert.svg" width="16" height="16" />
                        &nbsp; Insert
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {currentSidebarTab === 1 && (
                <div className="pages-container">
                  {selectedComponent ? (
                    <Inspector
                      componentDefinitionChanged={this.componentDefinitionChanged}
                      dataQueries={dataQueries}
                      removeComponent={this.removeComponent}
                      selectedComponent={selectedComponent}
                      components={appDefinition.components}
                    ></Inspector>
                  ) : (
                    <div className="mt-5 p-2">Please select a component to inspect</div>
                  )}
                </div>
              )}

              {currentSidebarTab === 2 && (
                <div className="components-container m-2">
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="icon"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <circle cx="10" cy="10" r="7" />
                        <line x1="21" y1="21" x2="15" y2="15" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder="Search…"
                      aria-label="Search in website"
                      onBlur={(event) => this.filterComponents(event)}
                    />
                  </div>
                  <div className="col-sm-12 col-lg-12">
                    {componentTypes.map((component, i) => this.renderComponentCard(component, i))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DndProvider>
      </div>
    );
  }
}

export { Editor };
