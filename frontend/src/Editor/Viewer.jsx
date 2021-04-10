import React from 'react';
import { appService, dataqueryService, authenticationService } from '@/_services';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Container } from './Container';
import { CustomDragLayer } from './CustomDragLayer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getDynamicVariables, resolve, resolve_references } from '@/_helpers/utils';
import { Confirm } from './Viewer/Confirm';

class Viewer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentUser: authenticationService.currentUserValue,
            users: null,
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
        
        const id = this.props.match.params.id;

        appService.getApp(id).then(data => this.setState({ 
            app: data, 
            isLoading: false,
            appDefinition: data.definition
        }, () => {
            data.data_queries.map((query) => {
                if(query.options.runOnPageLoad) {
                    this.runQuery(query.id, query.name);
                }
            })
        }));

        const currentUser = authenticationService.currentUserValue;

        this.setState({
            currentSidebarTab: 2,
            selectedComponent: null,
            currentState: {
                queries: {},
                components: {},
                globals: {
                    current_user: {
                        email: currentUser.email,
                        first_name: currentUser.first_name,
                        last_name: currentUser.last_name
                    },
                    urlparams: {}
                }
            }
        });
    }

    switchSidebarTab = (tabIndex) => { 
        this.setState({
            currentSidebarTab: tabIndex
        });
    }

    runTransformation = (rawData, transformation) => {
        const data = rawData;
        const evalFunction = Function(['data'], transformation);
        return evalFunction(data);
    }

    runQuery = (queryId, queryName, confirmed = undefined ) => {
        const dataQuery = this.state.app.data_queries.find(query => query.id === queryId);

        const options = resolve_references(dataQuery.options, this.state.currentState);

        if(options.requestConfirmation) {
            if(confirmed === undefined) {
                this.setState({ 
                    showQueryConfirmation: true,
                    queryConfirmationData : {
                        queryId, queryName
                    }
                });
                return;
            }
        }

        this.setState({
            currentState: {
                ...this.state.currentState, 
                queries: {
                    ...this.state.currentState.queries, 
                    [queryName]: {
                        ...this.state.currentState.queries[queryName],
                        isLoading: true
                    }
                }
            }
        });

        dataqueryService.run(queryId, options).then(data => 
            {
                let rawData = data.data;
                let finalData = data.data;
                finalData = this.runTransformation(rawData, options.transformation);

                this.setState({
                    currentState: {
                        ...this.state.currentState, 
                        queries: {
                            ...this.state.currentState.queries, 
                            [queryName]: {
                                ...this.state.currentState.queries[queryName],
                                data: finalData,
                                rawData,
                                isLoading: false
                            }
                        }
                    }
                })
            }
        );
    }

    executeAction = (event) => {
        if(event.actionId === 'show-alert') {
            toast(event.options.message, { hideProgressBar: true })
        }

        if(event.actionId === 'run-query') {

            const { queryId, queryName } = event.options;
            this.runQuery(queryId, queryName);
        }
    }

    onComponentClick = (id, component) => {
        console.log(component);
        const onClickEvent = component.definition.events.onClick;
        this.executeAction(onClickEvent);
    }

    onEvent = (eventName, options) => {

        if (eventName === 'onRowClicked') {
            const { component, data } = options;
            const event = component.definition.events[eventName];
            this.setState({
                currentState: {...this.state.currentState, 
                    components: {
                        ...this.state.currentState.components, 
                        [component.name]: {
                            ...this.state.currentState.components[component.name],
                            selectedRow: data
                        }}}
            }, () => {
                if(event.actionId) {
                    this.executeAction(event);
                }
            });
        }

        if(eventName === 'onTableActionButtonClicked') { 
            const { component, data, action } = options;
            const event = action.onClick;

            this.setState({
                currentState: {...this.state.currentState, 
                    components: {
                        ...this.state.currentState.components, 
                        [component.name]: {
                            ...this.state.currentState.components[component.name],
                            selectedRow: data
                        }}}
            }, () => {
                if(event.actionId) {
                    this.executeAction(event);
                }
            });
        }
    }

    onComponentOptionChanged = (component, option_name, value) => {

        const componentName = component.name;
        const components = this.state.currentState.components;
        let componentData = components[componentName];
        componentData = componentData ? componentData : { };
        componentData[option_name] = value;

        this.setState({
            currentState: { ...this.state.currentState, components: {...components, [componentName]: componentData }}
        })
    }

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

    onQueryConfirm = (queryConfirmationData) => {
        this.setState({
            showQueryConfirmation: false
        })
        this.runQuery(queryConfirmationData.queryId, queryConfirmationData.queryName, true);
    }

    onQueryCancel = () => {
        this.setState({
            showQueryConfirmation: false
        })
    }

    render() {
        const { currentSidebarTab, selectedComponent, appDefinition, showQueryConfirmation } = this.state;

        console.log(appDefinition);

        return (
            <div class="viewer wrapper">
                <Confirm 
                    show={showQueryConfirmation} 
                    message={'Do you want to run this query?'}
                    onConfirm={this.onQueryConfirm}
                    onCancel={this.onQueryCancel}
                    queryConfirmationData={this.state.queryConfirmationData}
                />
                <ToastContainer />
                <DndProvider backend={HTML5Backend}>
                    <div className="header">
                        <header class="navbar navbar-expand-md navbar-light d-print-none">
                            <div class="container-xl header-container">
                                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
                                    <span class="navbar-toggler-icon"></span>
                                </button>
                                <h1 class="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                                    <a href=".">
                                    <img src="/public/images/logo.svg" width="110" height="32" alt="StackEgg" class="navbar-brand-image"/>
                                    </a>
                                </h1>
                                <div class="navbar-nav flex-row order-md-last">
                                    
                                </div>
                            </div>
                        </header>
                    </div>
                    <div className="sub-section">
                    
                    <div className="main">
                        <div className="canvas-container align-items-center">
                            {appDefinition.components &&
                                <div className="canvas-area">
                                    <Container 
                                        appDefinition={appDefinition}
                                        appDefinitionChanged={this.appDefinitionChanged}
                                        snapToGrid={true} 
                                        onEvent={this.onEvent}
                                        currentState={this.state.currentState}
                                        onComponentClick={this.onComponentClick}
                                        onComponentOptionChanged={this.onComponentOptionChanged}
                                    />
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

export { Viewer };