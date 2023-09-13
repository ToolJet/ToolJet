import React, { useState, useCallback, useEffect } from 'react';
import { organizationService, licenseService } from '@/_services';
import { GeneralSettings } from './GeneralSettings';
import { Google } from './Google';
import { Loader } from './Loader';
import { Git } from './Git';
import { Form } from './Form';
import { OpenId } from './OpenId';
import { Ldap } from './Ldap';
// eslint-disable-next-line import/no-unresolved
import ErrorBoundary from '@/Editor/ErrorBoundary';
import { toast } from 'react-hot-toast';
import FolderList from '@/_ui/FolderList/FolderList';
import { LicenseTooltip } from '@/LicenseTooltip';

export function ManageSSO({ darkMode }) {
  const [featureAccess, setFeatureAccess] = useState({});
  const menuItems = [
    { id: 'general-settings', label: 'General Settings' },
    { id: 'google', label: 'Google' },
    { id: 'git', label: 'GitHub' },
    { id: 'openid', label: 'OpenID Connect' },
    { id: 'ldap', label: 'LDAP' },
  ];
  const protectedMenuItems = [
    { id: 'openid', label: 'OpenID Connect' },
    { id: 'ldap', label: 'LDAP' },
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
  const [instanceSettings, setInstanceSettings] = useState({});

  const showPage = () => {
    switch (currentPage) {
      case 'general-settings':
        return (
          <GeneralSettings
            updateData={updateData}
            settings={ssoData}
            instanceSettings={instanceSettings}
            darkMode={darkMode}
          />
        );
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
      case 'ldap':
        return <Ldap updateData={updateData} settings={ssoData?.sso_configs?.find((obj) => obj.sso === 'ldap')} />;
      case 'openid':
        return <OpenId updateData={updateData} settings={ssoData?.sso_configs?.find((obj) => obj.sso === 'openid')} />;
      default:
        return <Loader />;
    }
  };

  useEffect(() => {
    fetchFeatureAccess();
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

  const fetchFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess({ ...data });
    });
  };

  return (
    <ErrorBoundary showFallback={true}>
      <div className="wrapper manage-sso animation-fade">
        <div className="page-wrapper">
          <div className="container-xl">
            <div className="manage-sso-container">
              <div className="d-flex org-settings-wrapper-card">
                <div className="left-menu">
                  <ul data-cy="left-menu-items tj-text-xsm">
                    {menuItems.map((item, index) => {
                      const protectedMenuIndex = protectedMenuItems.some((menuItem) => item.id === menuItem.id);
                      const Wrapper = ({ children, key }) =>
                        protectedMenuIndex ? (
                          <LicenseTooltip
                            key={key}
                            limits={featureAccess}
                            feature={item?.label}
                            isAvailable={featureAccess[item.id]}
                          >
                            {children}
                          </LicenseTooltip>
                        ) : (
                          <>{children}</>
                        );
                      return (
                        <Wrapper key={index}>
                          <FolderList
                            onClick={() => {
                              if (featureAccess[item.id]) {
                                changePage(item.id);
                              } else if (!protectedMenuIndex) {
                                changePage(item.id);
                              }
                            }}
                            selectedItem={currentPage == item.id}
                            items={menuItems}
                            onChange={changePage}
                            isLoading={isLoading}
                            dataCy={`${String(item.label).toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {item.label}
                          </FolderList>
                        </Wrapper>
                      );
                    })}
                  </ul>
                </div>
                <div style={{ width: '75%' }}>{showPage()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
