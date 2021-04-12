import React from 'react';
import { appVersionService } from '@/_services';
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
            addingUser: false
        };
    }

    componentDidMount() {

        const appId = this.props.appId;

        appVersionService.getAll(appId).then(data => this.setState({ 
            users: data.users, 
            isLoading: false,
        }));    

        this.setState({ appId });
    }

    hideModal = () => {
        this.setState({ 
            showModal: false
        });
    }
   
    render() {
        const { showModal, isLoading, users } = this.state;

        return (
            <div>

                {!showModal && <button className="btn btn-sm" onClick={() => this.setState({ showModal: true })}>Save & preview </button>}

                <Modal
                    show={this.state.showModal}
                    size="lg"
                    backdrop="static"
                    centered={true}
                    keyboard={true}>

                        <Modal.Header>
                            <Modal.Title>
                                Save and Preview
                            </Modal.Title>
                            <div>
                                <button className="btn btn-primary mx-2">Create New Version</button>

                                <Button variant="light" onClick={() => this.hideModal()}>
                                    x
                                </Button>
                            </div>
                            
                        </Modal.Header>

                        <Modal.Body>
                            {isLoading ? 
                                <div style={{width: '100%'}} className="p-5">
                                    <Skeleton count={5}/> 
                                </div>
                            :
                                <div>
                                    
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
