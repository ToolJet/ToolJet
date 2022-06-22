import React from 'react';
import { authenticationService } from '@/_services';
import { groupPermissionService } from '../_services/groupPermission.service';
import { Header, ConfirmDialog } from '@/_components';
import { toast } from 'react-hot-toast';
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
      isDeletingGroup: false,
      showGroupDeletionConfirmation: false,
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
        });
        toast.success('Group has been created', {
          position: 'top-center',
        });
        this.fetchGroups();
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        this.setState({
          creatingGroup: false,
          showNewGroupForm: true,
        });
      });
  };

  deleteGroup = (groupPermissionId) => {
    this.setState({
      showGroupDeletionConfirmation: true,
      groupToBeDeleted: groupPermissionId,
    });
  };

  cancelDeleteGroupDialog = () => {
    this.setState({
      isDeletingGroup: false,
      groupToBeDeleted: null,
      showGroupDeletionConfirmation: false,
    });
  };

  executeGroupDeletion = () => {
    this.setState({ isDeletingGroup: true });
    groupPermissionService
      .del(this.state.groupToBeDeleted)
      .then(() => {
        toast.success('Group deleted successfully', {
          position: 'top-center',
        });
        this.fetchGroups();
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
      })
      .finally(() => {
        this.cancelDeleteGroupDialog();
      });
  };

  render() {
    const { isLoading, showNewGroupForm, creatingGroup, groups, isDeletingGroup, showGroupDeletionConfirmation } =
      this.state;
    return (
      <div className="wrapper org-users-page">
        <ConfirmDialog
          show={showGroupDeletionConfirmation}
          message={'This group will be permanently deleted. Do you want to continue?'}
          confirmButtonLoading={isDeletingGroup}
          onConfirm={() => this.executeGroupDeletion()}
          onCancel={() => this.cancelDeleteGroupDialog()}
        />

        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />

        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <div className="page-pretitle"></div>
                  <h2 className="page-title" data-cy="user-groups-title">
                    User Groups
                  </h2>
                </div>
                <div className="col-auto ms-auto d-print-none">
                  {!showNewGroupForm && (
                    <div
                      className="btn btn-primary"
                      onClick={() => this.setState({ showNewGroupForm: true })}
                      data-cy="create-new-group-button"
                    >
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
                    <h3 className="card-title" data-cy="card-title">
                      Add new group
                    </h3>
                  </div>
                  <div className="card-body">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        this.createGroup();
                      }}
                    >
                      <div className="form-group mb-3 ">
                        <div className="row">
                          <div className="col">
                            <input
                              type="text"
                              required
                              className="form-control"
                              placeholder="Enter Name"
                              onChange={(e) => {
                                this.changeNewGroupName(e.target.value);
                              }}
                              data-cy="group-name-input"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="form-footer">
                        <button
                          type="button"
                          className="btn btn-light mr-2"
                          onClick={() =>
                            this.setState({
                              showNewGroupForm: false,
                              newGroupName: null,
                            })
                          }
                          disabled={creatingGroup}
                          data-cy="cancel-button"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`btn mx-2 btn-primary ${creatingGroup ? 'btn-loading' : ''}`}
                          disabled={creatingGroup}
                          data-cy="create-group-button"
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
                          <th data-cy="table-header">Name</th>
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
                                <Link to={`/groups/${permissionGroup.id}`} data-cy="group-name">
                                  {this.humanizeifDefaultGroupName(permissionGroup.group)}
                                </Link>
                              </td>
                              <td>
                                {permissionGroup.group !== 'admin' && permissionGroup.group !== 'all_users' && (
                                  <Link onClick={() => this.deleteGroup(permissionGroup.id)} data-cy="delete-link">
                                    Delete
                                  </Link>
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
