import React from 'react';
import { authenticationService, organizationService, organizationUserService } from '@/_services';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { toast } from 'react-toastify';

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
      .then((data) => {
        toast.success('User role has been updated', { hideProgressBar: true, position: 'top-center' });
        this.setState({ idChangingRole: null });
      })
      .catch((error) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
        this.setState({ idChangingRole: null });
      });
  };

  createUser = () => {
    this.setState({
      creatingUser: true,
    });

    const { first_name, last_name, email, role } = this.state.newUser;

    organizationUserService.create(first_name, last_name, email, role).then((data) => {
      this.setState({ creatingUser: false, showNewUserForm: false, newUser: {} });
      toast.success('User has been created', { hideProgressBar: true, position: 'top-center' });
      this.fetchUsers();
    });
  };

  logout() {
    authenticationService.logout();
    history.push('/login');
  }

  render() {
    const { isLoading, showNewUserForm, creatingUser, users, newUser, idChangingRole } = this.state;

    return (
      <div className="wrapper">
        <header className="navbar navbar-expand-md navbar-light d-print-none">
          <div className="container-xl">
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
              <span className="navbar-toggler-icon"></span>
            </button>
            <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
              <a href=".">
                <img src="/images/logo.svg" width="110" height="32" className="navbar-brand-image" />
              </a>
            </h1>
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to={`/`} className="nav-link">
                  <span className="nav-link-title">Apps</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to={`/users`} className="nav-link active">
                  <span className="nav-link-title">Users</span>
                </Link>
              </li>
            </ul>
            <div className="navbar-nav flex-row order-md-last">
              <div className="nav-item dropdown d-none d-md-flex me-3">
                <div className="dropdown-menu dropdown-menu-end dropdown-menu-card">
                  <div className="card">
                    <div className="card-body">
                      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus ad amet consectetur
                      exercitationem fugiat in ipsa ipsum, natus odio quidem quod repudiandae sapiente. Amet debitis et
                      magni maxime necessitatibus ullam.
                    </div>
                  </div>
                </div>
              </div>
              <div className="nav-item dropdown">
                <a
                  href="#"
                  className="nav-link d-flex lh-1 text-reset p-0"
                  data-bs-toggle="dropdown"
                  aria-label="Open user menu"
                >
                  <div className="d-none d-xl-block ps-2">
                    {/* <div>{this.state.currentUser.first_name}</div> */}
                    <span onClick={this.logout}>Logout</span>
                  </div>
                </a>
                <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                  <a href="#" className="dropdown-item">
                    Settings
                  </a>
                  <a href="#" className="dropdown-item">
                    Logout
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <div className="page-pretitle"></div>
                  <h2 className="page-title">Users & Permissions</h2>
                </div>
                <div className="col-auto ms-auto d-print-none">
                  <div className="btn btn-primary" onClick={() => this.setState({ showNewUserForm: true })}>
                    Add User
                  </div>
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
                                this.changeNewUserOption('first_name', e.target.value);
                              }}
                            />
                          </div>
                          <div className="col">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter Last Name"
                              onChange={(e) => {
                                this.changeNewUserOption('last_name', e.target.value);
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
                      <div className="form-group mb-3 ">
                        <label className="form-label">Role</label>
                        <div>
                          <SelectSearch
                            options={['Admin', 'Developer', 'Viewer'].map((role) => {
                              return { name: role, value: role.toLowerCase() };
                            })}
                            value={newUser.role}
                            search={true}
                            onChange={(value) => {
                              this.changeNewUserOption('role', value);
                            }}
                            filterOptions={fuzzySearch}
                            placeholder="Select.."
                          />
                        </div>
                      </div>
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
                          onClick={this.createUser}
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
                {isLoading ? (
                  <div style={{ width: '100%' }} className="p-5">
                    <Skeleton count={5} />
                  </div>
                ) : (
                  <div className="card">
                    <div className="card-table table-responsive table-bordered">
                      <table className="table table-vcenter" disabled={true}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>
                              <center>Role</center>
                            </th>
                            <th>Status</th>
                            <th className="w-1"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr>
                              <td>{user.name}</td>
                              <td className="text-muted">
                                <a href="#" className="text-reset">
                                  {user.email}
                                </a>
                              </td>
                              <td className="text-muted" style={{ width: '280px' }}>
                                <center className="mx-5">
                                  <SelectSearch
                                    options={['Admin', 'Developer', 'Viewer'].map((role) => {
                                      return { name: role, value: role.toLowerCase() };
                                    })}
                                    value={user.role}
                                    search={false}
                                    disabled={idChangingRole === user.id}
                                    onChange={(value) => {
                                      this.changeNewUserRole(user.id, value);
                                    }}
                                    filterOptions={fuzzySearch}
                                    placeholder="Select.."
                                  />
                                  {idChangingRole === user.id && <small>Updating role...</small>}
                                </center>
                              </td>
                              <td className="text-muted">
                                <span
                                  class={`badge bg-${user.status === 'invited' ? 'warning' : 'success'} me-1 m-1`}
                                ></span>
                                <small>{user.status}</small>
                              </td>
                              <td>
                                <a href="#">Remove</a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export { ManageOrgUsers };
