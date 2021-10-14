import React from 'react';
import { authenticationService } from '@/_services';
import { groupPermissionService } from '../_services/groupPermission.service';
import 'react-toastify/dist/ReactToastify.css';
import { Header } from '@/_components';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

class ManageGroupPermissions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isLoading: true,
      groups: [],
      creatingGroup: false,
      showNewGroupForm: false,
      newGroupName: null,
    };
  }

  componentDidMount() {
    this.fetchGroups();
  }

  fetchGroups = () => {
    this.setState({
      isLoading: true,
    });

    groupPermissionService.getGroups().then((data) => {
      this.setState({
        groups: data.group_permissions,
        isLoading: false,
      });
    });
  };

  changeNewGroupName = (value) => {
    this.setState({
      newGroupName: value,
    });
  };

  humanizeifDefaultGroupName = (groupName) => {
    switch (groupName) {
      case 'all_users':
        return 'All Users';
      case 'admin':
        return 'Admin';
      default:
        return groupName;
    }
  };

  createGroup = () => {
    this.setState({ creatingGroup: true });
    groupPermissionService
      .create(this.state.newGroupName)
      .then(() => {
        this.setState({
          creatingGroup: false,
          showNewGroupForm: false,
          newGroup: null,
        });
        toast.success('Group has been created', {
          hideProgressBar: true,
          position: 'top-center',
        });
        this.fetchGroups();
      })
      .catch(({ error }) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
        this.setState({
          creatingGroup: false,
          showNewGroupForm: true,
          newGroup: {},
        });
      });
  };

  deleteGroup = (groupPermissionId) => {
    groupPermissionService
      .del(groupPermissionId)
      .then(() => {
        toast.success('Group has been deleted', {
          hideProgressBar: true,
          position: 'top-center',
        });
        this.fetchGroups();
      })
      .catch(({ error }) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
      });
  };

  render() {
    const { isLoading, showNewGroupForm, creatingGroup, groups } = this.state;
    return (
      <div className="wrapper org-users-page">
        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />

        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <div className="page-pretitle"></div>
                  <ol className="breadcrumb" aria-label="breadcrumbs">
                    <li className="breadcrumb-item">
                      <Link>User groups</Link>
                    </li>
                  </ol>
                </div>
                <div className="col-auto ms-auto d-print-none">
                  {!showNewGroupForm && (
                    <div className="btn btn-primary" onClick={() => this.setState({ showNewGroupForm: true })}>
                      Create new group
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="page-body">
            {showNewGroupForm && (
              <div className="container-xl">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Add new group</h3>
                  </div>
                  <div className="card-body">
                    <form>
                      <div className="form-group mb-3 ">
                        <div className="row">
                          <div className="col">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter Name"
                              onChange={(e) => {
                                this.changeNewGroupName(e.target.value);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="form-footer">
                        <button
                          className="btn btn-light mr-2"
                          onClick={() =>
                            this.setState({
                              showNewGroupForm: false,
                              newGroup: null,
                            })
                          }
                          disabled={creatingGroup}
                        >
                          Cancel
                        </button>
                        <button
                          className={`btn mx-2 btn-primary ${creatingGroup ? 'btn-loading' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            this.createGroup();
                          }}
                          disabled={creatingGroup}
                        >
                          Create Group
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
            {!showNewGroupForm && (
              <div className="container-xl">
                <div className="card">
                  <div className="card-table table-responsive table-bordered">
                    <table data-testid="usersTable" className="table table-vcenter" disabled={true}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th className="w-1"></th>
                          <th className="w-1"></th>
                        </tr>
                      </thead>
                      {isLoading ? (
                        <tbody className="w-100" style={{ minHeight: '300px' }}>
                          {Array.from(Array(2)).map((index) => (
                            <tr key={index}>
                              <td className="col-auto">
                                <div className="row">
                                  <div className="skeleton-line w-10 col mx-3"></div>
                                </div>
                              </td>
                              <td className="col-auto">
                                <div className="skeleton-line w-10"></div>
                              </td>
                              <td className="col-auto">
                                <div className="skeleton-line w-10"></div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      ) : (
                        <tbody>
                          {groups.map((permissionGroup) => (
                            <tr key={permissionGroup.id}>
                              <td>
                                <Link to={`/groups/${permissionGroup.id}`}>
                                  {this.humanizeifDefaultGroupName(permissionGroup.group)}
                                </Link>
                              </td>
                              <td>
                                {permissionGroup.group !== 'admin' && permissionGroup.group !== 'all_users' && (
                                  <Link onClick={() => this.deleteGroup(permissionGroup.id)}>Delete</Link>
                                )}
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

export { ManageGroupPermissions };
