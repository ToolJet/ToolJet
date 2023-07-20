import React from 'react';
import cx from 'classnames';
import { groupPermissionService, userService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import { Loader } from '../ManageSSO/Loader';
import SolidIcon from '@/_ui/Icon/solidIcons/index';
import BulkIcon from '@/_ui/Icon/bulkIcons/index';
import Multiselect from '@/_ui/Multiselect/Multiselect';
import { FilterPreview, MultiSelectUser } from '@/_components';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { LicenseBanner } from '@/LicenseBanner';

class ManageGroupPermissionResourcesComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoadingGroup: true,
      isLoadingApps: true,
      isLoadingDataSources: true,
      isAddingApps: false,
      isLoadingUsers: true,
      isAddingUsers: false,
      isAddingDataSources: false,
      groupPermission: null,
      usersInGroup: [],
      appsInGroup: [],
      dataSourcesInGroup: [],
      usersNotInGroup: [],
      appsNotInGroup: [],
      dataSourcesNotInGroup: [],
      selectedAppIds: [],
      selectedDataSourceIds: [],
      removeAppIds: [],
      removeDataSourceIds: [],
      currentTab: 'apps',
      selectedUsers: [],
      editorLimits: {},
    };
  }

  componentDidMount() {
    this.fetchEditorLimits();
    if (this.props.groupPermissionId) this.fetchGroupAndResources(this.props.groupPermissionId);
  }

  componentDidUpdate(prevProps) {
    if (this.props.groupPermissionId && this.props.groupPermissionId !== prevProps.groupPermissionId) {
      this.fetchGroupAndResources(this.props.groupPermissionId);
    }
  }

  fetchEditorLimits = () => {
    userService.getUserLimits('editor').then((data) => {
      this.setState({
        editorLimits: data,
      });
    });
  };

  fetchGroupPermission = (groupPermissionId) => {
    groupPermissionService.getGroup(groupPermissionId).then((data) => {
      this.setState((prevState) => {
        return {
          groupPermission: data,
          currentTab: prevState.currentTab,
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
    this.fetchDataSourcesInGroup(groupPermissionId);
    this.fetchDataSourcesNotInGroup(groupPermissionId);
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
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
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

  fetchDataSourcesInGroup = (groupPermissionId) => {
    groupPermissionService.getDataSourcesInGroup(groupPermissionId).then((data) => {
      this.setState({
        dataSourcesInGroup: data.data_sources,
        isLoadingDataSources: false,
      });
    });
  };

  fetchDataSourcesNotInGroup = (groupPermissionId) => {
    groupPermissionService.getDataSourcesNotInGroup(groupPermissionId).then((data) => {
      this.setState({
        dataSourcesNotInGroup: data.data_sources,
      });
    });
  };

  updateGroupPermission = (groupPermissionId, params) => {
    groupPermissionService
      .update(groupPermissionId, params)
      .then(() => {
        this.fetchEditorLimits();
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

    if (action === 'hideFromDashboard') {
      actionParams['hideFromDashboard'] = !this.canAppGroupPermission(app, groupPermissionId, 'hideFromDashboard');
    }

    if (action === 'edit') actionParams['hideFromDashboard'] = false;

    groupPermissionService
      .updateAppGroupPermission(groupPermissionId, appGroupPermission.id, actionParams)
      .then(() => {
        toast.success('App permissions updated');

        this.fetchAppsInGroup(groupPermissionId);
        this.fetchEditorLimits();
      })
      .catch(({ error, data }) => {
        const { statusCode } = data;
        if ([451].indexOf(statusCode) === -1) {
          toast.error(error);
        }
      });
  };

  canAppGroupPermission = (app, groupPermissionId, action) => {
    let appGroupPermission = this.findAppGroupPermission(app, groupPermissionId);
    switch (action) {
      case 'edit':
        return appGroupPermission?.read && appGroupPermission?.update;
      case 'view':
        return appGroupPermission?.read && !appGroupPermission?.update;
      case 'hideFromDashboard':
        return appGroupPermission?.read && appGroupPermission?.read_on_dashboard;
      default:
        return false;
    }
  };

  updateDataSourceGroupPermission = (dataSource, groupPermissionId, action) => {
    const dataSourceGroupPermission = dataSource.data_source_group_permissions.find(
      (permission) => permission.group_permission_id === groupPermissionId
    );

    let actionParams = {
      read: true,
      update: action === 'edit',
    };

    // if (action === 'hideFromDashboard') {
    //   actionParams['hideFromDashboard'] = !this.canAppGroupPermission(app, groupPermissionId, 'hideFromDashboard');
    // }

    // if (action === 'edit') actionParams['hideFromDashboard'] = false;

    groupPermissionService
      .updateDataSourceGroupPermission(groupPermissionId, dataSourceGroupPermission.id, actionParams)
      .then(() => {
        toast.success('Datasource permissions updated');

        this.fetchDataSourcesInGroup(groupPermissionId);
      })
      .catch(({ error }) => {
        toast.error(error);
      });
  };

  canDataSourceGroupPermission = (dataSource, groupPermissionId, action) => {
    let dataSourceGroupPermission = this.findDataSourceGroupPermission(dataSource, groupPermissionId);
    switch (action) {
      case 'edit':
        return dataSourceGroupPermission?.read && dataSourceGroupPermission?.update;
      case 'view':
        return dataSourceGroupPermission?.read && !dataSourceGroupPermission?.update;
      default:
        return false;
    }
  };

  findAppGroupPermission = (app, groupPermissionId) => {
    return app.app_group_permissions.find((permission) => permission.group_permission_id === groupPermissionId);
  };

  findDataSourceGroupPermission = (dataSource, groupPermissionId) => {
    return dataSource.data_source_group_permissions.find(
      (permission) => permission.group_permission_id === groupPermissionId
    );
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

  setSelectedDataSources = (value) => {
    this.setState({
      selectedDataSourceIds: value,
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
        this.setState({
          selectedApps: [],
        });
      })
      .catch(({ error }) => {
        toast.error(error);
        this.setState({
          isAddingApps: false,
        });
      });
  };

  addSelectedDataSourcesToGroup = (groupPermissionId) => {
    this.setState({ isAddingDataSources: true });
    const updateParams = {
      add_data_sources: this.state.selectedDataSourceIds.map((dataSource) => dataSource.value),
    };
    groupPermissionService
      .update(groupPermissionId, updateParams)
      .then(() => {
        this.setState({
          selectedDataSourceIds: [],
          isLoadingDataSources: true,
          isAddingDataSources: false,
        });
        this.fetchDataSourcesNotInGroup(groupPermissionId);
        this.fetchDataSourcesInGroup(groupPermissionId);
      })
      .then(() => {
        toast.success('Datasources added to the group');
      })
      .catch(({ error }) => {
        toast.error(error);
        this.setState({
          isAddingDataSources: false,
        });
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

  removeDataSourcesFromGroup = (groupPermissionId, dataSourceId, dataSourceName) => {
    if (window.confirm(`Are you sure you want to delete this datasource - ${dataSourceName}?`) === false) return;
    const updateParams = {
      remove_data_sources: [dataSourceId],
    };
    groupPermissionService
      .update(groupPermissionId, updateParams)
      .then(() => {
        this.setState({ removeDataSourceIds: [], isLoadingDataSources: true });
        this.fetchDataSourcesNotInGroup(groupPermissionId);
        this.fetchDataSourcesInGroup(groupPermissionId);
      })
      .then(() => {
        toast.success('DataSource removed from the group');
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
      .catch(() => {
        this.setState({
          isAddingUsers: false,
        });
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
      isLoadingDataSources,
      isAddingApps,
      isLoadingUsers,
      isAddingUsers,
      isAddingDataSources,
      appsInGroup,
      appsNotInGroup,
      dataSourcesInGroup,
      dataSourcesNotInGroup,
      usersInGroup,
      groupPermission,
      currentTab,
      selectedAppIds,
      selectedDataSourceIds,
      selectedUsers,
      editorLimits,
    } = this.state;

    const searchSelectClass = this.props.darkMode ? 'select-search-dark' : 'select-search';

    const folder_permission = groupPermission
      ? groupPermission.folder_create && groupPermission.folder_delete && groupPermission.folder_update
      : false;

    const appSelectOptions = appsNotInGroup.map((app) => {
      return { name: app.name, value: app.id };
    });

    const dataSourceSelectOptions = dataSourcesNotInGroup.map((dataSource) => {
      return { name: dataSource.name, value: dataSource.id };
    });

    const orgEnvironmentPermission = groupPermission
      ? groupPermission.org_environment_variable_create &&
        groupPermission.org_environment_variable_update &&
        groupPermission.org_environment_variable_delete
      : false;

    return (
      <ErrorBoundary showFallback={false}>
        <div className="org-users-page animation-fade">
          {isLoadingGroup ? (
            <Loader />
          ) : (
            <div>
              <div className="justify-content-between d-flex groups-main-header-wrap">
                <p
                  className="font-weight-500 tj-text-md"
                  data-cy={`${this.props.selectedGroup.toLowerCase().replace(/\s+/g, '-')}-title`}
                >
                  {this.props.selectedGroup}
                </p>
                {(groupPermission.group == 'admin' || groupPermission.group == 'all_users') && (
                  <div className="default-group-wrap">
                    <SolidIcon name="information" fill="#46A758" width="13" />
                    <p className="font-weight-500 tj-text-xsm" data-cy="text-default-group">
                      Default group
                    </p>
                  </div>
                )}
                {groupPermission.group !== 'admin' && groupPermission.group !== 'all_users' && (
                  <div className="user-group-actions">
                    <Link
                      onClick={() => this.props.updateGroupName(groupPermission)}
                      data-cy={`${String(groupPermission.group)
                        .toLowerCase()
                        .replace(/\s+/g, '-')}-group-name-update-link`}
                      className="tj-text-xsm font-weight-500 edit-group"
                    >
                      <SolidIcon fill="#28303F" name="editrectangle" width="14" />
                      Edit name
                    </Link>
                    <Link
                      className="delete-group tj-text-xsm font-weight-500"
                      onClick={() => this.props.deleteGroup(groupPermission.id)}
                      data-cy={`${String(groupPermission.group).toLowerCase().replace(/\s+/g, '-')}-group-delete-link`}
                    >
                      <SolidIcon fill="#E54D2E" name="trash" width="14" /> Delete group
                    </Link>
                  </div>
                )}
              </div>

              <nav className="nav nav-tabs groups-sub-header-wrap">
                <a
                  onClick={() => this.setState({ currentTab: 'apps' })}
                  className={cx('nav-item nav-link', { active: currentTab === 'apps' })}
                  data-cy="apps-link"
                >
                  <SolidIcon
                    className="manage-group-tab-icons"
                    fill={currentTab === 'apps' ? '#3E63DD' : '#C1C8CD'}
                    name="grid"
                    width="16"
                  ></SolidIcon>
                  {this.props.t('header.organization.menus.manageGroups.permissionResources.apps', 'Apps')}
                </a>
                <a
                  onClick={() => this.setState({ currentTab: 'users' })}
                  className={cx('nav-item nav-link', { active: currentTab === 'users' })}
                  data-cy="users-link"
                >
                  <SolidIcon
                    name="usergroup"
                    fill={currentTab === 'users' ? '#3E63DD' : '#C1C8CD'}
                    className="manage-group-tab-icons"
                    width="16"
                  ></SolidIcon>

                  {this.props.t('header.organization.menus.manageGroups.permissionResources.users', 'Users')}
                </a>
                <a
                  onClick={() => this.setState({ currentTab: 'permissions' })}
                  className={cx('nav-item nav-link', { active: currentTab === 'permissions' })}
                  data-cy="permissions-link"
                >
                  <SolidIcon
                    className="manage-group-tab-icons"
                    fill={currentTab === 'permissions' ? '#3E63DD' : '#C1C8CD'}
                    name="lock"
                    width="16"
                  ></SolidIcon>

                  {this.props.t(
                    'header.organization.menus.manageGroups.permissionResources.permissions',
                    'Permissions'
                  )}
                </a>
                {groupPermission?.group !== 'admin' && (
                  <a
                    onClick={() => this.setState({ currentTab: 'datasources' })}
                    className={cx('nav-item nav-link', { active: currentTab === 'datasources' })}
                    data-cy="datasource-link"
                  >
                    <SolidIcon
                      className="manage-group-tab-icons"
                      fill={currentTab === 'permissions' ? '#3E63DD' : '#C1C8CD'}
                      name="datasource"
                      width="16"
                    ></SolidIcon>
                    Datasources
                  </a>
                )}
              </nav>

              <div className="manage-groups-body">
                <div className="tab-content">
                  {/* Apps Tab */}
                  <div className={`tab-pane ${currentTab === 'apps' ? 'active show' : ''}`}>
                    {groupPermission?.group !== 'admin' && (
                      <div className="row">
                        <div className="manage-groups-app-dropdown" data-cy="select-search">
                          <Multiselect
                            onChange={this.setSelectedApps}
                            options={appSelectOptions}
                            overrideStrings={{
                              selectSomeItems: this.props.t(
                                'header.organization.menus.manageGroups.permissionResources.addAppsToGroup',
                                'Select apps to add to the group'
                              ),
                            }}
                            setState={this.setState}
                            value={this.state.selectedAppIds}
                          />
                        </div>

                        <div className="col-1">
                          <ButtonSolid
                            className="add-apps-btn"
                            leftIcon="plus"
                            onClick={() => this.addSelectedAppsToGroup(groupPermission.id)}
                            data-cy="add-button"
                            disabled={selectedAppIds?.length == 0}
                            iconWidth="16"
                            fill={selectedAppIds.length != 0 ? '#FDFDFE' : this.props.darkMode ? '#4C5155' : '#C1C8CD'}
                            isLoading={isAddingApps}
                          >
                            Add apps
                          </ButtonSolid>
                        </div>
                      </div>
                    )}
                    <br />
                    <div>
                      <div className="table-responsive">
                        <table>
                          {groupPermission.group == 'admin' && (
                            <div className="manage-group-users-info">
                              <p className="tj-text-xsm" data-cy="helper-text-admin-app-access">
                                <SolidIcon name="information" fill="#3E63DD" /> Admin has edit access to all apps. These
                                are not editable
                              </p>
                            </div>
                          )}
                          <div className="groups-app-body-header d-flex">
                            <p className="font-weight-500 tj-text-xsm" data-cy="name-header">
                              App name
                            </p>
                            <p className="font-weight-500 tj-text-xsm" data-cy="permissions-header">
                              Permissions
                            </p>
                          </div>
                          <tbody className="manage-group-app-table-body">
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
                              <>
                                {appsInGroup?.length > 0 ? (
                                  appsInGroup.map((app) => (
                                    <tr
                                      key={app.id}
                                      className="apps-table-row"
                                      data-cy={`${app.name.toLowerCase().replace(/\s+/g, '-')}-app-permission-data`}
                                    >
                                      <td className="font-weight-500" data-cy="selected-app-name">
                                        {app.name}
                                      </td>
                                      <td className="text-secondary d-flex">
                                        <div className="apps-view-edit-wrap">
                                          <label className="form-check form-check-inline">
                                            <input
                                              className="form-check-input"
                                              type="radio"
                                              onChange={() => {
                                                this.updateAppGroupPermission(app, groupPermission.id, 'view');
                                              }}
                                              disabled={groupPermission.group === 'admin'}
                                              checked={this.canAppGroupPermission(app, groupPermission.id, 'view')}
                                              data-cy="checkbox-view-app"
                                            />
                                            <span className="form-check-label" data-cy="label-app-view">
                                              {this.props.t('globals.view', 'view')}
                                            </span>
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
                                              data-cy="checkbox-app-edit"
                                            />
                                            <span className="form-check-label" data-cy="label-app-edit">
                                              {this.props.t('globals.edit', 'Edit')}
                                            </span>
                                          </label>
                                        </div>
                                        <div>
                                          <label className="form-check form-check-inline">
                                            <input
                                              className={`form-check-input ${
                                                this.canAppGroupPermission(app, groupPermission.id, 'edit') &&
                                                'faded-input'
                                              }`}
                                              type="checkbox"
                                              onChange={() => {
                                                this.updateAppGroupPermission(
                                                  app,
                                                  groupPermission.id,
                                                  'hideFromDashboard'
                                                );
                                              }}
                                              disabled={
                                                groupPermission.group === 'admin' ||
                                                this.canAppGroupPermission(app, groupPermission.id, 'edit')
                                              }
                                              checked={this.canAppGroupPermission(
                                                app,
                                                groupPermission.id,
                                                'hideFromDashboard'
                                              )}
                                              data-cy="checkbox-hide-from-dashboard"
                                            />
                                            <span
                                              className={`form-check-label ${
                                                this.canAppGroupPermission(app, groupPermission.id, 'edit') &&
                                                'faded-text'
                                              }`}
                                              data-cy="label-hide-from-dashboard"
                                            >
                                              Hide from dashboard
                                            </span>
                                          </label>
                                        </div>
                                      </td>
                                      <td>
                                        {groupPermission.group !== 'admin' && (
                                          <Link
                                            to="#"
                                            onClick={() => {
                                              this.removeAppFromGroup(groupPermission.id, app.id, app.name);
                                            }}
                                            className="delete-link"
                                          >
                                            <ButtonSolid
                                              className="tj-text-xsm font-weight-600 remove-decoration  apps-remove-btn"
                                              variant="dangerSecondary"
                                              leftIcon="trash"
                                              iconWidth="14"
                                              fill={'#E54D2E'}
                                              data-cy={`${app.name.toLowerCase().replace(/\s+/g, '-')}-remove-button`}
                                            >
                                              Remove
                                            </ButtonSolid>
                                          </Link>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <div className="manage-groups-no-apps-wrap">
                                    <div className="manage-groups-no-apps-icon">
                                      <BulkIcon name="apps" fill="#3E63DD" width="28" />
                                    </div>
                                    <p className="tj-text-md font-weight-500" data-cy="helper-text-no-apps-added">
                                      No apps are added to the group
                                    </p>
                                    <span
                                      className="tj-text-sm text-center"
                                      data-cy="helper-text-user-groups-permissions"
                                    >
                                      Add app to the group to control permissions
                                      <br /> for users in this group
                                    </span>
                                  </div>
                                )}
                              </>
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
                        <div className="col" data-cy="multi-select-search">
                          <MultiSelectUser
                            className={{
                              container: searchSelectClass,
                              value: `${searchSelectClass}__value`,
                              input: `${searchSelectClass}__input`,
                              select: `${searchSelectClass}__select`,
                              options: `${searchSelectClass}__options`,
                              row: `${searchSelectClass}__row`,
                              option: `${searchSelectClass}__option`,
                              group: `${searchSelectClass}__group`,
                              'group-header': `${searchSelectClass}__group-header`,
                              'is-selected': 'is-selected',
                              'is-highlighted': 'is-highlighted',
                              'is-loading': 'is-loading',
                              'is-multiple': 'is-multiple',
                              'has-focus': 'has-focus',
                              'not-found': `${searchSelectClass}__not-found`,
                            }}
                            onSelect={this.setSelectedUsers}
                            onSearch={(query) => this.searchUsersNotInGroup(query, groupPermission.id)}
                            selectedValues={selectedUsers}
                            onReset={() => this.setSelectedUsers([])}
                            placeholder="Select users to add to the group"
                            searchLabel="Enter name or email"
                          />
                        </div>
                        <div className="col-auto">
                          <ButtonSolid
                            onClick={() => this.addSelectedUsersToGroup(groupPermission.id, selectedUsers)}
                            disabled={selectedUsers.length === 0}
                            leftIcon="plus"
                            fill={selectedUsers.length !== 0 ? '#3E63DD' : this.props.darkMode ? '#131620' : '#C1C8CD'}
                            iconWidth="16"
                            className="add-users-button"
                            isLoading={isAddingUsers}
                            data-cy={`${String(groupPermission.group)
                              .toLowerCase()
                              .replace(/\s+/g, '-')}-group-add-button`}
                          >
                            Add users
                          </ButtonSolid>
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
                      {groupPermission.group == 'all_users' && (
                        <div className="manage-group-users-info" data-cy="helper-text-all-user-included">
                          <p className="tj-text-xsm">
                            <SolidIcon name="information" fill="#3E63DD" /> All users include every users in the app.
                            This list is not editable
                          </p>
                        </div>
                      )}
                      <div className="manage-group-table-head">
                        <p className="tj-text-xsm" data-cy="name-header">
                          User name
                        </p>
                        <p className="tj-text-xsm" data-cy="email-header">
                          Email id
                        </p>
                        <p></p> {/* DO NOT REMOVE FOR TABLE ALIGNMENT  */}
                      </div>
                      <section>
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
                            <div key={user.id} className="manage-group-users-row">
                              <p className="tj-text-sm d-flex align-items-center">
                                <div className="name-avatar">
                                  {`${user?.first_name?.[0] ?? ''} ${user?.last_name?.[0] ?? ''}`}
                                </div>
                                <span>{`${user?.first_name ?? ''} ${user?.last_name ?? ''}`}</span>
                              </p>
                              <p className="tj-text-sm" style={{ paddingLeft: '8px' }}>
                                <span> {user.email}</span>
                              </p>
                              <p>
                                {groupPermission.group !== 'all_users' && (
                                  <Link to="#" className="remove-decoration">
                                    <ButtonSolid
                                      variant="dangerSecondary"
                                      className="apps-remove-btn remove-decoration tj-text-xsm font-weight-600"
                                      onClick={() => {
                                        this.removeUserFromGroup(groupPermission.id, user.id);
                                      }}
                                    >
                                      {this.props.t('globals.delete', 'Delete')}
                                    </ButtonSolid>
                                  </Link>
                                )}
                              </p>
                            </div>
                          ))
                        )}
                      </section>
                    </div>
                  </div>

                  {/* Permissions Tab */}

                  <aside className={`tab-pane ${currentTab === 'permissions' ? 'active show' : ''}`}>
                    <div>
                      <div>
                        <div>
                          {groupPermission.group == 'admin' && (
                            <div className="manage-group-users-info">
                              <p className="tj-text-xsm" data-cy="helper-text-admin-permissions">
                                <SolidIcon name="information" fill="#3E63DD" /> Admin has all permissions
                              </p>
                            </div>
                          )}
                          <div className="manage-group-permision-header">
                            <p data-cy="resource-header" className="tj-text-xsm">
                              {this.props.t(
                                'header.organization.menus.manageGroups.permissionResources.resource',
                                'Resource'
                              )}
                            </p>
                            <p data-cy="permissions-header" className="tj-text-xsm">
                              {this.props.t(
                                'header.organization.menus.manageGroups.permissionResources.permissions',
                                'Permissions'
                              )}
                            </p>
                          </div>
                          <div className="permission-body">
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
                                <div className="manage-groups-permission-apps">
                                  <div data-cy="resource-apps">
                                    {this.props.t(
                                      'header.organization.menus.manageGroups.permissionResources.apps',
                                      'Apps'
                                    )}
                                  </div>
                                  <div className="text-muted">
                                    <div className="d-flex apps-permission-wrap flex-column">
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
                                  </div>
                                </div>

                                <div className="apps-folder-permission-wrap">
                                  <div data-cy="resource-folders">
                                    {this.props.t(
                                      'header.organization.menus.manageGroups.permissionResources.folder',
                                      'Folder'
                                    )}
                                  </div>
                                  <div className="text-muted">
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
                                  </div>
                                </div>
                                <div className="apps-variable-permission-wrap">
                                  <div data-cy="resource-workspace-variable">
                                    {this.props.t('globals.environmentVar', 'Environment variables')}
                                  </div>
                                  <div className="text-muted">
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
                                          data-cy="env-variable-checkbox"
                                        />
                                        <span className="form-check-label" data-cy="workspace-variable-create-label">
                                          {this.props.t(
                                            'header.organization.menus.manageGroups.permissionResources.createUpdateDelete',
                                            'Create/Update/Delete'
                                          )}
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                                <div className="datasource-permissions-wrap">
                                  <div data-cy="resource-datasources">Datasources</div>
                                  <div className="text-muted">
                                    <div className="d-flex apps-permission-wrap flex-column">
                                      <label className="form-check form-check-inline">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          onChange={() => {
                                            this.updateGroupPermission(groupPermission.id, {
                                              data_source_create: !groupPermission.data_source_create,
                                            });
                                          }}
                                          checked={groupPermission.data_source_create}
                                          disabled={groupPermission.group === 'admin'}
                                          data-cy="checkbox-create-ds"
                                        />
                                        <span className="form-check-label" data-cy="ds-create-label">
                                          {this.props.t('globals.create', 'Create')}
                                        </span>
                                      </label>
                                      <label className="form-check form-check-inline">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          onChange={() => {
                                            this.updateGroupPermission(groupPermission.id, {
                                              data_source_delete: !groupPermission.data_source_delete,
                                            });
                                          }}
                                          checked={groupPermission.data_source_delete}
                                          disabled={groupPermission.group === 'admin'}
                                          data-cy="checkbox-delete-ds"
                                        />

                                        <span className="form-check-label" data-cy="ds-delete-label">
                                          {this.props.t('globals.delete', 'Delete')}
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>
                  {/* Global Datasources Tab */}
                  <div className={`tab-pane ${currentTab === 'datasources' ? 'active show' : ''}`}>
                    {groupPermission?.group !== 'admin' && (
                      <div className="row">
                        <div className="manage-groups-datasource-dropdown" data-cy="datasource-select-search">
                          <Multiselect
                            value={selectedDataSourceIds}
                            onChange={this.setSelectedDataSources}
                            options={dataSourceSelectOptions}
                            overrideStrings={{
                              selectSomeItems: 'Select Datasources to add to the group',
                            }}
                            setState={this.setState}
                            selectedData={this.state.selectedDataSourceIds}
                          />
                        </div>
                        <div className="col-1">
                          <ButtonSolid
                            className="add-apps-btn"
                            leftIcon="plus"
                            onClick={() => this.addSelectedDataSourcesToGroup(groupPermission.id)}
                            disabled={selectedDataSourceIds?.length == 0}
                            iconWidth="16"
                            fill={
                              selectedDataSourceIds.length != 0
                                ? '#FDFDFE'
                                : this.props.darkMode
                                ? '#4C5155'
                                : '#C1C8CD'
                            }
                            isLoading={isAddingDataSources}
                            data-cy="datasource-add-button"
                          >
                            Add
                          </ButtonSolid>
                        </div>
                      </div>
                    )}
                    <br />
                    <div>
                      <div className="table-responsive">
                        <table className="table table-vcenter">
                          {/* <thead>
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
                          </thead> */}
                          <div className="groups-datasource-body-header d-flex">
                            <p className="font-weight-500 tj-text-xsm" data-cy="datasource-name-header">
                              Datasource name
                            </p>
                            <p className="font-weight-500 tj-text-xsm" data-cy="permissions-header">
                              Permissions
                            </p>
                          </div>

                          <tbody className="manage-group-datasource-table-body">
                            {isLoadingGroup || isLoadingDataSources ? (
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
                              dataSourcesInGroup.map((dataSource) => (
                                <tr key={dataSource.id} className="datasources-table-row">
                                  <td
                                    className="font-weight-500"
                                    data-cy={`${String(dataSource.name).toLowerCase().replace(/\s+/g, '-')}-datasource`}
                                  >
                                    {dataSource.name}
                                  </td>
                                  <td
                                    className="text-secondary d-flex"
                                    data-cy={`${String(dataSource.name)
                                      .toLowerCase()
                                      .replace(/\s+/g, '-')}-datasource-view-edit-wrap`}
                                  >
                                    <div className="datasources-view-edit-wrap">
                                      <label className="form-check form-check-inline" data-cy="view-label">
                                        <input
                                          className="form-check-input"
                                          type="radio"
                                          onChange={() => {
                                            this.updateDataSourceGroupPermission(
                                              dataSource,
                                              groupPermission.id,
                                              'view'
                                            );
                                          }}
                                          disabled={groupPermission.group === 'admin'}
                                          checked={this.canDataSourceGroupPermission(
                                            dataSource,
                                            groupPermission.id,
                                            'view'
                                          )}
                                          data-cy="view-radio-button"
                                        />
                                        <span className="form-check-label">{this.props.t('globals.view', 'view')}</span>
                                      </label>
                                      <label className="form-check form-check-inline" data-cy="edit-label">
                                        <input
                                          className="form-check-input"
                                          type="radio"
                                          onChange={() => {
                                            this.updateDataSourceGroupPermission(
                                              dataSource,
                                              groupPermission.id,
                                              'edit'
                                            );
                                          }}
                                          disabled={groupPermission.group === 'admin'}
                                          checked={this.canDataSourceGroupPermission(
                                            dataSource,
                                            groupPermission.id,
                                            'edit'
                                          )}
                                          data-cy="edit-radio-button"
                                        />
                                        <span className="form-check-label">{this.props.t('globals.edit', 'Edit')}</span>
                                      </label>
                                    </div>
                                  </td>
                                  <td
                                    data-cy={`${String(dataSource.name)
                                      .toLowerCase()
                                      .replace(/\s+/g, '-')}-datasource-remove-button-wrap`}
                                  >
                                    {groupPermission.group !== 'admin' && (
                                      <Link
                                        to="#"
                                        onClick={() => {
                                          this.removeDataSourcesFromGroup(
                                            groupPermission.id,
                                            dataSource.id,
                                            dataSource.name
                                          );
                                        }}
                                        className="delete-link"
                                      >
                                        <ButtonSolid
                                          className="tj-text-xsm font-weight-600 remove-decoration  datasources-remove-btn"
                                          variant="dangerSecondary"
                                          leftIcon="trash"
                                          iconWidth="14"
                                          fill={'#E54D2E'}
                                          data-cy="remove-button"
                                        >
                                          Remove
                                        </ButtonSolid>
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
