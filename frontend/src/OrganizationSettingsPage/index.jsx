import React, { useEffect, useState, useContext } from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import Layout from '@/_ui/Layout';
import { ManageOrgUsers } from '@/ManageOrgUsers';
import { ManageGroupPermissions } from '@/ManageGroupPermissions';
import { ManageSSO } from '@/ManageSSO';
import { ManageOrgVars } from '@/ManageOrgVars';
import { authenticationService } from '@/_services';
import { BreadCrumbContext } from '../App/App';

export function OrganizationSettings(props) {
  const { admin } = authenticationService.currentUserValue;
  const [selectedTab, setSelectedTab] = useState(admin ? 'users' : 'manageEnvVars');
  const { t } = useTranslation();
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const selectedClassName = props.darkMode ? 'bg-dark-indigo' : 'bg-light-indigo';

  useEffect(() => {
    updateSidebarNAV('users');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
        <div className="wrapper organization-settings-page">
          <div className="row gx-0">
            <div className="organization-page-sidebar col border-end p-3">
              <div className="list-group">
                {admin && (
                  <>
                    <div
                      className={cx(
                        'list-group-item tj-list-item h-4 cursor-pointer list-group-item-action d-flex align-items-center mb-1 border-0 ',
                        {
                          [selectedClassName]: selectedTab === 'users',
                          'text-white': props.darkMode,
                        }
                      )}
                      onClick={() => {
                        setSelectedTab('users');
                        updateSidebarNAV('Users');
                      }}
                    >
                      &nbsp;{t('header.organization.menus.menusList.manageUsers', 'Users')}
                    </div>
                    <div
                      className={cx(
                        'tj-list-item list-group-item h-4 cursor-pointer list-group-item-action d-flex align-items-center mb-1 border-0',
                        {
                          [selectedClassName]: selectedTab === 'manageGroups',
                          'text-white': props.darkMode,
                        }
                      )}
                      onClick={() => {
                        setSelectedTab('manageGroups');
                        updateSidebarNAV('Groups');
                      }}
                    >
                      &nbsp;{t('header.organization.menus.menusList.manageGroups', 'Manage Groups')}
                    </div>
                    <div
                      className={cx(
                        'tj-list-item list-group-item h-4 cursor-pointer list-group-item-action d-flex align-items-center mb-1 border-0',
                        {
                          [selectedClassName]: selectedTab === 'manageSSO',
                          'text-white': props.darkMode,
                        }
                      )}
                      onClick={() => {
                        setSelectedTab('manageSSO');
                        updateSidebarNAV('SSO');
                      }}
                    >
                      &nbsp;{t('header.organization.menus.menusList.manageSso', 'SSO')}
                    </div>
                  </>
                )}
                <div
                  className={cx(
                    'tj-list-item list-group-item h-4 cursor-pointer list-group-item-action d-flex align-items-center mb-1 border-0 ',
                    {
                      [selectedClassName]: selectedTab === 'manageEnvVars',
                      'text-white': props.darkMode,
                    }
                  )}
                  onClick={() => {
                    setSelectedTab('manageEnvVars');
                    updateSidebarNAV('Worksapce variables');
                  }}
                >
                  &nbsp;{t('header.organization.menus.menusList.manageEnv', 'Manage Environment Variables')}
                </div>
              </div>
            </div>
            <div
              className={cx('col workspace-content-wrapper', {
                'bg-light-gray': !props.darkMode,
              })}
              style={{ paddingTop: '40px', paddingLeft: '16px' }}
            >
              <div className="w-100 mb-5">
                {selectedTab === 'users' && <ManageOrgUsers darkMode={props.darkMode} />}
                {selectedTab === 'manageGroups' && <ManageGroupPermissions darkMode={props.darkMode} />}
                {selectedTab === 'manageSSO' && <ManageSSO />}
                {selectedTab === 'manageEnvVars' && <ManageOrgVars darkMode={props.darkMode} />}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
