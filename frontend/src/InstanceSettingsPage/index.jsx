import React, { useState } from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import Layout from '@/_ui/Layout';
import { ManageAllUsers } from '@/ManageAllUsers';
import { ManageInstanceSettings } from '@/ManageInstanceSettings';

export function InstanceSettings(props) {
  const [selectedTab, setSelectedTab] = useState('users');
  const { t } = useTranslation();
  const selectedClassName = props.darkMode ? 'bg-dark-indigo' : 'bg-light-indigo';
  return (
    <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
      <div className="wrapper organization-settings-page">
        <div className="row gx-0">
          <div className="organization-page-sidebar col p-3 border-end">
            <div className="list-group">
              <div
                className={cx(
                  'list-group-item h-4 cursor-pointer list-group-item-action d-flex align-items-center mb-1 border-0 ',
                  {
                    [selectedClassName]: selectedTab === 'users',
                    'text-white': props.darkMode,
                  }
                )}
                onClick={() => setSelectedTab('users')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7.99967 2.66659C6.8951 2.66659 5.99967 3.56202 5.99967 4.66659C5.99967 5.77115 6.8951 6.66659 7.99967 6.66659C9.10424 6.66659 9.99967 5.77115 9.99967 4.66659C9.99967 3.56202 9.10424 2.66659 7.99967 2.66659ZM4.66634 4.66659C4.66634 2.82564 6.15873 1.33325 7.99967 1.33325C9.84062 1.33325 11.333 2.82564 11.333 4.66659C11.333 6.50753 9.84062 7.99992 7.99967 7.99992C6.15873 7.99992 4.66634 6.50753 4.66634 4.66659Z"
                    fill="#C1C8CD"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.66634 10.6666C6.13591 10.6666 5.6272 10.8773 5.25213 11.2524C4.87705 11.6274 4.66634 12.1362 4.66634 12.6666V13.9999C4.66634 14.3681 4.36786 14.6666 3.99967 14.6666C3.63148 14.6666 3.33301 14.3681 3.33301 13.9999V12.6666C3.33301 11.7825 3.6842 10.9347 4.30932 10.3096C4.93444 9.68444 5.78229 9.33325 6.66634 9.33325H9.33301C10.2171 9.33325 11.0649 9.68444 11.69 10.3096C12.3152 10.9347 12.6663 11.7825 12.6663 12.6666V13.9999C12.6663 14.3681 12.3679 14.6666 11.9997 14.6666C11.6315 14.6666 11.333 14.3681 11.333 13.9999V12.6666C11.333 12.1362 11.1223 11.6274 10.7472 11.2524C10.3721 10.8773 9.86344 10.6666 9.33301 10.6666H6.66634Z"
                    fill="#C1C8CD"
                  />
                </svg>
                &nbsp;{t('header.instance.menus.menusList.manageAllUsers', 'Manage All Users')}
              </div>
              <div
                className={cx(
                  'list-group-item h-4 cursor-pointer list-group-item-action d-flex align-items-center mb-1 border-0 ',
                  {
                    [selectedClassName]: selectedTab === 'manageEnvVars',
                    'text-white': props.darkMode,
                  }
                )}
                onClick={() => setSelectedTab('manageEnvVars')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.3333 2.33325C11.7015 2.33325 12 2.63173 12 2.99992V4.11019L13.0066 3.54416C13.3275 3.36369 13.734 3.47756 13.9144 3.79848C14.0949 4.11941 13.981 4.52588 13.6601 4.70634L12.6932 5.25009L13.6602 5.79424C13.9811 5.97479 14.0949 6.38128 13.9143 6.70217C13.7338 7.02305 13.3273 7.13681 13.0064 6.95626L12 6.38998V7.49992C12 7.86811 11.7015 8.16659 11.3333 8.16659C10.9651 8.16659 10.6667 7.86811 10.6667 7.49992V6.38998L9.66025 6.95626C9.33937 7.13681 8.93287 7.02305 8.75232 6.70217C8.57177 6.38128 8.68554 5.97479 9.00642 5.79424L9.97351 5.25009L9.00657 4.70634C8.68564 4.52588 8.57177 4.11941 8.75224 3.79848C8.93271 3.47756 9.33917 3.36369 9.6601 3.54416L10.6667 4.11019V2.99992C10.6667 2.63173 10.9651 2.33325 11.3333 2.33325ZM4.33333 10.6666C4.06812 10.6666 3.81376 10.7719 3.62623 10.9595C3.43869 11.147 3.33333 11.4014 3.33333 11.6666C3.33333 11.9318 3.43869 12.1862 3.62623 12.3737C3.81376 12.5612 4.06812 12.6666 4.33333 12.6666C4.59855 12.6666 4.8529 12.5612 5.04044 12.3737C5.22798 12.1862 5.33333 11.9318 5.33333 11.6666C5.33333 11.4014 5.22798 11.147 5.04044 10.9595C4.8529 10.7719 4.59855 10.6666 4.33333 10.6666ZM2.68342 10.0167C3.121 9.57908 3.71449 9.33325 4.33333 9.33325C4.95217 9.33325 5.54566 9.57908 5.98325 10.0167C6.42083 10.4543 6.66667 11.0477 6.66667 11.6666C6.66667 12.2854 6.42083 12.8789 5.98325 13.3165C5.54566 13.7541 4.95217 13.9999 4.33333 13.9999C3.71449 13.9999 3.121 13.7541 2.68342 13.3165C2.24583 12.8789 2 12.2854 2 11.6666C2 11.0477 2.24583 10.4543 2.68342 10.0167Z"
                    fill="#C1C8CD"
                  />
                </svg>
                &nbsp;{t('header.instance.menus.menusList.manageEnvVariables', 'Manage Instance Settings')}
              </div>
            </div>
          </div>
          <div
            className={cx('col p-3', {
              'bg-light-gray': !props.darkMode,
            })}
          >
            <div className="w-100 mb-5">
              {selectedTab === 'users' && <ManageAllUsers darkMode={props.darkMode} />}
              {selectedTab === 'manageEnvVars' && <ManageInstanceSettings />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
