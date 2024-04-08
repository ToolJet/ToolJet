import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { Access } from './Access';
import { licenseService, userService, appsService, tooljetDatabaseService, authenticationService } from '@/_services';
import Skeleton from 'react-loading-skeleton';
import UpgradePlan from './UpgradePlan';
import toast from 'react-hot-toast';
import posthog from 'posthog-js';
import ChatwootIntegration from '@/_components/ChatwootIntegration';
import { PLANS } from '@/_helpers/constants';
import { capitalize } from 'lodash';
import SubscriptionFooter from './SubscriptionFooter';
import ComparePlans from './ComparePlans';
import ModalBase from '@/_ui/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import DueBanner from './DueBanner';
import { centsToUSD } from '@/_helpers/utils';

const PLAN_VALUES = {
  BUILDER: 30,
  VIEWER: 10,
  YEARLY_OFF: 20,
};

const MODAL_MODE = {
  NEW: 'new',
  UPGRADE: 'upgrade',
};

const PRICES_ITEM_MAP = {
  monthly: {
    price_1OIRFKE67rQ5743Ah2HmDERq: 'viewersCount',
    price_1OIRFlE67rQ5743AguxSuphU: 'editorsCount',
  },
  yearly: {
    price_1OIRCTE67rQ5743A7kQQsJM2: 'viewersCount',
    price_1OIREkE67rQ5743Ag0BYgVKq: 'editorsCount',
  },
};

const MONTHLY_TO_YEARLY_MAP = {
  yearly: {
    price_1OIRFKE67rQ5743Ah2HmDERq: 'price_1OIRCTE67rQ5743A7kQQsJM2',
    price_1OIRFlE67rQ5743AguxSuphU: 'price_1OIREkE67rQ5743Ag0BYgVKq',
  },
  monthly: {
    price_1OIRCTE67rQ5743A7kQQsJM2: 'price_1OIRFKE67rQ5743Ah2HmDERq',
    price_1OIREkE67rQ5743Ag0BYgVKq: 'price_1OIRFlE67rQ5743AguxSuphU',
  },
};

