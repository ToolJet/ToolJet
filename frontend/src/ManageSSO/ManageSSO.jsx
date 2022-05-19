import React, { useState, useCallback, useEffect } from 'react';
import { organizationService } from '@/_services';
import { Header, Menu } from '@/_components';
import ReactTooltip from 'react-tooltip';
import { GeneralSettings } from './GeneralSettings';
import { Google } from './Google';
import { Loader } from './Loader';
import { Git } from './Git';
import { Form } from './Form';

export function ManageSSO({ switchDarkMode, darkMode }) {
  const menuItems = [
    { id: 'general-settings', label: 'General Settings' },
    { id: 'google', label: 'Google' },
    { id: 'git', label: 'Git' },
    { id: 'form', label: 'Password Login' },
  ];
  const changePage = useCallback(
    (page) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );
  const [currentPage, setCurrentPage] = useState('');
  const [isLoading, setIsloading] = useState(true);
  const [ssoData, setSsoData] = useState({});

  const showPage = () => {
    switch (currentPage) {
      case 'general-settings':
        return <GeneralSettings updateData={updateData} settings={ssoData} />;
      case 'google':
        return <Google updateData={updateData} settings={ssoData?.sso_configs?.find((obj) => obj.sso === 'google')} />;
      case 'git':
        return <Git updateData={updateData} settings={ssoData?.sso_configs?.find((obj) => obj.sso === 'git')} />;
      case 'form':
        return <Form updateData={updateData} settings={ssoData?.sso_configs?.find((obj) => obj.sso === 'form')} />;
      default:
        return <Loader />;
    }
  };

  useEffect(() => {
    organizationService.getSSODetails().then((data) => {
      setSsoData(data.organization_details);
      setIsloading(false);
      setCurrentPage('general-settings');
    });
  }, []);

  const updateData = useCallback(
    (type, data) => {
      const ssoData_tmp = ssoData;
      let configs = ssoData_tmp.sso_configs.find((obj) => obj.sso === type);

      switch (type) {
        case 'general':
          return setSsoData({ ...ssoData, ...data });
        default:
          if (!configs) {
            // Enable/Disable
            ssoData_tmp.sso_configs.push({ ...data, sso: type });
          } else {
            // Change configs
            if (data.id !== undefined) {
              configs.id = data.id;
            }
            if (data.enabled !== undefined) {
              configs.enabled = data.enabled;
            }
            if (data.configs !== undefined) {
              configs.configs = data.configs;
            }
          }
          return setSsoData(ssoData_tmp);
      }
    },
    [ssoData]
  );

  return (
    <div className="wrapper manage-sso">
      <Header switchDarkMode={switchDarkMode} darkMode={darkMode} />
      <ReactTooltip type="dark" effect="solid" delayShow={250} />

      <div className="page-wrapper">
        <div className="container-xl">
          <div className="page-header d-print-none">
            <div className="row align-items-center">
              <div className="col">
                <div className="page-pretitle"></div>
                <h2 className="page-title">Manage SSO</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="page-body">
          <div className="container-xl">
            <div className="row">
              <div className="col-3">
                <div>
                  {isLoading ? (
                    <div className="row">
                      <div className="row">
                        <div className="skeleton-line"></div>
                      </div>
                      <div className="row">
                        <div className="skeleton-line"></div>
                      </div>
                      <div className="row">
                        <div className="skeleton-line"></div>
                      </div>
                    </div>
                  ) : (
                    <Menu items={menuItems} onChange={changePage} selected={currentPage} />
                  )}
                </div>
              </div>
              <div className="col-9">{showPage()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
