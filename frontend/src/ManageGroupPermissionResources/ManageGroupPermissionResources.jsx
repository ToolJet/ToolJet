import React from 'react';
import cx from 'classnames';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { groupPermissionService } from '../_services/groupPermission.service';
import { Header } from '@/_components';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

class ManageGroupPermissionResources extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoadingGroup: true,
      isLoadingApps: true,
      isAddingApps: false,
      isLoadingUsers: true,
      isAddingUsers: false,
      groupPermission: null,
      usersInGroup: [],
      appsInGroup: [],
      usersNotInGroup: [],
      appsNotInGroup: [],
      selectedAppIds: [],
      selectedUserIds: [],
      removeAppIds: [],
      currentTab: 'apps',
    };
  }

  componentDidMount() {
    const groupPermissionId = this.props.match.params.id;

    this.fetchGroupAndResources(groupPermissionId);
  }

  humanizeIfDefaultGroupName = (groupName) => {
    switch (groupName) {
      case 'all_users':
        return 'All Users';
      case 'admin':
        return 'Admin';
      default:
        return groupName;
    }
  };

  fetchGroupPermission = (groupPermissionId) => {
    groupPermissionService.getGroup(groupPermissionId).then((data) => {
      this.setState({
        groupPermission: data,
        isLoadingGroup: false,
      });
    });
  };

  fetchGroupAndResources = (groupPermissionId) => {
    this.setState({ isLoadingGroup: true });

    this.fetchGroupPermission(groupPermissionId);
    this.fetchUsersNotInGroup(groupPermissionId);
    this.fetchUsersInGroup(groupPermissionId);
    this.fetchAppsNotInGroup(groupPermissionId);
    this.fetchAppsInGroup(groupPermissionId);
  };

  fetchUsersNotInGroup = (groupPermissionId) => {
    groupPermissionService.getUsersNotInGroup(groupPermissionId).then((data) => {
      this.setState({
        usersNotInGroup: data.users,
      });
    });
  };

  fetchUsersInGroup = (groupPermissionId) => {
    groupPermissionService.getUsersInGroup(groupPermissionId).then((data) => {
      this.setState({
        usersInGroup: data.users,
        isLoadingUsers: false,
      });
    });
  };

  fetchAppsNotInGroup = (groupPermissionId) => {
    groupPermissionService.getAppsNotInGroup(groupPermissionId).then((data) => {
      this.setState({
        appsNotInGroup: data.apps,
      });
    });
  };

  fetchAppsInGroup = (groupPermissionId) => {
    groupPermissionService.getAppsInGroup(groupPermissionId).then((data) => {
      this.setState({
        appsInGroup: data.apps,
        isLoadingApps: false,
      });
    });
  };

  updateGroupPermission = (groupPermissionId, params) => {
    groupPermissionService
      .update(groupPermissionId, params)
      .then(() => {
        toast.success('Group permissions updated', {
          position: 'top-center',
        });

        this.fetchGroupPermission(groupPermissionId);
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
      });
  };

  updateAppGroupPermission = (app, groupPermissionId, action) => {
    const appGroupPermission = app.app_group_permissions.find(
      (permission) => permission.group_permission_id === groupPermissionId
    );

    let actionParams = { read: true, update: action === 'edit' };

    groupPermissionService
      .updateAppGroupPermission(groupPermissionId, appGroupPermission.id, actionParams)
      .then(() => {
        toast.success('App permissions updated', {
          position: 'top-center',
        });

        this.fetchAppsInGroup(groupPermissionId);
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
      });
  };

  canAppGroupPermission = (app, groupPermissionId, action) => {
    let appGroupPermission;
    switch (action) {
      case 'edit':
        appGroupPermission = this.findAppGroupPermission(app, groupPermissionId);
        return appGroupPermission['read'] && appGroupPermission['update'];
      case 'view':
        appGroupPermission = this.findAppGroupPermission(app, groupPermissionId);

        return appGroupPermission['read'] && !appGroupPermission['update'];
      default:
        return false;
    }
  };

  findAppGroupPermission = (app, groupPermissionId) => {
    const appGroupPermission = app.app_group_permissions.find(
      (permission) => permission.group_permission_id === groupPermissionId
    );

    return appGroupPermission;
  };

  setSelectedUsers = (value) => {
    this.setState({
      selectedUserIds: value,
    });
  };

  setSelectedApps = (value) => {
    this.setState({
      selectedAppIds: value,
    });
  };

  addSelectedAppsToGroup = (groupPermissionId, selectedAppIds) => {
    this.setState({ isAddingApps: true });
    const updateParams = {
      add_apps: selectedAppIds,
    };
    groupPermissionService
      .update(groupPermissionId, updateParams)
      .then(() => {
        this.setState({
          selectedAppIds: [],
          isLoadingApps: true,
          isAddingApps: false,
        });
        this.fetchAppsNotInGroup(groupPermissionId);
        this.fetchAppsInGroup(groupPermissionId);
      })
      .then(() => {
        toast.success('Apps added to the group', {
          position: 'top-center',
        });
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
      });
  };

  removeAppFromGroup = (groupPermissionId, appId) => {
    const updateParams = {
      remove_apps: [appId],
    };
    groupPermissionService
      .update(groupPermissionId, updateParams)
      .then(() => {
        this.setState({ removeAppIds: [], isLoadingApps: true });
        this.fetchAppsNotInGroup(groupPermissionId);
        this.fetchAppsInGroup(groupPermissionId);
      })
      .then(() => {
        toast.success('Apps removed from the group', {
          position: 'top-center',
        });
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
      });
  };

  addSelectedUsersToGroup = (groupPermissionId, selectedUserIds) => {
    this.setState({ isAddingUsers: true });
    const updateParams = {
      add_users: selectedUserIds,
    };
    groupPermissionService
      .update(groupPermissionId, updateParams)
      .then(() => {
        this.setState({
          selectedUserIds: [],
          isLoadingUsers: true,
          isAddingUsers: false,
        });
        this.fetchUsersNotInGroup(groupPermissionId);
        this.fetchUsersInGroup(groupPermissionId);
      })
      .then(() => {
        toast.success('Users added to the group', {
          position: 'top-center',
        });
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
      });
  };

  removeUserFromGroup = (groupPermissionId, userId) => {
    const updateParams = {
      remove_users: [userId],
    };
    groupPermissionService
      .update(groupPermissionId, updateParams)
      .then(() => {
        this.setState({ removeUserIds: [], isLoadingUsers: true });
        this.fetchUsersNotInGroup(groupPermissionId);
        this.fetchUsersInGroup(groupPermissionId);
      })
      .then(() => {
        toast.success('Users removed from the group', {
          position: 'top-center',
        });
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
      });
  };

  render() {
    const {
      isLoadingGroup,
      isLoadingApps,
      isAddingApps,
      isLoadingUsers,
      isAddingUsers,
      appsInGroup,
      appsNotInGroup,
      usersInGroup,
      usersNotInGroup,
      groupPermission,
      currentTab,
      selectedAppIds,
      selectedUserIds,
    } = this.state;

    const folder_permission = groupPermission
      ? groupPermission.folder_create && groupPermission.folder_delete && groupPermission.folder_update
      : false;

    const appSelectOptions = appsNotInGroup.map((app) => {
      return { name: app.name, value: app.id };
    });
    const userSelectOptions = usersNotInGroup.map((user) => {
      return { name: `${user.first_name} ${user.last_name}`, value: user.id };
    });

    const orgEnvironmentPermission = groupPermission
      ? groupPermission.org_environment_variable_create &&
        groupPermission.org_environment_variable_update &&
        groupPermission.org_environment_variable_delete
      : false;

    return (
      <div className="wrapper org-users-page">
        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />

        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <div className="page-pretitle"></div>
                  {isLoadingGroup ? (
                    <ol className="breadcrumb" aria-label="breadcrumbs">
                      <li className="breadcrumb-item">
                        <a href="#">User groups</a>
                      </li>
                    </ol>
                  ) : (
                    <ol className="breadcrumb" aria-label="breadcrumbs">
                      <li className="breadcrumb-item">
                        <Link to="/groups" data-cy="user-groups">
                          User groups
                        </Link>
                      </li>
                      <li className="breadcrumb-item">
                        <a href="#" data-cy="group-name">
                          {this.humanizeIfDefaultGroupName(groupPermission.group)}
                        </a>
                      </li>
                    </ol>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="page-body">
            <div className="container-xl">
              <div className="card">
                <nav className="nav nav-tabs">
                  <a
                    onClick={() => this.setState({ currentTab: 'apps' })}
                    className={cx('nav-item nav-link', { active: currentTab === 'apps' })}
                    data-cy="apps-link"
                  >
                    Apps
                  </a>
                  <a
                    onClick={() => this.setState({ currentTab: 'users' })}
                    className={cx('nav-item nav-link', { active: currentTab === 'users' })}
                    data-cy="users-link"
                  >
                    Users
                  </a>
                  <a
                    onClick={() => this.setState({ currentTab: 'permissions' })}
                    className={cx('nav-item nav-link', { active: currentTab === 'permissions' })}
                    data-cy="permissions-link"
                  >
                    Permissions
                  </a>
                </nav>
                <div className="card-body">
                  <div className="tab-content">
                    {/* Apps Tab */}
                    <div className={`tab-pane ${currentTab === 'apps' ? 'active show' : ''}`}>
                      <div className="row">
                        <div className="col-5" data-cy="select-search">
                          <SelectSearch
                            className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
                            options={appSelectOptions}
                            closeOnSelect={false}
                            multiple
                            search={true}
                            value={selectedAppIds}
                            filterOptions={fuzzySearch}
                            onChange={(value) => this.setSelectedApps(value)}
                            printOptions="on-focus"
                            placeholder="Select apps to add to the group"
                          />
                        </div>
                        <div className="col-auto">
                          <div
                            className={`btn btn-primary w-100 ${isAddingApps ? 'btn-loading' : ''} ${
                              selectedAppIds.length === 0 ? 'disabled' : ''
                            }`}
                            onClick={() => this.addSelectedAppsToGroup(groupPermission.id, selectedAppIds)}
                            data-cy="add-button"
                          >
                            Add
                          </div>
                        </div>
                      </div>
                      <br />
                      <div>
                        <div className="table-responsive">
                          <table className="table table-vcenter">
                            <thead>
                              <tr>
                                <th data-cy="name-header">Name</th>
                                <th data-cy="permissions-header">Permissions</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoadingGroup || isLoadingApps ? (
                                <tr>
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
                              ) : (
                                appsInGroup.map((app) => (
                                  <tr key={app.id}>
                                    <td>{app.name}</td>
                                    <td className="text-secondary">
                                      <div>
                                        <label className="form-check form-check-inline">
                                          <input
                                            className="form-check-input"
                                            type="radio"
                                            onChange={() => {
                                              this.updateAppGroupPermission(app, groupPermission.id, 'view');
                                            }}
                                            disabled={groupPermission.group === 'admin'}
                                            checked={this.canAppGroupPermission(app, groupPermission.id, 'view')}
                                          />
                                          <span className="form-check-label">View</span>
                                        </label>
                                        <label className="form-check form-check-inline">
                                          <input
                                            className="form-check-input"
                                            type="radio"
                                            onChange={() => {
                                              this.updateAppGroupPermission(app, groupPermission.id, 'edit');
                                            }}
                                            disabled={groupPermission.group === 'admin'}
                                            checked={this.canAppGroupPermission(app, groupPermission.id, 'edit')}
                                          />
                                          <span className="form-check-label">Edit</span>
                                        </label>
                                      </div>
                                    </td>
                                    <td>
                                      {groupPermission.group !== 'admin' && (
                                        <Link
                                          to="#"
                                          onClick={() => {
                                            this.removeAppFromGroup(groupPermission.id, app.id);
                                          }}
                                          data-cy="delete-link"
                                        >
                                          Delete
                                        </Link>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Users Tab */}
                    <div className={`tab-pane ${currentTab === 'users' ? 'active show' : ''}`}>
                      <div className="row">
                        <div className="col-5">
                          <SelectSearch
                            className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
                            options={userSelectOptions}
                            closeOnSelect={false}
                            multiple
                            search={true}
                            filterOptions={fuzzySearch}
                            value={selectedUserIds}
                            onChange={(value) => this.setSelectedUsers(value)}
                            printOptions="on-focus"
                            placeholder="Select users to add to the group"
                          />
                        </div>
                        <div className="col-auto">
                          <div
                            className={`btn btn-primary w-100 ${isAddingUsers ? 'btn-loading' : ''} ${
                              selectedUserIds.length === 0 ? 'disabled' : ''
                            }`}
                            onClick={() => this.addSelectedUsersToGroup(groupPermission.id, selectedUserIds)}
                          >
                            Add
                          </div>
                        </div>
                      </div>
                      <br />
                      <div>
                        <div className="table-responsive">
                          <table className="table table-vcenter">
                            <thead>
                              <tr>
                                <th data-cy="name-header">Name</th>
                                <th data-cy="email-header">Email</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoadingGroup || isLoadingUsers ? (
                                <tr>
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
                              ) : (
                                usersInGroup.map((user) => (
                                  <tr key={user.id}>
                                    <td>{`${user.first_name} ${user.last_name}`}</td>
                                    <td>{user.email}</td>
                                    <td className="text-muted">
                                      {groupPermission.group !== 'all_users' && (
                                        <Link
                                          to="#"
                                          onClick={() => {
                                            this.removeUserFromGroup(groupPermission.id, user.id);
                                          }}
                                        >
                                          Delete
                                        </Link>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Permissions Tab */}
                    <div className={`tab-pane ${currentTab === 'permissions' ? 'active show' : ''}`}>
                      <div>
                        <div className="table-responsive">
                          <table className="table table-vcenter">
                            <thead>
                              <tr>
                                <th data-cy="resource-header">Resource</th>
                                <th data-cy="permissions-header">Permissions</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoadingGroup ? (
                                <tr>
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
                              ) : (
                                <>
                                  <tr>
                                    <td data-cy="resource-apps">Apps</td>
                                    <td className="text-muted">
                                      <div>
                                        <label className="form-check form-check-inline">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            onChange={() => {
                                              this.updateGroupPermission(groupPermission.id, {
                                                app_create: !groupPermission.app_create,
                                              });
                                            }}
                                            checked={groupPermission.app_create}
                                            disabled={groupPermission.group === 'admin'}
                                            data-cy="app-create-checkbox"
                                          />
                                          <span className="form-check-label" data-cy="app-create-label">
                                            Create
                                          </span>
                                        </label>
                                        <label className="form-check form-check-inline">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            onChange={() => {
                                              this.updateGroupPermission(groupPermission.id, {
                                                app_delete: !groupPermission.app_delete,
                                              });
                                            }}
                                            checked={groupPermission.app_delete}
                                            disabled={groupPermission.group === 'admin'}
                                            data-cy="app-delete-checkbox"
                                          />
                                          <span className="form-check-label" data-cy="app-delete-label">
                                            Delete
                                          </span>
                                        </label>
                                      </div>
                                    </td>
                                    <td></td>
                                  </tr>

                                  <tr>
                                    <td data-cy="resource-folders">Folders</td>
                                    <td className="text-muted">
                                      <div>
                                        <label className="form-check form-check-inline">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            onChange={() => {
                                              this.updateGroupPermission(groupPermission.id, {
                                                folder_create: !folder_permission,
                                                folder_delete: !folder_permission,
                                                folder_update: !folder_permission,
                                              });
                                            }}
                                            checked={folder_permission}
                                            disabled={groupPermission.group === 'admin'}
                                            data-cy="folder-create-checkbox"
                                          />
                                          <span className="form-check-label" data-cy="folder-create-label">
                                            Create/Update/Delete
                                          </span>
                                        </label>
                                      </div>
                                    </td>
                                    <td></td>
                                  </tr>
                                  <tr>
                                    <td>Environment variables</td>
                                    <td className="text-muted">
                                      <div>
                                        <label className="form-check form-check-inline">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            onChange={() => {
                                              this.updateGroupPermission(groupPermission.id, {
                                                org_environment_variable_create: !orgEnvironmentPermission,
                                                org_environment_variable_update: !orgEnvironmentPermission,
                                                org_environment_variable_delete: !orgEnvironmentPermission,
                                              });
                                            }}
                                            checked={orgEnvironmentPermission}
                                            disabled={groupPermission.group === 'admin'}
                                          />
                                          <span className="form-check-label">Create/Update/Delete</span>
                                        </label>
                                      </div>
                                    </td>
                                    <td></td>
                                  </tr>
                                </>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export { ManageGroupPermissionResources };