function ManageSubscriptionKey({ darkMode }) {
  const isExpired = featureAccess?.licenseStatus?.isExpired;

  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('upgradePlan');
  const [licenseLoaded, setLicenseLoaded] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [featureAccess, setFeatureAccess] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const { workspaceId } = useParams();
  const { load_app, current_organization_id, current_user } = authenticationService.currentSessionValue;
  const licenseType = featureAccess?.licenseStatus?.licenseType;
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const currentTab = searchParams.get('currentTab');
  const [limitsData, setLimitsData] = useState([]);
  const [proration, setProration] = useState({});
  const [planForm, setPlanForm] = useState({
    viewersCount: '',
    editorsCount: '',
    subscriptionType: 'yearly',
    promoCode: '',
    includeChange: false,
  });
  const [costing, setCosting] = useState({
    totalValue: '',
    valueOff: '',
    viewerValue: PLAN_VALUES.VIEWER,
    editorValue: PLAN_VALUES.BUILDER,
  });

  const { subscriptionType, mode } = planForm;
  const prorationDate = Math.floor(Date.now() / 1000);
  const { editorsCount, viewersCount } = currentPlan ?? {};
  const upgradeEnabled =
    (planForm.editorsCount != editorsCount?.total ||
      planForm.viewersCount != viewersCount?.total ||
      subscriptionType != `${planForm.items.data[0].plan.interval}ly`) &&
    mode === MODAL_MODE.UPGRADE &&
    !isExpired;

  const REDIRECT_URL = `${window.public_config?.TOOLJET_HOST}${
    window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
  }${workspaceId}/settings/subscription`;

  useEffect(() => {
    const { viewersCount, editorsCount, subscriptionType } = planForm;
    let totalValue = viewersCount * PLAN_VALUES.VIEWER + editorsCount * PLAN_VALUES.BUILDER;
    let valueOff = (totalValue * (PLAN_VALUES.YEARLY_OFF / 100)).toFixed(2) * 12;
    let viewerValue = PLAN_VALUES.VIEWER;
    let builderValue = PLAN_VALUES.BUILDER;
    if (subscriptionType === 'yearly') {
      totalValue = (totalValue * 12 - valueOff).toFixed(2);
      viewerValue = PLAN_VALUES.VIEWER - PLAN_VALUES.VIEWER * (PLAN_VALUES.YEARLY_OFF / 100);
      builderValue = PLAN_VALUES.BUILDER - PLAN_VALUES.BUILDER * (PLAN_VALUES.YEARLY_OFF / 100);
    }
    setCosting({ valueOff, totalValue, viewerValue, builderValue });
  }, [planForm]);

  useEffect(() => {
    return () => {
      if (window.$chatwoot?.hasLoaded) {
        window.$chatwoot?.toggleBubbleVisibility('hide');
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const services = [
        appsService.getAppsLimit(),
        userService.getUserLimits('all'),
        tooljetDatabaseService.getTablesLimit(),
      ];

      const responses = await Promise.all(services);

      const mergedValues = responses.flatMap((obj) => Object.values(obj));

      setLimitsData(mergedValues);
      setIsLoading(false);
    };

    fetchData();
    fetchCurrentPlanDetails();
  }, []);

  useEffect(() => {
    fetchFeatureAccess();
    if (currentTab === 'subscriptionKey') {
      setSelectedTab(currentTab);
    } else if ((load_app && paymentStatus) || currentTab) {
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

  useEffect(() => {
    const { subscriptionType, includeChange } = planForm ?? {};
    if (upgradeEnabled && !includeChange) {
      licenseService
        .getProration({
          prorationDate,
          includeChange,
          items: planForm?.items?.data.map((item) => {
            let price;
            const isSubscriptionTypeChanged = subscriptionType !== `${item.plan.interval}ly`;
            if (isSubscriptionTypeChanged) {
              price = MONTHLY_TO_YEARLY_MAP[subscriptionType][item.plan.id];
            }
            return {
              quantity: planForm[PRICES_ITEM_MAP[`${item.plan.interval}ly`][item.plan.id]],
              id: item.id,
              price,
            };
          }),
        })
        .then((data) => {
          setProration(data);
        });
    } else {
      setProration({ amount_due: 0 });
    }
  }, [planForm]);

  const fetchCurrentPlanDetails = async () => {
    setLicenseLoaded(false);
    const data = await userService.getUserLimits('all');
    const existingPlan = await licenseService.getCurrentPlan();
    const { editorsCount, viewersCount } = data ?? {};
    setCurrentPlan(data);
    if (existingPlan) {
      const { noOfEditors, noOfReaders, subscriptionType } = existingPlan;
      setPlanForm({
        ...planForm,
        ...existingPlan,
        viewersCount: noOfReaders,
        editorsCount: noOfEditors,
        subscriptionType: subscriptionType,
        mode: MODAL_MODE.UPGRADE,
      });
    } else {
      setPlanForm({
        ...planForm,
        viewersCount: viewersCount?.current === 0 ? 1 : viewersCount?.current,
        editorsCount: editorsCount?.current,
        mode: MODAL_MODE.NEW,
      });
    }
    setLicenseLoaded(true);
  };

  const fetchFeatureAccess = () => {
    setIsLoading(true);
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess(data);
      setIsLoading(false);
    });
  };

  const generateLicenseType = () => {
    switch (true) {
      case featureAccess?.licenseStatus?.isExpired:
        return {
          text: 'Basic plan',
          className: 'basic-status',
        };
      case [PLANS.BUSINESS, PLANS.ENTERPRISE, PLANS.TRIAL].includes(licenseType):
        return {
          text: `${capitalize(licenseType)} plan`,
          className: 'valid-status',
        };
      default:
        return {
          text: `${capitalize(licenseType)} plan`,
          className: 'basic-status',
        };
    }
  };

  const updatePlanDetailsForm = (key, value) => {
    setPlanForm({
      ...planForm,
      [key]: value,
    });
  };

  const updateSubscription = () => {
    setUpgradeLoading(true);
    const { subscriptionType, includeChange } = planForm;
    const subscriptionDetails = {
      items: planForm?.items?.data.map((item) => {
        let price;
        const isSubscriptionTypeChanged = subscriptionType !== `${item.plan.interval}ly`;
        if (isSubscriptionTypeChanged) {
          price = MONTHLY_TO_YEARLY_MAP[subscriptionType][item.plan.id];
        }
        return {
          quantity: +planForm[PRICES_ITEM_MAP[`${item.plan.interval}ly`][item.plan.id]],
          id: item.id,
          price: price,
        };
      }),
      prorationDate,
      includeChange,
    };

    licenseService
      .updateSubscription(subscriptionDetails)
      .then(() => {
        setUpgradeLoading(false);
        toggleUpgradeModal();
        window.location.href = `${REDIRECT_URL}?payment=success`;
      })
      .catch(({ error }) => {
        setUpgradeLoading(false);
        toast.error(error);
      });
  };

  const upgradePlan = () => {
    setUpgradeLoading(true);
    const { viewersCount, editorsCount, subscriptionType, promoCode } = planForm;
    posthog.capture('click_billing_pay', {
      workspace_id:
        authenticationService?.currentUserValue?.organization_id ||
        authenticationService?.currentSessionValue?.current_organization_id,
      editors_count: parseInt(editorsCount),
      viewers_count: parseInt(viewersCount),
    });
    const planDetails = {
      workspaceId: current_organization_id,
      subscriptionType: subscriptionType,
      mode: 'subscription',
      customer_email: current_user?.email,
      NumberOfEditor: parseInt(editorsCount),
      NumberOfViewers: parseInt(viewersCount),
      success_url: `${REDIRECT_URL}?payment=success`,
      cancel_url: `${REDIRECT_URL}?payment=failure`,
      promo_code: promoCode,
    };
    licenseService
      .upgradePlan(planDetails)
      .then((data) => {
        window.location.href = data.redirectUrl;
      })
      .catch(({ error }) => {
        console.log({ error });
        toast.error(error, { style: { maxWidth: 'unset' } });
      })
      .finally(() => {
        setUpgradeLoading(false);
      });
  };

  const toggleUpgradeModal = () => {
    setShowUpgradeModal(!showUpgradeModal);
    fetchCurrentPlanDetails();
  };

  const footerBody = () => {
    const { mode } = planForm;
    const generateActionBtnProps = () => {
      if (upgradeEnabled || isExpired) {
        return {
          text: 'Upgrade',
          disabled: false,
          onClick: updateSubscription,
        };
      } else if (mode === MODAL_MODE.NEW) {
        return {
          text: 'Upgrade',
          disabled: false,
          onClick: upgradePlan,
        };
      } else {
        return {
          text: 'Current plan',
          disabled: true,
          onClick: () => {},
        };
      }
    };
    const actionBtnProps = generateActionBtnProps();
    return (
      <div className="upgrade-plan-footer">
        <div className="total-amount">
          <div className="font-weight-500 tj-text tj-text-md">
            ${costing.totalValue}/
            <span className="font-weight-500">{subscriptionType === 'yearly' ? 'year' : 'month'}</span>
          </div>
        </div>
        <div className="due-container">
          <div className="tj-text-md font-weight-500">
            ${mode === MODAL_MODE.UPGRADE ? centsToUSD(proration?.amount_due) : costing?.totalValue}
          </div>
          <div className="tj-text-xsm text-muted">Due today</div>
        </div>
        <div className="separator"></div>
        <ButtonSolid
          disabled={actionBtnProps.disabled}
          isLoading={upgradeLoading}
          onClick={actionBtnProps.onClick}
          variant={mode !== MODAL_MODE.NEW && 'primary'}
          className={`sso-footer-save-btn ${mode === MODAL_MODE.NEW && 'upgrade-btn'}`}
        >
          {actionBtnProps.text}
        </ButtonSolid>
      </div>
    );
  };

  const licenseTypeTag = generateLicenseType();

  return (
    <div className="wrapper enterprise-page">
      <div className="wrapper license-page">
        <DueBanner license={featureAccess} />
        <div className="row gx-0 body-wrapper">
          <div className={cx('col license-content-wrapper')}>
            <div
              className={`col tj-dashboard-header-wrap font-weight-500 license-header-wrap ${
                selectedTab === 'limits' && 'border-none'
              }`}
            >
              <div data-cy={'Subscription overview'}>Subscription overview</div>
              {!isLoading ? (
                licenseType && (
                  <div className={`status-container ${licenseTypeTag.className}`}>{licenseTypeTag.text}</div>
                )
              ) : (
                <Skeleton width="150px" height="20px" />
              )}
            </div>
            <div className="content-wrapper">
              <div className="limits-access-container metrics-wrapper">
                <div className="limits-container">
                  <div className="title">SUBSCRIPTION LIMITS</div>
                  <div className="limits-content mt-3">
                    {limitsData.map((limit) => (
                      <div key={limit?.label} className="d-flex align-items-center metric">
                        <div
                          className="tj-text-sm"
                          data-cy={`number-of-${limit?.label.toLowerCase().replace(/\s+/g, '-')}-label`}
                        >
                          {capitalize(limit?.label)}
                        </div>
                        <div className="input-wrapper">
                          <input
                            readOnly
                            type="text"
                            className={cx('form-control', {
                              'error-border': !limit?.canAddUnlimited && limit?.current > limit?.total,
                            })}
                            value={limit?.canAddUnlimited ? 'Unlimited' : `${limit?.current}/${limit?.total}`}
                            data-cy={`${limit?.label.toLowerCase().replace(/\s+/g, '-')}-field`}
                          />
                          {!limit?.canAddUnlimited && limit?.current > limit?.total && (
                            <div className="error-text" data-cy="error-label">
                              Exceeding Limit
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="access-container">
                  <div className="title">FEATURE ACCESS</div>
                  <Access />
                </div>
              </div>
            </div>
            {licenseType !== 'enterprise' && (
              <SubscriptionFooter
                featureAccess={featureAccess}
                costing={costing}
                toggleUpgradeModal={toggleUpgradeModal}
                currentPlan={currentPlan}
                planForm={planForm}
                redirectUrl={REDIRECT_URL}
              />
            )}
          </div>
        </div>
      </div>
      {(featureAccess?.licenseStatus?.isExpired || licenseType === 'basic') && (
        <ComparePlans
          toggleUpgradeModal={toggleUpgradeModal}
          planForm={planForm}
          updatePlanDetailsForm={updatePlanDetailsForm}
          costing={costing}
          featureAccess={featureAccess}
        />
      )}
      <ModalBase
        title={'Upgrade'}
        show={showUpgradeModal}
        handleClose={toggleUpgradeModal}
        size="md"
        className={'upgrade-plan-modal'}
        darkMode={darkMode}
        body={
          <UpgradePlan
            updatePlanDetailsForm={updatePlanDetailsForm}
            licenseLoaded={licenseLoaded}
            costing={costing}
            planForm={planForm}
            current_organization_id={current_organization_id}
            upgradeEnabled={upgradeEnabled}
          />
        }
        footerBody={footerBody()}
      />
      <ChatwootIntegration
        token="oN4XrHrWTqwPTgj66JuzVrje"
        darkMode={darkMode}
        currentUser={authenticationService.currentSessionValue?.current_user}
      />
    </div>
  );
}

export { ManageSubscriptionKey };
