import React from 'react';
import cx from 'classnames';
import { groupPermissionService } from '@/_services';
import { MultiSelect, FilterPreview } from '@/_components';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import { Loader } from '../ManageSSO/Loader';
import Select from '@/_ui/Select';

class ManageGroupPermissionResourcesComponent extends React.Component {
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
      removeAppIds: [],
      currentTab: 'apps',
      selectedUsers: [],
    };
  }

  componentDidMount() {
    if (this.props.groupPermissionId) this.fetchGroupAndResources(this.props.groupPermissionId);
  }

  componentDidUpdate(prevProps) {
    if (this.props.groupPermissionId && this.props.groupPermissionId !== prevProps.groupPermissionId) {
      this.fetchGroupAndResources(this.props.groupPermissionId);
    }
  }

  fetchGroupPermission = (groupPermissionId) => {
    groupPermissionService.getGroup(groupPermissionId).then((data) => {
      this.setState((prevState) => {
        return {
          groupPermission: data,
          currentTab: data?.group === 'admin' ? 'users' : prevState.currentTab,
          isLoadingGroup: false,
        };
      });
    });
  };

  fetchGroupAndResources = (groupPermissionId) => {
    this.setState({ isLoadingGroup: true });

    this.fetchGroupPermission(groupPermissionId);
    this.fetchUsersInGroup(groupPermissionId);
    this.fetchAppsNotInGroup(groupPermissionId);
    this.fetchAppsInGroup(groupPermissionId);
  };

  userFullName = (user) => {
    return `${user?.first_name} ${user?.last_name ?? ''}`;
  };

  searchUsersNotInGroup = async (query, groupPermissionId) => {
    if (!query) {
      return [];
    }
    return new Promise((resolve, reject) => {
      groupPermissionService
        .getUsersNotInGroup(query, groupPermissionId)
        .then(({ users }) => {
          resolve(
            users.map((user) => {
              return {
                name: `${this.userFullName(user)} (${user.email})`,
                value: user.id,
              };
            })
          );
        })
        .catch(reject);
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
        toast.success('Group permissions updated');

        this.fetchGroupPermission(groupPermissionId);
      })
      .catch(({ error }) => {
        toast.error(error);
      });
  };

  updateAppGroupPermission = (app, groupPermissionId, action) => {
    const appGroupPermission = app.app_group_permissions.find(
      (permission) => permission.group_permission_id === groupPermissionId
    );

    let actionParams = {
      read: true,
      update: action === 'edit',
    };

    if (action === 'readOnDashboard') {
      actionParams['readOnDashboard'] = !this.canAppGroupPermission(app, groupPermissionId, 'readOnDashboard');
    }

    if (action === 'edit') actionParams['readOnDashboard'] = false;

    groupPermissionService
      .updateAppGroupPermission(groupPermissionId, appGroupPermission.id, actionParams)
      .then(() => {
        toast.success('App permissions updated');

        this.fetchAppsInGroup(groupPermissionId);
      })
      .catch(({ error }) => {
        toast.error(error);
      });
  };

  canAppGroupPermission = (app, groupPermissionId, action) => {
    let appGroupPermission = this.findAppGroupPermission(app, groupPermissionId);
    switch (action) {
      case 'edit':
        return appGroupPermission?.read && appGroupPermission?.update;
      case 'view':
        return appGroupPermission?.read && !appGroupPermission?.update;
      case 'readOnDashboard':
        return appGroupPermission?.read && appGroupPermission?.read_on_dashboard;
      default:
        return false;
    }
  };

  findAppGroupPermission = (app, groupPermissionId) => {
    return app.app_group_permissions.find((permission) => permission.group_permission_id === groupPermissionId);
  };

  setSelectedUsers = (value) => {
    this.setState({
      selectedUsers: value,
    });
  };

  setSelectedApps = (value) => {
    this.setState({
      selectedAppIds: value,
    });
  };

  addSelectedAppsToGroup = (groupPermissionId) => {
    this.setState({ isAddingApps: true });
    const updateParams = {
      add_apps: this.state.selectedAppIds.map((app) => app.value),
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
        toast.success('Apps added to the group');
      })
      .catch(({ error }) => {
        toast.error(error);
      });
  };

  removeAppFromGroup = (groupPermissionId, appId, appName) => {
    if (window.confirm(`Are you sure you want to delete this app - ${appName}?`) === false) return;
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
        toast.success('App removed from the group');
      })
      .catch(({ error }) => {
        toast.error(error);
      });
  };

  addSelectedUsersToGroup = (groupPermissionId, selectedUsers) => {
    this.setState({ isAddingUsers: true });
    const updateParams = {
      add_users: selectedUsers.map((user) => user.value),
    };
    groupPermissionService
      .update(groupPermissionId, updateParams)
      .then(() => {
        this.setState({
          selectedUsers: [],
          isLoadingUsers: true,
          isAddingUsers: false,
        });
        this.fetchUsersInGroup(groupPermissionId);
      })
      .then(() => {
        toast.success('Users added to the group');
      })
      .catch(({ error }) => {
        toast.error(error);
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
        this.fetchUsersInGroup(groupPermissionId);
      })
      .then(() => {
        toast.success('User removed from the group');
      })
      .catch(({ error }) => {
        toast.error(error);
      });
  };

  removeSelection = (selected, value) => {
    const updatedData = selected.filter((d) => d.value !== value);
    this.setSelectedUsers([...updatedData]);
  };

  generateSelection = (selected) => {
    return selected?.map((d) => {
      return (
        <div className="selected-item tj-ms" key={d.value}>
          <FilterPreview text={d.name} onClose={() => this.removeSelection(selected, d.value)} />
        </div>
      );
    });
  };

  render() {
    if (!this.props.groupPermissionId) return null;

    const {
      isLoadingGroup,
      isLoadingApps,
      isAddingApps,
      isLoadingUsers,
      isAddingUsers,
      appsInGroup,
      appsNotInGroup,
      usersInGroup,
      groupPermission,
      currentTab,
      selectedAppIds,
      selectedUsers,
    } = this.state;

    const folder_permission = groupPermission
      ? groupPermission.folder_create && groupPermission.folder_delete && groupPermission.folder_update
      : false;

    const appSelectOptions = appsNotInGroup.map((app) => {
      return { name: app.name, value: app.id };
    });

    const orgEnvironmentPermission = groupPermission
      ? groupPermission.org_environment_variable_create &&
        groupPermission.org_environment_variable_update &&
        groupPermission.org_environment_variable_delete
      : false;

    return (
      <ErrorBoundary showFallback={false}>
        <div className="wrapper org-users-page animation-fade">
          {isLoadingGroup ? (
            <Loader />
          ) : (
            <div className="card">
              <nav className="nav nav-tabs">
                {groupPermission?.group !== 'admin' && (
                  <a
                    onClick={() => this.setState({ currentTab: 'apps' })}
                    className={cx('nav-item nav-link', { active: currentTab === 'apps' })}
                    data-cy="apps-link"
                  >
                    {this.props.t('header.organization.menus.manageGroups.permissionResources.apps', 'Apps')}
                  </a>
                )}
                <a
                  onClick={() => this.setState({ currentTab: 'users' })}
                  className={cx('nav-item nav-link', { active: currentTab === 'users' })}
                  data-cy="users-link"
                >
                  {this.props.t('header.organization.menus.manageGroups.permissionResources.users', 'Users')}
                </a>
                <a
                  onClick={() => this.setState({ currentTab: 'permissions' })}
                  className={cx('nav-item nav-link', { active: currentTab === 'permissions' })}
                  data-cy="permissions-link"
                >
                  {this.props.t(
                    'header.organization.menus.manageGroups.permissionResources.permissions',
                    'Permissions'
                  )}
                </a>
              </nav>
              <div className="card-body">
                <div className="tab-content">
                  {/* Apps Tab */}
                  <div className={`tab-pane ${currentTab === 'apps' ? 'active show' : ''}`}>
                    {groupPermission?.group !== 'admin' && (
                      <div className="row">
                        <div className="col-11" data-cy="select-search">
                          <Select
                            isMulti
                            closeMenuOnSelect={false}
                            width={'100%'}
                            options={appSelectOptions}
                            value={selectedAppIds}
                            onChange={this.setSelectedApps}
                            placeholder={this.props.t(
                              'header.organization.menus.manageGroups.permissionResources.addAppsToGroup',
                              'Select apps to add to the group'
                            )}
                          />
                        </div>
                        <div className="col-1">
                          <div
                            className={`btn btn-primary w-100 ${isAddingApps ? 'btn-loading' : ''} ${
                              selectedAppIds.length === 0 ? 'disabled' : ''
                            }`}
                            onClick={() => this.addSelectedAppsToGroup(groupPermission.id)}
                            data-cy="add-button"
                          >
                            {this.props.t('globals.add', 'Add')}
                          </div>
                        </div>
                      </div>
                    )}
                    <br />
                    <div>
                      <div className="table-responsive">
                        <table className="table table-vcenter">
                          <thead>
                            <tr>
                              <th data-cy="name-header">
                                {this.props.t(
                                  'header.organization.menus.manageGroups.permissionResources.name',
                                  'Name'
                                )}
                              </th>
                              <th data-cy="permissions-header">
                                {this.props.t(
                                  'header.organization.menus.manageGroups.permissionResources.permissions',
                                  'Permissions'
                                )}
                              </th>
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
                                        <span className="form-check-label">{this.props.t('globals.view', 'view')}</span>
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
                                        <span className="form-check-label">{this.props.t('globals.edit', 'Edit')}</span>
                                      </label>
                                    </div>
                                    {this.canAppGroupPermission(app, groupPermission.id, 'view') && (
                                      <div>
                                        <label className="form-check form-check-inline">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            onChange={() => {
                                              this.updateAppGroupPermission(app, groupPermission.id, 'readOnDashboard');
                                            }}
                                            disabled={groupPermission.group === 'admin'}
                                            checked={this.canAppGroupPermission(
                                              app,
                                              groupPermission.id,
                                              'readOnDashboard'
                                            )}
                                          />
                                          <span className="form-check-label">Hide from dashboard</span>
                                        </label>
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    {groupPermission.group !== 'admin' && (
                                      <Link
                                        to="#"
                                        onClick={() => {
                                          this.removeAppFromGroup(groupPermission.id, app.id, app.name);
                                        }}
                                        className="text-danger"
                                        data-cy="delete-link"
                                      >
                                        {this.props.t('globals.delete', 'Delete')}
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
                    {groupPermission?.group !== 'all_users' && (
                      <div className="row">
                        <div className="col-6">
                          <MultiSelect
                            className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
                            onSelect={this.setSelectedUsers}
                            onSearch={(query) => this.searchUsersNotInGroup(query, groupPermission.id)}
                            selectedValues={selectedUsers}
                            onReset={() => this.setSelectedUsers([])}
                            placeholder="Select users to add to the group"
                            searchLabel="Enter name or email"
                          />
                        </div>
                        <div className="col-auto">
                          <div
                            className={`btn btn-primary w-100 ${isAddingUsers ? 'btn-loading' : ''} ${
                              selectedUsers.length === 0 ? 'disabled' : ''
                            }`}
                            onClick={() => this.addSelectedUsersToGroup(groupPermission.id, selectedUsers)}
                          >
                            {this.props.t('globals.add', 'Add')}
                          </div>
                        </div>
                        <div className="row mt-2">
                          <div className="selected-section">
                            <div className="selected-text">Selected Users:</div>
                            {this.generateSelection(selectedUsers)}
                          </div>
                        </div>
                      </div>
                    )}
                    <br />
                    <div>
                      <div className="table-responsive">
                        <table className="table table-vcenter">
                          <thead>
                            <tr>
                              <th data-cy="name-header">
                                {this.props.t(
                                  'header.organization.menus.manageGroups.permissionResources.name',
                                  'name'
                                )}
                              </th>
                              <th data-cy="email-header">
                                {this.props.t(
                                  'header.organization.menus.manageGroups.permissionResources.email',
                                  'email'
                                )}
                              </th>
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
                                  <td>{`${user?.first_name ?? ''} ${user?.last_name ?? ''}`}</td>
                                  <td>{user.email}</td>
                                  <td>
                                    {groupPermission.group !== 'all_users' && (
                                      <Link
                                        to="#"
                                        onClick={() => {
                                          this.removeUserFromGroup(groupPermission.id, user.id);
                                        }}
                                      >
                                        {this.props.t('globals.delete', 'Delete')}
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
                              <th data-cy="resource-header">
                                {this.props.t(
                                  'header.organization.menus.manageGroups.permissionResources.resource',
                                  'Resource'
                                )}
                              </th>
                              <th data-cy="permissions-header">
                                {this.props.t(
                                  'header.organization.menus.manageGroups.permissionResources.permissions',
                                  'Permissions'
                                )}
                              </th>
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
                                  <td data-cy="resource-apps">
                                    {this.props.t(
                                      'header.organization.menus.manageGroups.permissionResources.apps',
                                      'Apps'
                                    )}
                                  </td>
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
                                          {this.props.t('globals.create', 'Create')}
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
                                          {this.props.t('globals.delete', 'Delete')}
                                        </span>
                                      </label>
                                    </div>
                                  </td>
                                  <td></td>
                                </tr>

                                <tr>
                                  <td data-cy="resource-folders">
                                    {this.props.t(
                                      'header.organization.menus.manageGroups.permissionResources.folder',
                                      'Folder'
                                    )}
                                  </td>
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
                                          {this.props.t(
                                            'header.organization.menus.manageGroups.permissionResources.createUpdateDelete',
                                            'Create/Update/Delete'
                                          )}
                                        </span>
                                      </label>
                                    </div>
                                  </td>
                                  <td></td>
                                </tr>
                                <tr>
                                  <td>{this.props.t('globals.environmentVar', 'Environment variables')}</td>
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
                                        <span className="form-check-label">
                                          {this.props.t(
                                            'header.organization.menus.manageGroups.permissionResources.createUpdateDelete',
                                            'Create/Update/Delete'
                                          )}
                                        </span>
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
          )}
        </div>
      </ErrorBoundary>
    );
  }
}

export const ManageGroupPermissionResources = withTranslation()(ManageGroupPermissionResourcesComponent);
