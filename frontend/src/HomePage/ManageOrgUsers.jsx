import React from 'react';
import { organizationService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Skeleton from 'react-loading-skeleton';

class ManageOrgUsers extends React.Component {
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

        organizationService.getUsers(appId).then(data => this.setState({ 
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

                {!showModal && <button className="btn btn-sm" onClick={() => this.setState({ showModal: true })}> Manage Users</button>}

                <Modal
                    show={this.state.showModal}
                    size="lg"
                    backdrop="static"
                    centered={true}
                    keyboard={true}>

                        <Modal.Header>
                            <Modal.Title>
                                Users and permissions
                            </Modal.Title>
                            <div>
                                <button className="btn btn-primary mx-2">Add User</button>

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
                                <div class="table-responsive">
                                    <table
                                            class="table table-vcenter">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th class="w-1"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => 
                                                <tr>
                                                    <td >{user.name}</td>
                                                    <td class="text-muted" >
                                                        <a href="#" class="text-reset">{user.email}</a>
                                                    </td>
                                                    <td class="text-muted" >
                                                        {user.role}
                                                    </td>
                                                    <td>
                                                        <a href="#">Remove</a>
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

export { ManageOrgUsers };
