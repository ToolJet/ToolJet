import React from 'react';
import { authenticationService, organizationService } from '@/_services';
import ReactJson from 'react-json-view';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import { auditLogsService } from '../_services/auditLogsService';
import { appService } from '../_services/app.service';
import { Pagination, MultiSelectUser, FilterPreview, ToolTip } from '@/_components';
import Layout from '@/_ui/Layout';
import moment from 'moment';
import { withRouter } from '@/_hoc/withRouter';
import { BreadCrumbContext } from '@/App/App';
class AuditLogs extends React.Component {
  constructor(props) {
    super(props);

    const searchParams = new URLSearchParams(props.location.search);
    const initArraySearchParams = (param, searchParams, dependency) => {
      const selected = searchParams.get(param) ? searchParams.get(param).split(',') : [];

      if (param === 'resources') {
        if (dependency?.length > 0) {
          return [{ name: 'App', value: 'APP' }];
        }
        return this.resourceTypeOptions().filter((resource) => selected.indexOf(resource.value) !== -1);
      }
      if (param === 'actions') {
        const allActions = this.fetchActionTypesOptionsForResource(dependency);
        return allActions.filter((actions) => selected.indexOf(actions.value) !== -1);
      }
      if (param === 'appsList' || param === 'usersList') {
        return this.safelyParseJson(selected) || [];
      }
      if (param === 'timeFrom' || param === 'timeTo') {
        const date = this.safelyParseDate(selected?.[0]);
        if (date) {
          return [{ value: date.toISOString(), name: this.humanizeDate(date), obj: date }];
        }
        return [];
      }
      return selected;
    };
    const appIds = initArraySearchParams('apps', searchParams);
    const resources = initArraySearchParams('resources', searchParams, appIds);
    const actions = initArraySearchParams('actions', searchParams, resources);
    const users = initArraySearchParams('usersList', searchParams);
    const apps = initArraySearchParams('appsList', searchParams);
    const timeFrom = initArraySearchParams('timeFrom', searchParams);
    const timeTo = initArraySearchParams('timeTo', searchParams);

    this.state = {
      currentUser: authenticationService.currentSessionValue.current_user,
      isLoadingAuditLogs: true,
      isLoadingApps: true,
      apps: [],
      totalPages: 0,
      totalCount: 0,
      currentPage: searchParams.get('page') || 0,
      perPage: searchParams.get('perPage') || 50,
      selectedSearchOptions: {
        resources,
        actions,
        users,
        apps,
        timeFrom,
        timeTo,
      },
      auditLogs: [],
    };
  }

