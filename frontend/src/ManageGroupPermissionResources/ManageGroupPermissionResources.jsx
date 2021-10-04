import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { groupPermissionService } from '../_services/groupPermission.service';
import 'react-toastify/dist/ReactToastify.css';
import { Header } from '@/_components';
import { toast } from 'react-toastify';

class ManageGroupPermissionResources extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoadingGroup: true,
      isLoadingApps: true,
      isLoadingUsers: true,
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

  fetchGroupAndResources = (groupPermissionId) => {
    groupPermissionService.getGroup(groupPermissionId).then((data) => {
      this.setState({
        groupPermission: data.group_permission,
        isLoadingGroup: false,
      });

      this.fetchUsersNotInGroup(groupPermissionId);
      this.fetchUsersInGroup(groupPermissionId);

      this.fetchAppsNotInGroup(groupPermissionId);
      this.fetchAppsInGroup(groupPermissionId);
    });
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

  updateAppGroupPermission = (app, groupPermissionId, action) => {
    const appGroupPermission = app.app_group_permissions.find(
      (permission) => permission.group_permission_id == groupPermissionId
    );
    groupPermissionService
      .updateAppGroupPermission(
        groupPermissionId,
        appGroupPermission.id,
        action,
        !this.findAppGroupPermission(app, groupPermissionId, action)
      )
      .then(() => {
        toast.success('App permissions udpated', {
          hideProgressBar: true,
          position: 'top-center',
        });
      })
      .catch(({ error }) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
      });

    this.fetchAppsInGroup(groupPermissionId);
  };

  findAppGroupPermission = (app, groupPermissionId, action) => {
    const appGroupPermission = app.app_group_permissions.find(
      (permission) => permission.group_permission_id == groupPermissionId
    );

    return appGroupPermission[action];
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
    const updateParams = {
      selectedAppIds,
    };
    groupPermissionService
      .update(groupPermissionId, updateParams)
      .then(() => {
        this.setState({ selectedAppIds: [], isLoadingApps: true });
        this.fetchAppsNotInGroup(groupPermissionId);
        this.fetchAppsInGroup(groupPermissionId);
      })
      .then(() => {
        toast.success('Apps added to the group', {
          hideProgressBar: true,
          position: 'top-center',
        });
      })
      .catch(({ error }) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
      });
  };

  removeAppFromGroup = (groupPermissionId, appId) => {
    const updateParams = {
      removeAppIds: [appId],
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
          hideProgressBar: true,
          position: 'top-center',
        });
      })
      .catch(({ error }) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
      });
  };

  addSelectedUsersToGroup = (groupPermissionId, selectedUserIds) => {
    const updateParams = {
      selectedUserIds,
    };
    groupPermissionService
      .update(groupPermissionId, updateParams)
      .then(() => {
        this.setState({ selectedUserIds: [], isLoadingUsers: true });
        this.fetchUsersNotInGroup(groupPermissionId);
        this.fetchUsersInGroup(groupPermissionId);
      })
      .then(() => {
        toast.success('Users added to the group', {
          hideProgressBar: true,
          position: 'top-center',
        });
      })
      .catch(({ error }) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
      });
  };

  removeUserFromGroup = (groupPermissionId, userId) => {
    const updateParams = {
      removeUserIds: [userId],
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
          hideProgressBar: true,
          position: 'top-center',
        });
      })
      .catch(({ error }) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
      });
  };

  render() {
    const {
      isLoadingGroup,
      isLoadingApps,
      isLoadingUsers,
      appsInGroup,
      appsNotInGroup,
      usersInGroup,
      usersNotInGroup,
      groupPermission,
      currentTab,
      selectedAppIds,
      selectedUserIds,
    } = this.state;

    const appSelectOptions = appsNotInGroup.map((app) => {
      return { name: app.name, value: app.id };
    });
    const userSelectOptions = usersNotInGroup.map((user) => {
      return { name: `${user.first_name} ${user.last_name}`, value: user.id };
    });

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
                    <div>Loading...</div>
                  ) : (
                    <h2 className="page-title">{`User Group: ${groupPermission.group}`}</h2>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="page-body">
            <div className="container-xl">
              <div className="card">
                <ul className="nav nav-tabs">
                  <li className="nav-item">
                    <a
                      className={`nav-link ${currentTab == 'apps' ? 'active' : ''}`}
                      onClick={() => this.setState({ currentTab: 'apps' })}
                    >
                      Apps
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className={`nav-link ${currentTab == 'users' ? 'active' : ''}`}
                      onClick={() => this.setState({ currentTab: 'users' })}
                    >
                      Users
                    </a>
                  </li>
                </ul>
                <div className="card-body">
                  <div className="tab-content">
                    <div className={`tab-pane ${currentTab == 'apps' ? 'active show' : ''}`}>
                      <div className="row">
                        <div className="col-5">
                          <SelectSearch
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
                            className="btn btn-primary w-100"
                            onClick={() => this.addSelectedAppsToGroup(groupPermission.id, selectedAppIds)}
                          >
                            Add
                          </div>
                        </div>
                      </div>
                      <br />
                      <div>
                        {isLoadingApps ? (
                          <div>Loading..</div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-vcenter">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Permissions</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {appsInGroup.map((app) => (
                                  <tr key={app.id}>
                                    <td>{app.name}</td>
                                    <td className="text-muted">
                                      <div>
                                        <label className="form-check form-check-inline">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            onClick={() => {
                                              this.updateAppGroupPermission(app, groupPermission.id, 'read');
                                            }}
                                            defaultChecked={this.findAppGroupPermission(
                                              app,
                                              groupPermission.id,
                                              'read'
                                            )}
                                          />
                                          <span className="form-check-label">View</span>
                                        </label>
                                        <label className="form-check form-check-inline">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            onClick={() => {
                                              this.updateAppGroupPermission(app, groupPermission.id, 'update');
                                            }}
                                            checked={this.findAppGroupPermission(app, groupPermission.id, 'update')}
                                          />
                                          <span className="form-check-label">Edit</span>
                                        </label>
                                      </div>
                                    </td>
                                    <td>
                                      <a
                                        onClick={() => {
                                          this.removeAppFromGroup(groupPermission.id, app.id);
                                        }}
                                      >
                                        Delete
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`tab-pane ${currentTab == 'users' ? 'active show' : ''}`}>
                      <div className="row">
                        <div className="col-5">
                          <SelectSearch
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
                            className="btn btn-primary w-100"
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
                                <th>Name</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoadingUsers ? (
                                <div>Loading..</div>
                              ) : (
                                usersInGroup.map((user) => (
                                  <tr key={user.id}>
                                    <td>{`${user.first_name} ${user.last_name}`}</td>
                                    <td className="text-muted">
                                      <a
                                        onClick={() => {
                                          this.removeUserFromGroup(groupPermission.id, user.id);
                                        }}
                                      >
                                        Delete
                                      </a>
                                    </td>
                                  </tr>
                                ))
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
