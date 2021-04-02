import React from 'react';
import { appService, authenticationService } from '@/_services';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Container } from './Container';
import { CustomDragLayer } from './CustomDragLayer';
import { DraggableBox } from './DraggableBox';
import { componentTypes } from './Components/components';
import { Inspector } from './Inspector/Inspector';
import ReactJson from 'react-json-view'

class Editor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentUser: authenticationService.currentUserValue,
            users: null,
            appDefinition: {
                components: {}
            }
        };
    }

    componentDidMount() {
        
        const id = this.props.match.params.id;

        appService.getApp(id).then(data => this.setState({ 
            app: data, 
            isLoading: false,
            appDefinition: { ...this.state.appDefinition, ...data.definition }
        }));

        this.setState({
            currentSidebarTab: 2,
            selectedComponent: null,
        });
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

    componentDefinitionChanged = (newDefinition) => { 
        console.log('new component definition', newDefinition);
        console.log('app definition', this.state.appDefinition);
        this.setState( { 
            appDefinition: { ...this.state.appDefinition, [newDefinition.id]: { component: newDefinition.component } }
        })
    }

    saveApp = () => {
        const { app, appDefinition } = this.state;
        appService.saveApp(app.id, appDefinition).then((data) => {
            alert('saved')
        });
    }

    render() {
        const { currentSidebarTab, selectedComponent, appDefinition } = this.state;

        const global_context = {
            current_user: {
                name: 'navaneeth',
                email: 'n@stackegg.com'
            },
            urlparams: {
                q: 'components'
            }
        }

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
                                <a href=".">
                                <img src="https://www.svgrepo.com/show/210145/egg.svg" width="110" height="32" alt="StackEgg" class="navbar-brand-image"/>
                                </a>
                            </h1>
                            <div class="navbar-nav flex-row order-md-last">
                                <div class="nav-item dropdown d-none d-md-flex me-3">
                                    <button onClick={this.saveApp} className="btn">Save</button>    
                                </div>
                                <div class="nav-item dropdown d-none d-md-flex me-3">
                                    <button className="btn">Preview</button>    
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
                                    <li class="nav-item">
                                        <a onClick={() => this.switchSidebarTab(1)} className={currentSidebarTab === 1 ? 'nav-link active' : 'nav-link'} data-bs-toggle="tab">
                                            <img src="https://www.svgrepo.com/show/73662/pages.svg" width="16" height="16"/>
                                                &nbsp; Inspect
                                        </a>
                                    </li>
                                    <li className="nav-item">
                                        <a onClick={() => this.switchSidebarTab(2)} className={currentSidebarTab === 2 ? 'nav-link active' : 'nav-link'}  data-bs-toggle="tab">
                                            <img src="https://www.svgrepo.com/show/315687/components.svg" width="16" height="16"/>
                                                &nbsp; Components
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
                            <div className="canvas-area">
                                <Container 
                                    appDefinition={appDefinition}
                                    appDefinitionChanged={this.appDefinitionChanged}
                                    snapToGrid={true} 
                                    onComponentClick={this.onComponentClick}/>
			                    <CustomDragLayer snapToGrid={true}/>
                            </div>
                        </div>
                        <div className="query-pane p-2">
                            <div className="row">
                                <div className="col-md-2">
                                    <div className="row">
                                        <div className="col-md-9 ">
                                            <div class="my-2 my-md-0 flex-grow-1 flex-md-grow-0 order-first order-md-last">
                                                <form action="." method="get">
                                                <div class="input-icon">
                                                    <span class="input-icon-addon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="10" cy="10" r="7" /><line x1="21" y1="21" x2="15" y2="15" /></svg>
                                                    </span>
                                                    <input type="text" class="form-control" placeholder="Search…" aria-label="Search in website"/>
                                                </div>
                                                </form>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <button className="btn btn-light">+ New </button>
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="left-sidebar">
                        <div class="accordion" id="accordion-example">
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="heading-1">
                                <button class="accordion-button " type="button" data-bs-toggle="collapse" data-bs-target="#collapse-1" aria-expanded="true">
                                    Pages
                                </button>
                                </h2>
                                <div id="collapse-1" class="accordion-collapse collapse show" data-bs-parent="#accordion-example">
                                <div class="accordion-body pt-0">
                                    <div class="card-table table-responsive">
                                        <table class="table table-vcenter">
                                        <tbody>
                                            <tr>
                                                <td class="td-truncate">
                                                    <div class="text-truncate">
                                                        Main view
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="td-truncate">
                                                    <div class="text-truncate">
                                                        Customer view
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="td-truncate">
                                                    <div class="text-truncate">
                                                        Payments view
                                                    </div>
                                                </td>
                                           </tr>
                                        </tbody>
                                        </table>
                                    </div>
                                </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="heading-2">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-2" aria-expanded="false">
                                    Components
                                </button>
                                </h2>
                                <div id="collapse-2" class="accordion-collapse collapse" data-bs-parent="#accordion-example">
                                <div class="accordion-body pt-0">
                                    <strong>This is the second item's accordion body.</strong> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the <code>.accordion-body</code>, though the transition does limit overflow.
                                </div>
                                </div>
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
                    </div>
                    </div>
                </DndProvider>    
            </div>
        );
    }
}

export { Editor };