import React, { useContext, useEffect, useState } from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import FolderList from '@/_ui/FolderList/FolderList';
import { Limits } from './Limits';
import { Access } from './Access';
import { licenseService } from '@/_services/license.service';
import { getDateDifferenceInDays, convertDateFormat } from '@/_helpers/utils';
import Skeleton from 'react-loading-skeleton';
import { SubscriptionKey } from './SubscriptionKey';
import UpgradePlan from './UpgradePlan';
import { authenticationService } from '@/_services';
import toast from 'react-hot-toast';
import { BreadCrumbContext } from '@/App';
import posthog from 'posthog-js';
import ChatwootIntegration from '@/_components/ChatwootIntegration';
import { PLANS } from '@/_helpers/constants';

function ManageSubscriptionKey({ darkMode }) {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('subscriptionKey');
  const [sidebarNavs, setSidebarNavs] = useState(['Subscription key']);
  const [featureAccess, setFeatureAccess] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { load_app, current_organization_id } = authenticationService.currentSessionValue;
  const expiryDate = featureAccess?.licenseStatus?.expiryDate;
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const currentTab = searchParams.get('currentTab');

  useEffect(() => {
    return () => {
      if (window.$chatwoot?.hasLoaded) {
        window.$chatwoot?.toggleBubbleVisibility('hide');
      }
    };
  }, []);

  const defaultOrgName = (groupName) => {
    switch (groupName) {
      case 'Subscription key':
        return 'subscriptionKey';
      case 'Limits':
        return 'limits';
      case 'Access':
        return 'access';
      case 'Upgrade plan':
        return 'upgradePlan';
      default:
        return groupName;
    }
  };

  const headerName = (groupName) => {
    switch (groupName) {
      case 'subscriptionKey':
        return 'Subscription key';
      case 'limits':
        return 'Limits';
      case 'access':
        return 'Access';
      case 'upgradePlan':
        return 'Upgrade to business plan';
      default:
        return groupName;
    }
  };

  useEffect(() => {
    fetchFeatureAccess();
    if ((load_app && paymentStatus) || currentTab) {
      switch (true) {
        case paymentStatus === 'failure':
          toast.error('Plan could not be upgraded. Please try again!', {
            style: {
              maxWidth: '280px',
              wordBreak: 'normal',
            },
          });
          break;
        case paymentStatus === 'success':
          toast.success('Payment success, your account will be upgraded shortly', {
            position: 'top-center',
            style: {
              maxWidth: '280px',
            },
          });
          break;
        default:
          break;
      }
      setSelectedTab('upgradePlan');
    }
    searchParams.delete('payment');
    searchParams.delete('currentTab');
    setSearchParams(searchParams);
  }, [selectedTab, paymentStatus, currentTab]);

  const fetchFeatureAccess = () => {
    setIsLoading(true);
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess(data);
      setSidebarNavs(['Subscription key', 'Limits', 'Access', 'Upgrade plan']);
      setIsLoading(false);
    });
  };

  const generatelicenseExpiryStatus = () => {
    const daysLeft = expiryDate && getDateDifferenceInDays(new Date(), new Date(expiryDate));
    switch (true) {
      case featureAccess?.licenseStatus?.isExpired:
        return {
          text: 'Subscription Expired',
          className: 'expiry-status',
        };
      case ![PLANS.BUSINESS, PLANS.ENTERPRISE].includes(featureAccess?.licenseStatus?.licenseType) && daysLeft < 14:
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
                        if (item === 'Upgrade plan') {
                          posthog.capture('click_upgrade_plan_menu', {
                            workspace_id:
                              authenticationService?.currentUserValue?.organization_id ||
                              authenticationService?.currentSessionValue?.current_organization_id,
                          });
                        }
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
            <div
              className={`col tj-dashboard-header-wrap font-weight-500 license-header-wrap ${
                selectedTab === 'limits' && 'border-none'
              }`}
            >
              <div>{headerName(selectedTab)}</div>
              {!isLoading ? (
                expiryDate && (
                  <div className={`status-container ${licenseExpiryStatus.className}`}>{licenseExpiryStatus.text}</div>
                )
              ) : (
                <Skeleton width="150px" height="20px" />
              )}
            </div>
            <div className="content-wrapper">
              {selectedTab === 'subscriptionKey' && (
                <SubscriptionKey fetchFeatureAccess={fetchFeatureAccess} featureAccess={featureAccess} />
              )}
            </div>
            <>
              <div className="content-wrapper">{selectedTab === 'limits' && <Limits />}</div>
              <div className="content-wrapper">{selectedTab === 'access' && <Access />}</div>
              <div className="content-wrapper">
                {selectedTab === 'upgradePlan' && <UpgradePlan current_organization_id={current_organization_id} />}
              </div>
            </>
          </div>
        </div>
      </div>
      <ChatwootIntegration
        token="oN4XrHrWTqwPTgj66JuzVrje"
        darkMode={darkMode}
        currentUser={authenticationService.currentSessionValue?.current_user}
      />
    </div>
  );
}

export { ManageSubscriptionKey };
