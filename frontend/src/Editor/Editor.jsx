import React from 'react';
import {
  datasourceService, dataqueryService, appService, authenticationService
} from '@/_services';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './Container';
import { CustomDragLayer } from './CustomDragLayer';
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
  runQuery,
  previewQuery
} from '@/_helpers/appUtils';
import { Confirm } from './Viewer/Confirm';
import ReactTooltip from 'react-tooltip';
import { Resizable } from 're-resizable';
import { WidgetManager } from './WidgetManager';

class Editor extends React.Component {
  constructor(props) {
    super(props);

    const appId = this.props.match.params.id;

    const currentUser = authenticationService.currentUserValue;
    let userVars = { };

    if (currentUser) {
      userVars = {
        email: currentUser.email,
        firstName: currentUser.first_name,
        lastName: currentUser.last_name
      };
    }

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
      zoomLevel: 1.0,
      currentLayout: 'desktop',
      scaleValue: 1,
      deviceWindowWidth: 450,
      appDefinition: {
        components: null
      },
      currentState: {
        queries: {},
        components: {},
        globals: {
          currentUser: userVars,
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
              loadingDataQueries: false,
              app: {
                ...this.state.app,
                data_queries: data.data_queries
              }
            },
            () => {
              let queryState = {};
              data.data_queries.forEach((query) => {
                queryState[query.name] = { 
                  ...DataSourceTypes.find((source) => source.kind === query.kind).exposedVariables,
                  ...this.state.currentState.queries[query.name]
                };
              });

              // Select first query by default
              let selectedQuery = this.state.selectedQuery;
              let editingQuery = false;

              if (selectedQuery) {
                data.data_queries.find((dq) => dq.id === selectedQuery.id);
                editingQuery = true;
              } else if (data.data_queries.length > 0) {
                selectedQuery = data.data_queries[0];
                editingQuery = true;
              }

              this.setState({
                selectedQuery,
                editingQuery,
                currentState: {
                  ...this.state.currentState,
                  queries: {
                    ...queryState
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
    const currentComponents = this.state.currentState.components;
    Object.keys(components).forEach((key) => {
      const component = components[key];
      const componentMeta = componentTypes.find((comp) => component.component.component === comp.component);

      const existingComponentName = Object.keys(currentComponents).find(comp => currentComponents[comp].id === key);
      const existingValues = currentComponents[existingComponentName];

      componentState[component.component.name] = { ...componentMeta.exposedVariables, id: key, ...existingValues };
    });

    this.setState({
      currentState: {
        ...this.state.currentState,
        components: {
          ...componentState
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

    // Delete child components when parent is deleted
    const childComponents = Object.keys(newDefinition.components).filter((key) => newDefinition.components[key].parent === component.id);
    childComponents.forEach((componentId) => {
      delete newDefinition.components[componentId];
    });

    delete newDefinition.components[component.id];
    this.appDefinitionChanged(newDefinition);
    this.switchSidebarTab(2);
  };

  componentDefinitionChanged = (newDefinition) => {
    this.setState({
      appDefinition: {
        ...this.state.appDefinition,
        components: {
          ...this.state.appDefinition.components,
          [newDefinition.id]: {
            ...this.state.appDefinition.components[newDefinition.id],
            component: newDefinition.component,
            layouts: newDefinition.layouts
          }
        }
      }
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
            ...newComponent
          }
        }
      }
    });
  }

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
          <img src={`/assets/images/icons/editor/datasources/${sourceMeta.kind.toLowerCase()}.svg`} width="20" height="20" /> {dataSource.name}
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

    const { currentState } = this.state;

    const isLoading = currentState.queries[dataQuery.name] ? currentState.queries[dataQuery.name].isLoading  : false;

    return (
      <div 
        className={'row query-row py-2 px-3' + (isSeletedQuery ? ' query-row-selected' : '')}
        key={dataQuery.name}
        onClick={() => this.setState({ editingQuery: true, selectedQuery: dataQuery })}
        role="button"
      >
        <div className="col">
          <img src={`/assets/images/icons/editor/datasources/${sourceMeta.kind.toLowerCase()}.svg`} width="20" height="20" />
          <span className="p-3">{dataQuery.name}</span>
        </div>
        <div className="col-auto">
          {!(isLoading === true) &&
            <button 
              className="btn badge bg-azure-lt"
              onClick={() => {
                runQuery(this, dataQuery.id, dataQuery.name).then(() => {
                  toast.info(`Query (${dataQuery.name}) completed.`, {
                    hideProgressBar: true,
                    position: 'bottom-center'
                  });
                });
              }}
            >
              <div><img src="/assets/images/icons/editor/play.svg" width="8" height="8" className="mx-1" /></div>
            </button>
          }
          {isLoading === true && 
            <div 
              className="px-2">
              <div class="text-center spinner-border spinner-border-sm" role="status"></div>
            </div>
          }
        </div>
      </div>
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

  toggleQueryEditor = () => {
    this.setState({ showQueryEditor: !this.state.showQueryEditor });
  };

  toggleLeftSidebar = () => {
    this.setState({ showLeftSidebar: !this.state.showLeftSidebar });
  };

  configHandleClicked = (id, component) => {
    this.switchSidebarTab(1);
    this.setState({ selectedComponent: { id, component } });
  }

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
      isLoading,
      zoomLevel,
      currentLayout,
      deviceWindowWidth,
      scaleValue
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
                <div className="editor-buttons">
                  <span
                    className={`btn ${showLeftSidebar ? 'btn-light' : 'btn-default'} mx-2`}
                    onClick={this.toggleLeftSidebar}
                    data-tip={showLeftSidebar ? 'Hide left sidebar' : 'Show left sidebar'}
                  >
                    <img src="/assets/images/icons/editor/sidebar-toggle.svg" width="12" height="12" />
                  </span>
                  <span
                    className={`btn ${showQueryEditor ? 'btn-light' : 'btn-default'} mx-2`}
                    onClick={this.toggleQueryEditor}
                    data-tip={showQueryEditor ? 'Hide query editor' : 'Show query editor'}
                  >
                    <img
                      style={{ transform: 'rotate(-90deg)' }}
                      src="/assets/images/icons/editor/sidebar-toggle.svg"
                      width="12"
                      height="12"
                    />
                  </span>
                </div>
                <div className="canvas-buttons">
                    <button
                        className="btn btn-light mx-2"
                        onClick={() => this.setState({ zoomLevel: zoomLevel - 0.1 })}
                        disabled={zoomLevel <= 0.6}
                        role="button"
                    >
                        <img
                            src="/assets/images/icons/zoom-out.svg"
                            width="12"
                            height="12"
                        />
                    </button>
                    <small>
                        {zoomLevel * 100}%
                    </small>
                    <button
                        className="btn btn-light mx-2"
                        onClick={() => this.setState({ zoomLevel: zoomLevel + 0.1 })}
                        disabled={zoomLevel === 1}
                        role="button"
                    >
                        <img
                        src="/assets/images/icons/zoom-in.svg"
                        width="12"
                        height="12"
                        />
                  </button>
                </div>
                <div className="layout-buttons">
                  <div class="btn-group" role="group" aria-label="Basic example">
                    <button 
                      type="button" 
                      class="btn btn-light"
                      onClick={() => this.setState({ currentLayout: 'desktop' })}
                      disabled={currentLayout === 'desktop'}
                    >
                      <img src="https://www.svgrepo.com/show/108320/desktop.svg" width="12" height="12" />
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-light"
                      onClick={() => this.setState({ currentLayout: 'mobile' })}
                      disabled={currentLayout === 'mobile'}
                    >
                      <img src="https://www.svgrepo.com/show/80383/touch-screen-mobile-device.svg" width="12" height="12" />
                    </button>
                  </div>

                </div>
                <div className="navbar-nav flex-row order-md-last">
                  <div className="nav-item dropdown d-none d-md-flex me-3">
                    {app
                      && <ManageAppUsers app={app} />
                    }
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
                        src={currentState.globals}
                        name={'globals'}
                        displayDataTypes={false}
                        collapsed={true}
                        displayObjectSize={false}
                        quotesOnKeys={false}
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
                        displayObjectSize={false}
                        quotesOnKeys={false}
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
                        displayObjectSize={false}
                        quotesOnKeys={false}
                        sortKeys={true}
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
                        className="btn btn-light btn-sm text-muted"
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
                    <div className="p-5">
                      <center>
                        <div className="spinner-border text-azure" role="status"></div>
                      </center>
                    </div>
                  ) : (
                    <div className="m-2">
                      <div className="table-responsive">
                        <table className="table table-vcenter table-nowrap">
                          <tbody>{this.state.dataSources.map((source) => this.renderDataSource(source))}</tbody>
                        </table>
                        {dataSources.length === 0 && (
                          <center className="p-2 text-muted">
                            You haven&apos;t added data sources yet. <br />
                            <button
                              className="btn btn-sm btn-outline-azure mt-3"
                              onClick={() => this.setState({ showDataSourceManagerModal: true, selectedDataSource: null })
                              }
                            >
                              add datasource
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
              <div className="canvas-container align-items-center" style={{ transform: `scale(${zoomLevel})` }}>
                <div className="canvas-area" style={{width: currentLayout === 'desktop' ? '1292px' : '450px'}}>
                  <Container
                    appDefinition={appDefinition}
                    appDefinitionChanged={this.appDefinitionChanged}
                    snapToGrid={true}
                    mode={'edit'}
                    zoomLevel={zoomLevel}
                    currentLayout={currentLayout}
                    deviceWindowWidth={deviceWindowWidth}
                    scaleValue={scaleValue}
                    appLoading={isLoading}
                    onEvent={(eventName, options) => onEvent(this, eventName, options)}
                    onComponentOptionChanged={(component, optionName, value) => onComponentOptionChanged(this, component, optionName, value)
                    }
                    onComponentOptionsChanged={(component, options) => onComponentOptionsChanged(this, component, options)
                    }
                    currentState={this.state.currentState}
                    configHandleClicked={this.configHandleClicked}
                    removeComponent={this.removeComponent}
                    onComponentClick={(id, component) => {
                      // this.setState({ selectedComponent: { id, component } });
                      // this.switchSidebarTab(1);
                      onComponentClick(this, id, component);
                    }}
                  />
                  <CustomDragLayer 
                    snapToGrid={true} 
                    currentLayout={currentLayout}
                  />
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
                      <div className="queries-header row mt-2">
                        <div className="col">
                          <h5 className="py-1 px-3 text-muted">QUERIES</h5>
                        </div>
                        <div className="col-auto px-3">
                          {/* {<button className="btn btn-sm btn-light mx-2">
                                                        <img className="p-1" src="/search.svg" width="17" height="17"/>
                                                    </button>} */}

                          <span
                            data-tip="Add new query"
                            className="btn btn-sm btn-light text-muted"
                            onClick={() => this.setState({ selectedQuery: {}, editingQuery: false, addingQuery: true })}
                          >
                            +
                          </span>
                        </div>
                      </div>

                      {loadingDataQueries ? (
                        <div className="p-5">
                          <center>
                            <div className="spinner-border text-azure" role="status"></div>
                          </center>
                        </div>
                      ) : (
                        <div className="query-list">
                          <div>
                            {dataQueries.map((query) => this.renderDataQuery(query))}
                          </div>
                          {dataQueries.length === 0 && (
                            <div className="mt-5">
                              <center>
                                <span className="text-muted">You haven&apos;t created queries yet.</span> <br />
                                <button
                                  className="btn btn-sm btn-outline-azure mt-3"
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
                          src="/assets/images/icons/lens.svg"
                          width="16"
                          height="16"
                          className="d-md-none d-lg-block"
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
                        <img src="/assets/images/icons/insert.svg" width="16" height="16" className="d-md-none d-lg-block"/>
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
                      componentChanged={this.componentChanged}
                      removeComponent={this.removeComponent}
                      selectedComponentId={selectedComponent.id}
                      currentState={currentState}
                      allComponents={appDefinition.components}
                      key={selectedComponent.id}
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
