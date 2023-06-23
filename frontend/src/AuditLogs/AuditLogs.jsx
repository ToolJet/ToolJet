import React, { useContext, useEffect, useState } from 'react';
import Layout from '@/_ui/Layout';
import { withRouter } from '@/_hoc/withRouter';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import cx from 'classnames';
import { auditLogsService, organizationService, appService, authenticationService } from '@/_services';
import ReactJson from 'react-json-view';
import { DateRangePicker, Tag } from '@/ToolJetUI/';
import { MultiSelectUser, ToolTip } from '@/_components';
import moment from 'moment';
import Pagination from '@/_ui/Pagination';
import { CustomToggleSwitch } from '../Editor/QueryManager/Components/CustomToggleSwitch';
import { Button } from '@/_ui/LeftSidebar';
import { BreadCrumbContext } from '@/App/App';
import { Navigate, useNavigate } from 'react-router-dom';
import { getPrivateRoute } from '@/_helpers/routes';

const AuditLogs = (props) => {
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [totalPages, setTotalPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);

  const [apps, setApps] = useState([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [selectedSearchOptions, setSelectedSearchOptions] = useState({});

  const [dateRangePicketValue, set] = useState(() => [moment().subtract(1, 'days'), moment()]);
  const [showLatestLogs, setShowLatestLogs] = useState(false);

  const maxDate = DateRangePicker.setMaxDate(dateRangePicketValue[0], 30, 'days');
  const minDate = DateRangePicker.setMinDate(dateRangePicketValue[0], 30, 'days');

  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const { super_admin, admin, current_organization_id } = authenticationService.currentSessionValue;

  const perPage = 7;

  const dateToolTip = (auditLog) => {
    return (
      <ToolTip message={<time>{humanizeDate(moment(auditLog?.created_at))}</time>}>
        <time className="tj-dashed-tooltip">{moment.utc(auditLog?.created_at).fromNow(true)} ago:</time>
      </ToolTip>
    );
  };

  const goToNextPageAuditLogs = () => {
    const nextPage = currentPage + 1;
    searchAuditLog(nextPage, perPage, selectedSearchOptions);
  };

  const goToPreviousPageAuditLogs = () => {
    const previousPage = currentPage - 1;
    searchAuditLog(previousPage, perPage, selectedSearchOptions);
  };

  const fetchAuditLogs = (params) => {
    setIsLoadingAuditLogs(true);

    auditLogsService.index(params).then((data) => {
      const { audit_logs, meta } = data;

      setAuditLogs(audit_logs);
      setTotalPages(meta['total_pages']);
      setCurrentPage(meta['current_page']);
      setIsLoadingAuditLogs(false);
    });
  };

  const fetchAllApps = () => {
    setIsLoadingApps(true);
    appService.getAll(0).then((data) => {
      setApps(data.apps);
      setIsLoadingApps(false);
    });
  };

  const fetchAppsOptions = () => {
    return apps?.map((app) => {
      return { name: app?.name, value: app?.id };
    });
  };

  const removeEmptyKeysFromObject = (obj) => {
    const searchParams = {};
    ['users', 'apps', 'resources', 'actions', 'timeFrom', 'timeTo'].forEach((type) => {
      const values = Array.isArray(obj[type]) && obj[type]?.map((valueList) => valueList?.value);
      if (values?.length) {
        searchParams[type] = values;
      }
    });
    if (searchParams.users?.length) {
      searchParams.usersList = JSON.stringify(obj?.users);
    }
    if (searchParams.apps?.length) {
      searchParams.appsList = JSON.stringify(obj?.apps);
    }

    return searchParams;
  };

  const searchAuditLog = (page, perPage, params) => {
    const timeTo = params?.timeTo?.value;
    const timeFrom = params?.timeFrom?.value;

    const urlParams = {
      page,
      perPage,
      timeTo,
      timeFrom,
      ...removeEmptyKeysFromObject(params),
    };

    fetchAuditLogs(urlParams);
    const { current_organization_id } = authenticationService.currentSessionValue;
    props.navigate({
      pathname: `/${current_organization_id}/audit-logs`,
      search: new URLSearchParams(urlParams).toString(),
    });
  };

  const performSearch = () => {
    searchAuditLog(1, perPage, selectedSearchOptions);
  };
  const humanizeLog = (auditLog) => {
    if (auditLog.user_id === auditLog.resource_id && auditLog.resource_type === 'USER') {
      return (
        <span>
          {dateToolTip(auditLog)}&nbsp;
          <code data-cy="audit-log-user-email">{auditLog.user?.email}</code> performed{' '}
          <mark data-cy="audit-log-action-type">{auditLog.action_type}</mark>
        </span>
      );
    } else {
      return (
        <span>
          {dateToolTip(auditLog)}&nbsp;
          <code data-cy="audit-log-user-email">{auditLog.user?.email}</code> performed{' '}
          <mark data-cy="audit-log-action-type">{auditLog.action_type}</mark> on{' '}
          {auditLog.resource_type.toLowerCase().replaceAll('_', ' ')} - <samp>{auditLog.resource_name}</samp>
        </span>
      );
    }
  };

  const resourceTypeOptions = () => {
    if (selectedSearchOptions?.apps?.length > 0) {
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

  const fetchActionTypesOptionsForResource = (resources) => {
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

    if (resourceTypes?.length !== 0) {
      return resourceTypes?.flatMap((resourceType) => resourceTypeToActionTypeOptions[resourceType]);
    } else {
      return Object.values(resourceTypeToActionTypeOptions).flat();
    }
  };

  const initArraySearchParams = (param, searchParams, dependency) => {
    const selected = searchParams.get(param) ? searchParams.get(param).split(',') : [];

    if (param === 'resources') {
      if (dependency?.length > 0) {
        return [{ name: 'App', value: 'APP' }];
      }
      return resourceTypeOptions().filter((resource) => selected.indexOf(resource.value) !== -1);
    }
    if (param === 'actions') {
      const allActions = fetchActionTypesOptionsForResource(dependency);
      return allActions.filter((actions) => selected.indexOf(actions.value) !== -1);
    }
    if (param === 'appsList' || param === 'usersList') {
      return safelyParseJson(selected) || [];
    }
    if (param === 'timeFrom' || param === 'timeTo') {
      const date = safelyParseDate(selected?.[0]);
      if (date) {
        return [{ value: date.toISOString(), name: humanizeDate(date), obj: date }];
      }
      return [];
    }
    return selected;
  };

  const userFullName = (user) => {
    return `${user.first_name} ${user.last_name ?? ''}`;
  };

  const searchUser = async (query) => {
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
                name: `${userFullName(user)} (${user.email})`,
                value: user.user_id,
              };
            })
          );
        })
        .catch(reject);
    });
  };

  const safelyParseDate = (isoSateString) => {
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
  };

  const safelyParseJson = (jsonString) => {
    if (!jsonString) {
      return;
    }
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      return;
    }
  };

  function handleAuditLogClick() {
    auditLogsService
      .getLicenseTerms()
      .then(() => navigate(getPrivateRoute('audit_logs')))
      .catch(() => navigate(getPrivateRoute('dashboard')));
    document.activeElement.blur();
    return;
  }

  useEffect(() => {
    handleAuditLogClick();

    updateSidebarNAV('');
    const urlSearchParams = new URLSearchParams(props.location.search);

    fetchAllApps();

    if (urlSearchParams['size'] !== 0) {
      updateSearchOptions();
    } else {
      const timeFrom = moment().subtract(1, 'days').toISOString();
      const timeTo = moment().toISOString();
      setShowLatestLogs(true);

      setSelectedSearchOptions({
        timeFrom: [{ value: timeFrom, name: humanizeDate(timeFrom) }],
        timeTo: [{ value: timeTo, name: humanizeDate(timeTo) }],
      });

      fetchAuditLogs({
        page: 1,
        perPage: perPage,
        timeFrom,
        timeTo,
        ...removeEmptyKeysFromObject(selectedSearchOptions),
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSearchOptions = () => {
    const searchParams = new URLSearchParams(props.location.search);
    const appIds = initArraySearchParams('apps', searchParams);
    const resources = initArraySearchParams('resources', searchParams, appIds);
    const actions = initArraySearchParams('actions', searchParams, resources);
    const users = initArraySearchParams('usersList', searchParams);
    const apps = initArraySearchParams('appsList', searchParams);
    let timeFrom = initArraySearchParams('timeFrom', searchParams);
    let timeTo = initArraySearchParams('timeTo', searchParams);
    const page = searchParams.get('page');

    if (!timeFrom || !timeTo) {
      (timeFrom = moment().subtract(1, 'days').toISOString()), (timeTo = moment().toISOString());
      setShowLatestLogs(true);
    }

    setSelectedSearchOptions({
      resources,
      actions,
      users,
      apps,
      timeFrom,
      timeTo,
    });

    set([moment(timeFrom[0]?.value), moment(timeTo[0]?.value)]);

    const urlParams = {
      page,
      perPage,
      ...removeEmptyKeysFromObject({
        resources,
        actions,
        users,
        apps,
        timeFrom,
        timeTo,
      }),
    };

    fetchAuditLogs(urlParams);
  };

  const humanizeDate = (date) => {
    return moment(date).format('DD/MM/YYYY hh:mm A');
  };

  const showRecentLogs = () => {
    setShowLatestLogs(true);
    handleDateChange([moment().subtract(1, 'days'), moment()], false);
  };

  const handleDateChange = (value, shouldDisableLatestLogs = true) => {
    set(value);
    const timeFrom = {
      value: value[0].toISOString(),
      name: humanizeDate(value[0]),
    };

    const timeTo = {
      value: value[1].toISOString(),
      name: humanizeDate(value[1]),
    };

    if (shouldDisableLatestLogs) {
      setShowLatestLogs(false);
    }

    setSelectedSearchOptions((prev) => ({ ...prev, timeFrom, timeTo }));

    const urlParams = {
      page: 1,
      perPage,
      timeTo: timeTo.value,
      timeFrom: timeFrom.value,
      ...removeEmptyKeysFromObject(selectedSearchOptions),
    };

    fetchAuditLogs(urlParams);
  };

  const isLoading = () => {
    return isLoadingApps || isLoadingAuditLogs;
  };

  const RangePickerLabel = () => {
    return (
      <>
        <span className="font-500">Date Range Picker </span>
        <span style={{ color: 'red' }}>*</span>
      </>
    );
  };

  const closeFilter = (type, value) => {
    const data = selectedSearchOptions[type];
    const updatedData = {};
    updatedData[type] = data.filter((d) => d.value !== value);
    setSelectedSearchOptions((prev) => ({ ...prev, ...updatedData }));
  };

  const clearAllFilters = (e) => {
    e.preventDefault();
    const urlSearchParams = new URLSearchParams(props.location.search);

    if (urlSearchParams['size'] === 0) {
      return setSelectedSearchOptions((prev) => ({
        ...prev,
        resources: [],
        actions: [],
        users: [],
        apps: [],
      }));
    }

    let timeFrom = initArraySearchParams('timeFrom', urlSearchParams)[0]?.value;
    let timeTo = initArraySearchParams('timeTo', urlSearchParams)[0]?.value;
    const page = urlSearchParams.get('page');

    setSelectedSearchOptions({
      resources: [],
      actions: [],
      users: [],
      apps: [],
      timeFrom: [{ value: timeFrom, name: humanizeDate(timeFrom) }],
      timeTo: [{ value: timeTo, name: humanizeDate(timeTo) }],
    });

    const { current_organization_id } = authenticationService.currentSessionValue;
    props.navigate({
      pathname: `/${current_organization_id}/audit-logs`,
    });

    fetchAuditLogs({
      page,
      perPage,
      timeFrom,
      timeTo,
    });
  };

  const searchSelectClass = props.darkMode ? 'select-search-dark' : 'select-search';

  function isFilterApplied() {
    for (const key in selectedSearchOptions) {
      if (key === 'timeFrom' || key === 'timeTo') {
        continue;
      }

      const filterTags = selectedSearchOptions[key];
      if (filterTags.length > 0) {
        return true;
      }
    }
    return false;
  }

  if (super_admin || admin) {
    return (
      <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
        <div className={`wrapper audit-log ${props.darkMode || 'bg-light-gray'}`}>
          <div
            style={{
              height: '100vh',
              overflowY: 'none',
              padding: '0rem 4rem',
            }}
            className="row gx-0"
          >
            <div className={cx('col workspace-content-wrapper')} style={{ paddingTop: '40px' }}>
              <div className="w-100">
                <div className="wrapper animation-fade">
                  <div className="page-wrapper">
                    <div className="container-xl">
                      <div>
                        <div className="row align-items-center ">
                          <div className="row">
                            <div className="col">
                              <DateRangePicker
                                dateRange={dateRangePicketValue}
                                showCalenderIcon={true}
                                autoFocus={false}
                                classNames="tooljet-range-picker"
                                onChange={handleDateChange}
                                maxRange={15}
                                maxDate={maxDate}
                                minDate={minDate}
                                type="datetime"
                                customLabel={<RangePickerLabel />}
                                format="dd-MM-yyyy hh:mm a"
                              />
                            </div>
                            <div className="mb-0 d-flex col-auto">
                              <CustomToggleSwitch
                                isChecked={showLatestLogs}
                                toggleSwitchFunction={showRecentLogs}
                                action="enableAuditRecentActivity"
                                dataCy={'audit-recent-activity'}
                                disabled={showLatestLogs}
                              />

                              <span
                                className="mx-2 mt-3 font-weight-400 tranformation-label"
                                data-cy={'label-query-transformation'}
                              >
                                Show Latest activity
                                <small className="text-muted" style={{ display: 'block' }}>
                                  (Last 24 hours)
                                </small>
                              </span>
                            </div>
                          </div>
                          <div className="row align-items-center mt-3 mb-1">
                            <div className="col" data-cy="select-users-dropdown">
                              <span className="font-500 mb-1">Users</span>
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
                                onSelect={(value) => setSelectedSearchOptions((prev) => ({ ...prev, users: value }))}
                                onSearch={searchUser}
                                selectedValues={selectedSearchOptions.users}
                                onReset={() => setSelectedSearchOptions((prev) => ({ ...prev, users: [] }))}
                                placeholder="Select Users"
                                searchLabel="Enter name or email"
                                allowCustomRender={false}
                              />
                            </div>
                            <div className="col" data-cy="select-users-dropdown">
                              <span className="font-500 mb-1">Apps</span>
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
                                  setSelectedSearchOptions((prev) => ({
                                    ...prev,
                                    apps: value,
                                    resources: value.length ? [{ name: 'App', value: 'APP' }] : [],
                                    actions: [],
                                  }))
                                }
                                selectedValues={selectedSearchOptions.apps}
                                options={fetchAppsOptions()}
                                onReset={() =>
                                  setSelectedSearchOptions((prev) => ({
                                    ...prev,
                                    apps: [],
                                    resources: [],
                                    actions: [],
                                  }))
                                }
                                placeholder="Select Apps"
                                disabled={isLoadingApps}
                                allowCustomRender={false}
                              />
                            </div>
                            <div className="col" data-cy="select-users-dropdown">
                              <span className="font-500 mb-1">Resources</span>
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
                                  setSelectedSearchOptions((prev) => ({
                                    ...prev,
                                    resources: value,
                                    actions: [],
                                  }))
                                }
                                selectedValues={selectedSearchOptions.resources}
                                options={resourceTypeOptions()}
                                onReset={() =>
                                  setSelectedSearchOptions((prev) => ({ ...prev, actions: [], resources: [] }))
                                }
                                placeholder="Select Resources"
                                disabled={isLoading()}
                                allowCustomRender={false}
                              />
                            </div>
                            <div className="col" data-cy="select-users-dropdown">
                              <span className="font-500 mb-1">Actions</span>
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
                                onSelect={(value) => setSelectedSearchOptions((prev) => ({ ...prev, actions: value }))}
                                selectedValues={selectedSearchOptions.actions}
                                options={fetchActionTypesOptionsForResource(selectedSearchOptions.resources)}
                                onReset={() =>
                                  setSelectedSearchOptions((prev) => ({ ...prev, actions: [], resources: [] }))
                                }
                                placeholder="Select Actions"
                                disabled={isLoading()}
                                allowCustomRender={false}
                              />
                            </div>
                            <div className="col-auto d-flex pt-3" data-cy="select-users-dropdown">
                              <ButtonSolid
                                data-cy=""
                                vaiant="primary"
                                className=""
                                size="md"
                                customStyles={{
                                  height: '32px',
                                  width: '67px',
                                }}
                                onClick={performSearch}
                              >
                                Filter
                              </ButtonSolid>
                            </div>
                          </div>

                          <div className="row mt-2" data-cy="filter-by-section">
                            <div className="filter-by-section">
                              <div className="filter-by-text" data-cy="filter-by-label">
                                Filter By:
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  minHeight: '50px',
                                  maxHeight: '100px',
                                  overflowY: 'auto',
                                  alignItems: 'center',
                                }}
                                className="selected-section d-flex"
                              >
                                {isFilterApplied() ? (
                                  <Button
                                    onClick={clearAllFilters}
                                    darkMode={props.darkMode}
                                    size="md"
                                    styles={{
                                      border: 'none',
                                      backgroundColor: '#F0F4FF',
                                      color: props.darkMode ? '#64748B' : '#3E63DD',
                                      height: '32px',
                                    }}
                                  >
                                    <Button.Content title={'Clear all filters'} />
                                  </Button>
                                ) : (
                                  <div className="d-flex align-items-center">
                                    <div>
                                      <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 22 22"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <rect width="22" height="22" rx="2" fill="#F1F3F5" />
                                        <path
                                          opacity="0.4"
                                          d="M9.81465 6.43012C10.3313 5.52329 11.6687 5.52329 12.1853 6.43012L16.6607 14.2856C17.1628 15.1669 16.5093 16.25 15.4754 16.25H6.52459C5.49067 16.25 4.83713 15.1669 5.33925 14.2856L9.81465 6.43012Z"
                                          fill="#889096"
                                        />
                                        <path
                                          d="M11.5833 13.9154C11.5833 14.2375 11.3222 14.4987 11 14.4987C10.6778 14.4987 10.4167 14.2375 10.4167 13.9154C10.4167 13.5932 10.6778 13.332 11 13.332C11.3222 13.332 11.5833 13.5932 11.5833 13.9154Z"
                                          fill="#889096"
                                        />
                                        <path
                                          fill-rule="evenodd"
                                          clip-rule="evenodd"
                                          d="M11 8.8125C11.2416 8.8125 11.4375 9.00838 11.4375 9.25V12.1667C11.4375 12.4083 11.2416 12.6042 11 12.6042C10.7584 12.6042 10.5625 12.4083 10.5625 12.1667V9.25C10.5625 9.00838 10.7584 8.8125 11 8.8125Z"
                                          fill="#889096"
                                        />
                                      </svg>
                                    </div>

                                    <div className="filter-by-text mx-2" data-cy="filter-by-label">
                                      No filters applied
                                    </div>
                                  </div>
                                )}

                                <AuditLogs.GenerateFilterBy data={selectedSearchOptions} closeFilter={closeFilter} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="container-xl mt-2">
                      <div
                        style={{
                          maxHeight: '440px',
                          minHeight: '400px',
                          marginTop: '2rem',
                        }}
                        className="card"
                      >
                        <div className="row mt-1">
                          <div className="col-12">
                            <div className="table-responsive px-2" style={{ maxHeight: '400px', overflow: 'auto' }}>
                              <table
                                style={{ height: auditLogs?.length === 0 || !auditLogs ? '400px' : 'inherit' }}
                                data-testid="usersTable"
                                className="table table-vcenter"
                                disabled={true}
                              >
                                {isLoadingAuditLogs ? (
                                  <tbody className="w-100">
                                    {Array.from(Array(10)).map((index) => (
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
                                          {humanizeLog(auditLog)}
                                          <ReactJson
                                            src={auditLog}
                                            theme={props.darkMode ? 'shapeshifter' : 'rjv-default'}
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
                                  <tbody className="">
                                    <tr>
                                      <td>
                                        <div className="text-center">No results found</div>
                                      </td>
                                    </tr>
                                  </tbody>
                                )}
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
          <AuditLogs.Footer
            darkMode={props.darkMode}
            totalPage={totalPages}
            pageCount={currentPage}
            dataLoading={isLoadingAuditLogs}
            gotoNextPage={goToNextPageAuditLogs}
            gotoPreviousPage={goToPreviousPageAuditLogs}
          />
        </div>
      </Layout>
    );
  } else {
    return <Navigate to={`/${current_organization_id}`} />;
  }
};

const Footer = ({ darkMode, totalPage, pageCount, dataLoading, gotoNextPage, gotoPreviousPage }) => {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: '0',
      }}
      className={`card-footer d-flex align-items-center jet-table-footer justify-content-center`}
    >
      <div className="row gx-0" data-cy="table-footer-section">
        <Pagination
          darkMode={darkMode}
          gotoNextPage={gotoNextPage}
          gotoPreviousPage={gotoPreviousPage}
          currentPage={pageCount}
          totalPage={totalPage}
          isDisabled={dataLoading}
          disableInput={true}
        />
      </div>
    </div>
  );
};

