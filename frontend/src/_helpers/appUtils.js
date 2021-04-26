import moment from 'moment';
import { toast } from 'react-toastify';
import { resolve_references } from '@/_helpers/utils';
import { dataqueryService } from '@/_services';


export function onComponentOptionChanged (_ref, component, option_name, value) {

    const componentName = component.name;
    const components = _ref.state.currentState.components;
    let componentData = components[componentName];
    componentData = componentData ? componentData : { };
    componentData[option_name] = value;

    _ref.setState({
        currentState: { ..._ref.state.currentState, components: {...components, [componentName]: componentData }}
    })
}

export function fetchOAuthToken(authUrl, dataSourceId) {
    localStorage.setItem('sourceWaitingForOAuth', dataSourceId);
    window.open(authUrl);
}

export function runTransformation(_ref, rawData, transformation) {
    const data = rawData;
    const evalFunction = Function(['data', 'moment', 'currentState'], transformation);
    let result = [];

    try { 
        result = evalFunction(data, moment, _ref.state.currentState);
    } catch(err) {
        toast.error(err.message, { hideProgressBar: true });
    }

    return result;
}

export function onComponentClick(_ref, id, component) {
    const onClickEvent = component.definition.events.onClick;
    executeAction(_ref, onClickEvent);
}

export function onQueryConfirm(_ref, queryConfirmationData) {
    _ref.setState({
        showQueryConfirmation: false
    })
    runQuery(_ref, queryConfirmationData.queryId, queryConfirmationData.queryName, true);
}

export function onQueryCancel(_ref) {
    _ref.setState({
        showQueryConfirmation: false
    })
}

function executeAction(_ref, event){
    if(event) {
        if(event.actionId === 'show-alert') {
            toast(event.options.message, { hideProgressBar: true })
        }

        if(event.actionId === 'open-webpage') {
            const url = resolve_references(event.options.url, _ref.state.currentState);
            window.open(url, '_blank');
        }

        if(event.actionId === 'run-query') {
            const { queryId, queryName } = event.options;
            return runQuery(_ref, queryId, queryName);
        }
    }
}

export function onEvent(_ref, eventName, options) {

    let _self = _ref;

    if (eventName === 'onRowClicked') {
        const { component, data } = options;
        const event = component.definition.events[eventName];
        _self.setState({
            currentState: {..._self.state.currentState, 
                components: {
                    ..._self.state.currentState.components, 
                    [component.name]: {
                        ..._self.state.currentState.components[component.name],
                        selectedRow: data
                    }}}
        }, () => {
            if(event.actionId) {
                executeAction(_self, event);
            }
        });
    }

    if(eventName === 'onTableActionButtonClicked') { 
        const { component, data, action } = options;
        const event = action.onClick;

        _self.setState({
            currentState: {..._self.state.currentState, 
                components: {
                    ..._self.state.currentState.components, 
                    [component.name]: {
                        ..._self.state.currentState.components[component.name],
                        selectedRow: data
                    }}}
        }, () => {
            if(event.actionId) {
                executeAction(_self, event);
            }
        });
    }

    if(eventName === 'onCheck' || eventName === 'onUnCheck') { 
        const { component, data, action } = options;
        const event = (eventName === 'onCheck') ? component.definition.events.onCheck : component.definition.events.onUnCheck;

        if(event.actionId) {
            executeAction(_self, event);
        }
    }

    if (eventName === 'onBulkUpdate') {
        return new Promise(function(resolve, reject) {
            onComponentOptionChanged(_self, options.component, 'isSavingChanges', true);
            executeAction(_self, { actionId: 'run-query', ...options.component.definition.events.onBulkUpdate }).then(() => {
                onComponentOptionChanged(_self, options.component, 'isSavingChanges', false);
                resolve();
            });
        });
    }
}

export function runQuery(_ref, queryId, queryName, confirmed = undefined ) {
    const dataQuery = JSON.parse(JSON.stringify(_ref.state.app.data_queries.find(query => query.id === queryId)));

    const options = resolve_references(dataQuery.options, _ref.state.currentState);

    if(options.requestConfirmation) {
        if(confirmed === undefined) {
            _ref.setState({ 
                showQueryConfirmation: true,
                queryConfirmationData : {
                    queryId, queryName
                }
            });
            return;
        }
    }

    const newState = {
        ..._ref.state.currentState, 
        queries: {
            ..._ref.state.currentState.queries, 
            [queryName]: {
                ..._ref.state.currentState.queries[queryName],
                isLoading: _ref
            }
        }
    }

    let _self = _ref;

    return new Promise(function(resolve, reject) {
        _self.setState({currentState: newState}, () => {
            dataqueryService.run(queryId, options).then(data => 
                {

                    resolve();

                    if(data.error) {
                        if(data.error.code === "oauth2_needs_auth") {
                            const url = data.error.data.auth_url; // Backend generates and return sthe auth url
                            fetchOAuthToken(url, dataQuery.data_source_id);
                            return;
                        }
                    }

                    if(data.status === 'failed') {
                        toast.error(data.error.message, { hideProgressBar: true, autoClose: 3000 })
                    }

                    let rawData = data.data;
                    let finalData = data.data;

                    if(options.enableTransformation) {
                        finalData = runTransformation(_self, rawData, options.transformation);
                    }
    
                    if(options.showSuccessNotification) {
                        const notificationDuration = options.notificationDuration || 5;
                        toast.success(options.successMessage, { hideProgressBar: true, autoClose: notificationDuration * 1000 })
                    }
    
                    _self.setState({
                        currentState: {
                            ..._self.state.currentState, 
                            queries: {
                                ..._self.state.currentState.queries, 
                                [queryName]: {
                                    ..._self.state.currentState.queries[queryName],
                                    data: finalData,
                                    rawData,
                                    isLoading: false
                                }
                            }
                        }
                    })
                }
            );
        });
    });
}
