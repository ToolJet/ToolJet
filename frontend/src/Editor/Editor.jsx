import React from 'react';
import { datasourceService, dataqueryService, appService, authenticationService } from '@/_services';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Container } from './Container';
import { CustomDragLayer } from './CustomDragLayer';
import { DraggableBox } from './DraggableBox';
import { componentTypes } from './Components/components';
import { Inspector } from './Inspector/Inspector';
import ReactJson from 'react-json-view';
import { DataSourceManager }  from './DataSourceManager';
import { DataSourceTypes } from './DataSourceManager/DataSourceTypes';
import { QueryManager } from './QueryManager';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { toast } from 'react-toastify';
import { Router, Route, Link } from 'react-router-dom';
import { ManageAppUsers } from './ManageAppUsers';
import { SaveAndPreview } from './SaveAndPreview';

class Editor extends React.Component {
    constructor(props) {
        super(props);

        const appId = this.props.match.params.id;

        this.state = {
            currentUser: authenticationService.currentUserValue,
            allComponentTypes: componentTypes,
            componentTypes: componentTypes,
            queryPaneHeight: '30%',
            users: null,
            appId,
            loadingDataSources: true,
            loadingDataQueries: true,
            appDefinition: {
                components: null
            }
        };
    }

    componentDidMount() {
        
        const appId = this.props.match.params.id;

        appService.getApp(appId).then(data => this.setState({ 
            app: data, 
            isLoading: false,
            appDefinition: { ...this.state.appDefinition, ...data.definition }
        }));

        this.fetchDataSources();
        this.fetchDataQueries();

        this.setState({
            appId,
            currentSidebarTab: 2,
            selectedComponent: null,
        });
    }

    fetchDataSources = () => {
        this.setState({
            loadingDataSources: true
        }, () => {
            datasourceService.getAll(this.state.appId).then(data => this.setState({ 
                dataSources: data.data_sources, 
                loadingDataSources: false,
            }));
        });
    }

    fetchDataQueries = () => {
        this.setState({
            loadingDataQueries: true
        }, () => {
            dataqueryService.getAll(this.state.appId).then(data => this.setState({ 
                dataQueries: data.data_queries, 
                loadingDataQueries: false
            }));
        });
    }

    dataSourcesChanged = () => {
        this.fetchDataSources();
    }

    dataQueriesChanged = () => {
        this.fetchDataQueries();
        this.setState({addingQuery: false})
    }

    switchSidebarTab = (tabIndex) => { 
        this.setState({
            currentSidebarTab: tabIndex
        });
    }

    onComponentClick = (id, component) => {
        this.setState( { selectedComponent: { id, component } } )
        this.switchSidebarTab(1);
    }

    renderComponentCard = (component, index) => {
        return (<DraggableBox key={index} index={index} component={component} />);
    };
    
    filterComponents = (event, value) => {
        const searchText = event.currentTarget.value;
        let filteredComponents = this.state.allComponentTypes;

        if(searchText !== "") {
            filteredComponents = this.state.allComponentTypes.filter((e) => e.name.toLowerCase() == searchText.toLowerCase())
        }

        this.setState( { componentTypes: filteredComponents } )
    }

    appDefinitionChanged = (newDefinition) => { 
        console.log('currentDefinition', this.state.appDefinition);
        console.log('newDefinition', newDefinition);
        this.setState({ appDefinition: newDefinition })
    }

    removeComponent = (component) => {
        let newDefinition = this.state.appDefinition;
        delete newDefinition.components[component.id];
        this.appDefinitionChanged(newDefinition);
        this.switchSidebarTab(2);
    }

    componentDefinitionChanged = (newDefinition) => { 
        console.log('new component definition', newDefinition);
        console.log('app definition', this.state.appDefinition);
        debugger
        this.setState( { 
            appDefinition: {
                 ...this.state.appDefinition, 
                 components: {
                    ...this.state.appDefinition.components,
                    [newDefinition.id]: { component: newDefinition.component } 
                 }
            }
        })
    }

    saveApp = () => {
        const { app, appDefinition } = this.state;
        appService.saveApp(app.id, app.name, appDefinition).then((data) => {
            toast.success('App saved & deployed sucessfully', { hideProgressBar: true, position: "top-center" })
        });
    }

