import React, { useState, useCallback, useEffect } from 'react';
import { organizationService } from '@/_services';
import { Menu } from '@/_components';
import ReactTooltip from 'react-tooltip';
import { GeneralSettings } from './GeneralSettings';
import { Google } from './Google';
import { Loader } from './Loader';
import { Git } from './Git';
import { Form } from './Form';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import { toast } from 'react-hot-toast';

export function ManageSSO({ darkMode }) {
  const menuItems = [
    { id: 'general-settings', label: 'General Settings' },
    { id: 'google', label: 'Google' },
    { id: 'git', label: 'GitHub' },
    { id: 'form', label: 'Password Login' },
  ];
  const { t } = useTranslation();
  const changePage = useCallback(
    (page) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );
  const [currentPage, setCurrentPage] = useState('');
  const [isLoading, setIsloading] = useState(true);
  const [ssoData, setSsoData] = useState({});
  const [instanceSettings, setInstanceSettings] = useState({});

  const showPage = () => {
    switch (currentPage) {
      case 'general-settings':
        return <GeneralSettings updateData={updateData} settings={ssoData} instanceSettings={instanceSettings} />;
      case 'google':
        return <Google updateData={updateData} settings={ssoData?.sso_configs?.find((obj) => obj.sso === 'google')} />;
      case 'git':
        return <Git updateData={updateData} settings={ssoData?.sso_configs?.find((obj) => obj.sso === 'git')} />;
      case 'form':
        return (
          <Form
            updateData={updateData}
            settings={ssoData?.sso_configs?.find((obj) => obj.sso === 'form')}
            darkMode={darkMode}
          />
        );
      default:
        return <Loader />;
    }
  };

  useEffect(() => {
    organizationService
      .getSSODetails()
      .then((data) => {
        setSsoData(data.organization_details);
        setInstanceSettings(data.instance_configs);
        setIsloading(false);
        setCurrentPage('general-settings');
      })
      .catch(() => {
        setIsloading(false);
        toast.error('Failed to fetch SSO details');
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
    <ErrorBoundary showFallback={true}>
      <div className="wrapper manage-sso animation-fade">
        <ReactTooltip type="dark" effect="solid" delayShow={250} />
        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <div className="page-pretitle"></div>
                  <h2 className="page-title" data-cy="manage-sso-page-title">
                    {t('header.organization.menus.manageSSO.manageSso', 'SSO')}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <div className="page-body">
            <div className="container-xl">
              <div className="row">
                <div className="col-3">
                  <div>
                    <Menu isLoading={isLoading} items={menuItems} onChange={changePage} selected={currentPage} />
                  </div>
                </div>
                <div className="col-9">{showPage()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
