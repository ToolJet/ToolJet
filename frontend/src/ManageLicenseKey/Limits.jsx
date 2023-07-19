import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons.jsx';
import { userService, organizationService, appService } from '@/_services';

const Limits = () => {
  const [currentTab, setCurrentTab] = useState('apps');
  const [limitsData, setLimitsData] = useState([]);
  const [licenseStatus, setLicenseStatus] = useState({});

  useEffect(() => {
    let service;
    if (currentTab === 'apps') {
      service = appService.getAppsLimit();
    } else if (currentTab === 'workspaces') {
      service = organizationService.getWorkspacesLimit();
    } else if (currentTab === 'users') {
      service = userService.getUserLimits('all');
    }

    service.then((data) => {
      setLimitsData([
        ...Object.keys(data)
          .filter((key) => data[key] !== null)
          .map((limit) => data[limit]),
      ]);
      setLicenseStatus({ licenseStatus: data?.licenseStatus });
    });
  }, [currentTab]);

  return (
    <>
      <nav className="nav nav-tabs groups-sub-header-wrap">
        <a onClick={() => setCurrentTab('apps')} className={cx('nav-item nav-link', { active: currentTab === 'apps' })}>
          <SolidIcon
            className="manage-group-tab-icons"
            fill={currentTab === 'apps' ? '#3E63DD' : '#C1C8CD'}
            name="grid"
            width="16"
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
                      value={`${limit?.current}/${limit?.total}`}
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