    renderDataSource = (data_source) => {
        const sourceMeta = DataSourceTypes.find(source => source.kind === data_source.kind);
        return (
            <tr role="button" key={data_source.name} onClick={() => { console.log('dss', data_source); this.setState({ selectedDataSource: data_source, showDataSourceManagerModal: true })}}>
                <td>
                    <img src={sourceMeta.icon} width="20" height="20"/> {data_source.name}
                </td>
            </tr>
        )
    }

    renderDataQuery = (data_query) => {
        const sourceMeta = DataSourceTypes.find(source => source.kind === data_query.kind);
        
        let isSeletedQuery = false;
        if(this.state.selectedQuery) {
            isSeletedQuery = data_query.id === this.state.selectedQuery.id
        }

        return (
            <tr className={"query-row" + (isSeletedQuery ? ' query-row-selected': '')} key={data_query.name} className="query-row" onClick={() => this.setState( { editingQuery: true, selectedQuery: data_query })} role="button">
                <td>
                    <img src={sourceMeta.icon} width="20" height="20"/> 
                    <span className="p-3">
                        {data_query.name}
                    </span>
                    
                </td>
                <td>
                    <CopyToClipboard className="query-copy-button" text={`{{queries.${data_query.name}}}`}
                        onCopy={() => toast.success('Reference copied to clipboard', { hideProgressBar: true, position: "bottom-center", })}>
                        <img src="https://www.svgrepo.com/show/86790/copy.svg" width="12" height="12" role="button"></img>
                    </CopyToClipboard>
                </td>
            </tr>
        )
    }

    onNameChanged = (newName) => {
        this.setState({
            app: { ...this.state.app, name: newName }
        })
    }

    toggleQueryPaneHeight = () => {
        this.setState({
            queryPaneHeight: this.state.queryPaneHeight === '30%' ? '80%' : '30%'
        })
    }

