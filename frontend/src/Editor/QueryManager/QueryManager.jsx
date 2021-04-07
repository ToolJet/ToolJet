import React from 'react';
import { dataqueryService, authenticationService } from '@/_services';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Restapi } from './Restapi';
import { Mysql } from './Mysql';
import { Postgresql } from './Postgresql';

const allSources = {
    Restapi,
    Mysql,
    Postgresql
}

const staticDataSources = [
    { kind: 'js-code', id: 'js-code', name: 'Custom JS Code' },
    { kind: 'restapi', id: 'restapi', name: 'REST API' },
]

const defaultOptions = { 
    'postgresql': {

    },
    'restapi': {
        method: 'GET',
        url: null,
        url_params: [ ['', ''] ],
        headers: [ ['', ''] ],
        body: [ ['', ''] ],
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
            mode: props.mode
        });


        if(this.props.mode === 'edit') {
            const source = this.props.dataSources.find(source => source.id === selectedQuery.data_source_id) 

            this.setState({
                options: selectedQuery.options,
                selectedDataSource: source
            })
        } else { 
            this.setState({
                options: {},
                selectedDataSource: props.dataSources[0]
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

    computeQueryName = (kind) => {
        const { dataQueries } = this.state;
        const currentQueriesForKind = dataQueries.filter(query => query.kind === kind);
        let found = false;
        let name = '';
        let currentNumber = currentQueriesForKind.length;

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
            dataqueryService.update(this.state.selectedQuery.id, options).then((data) => {
                toast.success('Datasource Updated', { hideProgressBar: true, position: "top-center", });
                this.props.dataQueriesChanged();
            });
        } else { 
            dataqueryService.create(appId, name, kind, options, dataSourceId).then((data) => {
                toast.success('Datasource Added', { hideProgressBar: true, position: "top-center", });
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

    render() {
        const { dataSources, selectedDataSource, mode } = this.state;

        let ElementToRender = '';

        if(selectedDataSource) {
            const sourcecomponentName = selectedDataSource.kind.charAt(0).toUpperCase() + selectedDataSource.kind.slice(1);
            ElementToRender = allSources[sourcecomponentName];
        }

        return (
            <div>

                <ToastContainer/>

                <div className="row header">
                    <div className="col-md-9">
                    </div>
                    <div className="col-md-3">
                        <button className="btn btn-light m-1 float-right">Preview</button>
                        <button onClick={this.createOrUpdateDataQuery} className="btn btn-primary m-1 float-right">
                            { mode === 'edit' ? 'Save' : 'Create' }
                        </button>
                    </div>
                </div>
                
                <div class="row row-deck p-3">
                    {(dataSources && mode ==='create') && 
                        <div>
                            <label class="form-label col-md-2 p-2">Datasource</label>
                            <select 
                                class="form-select form-sm mb-2" 
                                value={selectedDataSource ? selectedDataSource.id : ''}
                                style={{width: '300px'}} 
                                onChange={(e) => this.changeDataSource(e.target.value)} 
                            >
                                {dataSources.map((source) => (<option value={source.id}>{source.name}</option>))}
                                {staticDataSources.map((source) => (<option value={source.id}>{source.name}</option>))}
                            </select>
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
            </div>
            
        )
    }
}

export { QueryManager };
