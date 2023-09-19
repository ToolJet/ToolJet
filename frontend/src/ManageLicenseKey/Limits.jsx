import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons.jsx';
import { userService, organizationService, appService, tooljetDatabaseService } from '@/_services';
import { LoadingScreen } from './LoadingScreen';

const Limits = () => {
  const [currentTab, setCurrentTab] = useState('apps');
  const [limitsData, setLimitsData] = useState([]);
  const [loading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      let service;
      if (currentTab === 'apps') {
        service = await appService.getAppsLimit();
      } else if (currentTab === 'workspaces') {
        service = await organizationService.getWorkspacesLimit();
      } else if (currentTab === 'users') {
        service = await userService.getUserLimits('all');
      } else if (currentTab === 'tables') {
        service = await tooljetDatabaseService.getTablesLimit();
        service = service.data;
      }

      const data = Object.keys(service)
        .filter((key) => service[key] !== null)
        .map((limit) => service[limit]);
      setLimitsData(data);
      setIsLoading(false);
    };

    fetchData();
  }, [currentTab]);

  return loading ? (
    <LoadingScreen />
  ) : (
    <>
      <nav className="nav nav-tabs groups-sub-header-wrap">
        <a onClick={() => setCurrentTab('apps')} className={cx('nav-item nav-link', { active: currentTab === 'apps' })}>
          <SolidIcon
            className="manage-group-tab-icons"
            fill={currentTab === 'apps' ? '#3E63DD' : '#C1C8CD'}
            name="grid"
            width="16"
            viewBox={'0 0 29 29'}
          ></SolidIcon>
          Apps
        </a>
        <a
          onClick={() => setCurrentTab('workspaces')}
          className={cx('nav-item nav-link', { active: currentTab === 'workspaces' })}
          data-cy="users-link"
        >
          <SolidIcon
            name="workspace"
            fill={currentTab === 'workspaces' ? '#3E63DD' : '#C1C8CD'}
            className="manage-group-tab-icons"
            width="16"
            viewBox={'0 0 16 16'}
          ></SolidIcon>
          Workspaces
        </a>
        <a
          onClick={() => setCurrentTab('users')}
          className={cx('nav-item nav-link', { active: currentTab === 'users' })}
          data-cy="permissions-link"
        >
          <SolidIcon
            className="manage-group-tab-icons"
            fill={currentTab === 'users' ? '#3E63DD' : '#C1C8CD'}
            name="usergroup"
            width="16"
          ></SolidIcon>
          Users
        </a>
        {window.public_config?.ENABLE_TOOLJET_DB === 'true' && (
          <a
            onClick={() => setCurrentTab('tables')}
            className={cx('nav-item nav-link', { active: currentTab === 'tables' })}
            data-cy="tables-link"
          >
            <SolidIcon
              name="table"
              fill={currentTab === 'tables' ? '#3E63DD' : '#C1C8CD'}
              className="manage-group-tab-icons"
              width="16"
              viewBox={'0 0 28 28'}
            ></SolidIcon>
            Tables
          </a>
        )}
      </nav>
      <div className="metrics-wrapper">
        <div className="tab-content">
          <div className={`tab-pane active show`}>
            <div className="limits-content mt-3">
              {limitsData.map((limit) => (
                <div key={limit?.label} className="d-flex align-items-center metric">
                  <div className="tj-text-sm">Number of {limit?.label}</div>
                  <div className="input-wrapper">
                    <input
                      readOnly
                      type="text"
                      className={cx('form-control', { 'error-border': limit?.total === limit?.current })}
                      value={limit?.canAddUnlimited ? 'Unlimited' : `${limit?.current}/${limit?.total}`}
                    />
                    {limit?.total === limit?.current && <div className="error-text">Exceeding Limit</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { Limits };