    renderVariables = (type, name, variables) => {
        return (
            <div className="mb-2">
                {name} <small className="text-muted"> {variables.length} keys</small>
                <div className="p-2 bg-light w-100">
                    {variables.map((variable, index) => 
                        <div className="row" key={`${name}-${index}`}>
                            <div className="col">
                                <small role="button col-auto">{variable}</small>
                            </div>
                            <div className="col-auto">
                                <CopyToClipboard className="query-copy-button" text={`{{${type}.${name}.${variable}}}`}
                                    onCopy={() => toast.success('Reference copied to clipboard', { hideProgressBar: true, position: "bottom-center", })}>
                                    <img src="https://www.svgrepo.com/show/86790/copy.svg" width="8" height="8" role="button"></img>
                                </CopyToClipboard>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    renderQueryVariables = (query) => { 
        const dataSourceMeta = DataSourceTypes.find(source => query.kind === source.kind);
        const exposedVariables = Object.keys(dataSourceMeta.exposedVariables);

        return this.renderVariables('queries', query.name, exposedVariables);
    }

    renderComponentVariables = (id, component) => { 
        const componentType = component.component.component;
        const componentMeta = componentTypes.find(comp => componentType === comp.component);
        const exposedVariables = Object.keys(componentMeta.exposedVariables);

        return this.renderVariables('components', component.component.name, exposedVariables);
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
            componentTypes
        } = this.state;

        const appLink = `/applications/${appId}`;

        return (
            <div className="editor wrapper">
                <DndProvider backend={HTML5Backend}>
                    <div className="header">
                        <header className="navbar navbar-expand-md navbar-light d-print-none">
                            <div className="container-xl header-container">
                            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
                                <span className="navbar-toggler-icon"></span>
                            </button>
                            <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                            <Link 
                                to={`/`} 
                                className="">
                                    <img src="/images/logo.svg" width="110" height="32" className="navbar-brand-image"/>
                            </Link>
                                <a href="/">
                                </a>
                            </h1>
                            {this.state.app &&
                                <input 
                                    type="text" 
                                    style={{width: '200px', left: '80px', position: 'absolute'}}
                                    onChange={(e) => this.onNameChanged(e.target.value)}
                                    className="form-control-plaintext form-control-plaintext-sm" 
                                    value={this.state.app.name}
                                />
                            }
                            <div className="navbar-nav flex-row order-md-last">
                                <div className="nav-item dropdown d-none d-md-flex me-3">
                                    <ManageAppUsers 
                                        appId={appId}
                                    />
                                </div>
                                <div className="nav-item dropdown d-none d-md-flex me-3">
                                    <a href={appLink} target="_blank" className="btn btn-sm">Launch</a>    
                                </div>
                                <div className="nav-item dropdown me-2">
                                    {this.state.app &&
                                        <SaveAndPreview
                                            appId={appId} 
                                            appName={app.name}
                                            appDefinition={appDefinition}
                                            app={app}
                                        />
                                    }
                                </div>
                                </div>
                            </div>
                        </header>
                    </div>
                    <div className="sub-section">
                    <div className="editor-sidebar">
                        <div className="col-md-12">
                            <div className="card">
                                <ul className="nav nav-tabs" data-bs-toggle="tabs">
                                    <li className="nav-item col-md-6">
                                        <a onClick={() => this.switchSidebarTab(1)} className={currentSidebarTab === 1 ? 'nav-link active' : 'nav-link'} data-bs-toggle="tab">
                                            <img src="https://www.svgrepo.com/show/308964/search-look-inspect-magnifying-glass.svg" width="16" height="16"/>
                                                &nbsp; Inspect
                                        </a>
                                    </li>
                                    <li className="nav-item col-md-6">
                                        <a onClick={() => this.switchSidebarTab(2)} className={currentSidebarTab === 2 ? 'nav-link active' : 'nav-link'}  data-bs-toggle="tab">
                                            <img src="https://www.svgrepo.com/show/274200/insert.svg" width="16" height="16"/>
                                                &nbsp; Insert
                                        </a>
                                    </li>
                                    
                                </ul>
                            </div>
                        </div>

                        {currentSidebarTab === 1 && 
                            <div className="pages-container">
                                    {selectedComponent ?
                                        <Inspector 
                                            componentDefinitionChanged={this.componentDefinitionChanged}
                                            dataQueries={dataQueries}
                                            removeComponent={this.removeComponent}
                                            selectedComponent={selectedComponent}>

                                        </Inspector>
                                        :
                                        <div className="mt-5 p-2">Please select a component to inspect</div>
                                    }
                            </div>
                        }

                        {currentSidebarTab === 2 && 
                            <div className="components-container m-2">
                                <div className="input-icon">
                                    <span className="input-icon-addon">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="10" cy="10" r="7" /><line x1="21" y1="21" x2="15" y2="15" /></svg>
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
                                    { componentTypes.map((component, i) => this.renderComponentCard(component, i)) }
                                </div>
                            </div>
                        }
                    </div>
                    <div className="main">
                        <div className="canvas-container align-items-center">
                            <div className="canvas-area">
                                <Container 
                                    appDefinition={appDefinition}
                                    appDefinitionChanged={this.appDefinitionChanged}
                                    snapToGrid={true} 
                                    onComponentClick={this.onComponentClick}/>
                                <CustomDragLayer snapToGrid={true}/>
                            </div>
                        </div>
                        <div className="query-pane" style={{height: this.state.queryPaneHeight}}>
                            <div className="row main-row">
                                <div className="col-md-3 data-pane">
                                    <div className="queries-container">
                                        <div className="queries-header row m-2">
                                                <div className="col">
                                                    <h5 className="p-1 text-muted">QUERIES</h5>
                                                    </div>
                                                <div className="col-auto">
                                                    {<button className="btn btn-sm btn-light mx-2">
                                                        <img className="p-1" src="https://www.svgrepo.com/show/13682/search.svg" width="17" height="17"/>
                                                    </button>}
                                                    {<button className="btn btn-sm btn-light" onClick={() => this.setState({ selectedQuery: {}, editingQuery: false, addingQuery: true})}>+</button>}
                                                </div>
                                        </div>
                                        
                                        {loadingDataQueries ?  
                                                <div>Loading queries...</div>
                                                : 
                                                <div className="m-2">
                                                    <div className="table-responsive">
                                                        <table
                                                                className="table table-vcenter table-nowrap">
                                                            <tbody>
                                                                {dataQueries.map((query) => this.renderDataQuery(query))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    
                                                </div>
                                            }
                                    </div>
                                </div>
                                <div className="col-md-9">
                                    {!loadingDataSources &&
                                        <div className="query-definition-pane">
                                            {(addingQuery || editingQuery) && 
                                                <div>
                                                    {console.log('sq', editingQuery ? 'edit' : 'create')}
                                                    <QueryManager 
                                                        dataSources={dataSources}
                                                        toggleQueryPaneHeight={this.toggleQueryPaneHeight}
                                                        dataQueries={dataQueries}
                                                        mode={editingQuery ? 'edit' : 'create'}
                                                        selectedQuery={selectedQuery}
                                                        dataQueriesChanged={this.dataQueriesChanged}
                                                        appId={appId}
                                                    />
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="left-sidebar">
                        <div className="variables-container p-3">
                            <div className="col-md-12">
                                <h5 className="text-muted">Globals</h5>
                                <div className="mb-2">
                                    currentUser <small className="text-muted">  2 keys</small>
                                    <div className="p-2 bg-light w-100">
                                    <div className="row">
                                            <div className="col">
                                                <small role="button col-auto">name</small>
                                            </div>
                                            <div className="col-auto">
                                                <CopyToClipboard className="query-copy-button" text={`{{globals.current_user.name}}`}
                                                    onCopy={() => toast.success('Reference copied to clipboard', { hideProgressBar: true, position: "bottom-center", })}>
                                                    <img src="https://www.svgrepo.com/show/86790/copy.svg" width="8" height="8" role="button"></img>
                                                </CopyToClipboard>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col">
                                                <small role="button col-auto">email</small>
                                            </div>
                                            <div className="col-auto">
                                                <CopyToClipboard className="query-copy-button" text={`{{globals.current_user.email}}`}
                                                    onCopy={() => toast.success('Reference copied to clipboard', { hideProgressBar: true, position: "bottom-center", })}>
                                                    <img src="https://www.svgrepo.com/show/86790/copy.svg" width="8" height="8" role="button"></img>
                                                </CopyToClipboard>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr/>

                            <div className="col-md-9">
                                <h5 className="text-muted">Queries</h5>
                            </div>
                            {dataQueries && 
                                <>
                                    {dataQueries.map((query => 
                                        this.renderQueryVariables(query)
                                    ))}
                                </>
                            }

                            <hr/>

                            <div className="col-md-9">
                                <h5 className="text-muted">Components</h5>
                            </div>
                            {appDefinition.components && 
                                <>
                                    {Object.keys(appDefinition.components).map((key => 
                                        this.renderComponentVariables(key, appDefinition.components[key])
                                    ))}
                                </>
                            }

                        </div>
                        
                        
                        <div className="datasources-container w-100 mt-3">
                                <div className="row m-2 datasources-header ">
                                    <div className="col-md-9">
                                       <h5 className="p-1 text-muted">DATASOURCES</h5>
                                    </div>
                                        <div className="col-md-3">
                                        <button className="btn btn-light btn-sm" 
                                            onClick={() => this.setState({ showDataSourceManagerModal: true, selectedDataSource: null })}>
                                                +
                                        </button>
                                        {this.state.showDataSourceManagerModal && 
                                            <DataSourceManager 
                                                appId={appId}
                                                hideModal={() => this.setState({ showDataSourceManagerModal: false })}
                                                dataSourcesChanged={this.dataSourcesChanged}
                                                showDataSourceManagerModal={this.state.showDataSourceManagerModal}
                                                selectedDataSource={this.state.selectedDataSource}
                                            />
                                        }
                                    </div>
                                </div>
                                {loadingDataSources ?  
                                    <div>Loading datasources...</div>
                                    : 
                                    <div className="m-2">
                                        <div className="table-responsive">
                                            <table
                                                    className="table table-vcenter table-nowrap">
                                                <tbody>
                                                    {this.state.dataSources.map((source) => this.renderDataSource(source))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                    </div>
                                }
                                
                            </div>
                        </div>
                    </div>
                </DndProvider>    
            </div>
        );
    }
}

export { Editor };