  safelyParseJson(jsonString) {
    if (!jsonString) {
      return;
    }
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      return;
    }
  }

  safelyParseDate(isoSateString) {
    if (!isoSateString) {
      return;
    }
    try {
      const date = moment(isoSateString);
      if (date.isValid()) {
        return date;
      }
      return;
    } catch (err) {
      return;
    }
  }

  componentDidMount() {
    this.fetchAuditLogs({
      page: 1,
      perPage: this.state.perPage,
      ...this.removeEmptyKeysFromObject(this.state.selectedSearchOptions),
    });
    this.fetchAllApps();
  }

  searchUser = async (query) => {
    if (!query) {
      return [];
    }
    return new Promise((resolve, reject) => {
      organizationService
        .getUsersByValue(query)
        .then(({ users }) => {
          resolve(
            users.map((user) => {
              return {
                name: `${this.userFullName(user)} (${user.email})`,
                value: user.user_id,
              };
            })
          );
        })
        .catch(reject);
    });
  };

  isLoading = () => {
    return this.state.isLoadingApps || this.state.isLoadingAuditLogs;
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
    const { current_organization_id } = authenticationService.currentSessionValue;
    this.props.navigate({
      pathname: `/${current_organization_id}/audit-logs`,
      search: new URLSearchParams(urlParams).toString(),
    });
  };

  fetchAllApps = () => {
    appService.getAll(0).then((data) => {
      this.setState({ apps: data.apps, isLoadingApps: false });
    });
  };

  canEnableAppSearchOptions = () => {
    return false;
  };

  setSelectedSearchOptions = (searchOptions) => {
    this.setState({
      selectedSearchOptions: {
        ...this.state.selectedSearchOptions,
        ...searchOptions,
      },
    });
  };

  fetchAppsOptions = () => {
    return this.state.apps?.map((app) => {
      return { name: app?.name, value: app?.id };
    });
  };

  userFullName = (user) => {
    return `${user.first_name} ${user.last_name ?? ''}`;
  };

  dateToolTip = (auditLog) => {
    return (
      <ToolTip message={<time>{this.humanizeDate(moment(auditLog.created_at))}</time>}>
        <time className="tj-dashed-tooltip">{moment.utc(auditLog.created_at).fromNow(true)} ago:</time>
      </ToolTip>
    );
  };

  humanizeLog = (auditLog) => {
    if (auditLog.user_id === auditLog.resource_id && auditLog.resource_type === 'USER') {
      return (
        <span>
          {this.dateToolTip(auditLog)}&nbsp;
          <code data-cy="audit-log-user-email">{auditLog.user?.email}</code> performed{' '}
          <mark data-cy="audit-log-action-type">{auditLog.action_type}</mark>
        </span>
      );
    } else {
      return (
        <span>
          {this.dateToolTip(auditLog)}&nbsp;
          <code data-cy="audit-log-user-email">{auditLog.user?.email}</code> performed{' '}
          <mark data-cy="audit-log-action-type">{auditLog.action_type}</mark> on{' '}
          {auditLog.resource_type.toLowerCase().replaceAll('_', ' ')} - <samp>{auditLog.resource_name}</samp>
        </span>
      );
    }
  };

  humanizeDate(date) {
    return date.format('ddd MM/DD/YYYY hh:mm A');
  }

  fetchActionTypesOptionsForResource = (resources) => {
    const resourceTypes = resources?.map((resource) => resource.value);
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
    const searchParams = {};
    ['users', 'apps', 'resources', 'actions', 'timeFrom', 'timeTo'].forEach((type) => {
      const values = obj[type]?.map((valueList) => valueList.value);
      if (values?.length) {
        searchParams[type] = values;
      }
    });
    if (searchParams.users?.length) {
      searchParams.usersList = JSON.stringify(obj.users);
    }
    if (searchParams.apps?.length) {
      searchParams.appsList = JSON.stringify(obj.apps);
    }
    return searchParams;
  };

  resourceTypeOptions = () => {
    if (this.state?.selectedSearchOptions?.apps?.length > 0) {
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

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  closeFilter(type, value) {
    const data = this.state.selectedSearchOptions[type];
    const updatedData = {};
    updatedData[type] = data.filter((d) => d.value !== value);
    this.setSelectedSearchOptions({ ...updatedData });
  }

  generateFilterBy(type) {
    const { selectedSearchOptions } = this.state;
    const data = selectedSearchOptions[type];
    return (
      <div>
        {(data?.length || '') && (
          <div className="selected-text" data-cy={`${String(type).toLowerCase()}-heading-text`}>
            {this.capitalizeFirstLetter(type)}:
          </div>
        )}
        <div>
          {data?.map((d) => {
            return (
              <div
                className="selected-item tj-ms"
                data-cy={String(d.name).toLowerCase().replace(/\s+/g, '-')}
                key={d.value}
              >
                <FilterPreview text={d.name} onClose={() => this.closeFilter(type, d.value)} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  render() {
    const {
      isLoadingApps,
      isLoadingAuditLogs,
      auditLogs,
      selectedSearchOptions,
      totalCount,
      totalPages,
      currentPage,
      perPage,
    } = this.state;
    const searchSelectClass = this.props.darkMode ? 'select-search-dark' : 'select-search';

    return (
      <BreadCrumbContext.Provider value={''}>
        <Layout switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode}>
          <div className={`wrapper audit-log ${this.props.darkMode || 'bg-light-gray'}`}>
            <div className="page-wrapper">
              <div className="page-body">
                <div className="container-xl">
                  <div className="card">
                    <div className="card-body border-bottom py-3 overflow-auto" style={{ height: '75vh' }}>
                      <div className="row align-items-center">
                        <div className="col" data-cy="select-users-dropdown">
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
                            onSelect={(value) => this.setSelectedSearchOptions({ users: value })}
                            onSearch={this.searchUser}
                            selectedValues={selectedSearchOptions.users}
                            onReset={() => this.setSelectedSearchOptions({ users: [] })}
                            placeholder="Select Users"
                            searchLabel="Enter name or email"
                            allowCustomRender={false}
                          />
                        </div>
                        <div className="col" data-cy="select-apps-dropdown">
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
                            onSelect={(value) =>
                              this.setSelectedSearchOptions({
                                apps: value,
                                resources: value.length ? [{ name: 'App', value: 'APP' }] : [],
                                actions: [],
                              })
                            }
                            selectedValues={selectedSearchOptions.apps}
                            options={this.fetchAppsOptions()}
                            onReset={() => this.setSelectedSearchOptions({ apps: [], resources: [], actions: [] })}
                            placeholder="Select Apps"
                            disabled={isLoadingApps}
                            allowCustomRender={false}
                          />
                        </div>
                        <div className="col" data-cy="select-resources-dropdown">
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
                            onSelect={(value) =>
                              this.setSelectedSearchOptions({
                                resources: value,
                                actions: [],
                              })
                            }
                            selectedValues={selectedSearchOptions.resources}
                            options={this.resourceTypeOptions()}
                            onReset={() => this.setSelectedSearchOptions({ actions: [], resources: [] })}
                            placeholder="Select Resources"
                            disabled={this.isLoading()}
                            allowCustomRender={false}
                          />
                        </div>
                        <div className="col" data-cy="select-actions-dropdown">
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
                            onSelect={(value) => this.setSelectedSearchOptions({ actions: value })}
                            selectedValues={selectedSearchOptions.actions}
                            options={this.fetchActionTypesOptionsForResource(selectedSearchOptions.resources)}
                            onReset={() => this.setSelectedSearchOptions({ actions: [], resources: [] })}
                            placeholder="Select Actions"
                            disabled={this.isLoading()}
                            allowCustomRender={false}
                          />
                        </div>

                        <div className="col-auto" data-cy="search-button">
                          <div
                            className={`btn btn-primary w-100 ${isLoadingAuditLogs ? 'btn-loading' : ''}`}
                            onClick={() => this.performSearch()}
                          >
                            Search
                          </div>
                        </div>
                      </div>
                      <br />
                      <div className="row">
                        <div className="col-auto" data-cy="from-date-inputfield">
                          <label data-cy="from-date-label">
                            From:
                            <Datetime
                              onChange={(value) => {
                                this.setSelectedSearchOptions({
                                  timeFrom: value && [
                                    {
                                      value: value.toISOString(),
                                      name: this.humanizeDate(value),
                                      obj: value,
                                    },
                                  ],
                                });
                              }}
                              timeFormat={true}
                              closeOnSelect={true}
                              value={selectedSearchOptions?.timeFrom?.[0]?.obj}
                              renderInput={(props) => {
                                return (
                                  <input
                                    {...props}
                                    value={selectedSearchOptions?.timeFrom?.[0]?.obj ? props.value : ''}
                                  />
                                );
                              }}
                            />
                          </label>
                        </div>

                        <div className="col-auto" data-cy="to-date-inputfield">
                          <label data-cy="to-date-label">
                            To:
                            <Datetime
                              onChange={(value) => {
                                this.setSelectedSearchOptions({
                                  timeTo: value && [
                                    {
                                      value: value.toISOString(),
                                      name: this.humanizeDate(value),
                                      obj: value,
                                    },
                                  ],
                                });
                              }}
                              timeFormat={true}
                              closeOnSelect={true}
                              value={selectedSearchOptions?.timeTo?.[0]?.obj}
                              renderInput={(props) => {
                                return (
                                  <input
                                    {...props}
                                    value={selectedSearchOptions?.timeTo?.[0]?.obj ? props.value : ''}
                                  />
                                );
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="row mt-2" data-cy="filter-by-section">
                        <div className="filter-by-section">
                          <div className="filter-by-text" data-cy="filter-by-label">
                            Filter By:
                          </div>
                          <div className="selected-section">
                            {['users', 'apps', 'resources', 'actions', 'timeFrom', 'timeTo'].map((type) =>
                              this.generateFilterBy(type)
                            )}
                          </div>
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
                              ) : auditLogs?.length ? (
                                <tbody>
                                  {auditLogs.map((auditLog, index) => (
                                    <tr key={auditLog.id} data-cy={`audit-table-row-${index}`}>
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
                              ) : (
                                <div className="text-center">No results found</div>
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
        </Layout>
      </BreadCrumbContext.Provider>
    );
  }
}

export const AuditLogsPage = withRouter(AuditLogs);
