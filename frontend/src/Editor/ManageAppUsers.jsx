import React from 'react';
import { appService, organizationService } from '@/_services';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import 'react-toastify/dist/ReactToastify.css';
import Skeleton from 'react-loading-skeleton';
import SelectSearch, { fuzzySearch } from 'react-select-search';

class ManageAppUsers extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
      app: props.app,
      isLoading: true,
      addingUser: false,
      organizationUsers: [],
      newUser: {}
    };
  }

  componentDidMount() {
    const appId = this.props.app.id;

    this.fetchAppUsers();

    organizationService.getUsers(null).then((data) => this.setState({
      organizationUsers: data.users
    }));

    this.setState({ appId });
  }

  fetchAppUsers = () => {
    appService.getAppUsers(this.props.app.id).then((data) => this.setState({
      users: data.users,
      isLoading: false
    }));
  };

  hideModal = () => {
    this.setState({
      showModal: false
    });
  };

  addUser = () => {
    this.setState({
      addingUser: true
    });

    const { organizationUserId, role } = this.state.newUser;

    appService
      .createAppUser(this.state.app.id, organizationUserId, role)
      .then(() => {
        this.setState({ addingUser: false, newUser: {} });
        toast.success('Added user successfully', { hideProgressBar: true, position: 'top-center' });
        this.fetchAppUsers();
      })
      .catch(( { error }) => {
        this.setState({ addingUser: false });
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
      });
  };

  toggleAppVisibility = () => {
    const newState =  !this.state.app.is_public;
    this.setState({
        ischangingVisibility: true
    });

    appService.setVisibility(this.state.app.id, newState).then(data =>  { 
      this.setState({ 
        ischangingVisibility: false,
        app: {
          ...this.state.app,
          is_public: newState
        }
      });

      if(newState) {
        toast.success('Application is now public.', {
          hideProgressBar: true,
          position: 'top-center'
        });
      } else {
        toast.success('Application visibility set to private', {
          hideProgressBar: true,
          position: 'top-center'
        });
      }
      
    });
  }

  render() {
    const {
      addingUser, isLoading, users, organizationUsers, newUser
    } = this.state;
    const shareableLink = `${window.location.origin}/applications/${this.state.app.id}`;

    return (
      <div>
        <button className="btn btn-sm" onClick={() => this.setState({ showModal: true })}>
          {' '}
          Share
        </button>

        <Modal show={this.state.showModal} size="lg" backdrop="static" centered={true} keyboard={true} onEscapeKeyDown={this.hideModal}>
          <Modal.Header>
            <Modal.Title>Users and permissions</Modal.Title>
            <div>
              <Button variant="light" size="sm" onClick={() => this.hideModal()}>
                x
              </Button>
            </div>
          </Modal.Header>

          <Modal.Body>
            {isLoading ? (
              <div style={{ width: '100%' }} className="p-5">
                <Skeleton count={5} />
              </div>
            ) : (
              <div>
                <div className="make-public mb-3">
                  <label className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      onClick={() => this.toggleAppVisibility()}
                      checked={this.state.app.is_public}
                      disabled={this.state.ischangingVisibility}
                    />
                    <span className="form-check-label">Make application public ?</span>
                  </label>
                </div>
                <div className="shareable-link mb-3">
                  <label className="form-label">
                    <small>Get shareable link for this application</small>
                  </label>
                  <div className="input-group">
                    <input type="text" className="form-control form-control-sm" value={shareableLink} />
                    <span className="input-group-text">
                      <CopyToClipboard
                        text={shareableLink}
                        onCopy={() => toast.success('Link copied to clipboard', {
                          hideProgressBar: true,
                          position: 'bottom-center'
                        })
                        }
                      >
                        <button className="btn btn-light btn-sm">Copy</button>
                      </CopyToClipboard>
                    </span>
                  </div>
                </div>
                <hr />
                <div className="add-user mb-3">
                  <div className="row">
                    <div className="col">
                      <SelectSearch
                        options={organizationUsers.map((user) => {
                          return {
                            name: `${user.name} ( ${user.email} )`,
                            value: user.id
                          };
                        })}
                        value={newUser.organizationUserId}
                        search={true}
                        onChange={(value) => {
                          this.setState({ newUser: { ...newUser, organizationUserId: value } });
                        }}
                        filterOptions={fuzzySearch}
                        placeholder="Select organization user"
                      />
                    </div>
                    <div style={{ width: '160px' }}>
                      <SelectSearch
                        options={[
                          { name: 'Admin', value: 'admin' },
                          { name: 'Developer', value: 'developer' },
                          { name: 'Viewer', value: 'role' }
                        ]}
                        value={newUser.role}
                        search={false}
                        onChange={(value) => {
                          this.setState({ newUser: { ...newUser, role: value } });
                        }}
                        filterOptions={fuzzySearch}
                        placeholder="Select role"
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        className={`btn btn-primary + ${addingUser ? ' btn-loading' : ''}`}
                        onClick={this.addUser}
                        disabled={addingUser}
                      >
                        Add User
                      </button>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-vcenter">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th className="w-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.email}>
                          <td>{user.name}</td>
                          <td className="text-muted">
                            <span lass="text-reset">{user.email}</span>
                          </td>
                          <td className="text-muted">{user.role}</td>
                          <td>
                            <a>Remove</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <a href="/users" target="_blank">
              Manage Organization Users
            </a>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export { ManageAppUsers };
