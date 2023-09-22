import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import FolderList from '@/_ui/FolderList/FolderList';
import { LicenseKey } from './LicenseKey';
import { Limits } from './Limits';
import { Access } from './Access';
import { Domains } from './Domains';
import { licenseService } from '@/_services/license.service';
import { getDateDifferenceInDays, convertDateFormat } from '@/_helpers/utils';
import Skeleton from 'react-loading-skeleton';

function ManageLicenseKey({ fetchFeatureAccessForInstanceSettings }) {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('licenseKey');
  const [sidebarNavs, setSidebarNavs] = useState(['License Key']);
  const [featureAccess, setFeatureAccess] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const expiryDate = featureAccess?.licenseStatus?.expiryDate;

  const defaultOrgName = (groupName) => {
    switch (groupName) {
      case 'License Key':
        return 'licenseKey';
      case 'Limits':
        return 'limits';
      case 'Access':
        return 'access';
      case 'Domain':
        return 'domain';
      default:
        return groupName;
    }
  };

  useEffect(() => {
    fetchFeatureAccess();
  }, [selectedTab]);

  const fetchFeatureAccess = () => {
    setIsLoading(true);
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess(data);
      fetchFeatureAccessForInstanceSettings();
      setSidebarNavs(['License Key', 'Limits', 'Access', 'Domain']);
      setIsLoading(false);
    });
  };

  const generatelicenseExpiryStatus = () => {
    const daysLeft = expiryDate && getDateDifferenceInDays(new Date(), new Date(expiryDate));
    switch (true) {
      case featureAccess?.licenseStatus?.isExpired:
        return {
          text: 'License Expired',
          className: 'expiry-status',
        };
      case daysLeft <= 14:
        return {
          text: `Expiring in ${daysLeft} day(s)`,
          className: 'expiry-status',
        };
      default:
        return {
          text: `Valid till ${convertDateFormat(expiryDate)} (UTC)`,
          className: 'valid-status',
        };
    }
  };

  const licenseExpiryStatus = generatelicenseExpiryStatus();

  return (
    <div className="wrapper enterprise-page">
      <div className="wrapper license-page">
        <div className="row gx-0 body-wrapper">
          <div className="license-page-sidebar col ">
            <div className="license-nav-list-wrap">
              {sidebarNavs.map((item, index) => {
                return (
                  <>
                    <FolderList
                      className="workspace-settings-nav-items"
                      key={index}
                      onClick={() => {
                        setSelectedTab(defaultOrgName(item));
                      }}
                      selectedItem={selectedTab == defaultOrgName(item)}
                      dataCy={item.toLowerCase().replace(/\s+/g, '-')}
                    >
                      {item}
                    </FolderList>
                  </>
                );
              })}
            </div>
          </div>
          <div className={cx('col license-content-wrapper')}>
            <div className="col tj-dashboard-header-wrap font-weight-500 license-header-wrap">
              <div>{sidebarNavs.find((nav) => selectedTab === defaultOrgName(nav))}</div>
              {!isLoading ? (
                expiryDate && (
                  <div className={`status-container ${licenseExpiryStatus.className}`}>{licenseExpiryStatus.text}</div>
                )
              ) : (
                <Skeleton width="150px" height="20px" />
              )}
            </div>
            <div className="content-wrapper">
              {selectedTab === 'licenseKey' && (
                <LicenseKey fetchFeatureAccess={fetchFeatureAccess} featureAccess={featureAccess} />
              )}
            </div>
            <>
              <div className="content-wrapper">{selectedTab === 'limits' && <Limits />}</div>
              <div className="content-wrapper">{selectedTab === 'access' && <Access />}</div>
              <div className="content-wrapper">{selectedTab === 'domain' && <Domains />}</div>
            </>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ManageLicenseKey };
