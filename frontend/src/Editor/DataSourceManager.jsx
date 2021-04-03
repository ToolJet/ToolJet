import React from 'react';
import { appService, authenticationService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const SOURCES = [
    {
        name: 'PostgreSQL',
        kind: 'postgresql',
        icon: 'https://www.svgrepo.com/show/303301/postgresql-logo.svg'
    },
    {
        name: 'ElasticSearch',
        kind: 'elasticsearch',
        icon: 'https://www.svgrepo.com/show/305988/elasticsearch.svg'
    }
]

class DataSourceManager extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentUser: authenticationService.currentUserValue,
            showModal: false,
            options: { 
                host: '',
                port: '5432',
                database: 'production',
                username: 'root',
                password: 'root'
            }
        };
    }

    componentDidMount() {}

    selectDataSource = (source) => { 
        this.setState({ selectedDataSource: source });
    }

    optionchanged = (option, value) => {
        this.setState( { options: { ...this.state.options, [option]: value } } );
    }

    saveDataSource = () => {

    }
   
    render() {
        const { showModal, selectedDataSource, options } = this.state;

        return (
            <div>
                
                {!showModal && <button className="btn btn-light" onClick={() => this.setState({ showModal: true })}>+</button>}

                <Modal
                    show={this.state.showModal}
                    size="xl"
                    className="mt-5"
                    // onHide={handleClose}
                    backdrop="static"
                    keyboard={false}>

                        <Modal.Header>
                            <Modal.Title>Add new datasource</Modal.Title>
                            <Button variant="light" onClick={() => this.setState({ showModal: false })}>
                                Close
                            </Button>
                        </Modal.Header>

                        <Modal.Body>

                        {!selectedDataSource &&
                            <div class="row row-deck">

                                {SOURCES.map((dataSource) => (<div class="col-md-2">
                                    <div class="card" role="button" onClick={() => this.selectDataSource(dataSource)}>
                                            <div class="card-body">
                                                <center>
                                                    <img src={dataSource.icon} width="50" height="50" alt=""/>
                                                    <br></br>
                                                    <br></br>
                                                    {dataSource.name}
                                                </center>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            
                            </div>
                        }

                        {selectedDataSource &&
                            <div>
                                {selectedDataSource.kind === 'postgresql' && 
                                    <div>
                                        <div className="row">
                                            <div className="col-md-9">
                                                <label class="form-label">Host Address</label>
                                                <input type="text" class="form-control" onChange={(e) => this.optionchanged('host', e.target.value)} value={options.host} />
                                            </div>
                                            <div className="col-md-3">
                                                <label class="form-label">Port</label>
                                                <input type="text" class="form-control" onChange={(e) => this.optionchanged('port', e.target.value)}  value={options.port} />
                                            </div>
                                        </div>
                                        <div className="row mt-3">
                                            <div className="col-md-4">
                                                <label class="form-label">Database Name</label>
                                                <input type="text" class="form-control" onChange={(e) => this.optionchanged('database', e.target.value)}  value={options.database} />
                                            </div>
                                            <div className="col-md-4">
                                                <label class="form-label">Username</label>
                                                <input type="text" class="form-control" onChange={(e) => this.optionchanged('username', e.target.value)}  value={options.username} />
                                            </div>
                                            <div className="col-md-4">
                                                <label class="form-label">Password</label>
                                                <input type="text" class="form-control" onChange={(e) => this.optionchanged('password', e.target.value)}  value={options.password} />
                                            </div>
                                        </div>
                                        <div className="row mt-3">
                                            <div className="col-md-9">

                                            </div>
                                            <div className="col-md-3">
                                                <Button className="m-2" variant="light" onClick={() => this.setState({ showModal: false })}>
                                                    Cancel
                                                </Button>
                                                <Button className="m-2" variant="success" onClick={() => this.setState({ showModal: false })}>
                                                    Test
                                                </Button>
                                                <Button className="m-2" variant="primary" onClick={this.saveDataSource}>
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                }
                            </div>
                        }

                        </Modal.Body>

                        <Modal.Footer>
                        
                        </Modal.Footer>
                </Modal>
            </div>
            
        )
    }
}

export { DataSourceManager };