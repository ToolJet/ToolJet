import React from 'react';
import { dataqueryService, authenticationService } from '@/_services';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Restapi } from './Restapi';
import { Mysql } from './Mysql';
import { Postgresql } from './Postgresql';
import { Stripe } from './Stripe';
import { Firestore } from './Firestore';
import { Redis } from './Redis';
import SelectSearch, { fuzzySearch } from 'react-select-search';

const allSources = {
    Restapi,
    Mysql,
    Postgresql,
    Stripe,
    Firestore,
    Redis
}

const staticDataSources = [
    { kind: 'js-code', id: 'js-code', name: 'Custom JS Code' },
    { kind: 'restapi', id: 'restapi', name: 'REST API' },
]

const defaultOptions = {
    'postgresql': {

    },
    'redis': {
        query: 'PING'
    },
    'mysql': {

    },
    'firestore': {
        path: '',

    },
    'restapi': {
        method: 'GET',
        url: null,
        url_params: [ ['', ''] ],
        headers: [ ['', ''] ],
        body: [ ['', ''] ],
    },
    'stripe': {
    }
}

class QueryManager extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
           
        };
    }

    setStateFromProps = (props) => {
        const selectedQuery = props.selectedQuery;

        this.setState({
            appId: props.appId,
            dataSources: props.dataSources,
            dataQueries: props.dataQueries,
            mode: props.mode,
            currentTab: 1,
        });

        if(this.props.mode === 'edit') {
            const source = props.dataSources.find(source => source.id === selectedQuery.data_source_id) 

            this.setState({
                options: selectedQuery.options,
                selectedDataSource: source,
                selectedQuery
            })
        } else { 
            this.setState({
                options: {},
            })
        }
    }

    componentWillReceiveProps(nextProps) {
        this.setStateFromProps(nextProps);
    }

    componentDidMount() {
        this.setStateFromProps(this.props);
    }

    changeDataSource = (sourceId) => {
        const source = [...this.state.dataSources, ...staticDataSources].find(source => source.id === sourceId);
        this.setState({ selectedDataSource: source, options: defaultOptions[source.kind] });
    }

    switchCurrentTab = (tab) => {
        this.setState({
            currentTab: tab
        });
    }

    computeQueryName = (kind) => {
        const { dataQueries } = this.state;
        const currentQueriesForKind = dataQueries.filter(query => query.kind === kind);
        let found = false;
        let name = '';
        let currentNumber = currentQueriesForKind.length + 1;

        while(!found) { 
            name = `${kind}${currentNumber}`;
            if(dataQueries.find(query => query.name === name) === undefined) {
                found = true;
            }
            currentNumber = currentNumber + 1
        }

        return name;
    }

    createOrUpdateDataQuery = () => {
        const  { appId, options, selectedDataSource, mode } = this.state;
        const name = this.computeQueryName(selectedDataSource.kind);
        const kind = selectedDataSource.kind;
        const dataSourceId = selectedDataSource.id;

        if ( mode === 'edit') {
            this.setState({ isUpdating: true });
            dataqueryService.update(this.state.selectedQuery.id, options).then((data) => {
                toast.success('Datasource Updated', { hideProgressBar: true, position: "top-center", });
                this.setState({ isUpdating: false });
                this.props.dataQueriesChanged();
            });
        } else { 
            this.setState({ isCreating: true });
            dataqueryService.create(appId, name, kind, options, dataSourceId).then((data) => {
                toast.success('Datasource Added', { hideProgressBar: true, position: "top-center", });
                this.setState({ isCreating: false });
                this.props.dataQueriesChanged();
            });
        }
    }

    optionchanged = (option, value) => {
        this.setState( { options: { ...this.state.options, [option]: value } } );
    }

    optionsChanged = (newOptions) => {
        this.setState({ options: newOptions });
    }

    toggleOption = (option) => {
        const currentValue = this.state.options[option] ? this.state.options[option] : false;
        this.optionchanged(option, !currentValue);
    }

    renderDataSourceOption = (props, option, snapshot, className) => {
        return (
            <button {...props} className={className} type="button">
                <div className="row">
                    <div className="col-md-9">
                        <span className="text-muted mx-2">{option.name}</span>
                    </div>
                </div>
            </button>
        );
    }

    render() {
        const { dataSources, selectedDataSource, mode, currentTab, isUpdating, isCreating } = this.state;

        let ElementToRender = '';

        if(selectedDataSource) {
            const sourcecomponentName = selectedDataSource.kind.charAt(0).toUpperCase() + selectedDataSource.kind.slice(1);
            ElementToRender = allSources[sourcecomponentName];
        }

        let buttonText = mode === 'edit' ? 'Save' : 'Create';
        const buttonDisabled = isUpdating || isCreating;

        if(isUpdating) { buttonText = 'Saving...'}
        if(isCreating) { buttonText = 'Creating...'}

        return (
            <div className="query-manager" key={this.props.selectedQuery.id}>

                <div className="row header">
                    <div className="col">
                        <div className="nav-header">
                            <ul className="nav nav-tabs" data-bs-toggle="tabs">
                                <li className="nav-item">
                                    <a 
                                        onClick={() => this.switchCurrentTab(1)} 
                                        className={currentTab === 1 ? 'nav-link active' : 'nav-link'} 
                                    >
                                        &nbsp; General
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a 
                                        onClick={() => this.switchCurrentTab(2)} 
                                        className={currentTab === 2 ? 'nav-link active' : 'nav-link'}  
                                    >
                                        &nbsp; Advanced
                                    </a>
                                </li>
                                
                            </ul>
                        </div>
                    </div>
                    <div className="col-auto">
                        <button className="btn btn-light" onClick={this.props.toggleQueryPaneHeight}>
                            <img src="https://www.svgrepo.com/show/129993/expand.svg" width="12" height="12"/>
                        </button>
                        <button onClick={this.createOrUpdateDataQuery} disabled={buttonDisabled} className="btn btn-primary m-1 float-right">
                            { buttonText }
                        </button>
                    </div>
                </div>
                
                {currentTab === 1 && 
                    <div className="row row-deck p-3">
                        {(dataSources && mode ==='create') && 
                            <div className="datasource-picker mb-2">
                                <label className="form-label col-md-2">Datasource</label>
                                <SelectSearch 
                                    options={[
                                        ...dataSources.map(source => { return  { name: source.name, value: source.id } }),
                                        ...staticDataSources.map(source => { return  {name: source.name, value: source.id} }),
                                    ]}
                                    value={selectedDataSource ? selectedDataSource.id : ''} 
                                    search={true}
                                    onChange={(value) => this.changeDataSource(value) }
                                    filterOptions={fuzzySearch}
                                    renderOption={this.renderDataSourceOption}
                                    placeholder="Select a data source" 
                                />
                            </div>
                        }   

                        {selectedDataSource && 
                            <div>
                            
                                    <ElementToRender
                                        options={this.state.options}
                                        optionsChanged={this.optionsChanged}
                                    />
                                
                            </div>
                        }

                    </div>
                }

                {currentTab === 2 && 
                    <div className="advanced-options-container p-2 m-2">
                        <label className="form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                onClick={() => this.toggleOption('runOnPageLoad')}
                                checked={this.state.options.runOnPageLoad} 
                            />
                            <span className="form-check-label">Run this query on page load?</span>
                        </label>
                        <label className="form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                onClick={() => this.toggleOption('requestConfirmation')}
                                checked={this.state.options.requestConfirmation} 
                            />
                            <span className="form-check-label">Request confirmation before running query?</span>
                        </label>

                        <hr/>

                        <label className="form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                onClick={() => this.toggleOption('showSuccessNotification')}
                                checked={this.state.options.showSuccessNotification} 
                            />
                            <span className="form-check-label">Show notification on success?</span>

                        </label>

                        <div class="row mt-3">
                            <div class="col-auto">
                                <label class="form-label p-2">Success Message</label>
                            </div>
                            <div class="col">
                                <input 
                                    type="text" 
                                    disabled={!this.state.options.showSuccessNotification}
                                    value={this.state.options.successMessage}
                                    onChange={(e) => this.optionchanged('successMessage', e.target.value)}
                                    placeholder="Query ran successfully"
                                    class="form-control" 
                                    value={this.state.options.successMessage} 
                                />
                            </div>
                        </div>

                        <hr/>

                        <div class="row mt-3">
                            <div class="col-auto">
                                <label class="form-label p-2">Notification duration (s)</label>
                            </div>
                            <div class="col">
                                <input 
                                    type="number" 
                                    disabled={!this.state.options.showSuccessNotification}
                                    value={this.state.options.notificationDuration}
                                    onChange={(e) => this.optionchanged('notificationDuration', e.target.value)}
                                    placeholder={5}
                                    class="form-control" 
                                    value={this.state.options.notificationDuration} 
                                />
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }
}

export { QueryManager };
