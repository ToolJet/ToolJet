import React from 'react';
import { authenticationService, organizationService, organizationUserService } from '@/_services';
import 'react-toastify/dist/ReactToastify.css';
import { Header } from '@/_components';
import { toast } from 'react-toastify';
import { history } from '@/_helpers';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactTooltip from 'react-tooltip';

class ManageOrgUsers extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isLoading: true,
      showNewUserForm: false,
      creatingUser: false,
      newUser: {},
      archivingUser: null,
      fields: {},
      errors: {},
    };
  }

  validateEmail(email) {
    console.log(email);
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  handleValidation() {
    let fields = this.state.fields;
    let errors = {};
    //Name
    if (!fields['firstName']) {
      errors['firstName'] = 'This field is required';
    } else if (typeof fields['firstName'] !== 'undefined') {
      if (!fields['firstName'].match(/^[a-zA-Z]+$/)) {
        errors['firstName'] = 'Only letters are allowed';
      }
    }
    if (!fields['lastName']) {
      errors['lastName'] = 'This field is required';
    } else if (typeof fields['lastName'] !== 'undefined') {
      if (!fields['lastName'].match(/^[a-zA-Z]+$/)) {
        errors['lastName'] = 'Only letters are allowed';
      }
    }
    //Email
    if (!fields['email']) {
      errors['email'] = 'This field is required';
    } else if (!this.validateEmail(fields['email'])) {
      errors['email'] = 'Email is not valid';
    }

    this.setState({ errors: errors });
    return Object.keys(errors).length === 0;
  }

  componentDidMount() {
    this.fetchUsers();
  }

  fetchUsers = () => {
    this.setState({
      isLoading: true,
    });

    organizationService.getUsers(null).then((data) =>
      this.setState({
        users: data.users,
        isLoading: false,
      })
    );
  };

  changeNewUserOption = (name, e) => {
    let fields = this.state.fields;
    fields[name] = e.target.value;

    this.setState({
      fields,
    });
  };

  archiveOrgUser = (id) => {
    this.setState({ archivingUser: id });

    organizationUserService
      .archive(id)
      .then(() => {
        toast.success('The user has been archived', { hideProgressBar: true, position: 'top-center' });
        this.setState({ archivingUser: null });
        this.fetchUsers();
      })
      .catch(({ error }) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
        this.setState({ archivingUser: null });
      });
  };

  createUser = (event) => {
    event.preventDefault();

    if (this.handleValidation()) {
      let fields = {};
      Object.keys(fields).map((key) => {
        fields[key] = '';
      });

      this.setState({
        creatingUser: true,
        fields: fields,
      });

      organizationUserService
        .create(
          this.state.fields.firstName,
          this.state.fields.lastName,
          this.state.fields.email,
          this.state.fields.role
        )
        .then(() => {
          toast.success('User has been created', { hideProgressBar: true, position: 'top-center' });
          this.fetchUsers();
          this.setState({ creatingUser: false, showNewUserForm: false });
        })
        .catch(({ error }) => {
          toast.error(error, { hideProgressBar: true, position: 'top-center' });
        });
    } else {
      this.setState({ creatingUser: false, showNewUserForm: true });
    }
  };

  logout = () => {
    authenticationService.logout();
    history.push('/login');
  };

  generateInvitationURL = (user) => window.location.origin + '/invitations/' + user.invitation_token;

  invitationLinkCopyHandler = () => {
    toast.info('Invitation URL copied', { hideProgressBar: true, position: 'bottom-right' });
  };

  render() {
    const { isLoading, showNewUserForm, creatingUser, users, archivingUser } = this.state;
    return (
      <div className="wrapper org-users-page">
        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />
        <ReactTooltip type="dark" effect="solid" delayShow={250} />

        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <div className="page-pretitle"></div>
                  <h2 className="page-title">Users & Permissions</h2>
                </div>
                <div className="col-auto ms-auto d-print-none">
                  {!showNewUserForm && (
                    <div className="btn btn-primary" onClick={() => this.setState({ showNewUserForm: true })}>
                      Invite new user
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="page-body">
            {showNewUserForm && (
              <div className="container-xl">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Add new user</h3>
                  </div>
                  <div className="card-body">
                    <form onSubmit={this.createUser} noValidate>
                      <div className="form-group mb-3 ">
                        <div className="row">
                          <div className="col">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter First Name"
                              name="firstName"
                              onChange={this.changeNewUserOption.bind(this, 'firstName')}
                              value={this.state.fields['firstName']}
                            />
                            <span className="text-danger">{this.state.errors['firstName']}</span>
                          </div>
                          <div className="col">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter Last Name"
                              name="lastName"
                              onChange={this.changeNewUserOption.bind(this, 'lastName')}
                              value={this.state.fields['lastName']}
                            />
                            <span className="text-danger">{this.state.errors['lastName']}</span>
                          </div>
                        </div>
                      </div>
                      <div className="form-group mb-3 ">
                        <label className="form-label">Email address</label>
                        <div>
                          <input
                            type="text"
                            className="form-control"
                            aria-describedby="emailHelp"
                            placeholder="Enter email"
                            name="email"
                            onChange={this.changeNewUserOption.bind(this, 'email')}
                            value={this.state.fields['email']}
                          />
                          <span className="text-danger">{this.state.errors['email']}</span>
                        </div>
                      </div>
                      <div className="form-footer">
                        <button
                          type="button"
                          className="btn btn-light mr-2"
                          onClick={() => this.setState({ showNewUserForm: false, newUser: {} })}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`btn mx-2 btn-primary ${creatingUser ? 'btn-loading' : ''}`}
                          disabled={creatingUser}
                        >
                          Create User
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {!showNewUserForm && (
              <div className="container-xl">
                <div className="card">
                  <div className="card-table table-responsive table-bordered">
                    <table data-testid="usersTable" className="table table-vcenter" disabled={true}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th className="w-1"></th>
                        </tr>
                      </thead>
                      {isLoading ? (
                        <tbody className="w-100" style={{ minHeight: '300px' }}>
                          {Array.from(Array(4)).map((index) => (
                            <tr key={index}>
                              <td className="col-2 p-3">
                                <div className="row">
                                  <div
                                    className="skeleton-image col-auto"
                                    style={{ width: '25px', height: '25px' }}
                                  ></div>
                                  <div className="skeleton-line w-10 col mx-3"></div>
                                </div>
                              </td>
                              <td className="col-4 p-3">
                                <div className="skeleton-line w-10"></div>
                              </td>
                              <td className="col-2 p-3">
                                <div className="skeleton-line"></div>
                              </td>
                              <td className="text-muted col-auto col-1 pt-3">
                                <div className="skeleton-line"></div>
                              </td>
                              <td className="text-muted col-auto col-1 pt-3">
                                <div className="skeleton-line"></div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      ) : (
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>
                                <span className="avatar bg-azure-lt avatar-sm">
                                  {user.first_name ? user.first_name[0] : ''}
                                  {user.last_name ? user.last_name[0] : ''}
                                </span>
                                <span className="mx-3" style={{ display: 'inline-flex', marginBottom: '7px' }}>
                                  {user.name}
                                </span>
                              </td>
                              <td className="text-muted">
                                <a href="#" className="text-reset user-email">
                                  {user.email}
                                </a>
                              </td>
                              <td className="text-muted">
                                <span
                                  className={`badge bg-${user.status === 'invited' ? 'warning' : user.status === 'archived' ? 'danger' : 'success'} me-1 m-1`}
                                ></span>
                                <small className="user-status">{user.status}</small>
                                {user.status === 'invited' && 'invitation_token' in user ? (
                                  <CopyToClipboard
                                    text={this.generateInvitationURL(user)}
                                    onCopy={this.invitationLinkCopyHandler}
                                  >
                                    <img
                                      data-tip="Copy invitation link"
                                      className="svg-icon"
                                      src="/assets/images/icons/copy.svg"
                                      width="15"
                                      height="15"
                                      style={{
                                        cursor: 'pointer'
                                      }}
                                    ></img>
                                  </CopyToClipboard>
                                ) : (
                                  ''
                                )}
                              </td>
                              <td>
                                {archivingUser === null && (
                                  <a
                                    onClick={() => {
                                      this.archiveOrgUser(user.id);
                                    }}
                                  >
                                    Archive
                                  </a>
                                )}
                                {archivingUser === user.id && <small>Archiving user...</small>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export { ManageOrgUsers };
