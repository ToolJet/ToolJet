import React from 'react';
import { authenticationService } from '@/_services';
import ReactJson from 'react-json-view';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import Select, { fuzzySearch } from 'react-select-search';
import { auditLogsService } from '../_services/auditLogsService';
import { userService } from '../_services/user.service';
import { appService } from '../_services/app.service';
import { Pagination, Header } from '@/_components';
import moment from 'moment';

class AuditLogs extends React.Component {
  constructor(props) {
    super(props);

    const searchParams = new URLSearchParams(props.location.search);
    const initArraySearchParams = (param, searchParams) => {
      return searchParams.get(param) ? searchParams.get(param).split(',') : [];
    };
    const initDateTimeSearchParams = (param, searchParams) => {
      return searchParams.get(param) ? new Date(searchParams.get(param)) : null;
    };
    const resources = initArraySearchParams('resources', searchParams);
    const actions = initArraySearchParams('actions', searchParams);
    const apps = initArraySearchParams('apps', searchParams);
    const users = initArraySearchParams('users', searchParams);
    const timeFrom = initDateTimeSearchParams('timeFrom', searchParams);
    const timeTo = initDateTimeSearchParams('timeTo', searchParams);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isLoadingAuditLogs: true,
      isLoadingApps: true,
      isLoadingUsers: true,
      isSearching: false,
      users: [],
      apps: [],
      usersMap: {},
      timeTo,
      timeFrom,
      totalPages: 0,
      totalCount: 0,
      currentPage: searchParams.get('page') || 0,
      perPage: searchParams.get('perPage') || 50,
      selectedSearchOptions: {
        resources,
        actions,
        users,
        apps,
        timeFrom: timeFrom && timeFrom.toISOString(),
        timeTo: timeTo && timeTo.toISOString(),
      },
      auditLogs: [],
      showGroupDeletionConfirmation: false,
    };
  }

  componentDidMount() {
    this.fetchAuditLogs({
      page: 1,
      perPage: this.state.perPage,
      ...this.removeEmptyKeysFromObject(this.state.selectedSearchOptions),
    });
    this.fetchAllApps();
    this.fetchAllUsers();
  }

  isLoading = () => {
    return this.state.isLoadingApps || this.state.isLoadingAuditLogs || this.state.isLoadingUsers;
  };

  fetchAuditLogs = (params) => {
    this.setState({
      isLoadingAuditLogs: true,
    });
    auditLogsService.index(params).then((data) => {
      this.setState({
        auditLogs: data.audit_logs,
        isLoadingAuditLogs: false,
        totalPages: data.meta.total_pages,
        currentPage: data.meta.current_page,
        totalCount: data.meta.total_count,
      });
    });
  };

  performSearch = () => {
    this.searchAuditLog(1, this.state.perPage, this.state.selectedSearchOptions);
  };

  searchAuditLog = (page, perPage, params) => {
    const urlParams = {
      page,
      perPage,
      ...this.removeEmptyKeysFromObject(params),
    };

    this.fetchAuditLogs(urlParams);

    this.props.history.push({
      pathname: '/audit_logs',
      search: new URLSearchParams(urlParams).toString(),
    });
  };

  fetchAllApps = () => {
    appService.getAll(0).then((data) => {
      this.setState({ apps: data.apps, isLoadingApps: false });
    });
  };

  fetchAllUsers = () => {
    userService.getAll().then((data) => {
      const usersMap = data.users.reduce((obj, user) => ({ ...obj, [user.id]: user }), {});

      this.setState({
        users: data.users,
        usersMap,
        isLoadingUsers: false,
      });
    });
  };

  canEnableAppSearchOptions = () => {
    return false;
  };

  setSelectedSearchOptions = (searchOptions) => {
    console.log(searchOptions);
    this.setState({
      selectedSearchOptions: {
        ...this.state.selectedSearchOptions,
        ...searchOptions,
      },
    });
  };

  fetchUsersOptions = () => {
    return this.state.users.map((user) => {
      return {
        name: `${this.userFullName(user)} (${user.email})`,
        value: user.id,
      };
    });
  };

  fetchAppsOptions = () => {
    const uniqAppNames = [...new Set(this.state.apps.map((app) => app.name))];

    return uniqAppNames.map((appName) => {
      return { name: appName, value: appName };
    });
  };

  userFullName = (user) => {
    return `${user.first_name} ${user.last_name}`;
  };

  userEmailForId = (userId) => {
    return this.state.usersMap[userId]['email'];
  };

  humanizeLog = (auditLog) => {
    if (auditLog.user_id === auditLog.resource_id && auditLog.resource_type === 'USER') {
      return (
        <span>
          <time>{moment.utc(auditLog.created_at).fromNow(true)} ago: </time>
          <code>{this.userEmailForId(auditLog.user_id)}</code> performed <mark>{auditLog.action_type}</mark>
        </span>
      );
    } else {
      return (
        <span>
          <time>{moment.utc(auditLog.created_at).fromNow(true)} ago: </time>
          <code>{this.userEmailForId(auditLog.user_id)}</code> performed <mark>{auditLog.action_type}</mark> on{' '}
          {auditLog.resource_type.toLowerCase().replaceAll('_', ' ')} - <samp>{auditLog.resource_name}</samp>
        </span>
      );
    }
  };

  hasSelectedTimeFrame = () => {
    return this.state.selectedSearchOptions.timeTo && this.state.selectedSearchOptions.timeFrom;
  };

  fetchActionTypesOptionsForResource = (resourceTypes) => {
    const resourceTypeToActionTypeOptions = {
      USER: [
        { name: 'USER_LOGIN', value: 'USER_LOGIN' },
        { name: 'USER_SIGNUP', value: 'USER_SIGNUP' },
        { name: 'USER_INVITE', value: 'USER_INVITE' },
        {
          name: 'USER_INVITE_REDEEM',
          value: 'USER_INVITE_REDEEM',
        },
      ],
      APP: [
        { name: 'APP_CREATE', value: 'APP_CREATE' },
        { name: 'APP_UPDATE', value: 'APP_UPDATE' },
        { name: 'APP_VIEW', value: 'APP_VIEW' },
        { name: 'APP_DELETE', value: 'APP_DELETE' },
        { name: 'APP_IMPORT', value: 'APP_IMPORT' },
        { name: 'APP_EXPORT', value: 'APP_EXPORT' },
        { name: 'APP_CLONE', value: 'APP_CLONE' },
      ],
      DATA_QUERY: [{ name: 'DATA_QUERY_RUN', value: 'DATA_QUERY_RUN' }],
      GROUP_PERMISSION: [
        {
          name: 'GROUP_PERMISSION_CREATE',
          value: 'GROUP_PERMISSION_CREATE',
        },
        {
          name: 'GROUP_PERMISSION_UPDATE',
          value: 'GROUP_PERMISSION_UPDATE',
        },
        {
          name: 'GROUP_PERMISSION_DELETE',
          value: 'GROUP_PERMISSION_DELETE',
        },
      ],
      APP_GROUP_PERMISSION: [
        {
          name: 'APP_GROUP_PERMISSION_UPDATE',
          value: 'APP_GROUP_PERMISSION_UPDATE',
        },
      ],
    };

    if (resourceTypes.length !== 0) {
      return resourceTypes.flatMap((resourceType) => resourceTypeToActionTypeOptions[resourceType]);
    } else {
      return Object.values(resourceTypeToActionTypeOptions).flat();
    }
  };

  removeEmptyKeysFromObject = (obj) => {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v.length > 0));
  };

  resourceTypeOptions = () => {
    if (this.state.selectedSearchOptions.apps.length > 0) {
      return [{ name: 'App', value: 'APP' }];
    } else {
      return [
        { name: 'User', value: 'USER' },
        { name: 'App', value: 'APP' },
        { name: 'Data Query', value: 'DATA_QUERY' },
        {
          name: 'Group Permission',
          value: 'GROUP_PERMISSION',
        },
        {
          name: 'App Group Permission',
          value: 'APP_GROUP_PERMISSION',
        },
      ];
    }
  };

  render() {
    const {
      isLoadingApps,
      isLoadingUsers,
      isLoadingAuditLogs,
      isSearching,
      auditLogs,
      selectedSearchOptions,
      timeFrom,
      timeTo,
      totalCount,
      totalPages,
      currentPage,
      perPage,
    } = this.state;

    return (
      <div className="wrapper">
        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />

        <div className="page-wrapper">
          <div className="page-body">
            <div className="container-xl">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Audit Logs</h3>
                </div>
                <div className="card-body border-bottom py-3 overflow-auto" style={{ height: '75vh' }}>
                  <div className="row">
                    <div className="col-3">
                      <Select
                        options={this.fetchUsersOptions()}
                        closeOnSelect={false}
                        search={true}
                        disabled={isLoadingUsers}
                        multiple
                        value={selectedSearchOptions.users}
                        filterOptions={fuzzySearch}
                        onChange={(value) => this.setSelectedSearchOptions({ users: value })}
                        printOptions="on-focus"
                        placeholder="Select Users"
                      />
                    </div>
                    <div className="col-3">
                      <Select
                        options={this.fetchAppsOptions()}
                        closeOnSelect={false}
                        search={true}
                        disabled={isLoadingApps}
                        multiple
                        value={selectedSearchOptions.apps}
                        filterOptions={fuzzySearch}
                        onChange={(value) =>
                          this.setSelectedSearchOptions({
                            apps: value,
                            resources: value.length ? ['APP'] : [],
                          })
                        }
                        printOptions="on-focus"
                        placeholder="Select Apps"
                      />
                    </div>
                    <div className="col">
                      <Select
                        options={this.resourceTypeOptions()}
                        closeOnSelect={false}
                        search={true}
                        disabled={this.isLoading()}
                        multiple
                        value={selectedSearchOptions.resources}
                        filterOptions={fuzzySearch}
                        onChange={(value) => {
                          this.setSelectedSearchOptions({
                            resources: value,
                            actions: [],
                          });
                        }}
                        printOptions="on-focus"
                        placeholder="Select Resources"
                      />
                    </div>
                    <div className="col">
                      <Select
                        options={this.fetchActionTypesOptionsForResource(selectedSearchOptions.resources)}
                        closeOnSelect={false}
                        search={true}
                        disabled={this.isLoading()}
                        multiple
                        value={selectedSearchOptions.actions}
                        filterOptions={fuzzySearch}
                        onChange={(value) => this.setSelectedSearchOptions({ actions: value })}
                        printOptions="on-focus"
                        placeholder="Select Actions"
                      />
                    </div>

                    <div className="col-auto">
                      <div
                        className={`btn btn-primary w-100 ${isSearching ? 'btn-loading' : ''} ${
                          this.hasSelectedTimeFrame() ? '' : 'disabled'
                        }`}
                        onClick={() => this.performSearch()}
                      >
                        Search
                      </div>
                    </div>
                  </div>
                  <br />
                  <div className="row">
                    <div className="col-auto">
                      <label>
                        From:
                        <Datetime
                          onChange={(value) => {
                            this.setState({ timeFrom: value });
                            this.setSelectedSearchOptions({
                              timeFrom: value && value.toISOString(),
                            });
                          }}
                          timeFormat={true}
                          closeOnSelect={true}
                          value={timeFrom}
                        />
                      </label>
                    </div>

                    <div className="col-auto">
                      <label>
                        To:
                        <Datetime
                          onChange={(value) => {
                            this.setState({ timeTo: value });
                            this.setSelectedSearchOptions({
                              timeTo: value && value.toISOString(),
                            });
                          }}
                          timeFormat={true}
                          closeOnSelect={true}
                          value={timeTo}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="row mt-3">
                    <div className="col-12">
                      <div
                        className="card-table table-responsive table-bordered overflow-auto"
                        style={{ height: '55vh' }}
                      >
                        <table data-testid="usersTable" className="table table-vcenter" disabled={true}>
                          {this.isLoading() ? (
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
                              {auditLogs.map((auditLog) => (
                                <tr key={auditLog.id}>
                                  <td>
                                    {this.humanizeLog(auditLog)}
                                    <ReactJson
                                      src={auditLog}
                                      theme={this.props.darkMode ? 'shapeshifter' : 'rjv-default'}
                                      name={'log'}
                                      style={{ fontSize: '0.7rem' }}
                                      enableClipboard={false}
                                      displayDataTypes={false}
                                      collapsed={true}
                                      displayObjectSize={false}
                                      quotesOnKeys={false}
                                      sortKeys={true}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          )}
                        </table>
                      </div>
                    </div>
                  </div>

                  {!isLoadingAuditLogs && totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      count={totalCount}
                      totalPages={totalPages}
                      itemsPerPage={perPage}
                      queryParams={selectedSearchOptions}
                      pageChanged={(page, perPage, queryParams) => this.searchAuditLog(page, perPage, queryParams)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export { AuditLogs };
