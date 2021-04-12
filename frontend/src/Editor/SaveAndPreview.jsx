import React from 'react';
import { appService, appVersionService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Skeleton from 'react-loading-skeleton';

class SaveAndPreview extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showModal: false,
            appId: props.appId,
            isLoading: true,
            showVersionForm: false,
        };
    }

    componentDidMount() {

        const appId = this.props.appId;

        this.fetchVersions();

        this.setState({ appId });
    }

    fetchVersions = () => {
        appVersionService.getAll(this.props.appId).then(data => this.setState({ 
            versions: data.versions, 
            isLoading: false,
        }));    
    }

    hideModal = () => {
        this.setState({ 
            showModal: false
        });
    }

    createVersion = () => {
        const newVersionName = this.state.newVersionName;
        const appId = this.props.appId;

        appVersionService.create(appId, newVersionName).then(data => { 
            this.setState({ showVersionForm: false, })
            toast.success('Version Created', { hideProgressBar: true, position: "top-center", });
            this.fetchVersions();
        });    
    }

    saveVersion = (versionId) => {
        appVersionService.save(this.props.appId, versionId, this.props.appDefinition).then(data => { 
            this.setState({ showVersionForm: false, })
            toast.success('Version Saved', { hideProgressBar: true, position: "top-center", });
            this.fetchVersions();
        });    
    }

    deployVersion = (versionId) => {
        appService.saveApp(this.props.appId, undefined ,undefined, versionId).then(data => { 
            toast.success('Version Deployed', { hideProgressBar: true, position: "top-center", });
        });    
    }
   
    render() {
        const { showModal, isLoading, versions , showVersionForm} = this.state;

        return (
            <div>

                {!showModal && <button className="btn btn-primary btn-sm" onClick={() => this.setState({ showModal: true })}>Deploy</button>}

                <Modal
                    show={this.state.showModal}
                    size="lg"
                    backdrop="static"
                    centered={true}
                    keyboard={true}>

                        <Modal.Header>
                            <Modal.Title>
                                Versions and deployments
                            </Modal.Title>
                            <div>
                                {!showVersionForm &&
                                    <button 
                                        className="btn btn-primary mx-2"
                                        onClick={() => this.setState({ showVersionForm: true })}
                                    >
                                        Create New Version
                                    </button>
                                }

                                <Button variant="light" onClick={() => this.hideModal()}>
                                    x
                                </Button>
                            </div>
                            
                        </Modal.Header>

                        <Modal.Body>
                            {showVersionForm &&
                                <div className="row">
                                    <div className="col">
                                        <input 
                                            type="text"
                                            className="form-control"
                                            placeholder="version name"
                                            onChange={(e) => this.setState({ newVersionName: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-auto">
                                        <Button variant="primary" onClick={() => this.createVersion()}>
                                            create
                                        </Button>
                                    </div>
                                </div>
                            }

                            {isLoading ? 
                                <div style={{width: '100%'}} className="p-5">
                                    <Skeleton count={5}/> 
                                </div>
                            :
                            <div class="table-responsive">
                                <table
                                    class="table table-vcenter"
                                >
                                    <tbody>
                                        {versions.map((version) => 
                                            <tr>
                                                <td>{version.name}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm"
                                                        onClick={() => this.saveVersion(version.id)}
                                                    >
                                                        save
                                                    </button>
                                                    <button 
                                                        className="btn btn-primary btn-sm mx-2"
                                                        onClick={() => this.deployVersion(version.id)}
                                                    >
                                                        deploy
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                        
                                    </tbody>
                                </table>
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

export { SaveAndPreview };
