import React from 'react';
import { datasourceService, authenticationService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import { dataBaseSources, apiSources, DataSourceTypes } from './DataSourceTypes';
import { Elasticsearch } from './Elasticsearch';
import { Redis } from './Redis';
import { Postgresql } from './Postgresql';
import { Mysql } from './Mysql';
import { Stripe } from './Stripe';
import { Firestore } from './Firestore';
import { RestApi } from './RestApi';
import { Googlesheets } from './Googlesheets';
import { defaultOptions } from './DefaultOptions';
import { TestConnection } from './TestConnection';

class DataSourceManager extends React.Component {
    constructor(props) {
        super(props);

        let selectedDataSource = null;
        let options = {};
        let dataSourceMeta = {};

        if(props.selectedDataSource) {
            selectedDataSource = props.selectedDataSource;
            options = selectedDataSource.options
            dataSourceMeta = DataSourceTypes.find(source => source.kind === selectedDataSource.kind);
        }

        this.state = {
            currentUser: authenticationService.currentUserValue,
            showModal: true,
            appId: props.appId,
            selectedDataSource,
            options,
            dataSourceMeta,
            isSaving: false
        };
    }

    componentDidMount() {
        this.setState({
            appId: this.props.appId,
        })
    }

    selectDataSource = (source) => { 
        this.setState({ 
            dataSourceMeta: source,
            selectedDataSource: source,
            options: defaultOptions[source.kind],
            name: source.kind
        });
    }

    onNameChanged = (newName) => {
        this.setState({
            selectedDataSource: {
                ...this.state.selectedDataSource,
                name: newName
            }
        })
    }

    setStateAsync = (state) => {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    optionchanged = (option, value) => {
        return this.setStateAsync( { 
            options: { 
                ...this.state.options, 
                [option]: { value }
            }
        });
    }

    hideModal = () => {
        this.props.hideModal()
    }

    createDataSource = () => {
        let _self = this;

        const  { appId, options, selectedDataSource } = this.state;
        const name = selectedDataSource.name;
        const kind = selectedDataSource.kind;

        const parsedOptions = Object.keys(options).map((key) => { 
            const keyMeta = selectedDataSource.options[key];
            return {
                key: key,
                value: options[key].value,
                encrypted: keyMeta ? keyMeta.encrypted : false
            }
        });

        if(selectedDataSource.id) {
            this.setState({ isSaving: true });
            datasourceService.save(selectedDataSource.id, appId, name, parsedOptions).then((data) => {
                this.setState({ isSaving: false});
                this.hideModal();
                toast.success('Datasource Saved', { hideProgressBar: true, position: "top-center", });
                this.props.dataSourcesChanged();
            });
        } else { 
            this.setState({ isSaving: true});
            datasourceService.create(appId, name, kind, parsedOptions).then((data) => {
                this.setState({ isSaving: false});
                this.hideModal();
                toast.success('Datasource Added', { hideProgressBar: true, position: "top-center", });
                this.props.dataSourcesChanged();
            });
        }
    }
    
    render() {
        const { dataSourceMeta, selectedDataSource, options, isSaving } = this.state;

        return (
            <div>

                <Modal
                    show={this.props.showDataSourceManagerModal}
                    size="lg"
                    className="mt-5"
                    // onHide={handleClose}
                    backdrop="static"
                    keyboard={false}>

                        <Modal.Header>
                            <Modal.Title>
                             {selectedDataSource &&
                             <div className="row">
                                <img src={dataSourceMeta.icon} style={{objectFit: 'contain'}}height="25" width="25" className="mt-2 col-md-2"></img>
                                <input 
                                    type="text" 
                                    onChange={(e) => this.onNameChanged(e.target.value)}
                                    class="form-control-plaintext form-control-plaintext-sm col mx-2" 
                                    value={selectedDataSource.name}
                                    autoFocus
                                />
                             </div>
                               
                             }
                            </Modal.Title>
                            <Button variant="light" onClick={() => this.hideModal()}>
                                x
                            </Button>
                        </Modal.Header>

                        <Modal.Body>

                        {!selectedDataSource &&
                            <div>
                                <div class="row row-deck">
                                    <h4 className="text-muted mb-2">DATABASES</h4>
                                    {dataBaseSources.map((dataSource) => (<div class="col-md-3" key={dataSource.name}>
                                        <div class="card mb-3" role="button" onClick={() => this.selectDataSource(dataSource)}>
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
                                <div class="row row-deck mt-5">
                                    <h4 className="text-muted mb-2">APIS</h4>
                                    {apiSources.map((dataSource) => (<div class="col-md-3" key={dataSource.name}>
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
                            </div>
                        }

                        {selectedDataSource &&
                            <div>
                                {selectedDataSource.kind === 'elasticsearch' && 
                                    <Elasticsearch
                                        optionchanged={this.optionchanged}
                                        createDataSource={this.createDataSource}
                                        options={options}
                                        isSaving={isSaving}
                                        hideModal={this.hideModal}
                                    />
                                }
                                {selectedDataSource.kind === 'redis' && 
                                    <Redis
                                        optionchanged={this.optionchanged}
                                        createDataSource={this.createDataSource}
                                        options={options}
                                        isSaving={isSaving}
                                        hideModal={this.hideModal}
                                    />
                                }
                                {selectedDataSource.kind === 'postgresql' && 
                                    <Postgresql
                                        optionchanged={this.optionchanged}
                                        createDataSource={this.createDataSource}
                                        testDataSource={this.testDataSource}
                                        testingConnection={this.state.testingConnection}
                                        options={options}
                                        isSaving={isSaving}
                                        hideModal={this.hideModal}
                                    />
                                }

                                {selectedDataSource.kind === 'mysql' && 
                                    <Mysql
                                        optionchanged={this.optionchanged}
                                        createDataSource={this.createDataSource}
                                        options={options}
                                        isSaving={isSaving}
                                        hideModal={this.hideModal}
                                    />
                                }

                                {selectedDataSource.kind === 'stripe' && 
                                    <Stripe
                                        optionchanged={this.optionchanged}
                                        createDataSource={this.createDataSource}
                                        options={options}
                                        isSaving={isSaving}
                                        hideModal={this.hideModal}
                                    />
                                }

                                {selectedDataSource.kind === 'firestore' && 
                                    <Firestore
                                        optionchanged={this.optionchanged}
                                        createDataSource={this.createDataSource}
                                        options={options}
                                        isSaving={isSaving}
                                        hideModal={this.hideModal}
                                    />
                                }

                                {selectedDataSource.kind === 'restapi' && 
                                    <RestApi
                                        optionchanged={this.optionchanged}
                                        createDataSource={this.createDataSource}
                                        options={options}
                                        isSaving={isSaving}
                                        hideModal={this.hideModal}
                                    />
                                }

                                {selectedDataSource.kind === 'googlesheets' && 
                                    <Googlesheets
                                        optionchanged={this.optionchanged}
                                        createDataSource={this.createDataSource}
                                        options={options}
                                        isSaving={isSaving}
                                        hideModal={this.hideModal}
                                    />
                                }
                                
                            </div>
                        }

                        </Modal.Body>

                        {selectedDataSource &&
                            <Modal.Footer>
                                <div className="col">
                                    <small>
                                        <a href={`https://docs.tooljet.io/data-sources/${selectedDataSource.kind}`}>Read documentation</a>
                                    </small>
                                </div>
                                <div className="col-auto">
                                    <TestConnection
                                        kind={selectedDataSource.kind}
                                        options={options}
                                    />
                                </div>
                                <div className="col-auto">
                                    <Button className="m-2" disabled={isSaving} variant="primary" onClick={this.createDataSource}>
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                            </Modal.Footer>
                        }
                </Modal>
            </div>
            
        )
    }
}

export { DataSourceManager };
