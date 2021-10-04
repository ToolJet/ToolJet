import React from 'react';
import { authenticationService, organizationService, organizationUserService } from '@/_services';
import 'react-toastify/dist/ReactToastify.css';
import { Header } from '@/_components';
import { toast } from 'react-toastify';
import { history } from '@/_helpers';
import { CopyToClipboard } from 'react-copy-to-clipboard';

class ManageOrgUsers extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isLoading: true,
      showNewUserForm: false,
      creatingUser: false,
      newUser: {},
      idChangingRole: null,
      archivingUser: null,
    };
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

  changeNewUserOption = (option, value) => {
    this.setState({
      newUser: {
        ...this.state.newUser,
        [option]: value,
      },
    });
  };

  changeNewUserRole = (id, role) => {
    this.setState({ idChangingRole: id });

    organizationUserService
      .changeRole(id, role)
      .then(() => {
        toast.success('User role has been updated', { hideProgressBar: true, position: 'top-center' });
        this.setState({ idChangingRole: null });
      })
      .catch(({ error }) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
        this.setState({ idChangingRole: null });
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

  createUser = () => {
    this.setState({
      creatingUser: true,
    });

    const { firstName, lastName, email, role } = this.state.newUser;

    organizationUserService
      .create(firstName, lastName, email, role)
      .then(() => {
        this.setState({ creatingUser: false, showNewUserForm: false, newUser: {} });
        toast.success('User has been created', { hideProgressBar: true, position: 'top-center' });
        this.fetchUsers();
      })
      .catch(({ error }) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
        this.setState({ creatingUser: false, showNewUserForm: true, newUser: {} });
      });
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
                    <form>
                      <div className="form-group mb-3 ">
                        <div className="row">
                          <div className="col">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter First Name"
                              onChange={(e) => {
                                this.changeNewUserOption('firstName', e.target.value);
                              }}
                            />
                          </div>
                          <div className="col">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter Last Name"
                              onChange={(e) => {
                                this.changeNewUserOption('lastName', e.target.value);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="form-group mb-3 ">
                        <label className="form-label">Email address</label>
                        <div>
                          <input
                            type="email"
                            className="form-control"
                            aria-describedby="emailHelp"
                            placeholder="Enter email"
                            onChange={(e) => {
                              this.changeNewUserOption('email', e.target.value);
                            }}
                          />
                        </div>
                      </div>
                      {/* <div className="form-group mb-3 "> */}
                      {/*   <label className="form-label">Role</label> */}
                      {/*   <div> */}
                      {/*     <SelectSearch */}
                      {/*       options={['Admin', 'Developer', 'Viewer'].map((role) => { */}
                      {/*         return { name: role, value: role.toLowerCase() }; */}
                      {/*       })} */}
                      {/*       value={newUser.role} */}
                      {/*       search={true} */}
                      {/*       onChange={(value) => { */}
                      {/*         this.changeNewUserOption('role', value); */}
                      {/*       }} */}
                      {/*       filterOptions={fuzzySearch} */}
                      {/*       placeholder="Select.." */}
                      {/*     /> */}
                      {/*   </div> */}
                      {/* </div> */}
                      <div className="form-footer">
                        <button
                          className="btn btn-light mr-2"
                          onClick={() => this.setState({ showNewUserForm: false, newUser: {} })}
                          disabled={creatingUser}
                        >
                          Cancel
                        </button>
                        <button
                          className={`btn mx-2 btn-primary ${creatingUser ? 'btn-loading' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            this.createUser();
                          }}
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
                          {/* <th> */}
                          {/*   <center>Role</center> */}
                          {/* </th> */}
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
                              {/* <td className="text-muted" style={{ width: '280px' }}> */}
                              {/*   <center className="mx-5 select-search-role"> */}
                              {/*     <SelectSearch */}
                              {/*       options={['Admin', 'Developer', 'Viewer'].map((role) => { */}
                              {/*         return { name: role, value: role.toLowerCase() }; */}
                              {/*       })} */}
                              {/*       value={user.role} */}
                              {/*       search={false} */}
                              {/*       disabled={idChangingRole === user.id} */}
                              {/*       onChange={(value) => { */}
                              {/*         this.changeNewUserRole(user.id, value); */}
                              {/*       }} */}
                              {/*       filterOptions={fuzzySearch} */}
                              {/*       placeholder="Select.." */}
                              {/*     /> */}
                              {/*     {idChangingRole === user.id && <small>Updating role...</small>} */}
                              {/*   </center> */}
                              {/* </td> */}
                              <td className="text-muted">
                                <span
                                  className={`badge bg-${user.status === 'invited' ? 'warning' : 'success'} me-1 m-1`}
                                ></span>
                                <small className="user-status">{user.status}</small>
                                {user.status === 'invited' && 'invitation_token' in user ? (
                                  <CopyToClipboard
                                    text={this.generateInvitationURL(user)}
                                    onCopy={this.invitationLinkCopyHandler}
                                  >
                                    <img
                                      className="svg-icon"
                                      src="/assets/images/icons/copy.svg"
                                      width="15"
                                      height="15"
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
