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

class Editor extends React.Component {
    constructor(props) {
        super(props);

        const appId = this.props.match.params.id;

        this.state = {
            currentUser: authenticationService.currentUserValue,
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
                loadingDataQueries: false,
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

    appDefinitionChanged = (newDefinition) => { 
        console.log('newDefinition', newDefinition);
        this.setState({ appDefinition: newDefinition })
        console.log('app definition', this.state.appDefinition);
    }

    removeComponent = (component) => {
        let newDefinition = this.state.appDefinition;
        delete newDefinition.components[component.id];
        this.appDefinitionChanged(newDefinition);
    }

    componentDefinitionChanged = (newDefinition) => { 
        console.log('new component definition', newDefinition);
        console.log('app definition', this.state.appDefinition);
        this.setState( { 
            appDefinition: { ...this.state.appDefinition, [newDefinition.id]: { component: newDefinition.component } }
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
            <tr>
                <td>
                    <img src={sourceMeta.icon} width="20" height="20"/> {data_source.name}
                </td>
            </tr>
        )
    }

    renderDataQuery = (data_query) => {
        const sourceMeta = DataSourceTypes.find(source => source.kind === data_query.kind);
        return (
            <tr onClick={() => this.setState( { editingQuery: true, selectedQuery: data_query })} role="button">
                <td>
                    <img src={sourceMeta.icon} width="20" height="20"/> {data_query.name}
                </td>
                <td>
                    <CopyToClipboard text={`{{queries.${data_query.name}}}`}
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
            editingQuery
        } = this.state;

        const global_context = {
            current_user: {
                name: 'navaneeth',
                email: 'n@stackegg.com'
            },
            urlparams: {
                q: 'components'
            }
        }

        const appLink = `/applications/${appId}`;

        return (
            <div class="editor wrapper">
                <DndProvider backend={HTML5Backend}>
                    <div className="header">
                        <header class="navbar navbar-expand-md navbar-light d-print-none">
                            <div class="container-xl header-container">
                            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
                                <span class="navbar-toggler-icon"></span>
                            </button>
                            <h1 class="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                            <Link 
                                to={`/`} 
                                className="">
                                    <img src="https://www.svgrepo.com/show/210145/egg.svg" width="110" height="32" alt="StackEgg" class="navbar-brand-image"/>

                                </Link>
                                <a href="/">
                                </a>
                            </h1>
                            {this.state.app &&
                                <input 
                                    type="text" 
                                    onChange={(e) => this.onNameChanged(e.target.value)}
                                    class="form-control-plaintext form-control-plaintext-sm" 
                                    value={this.state.app.name}
                                />
                            }
                            <div class="navbar-nav flex-row order-md-last">
                                <div class="nav-item dropdown d-none d-md-flex me-3">
                                    <button onClick={this.saveApp} className="btn">Save</button>    
                                </div>
                                <div class="nav-item dropdown d-none d-md-flex me-3">
                                    <a href={appLink} target="_blank" className="btn">Launch</a>    
                                </div>
                                <div class="nav-item dropdown ml-2">
                                    <button className="btn btn-primary">Deploy</button>    
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
                                    <li class="nav-item col-md-6">
                                        <a onClick={() => this.switchSidebarTab(1)} className={currentSidebarTab === 1 ? 'nav-link active' : 'nav-link'} data-bs-toggle="tab">
                                            <img src="https://www.svgrepo.com/show/73662/pages.svg" width="16" height="16"/>
                                                &nbsp; Inspect
                                        </a>
                                    </li>
                                    <li className="nav-item col-md-6">
                                        <a onClick={() => this.switchSidebarTab(2)} className={currentSidebarTab === 2 ? 'nav-link active' : 'nav-link'}  data-bs-toggle="tab">
                                            <img src="https://www.svgrepo.com/show/315687/components.svg" width="16" height="16"/>
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
                                <div class="input-icon">
                                    <span class="input-icon-addon">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="10" cy="10" r="7" /><line x1="21" y1="21" x2="15" y2="15" /></svg>
                                    </span>
                                    <input type="text" class="form-control mb-2" placeholder="Search…" aria-label="Search in website"/>
                                </div>
                                <div class="col-sm-12 col-lg-12">
                                    { componentTypes.map((component, i) => this.renderComponentCard(component, i)) }
                                </div>
                            </div>
                        }
                    </div>
                    <div className="main">
                        <div className="canvas-container align-items-center">
                            {appDefinition.components &&
                                <div className="canvas-area">
                                    
                                        <Container 
                                            appDefinition={appDefinition}
                                            appDefinitionChanged={this.appDefinitionChanged}
                                            snapToGrid={true} 
                                            onComponentClick={this.onComponentClick}/>
                                        <CustomDragLayer snapToGrid={true}/>
                                </div>
                            }
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
                                                    {<button className="btn btn-sm btn-light" onClick={() => this.setState({ editingQuery: false, addingQuery: true})}>+</button>}
                                                </div>
                                        </div>
                                        
                                        {loadingDataQueries ?  
                                                <div>Loading queries...</div>
                                                : 
                                                <div className="m-2">
                                                    <div class="table-responsive">
                                                        <table
                                                                class="table table-vcenter table-nowrap">
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
                        <div class="accordion" id="accordion-example">
                            <div class="accordion-item">
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="heading-2">
                                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-2" aria-expanded="false">
                                    Globals
                                </button>
                                </h2>
                                <div id="collapse-2" class="accordion" data-bs-parent="#accordion-example">
                                <div class="accordion-body pt-0">
                                    <ReactJson
                                        collapsed={true}
                                        enableClipboard={false}
                                        name={null}
                                        src={global_context} />
                                </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="datasources-container w-100">
                                <div className="row m-2 datasources-header ">
                                    <div className="col-md-9">
                                       <h5 className="p-1 text-muted">DATASOURCES</h5>
                                    </div>
                                    <div className="col-md-3">
                                        <DataSourceManager 
                                            appId={appId}
                                            dataSourcesChanged={this.dataSourcesChanged}
                                        />
                                    </div>
                                </div>
                                {loadingDataSources ?  
                                    <div>Loading datasources...</div>
                                    : 
                                    <div className="m-2">
                                        <div class="table-responsive">
                                            <table
                                                    class="table table-vcenter table-nowrap">
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