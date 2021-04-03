import React from 'react';
import { dataqueryService, authenticationService } from '@/_services';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

class QueryManager extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentUser: authenticationService.currentUserValue,
            appId: props.appId,
            dataSources: props.dataSources,
        };
    }

    componentDidMount() {
        this.state = {
            appId: this.props.appId,
            dataSources: this.props.dataSources,
        };
    }

    changeDataSource = (sourceId) => {
        const source = this.state.dataSources.find(source => source.id === sourceId);
        this.setState({ selectedDataSource: source });
    }

    createDataQuery = () => {
        const  { appId, options, selectedDataSource } = this.state;
        const name = selectedDataSource.name;
        const kind = selectedDataSource.kind;
 
        dataqueryService.create(appId, name, kind, options).then((data) => {
            this.setState( { showModal: false } );
            toast.success('Datasource Added', { hideProgressBar: true, position: "top-center", });
        });
    }

    optionchanged = (option, value) => {
        this.setState( { options: { ...this.state.options, [option]: value } } );
    }

    render() {
        const { dataSources, selectedDataSource } = this.state;

        return (
            <div>

                <ToastContainer/>

                <div className="row header">
                    <div className="col-md-9">
                    </div>
                    <div className="col-md-3">
                        <button className="btn btn-light m-1 float-right">Preview</button>
                        <button onClick={this.createDataQuery} className="btn btn-primary m-1 float-right">Save</button>
                    </div>
                </div>
                
                <div class="row row-deck p-3">

                    <label class="form-label">Datasource</label>

                    {dataSources && 
                        <select class="form-select" onChange={(e) => this.changeDataSource(e.target.value)} >
                            {dataSources.map((source) => (<option value={source.id}>{source.name}</option>))}
                            <option value="none">REST API</option>
                            <option value="none">Run JS code</option>
                        </select>
                    } 

                    {selectedDataSource && 
                        <div>
                            { selectedDataSource.kind === 'postgresql' && 
                                <div class="mb-3 mt-2">
                                    <label class="form-label">SQL Query</label>
                                    <textarea onChange={(e) => this.optionchanged('query', e.target.value)} class="form-control" placeholder="SELECT * FROM"></textarea>
                                </div>
                            }
                        </div>
                    }

                </div>
            </div>
            
        )
    }
}

export { QueryManager };