const GenerateFilterBy = ({ data, closeFilter }) => {
  const types = ['users', 'apps', 'resources', 'actions'];

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  if (!Object.keys(data).length) return null;

  const icon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="icon icon-tabler icon-tabler-x"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        strokeWidth="1"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <line x1={18} y1={6} x2={6} y2={18}></line>
        <line x1={6} y1={6} x2={18} y2={18}></line>
      </svg>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
      }}
    >
      {types.map((type) => {
        if (!data[type] || data[type]?.length === 0) return null;
        return (
          <div
            key={type}
            style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', width: 'fit-content' }}
            className="mx-2"
          >
            <div className="selected-text" data-cy={`${String(type).toLowerCase()}-heading-text`}>
              {capitalizeFirstLetter(type)}
            </div>
            {Array.isArray(data[type]) &&
              data[type]?.map((d) => {
                return (
                  <div key={d.value} className="mx-2 mt-1">
                    <Tag
                      text={d.name}
                      handleIconCallBack={() => closeFilter(type, d.value)}
                      type={'filter'}
                      dataCy={String(d.name).toLowerCase().replace(/\s+/g, '-')}
                      renderIcon={icon}
                    />
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
};

AuditLogs.GenerateFilterBy = GenerateFilterBy;
AuditLogs.Footer = Footer;

export const AuditLogsPage = withRouter(AuditLogs);
