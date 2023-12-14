import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import cx from 'classnames';
import posthog from 'posthog-js';
import { authenticationService, licenseService, userService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { getDateDifferenceInDays } from '@/_helpers/utils';
import toast from 'react-hot-toast';
import { LoadingScreen } from './LoadingScreen';

const PLAN_VALUES = {
  BUILDER: 30,
  VIEWER: 10,
  YEARLY_OFF: 20,
};

export default function UpgradePlan({ current_organization_id }) {
  const [licenseLoaded, setLicenseLoaded] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({});
  const { workspaceId } = useParams();
  const [costing, setCosting] = useState({
    totalValue: '',
    valueOff: '',
    viewerValue: PLAN_VALUES.VIEWER,
    editorValue: PLAN_VALUES.BUILDER,
  });
  const [planForm, setPlanForm] = useState({
    viewersCount: '',
    editorsCount: '',
    subscriptionType: 'yearly',
    couponCode: '',
    promoCode: '',
  });

  const { current_user } = authenticationService.currentSessionValue;
  const REDIRECT_URL = `${window.public_config?.TOOLJET_HOST}${
    window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
  }${workspaceId}/settings/subscription`;

  const fetchCurrentPlanDetails = () => {
    setLicenseLoaded(false);
    userService.getUserLimits('all').then((data) => {
      const { editorsCount, viewersCount } = data ?? {};
      setCurrentPlan(data);
      setPlanForm({
        ...planForm,
        viewersCount: viewersCount?.current === 0 ? 1 : viewersCount?.current,
        editorsCount: editorsCount?.current,
      });
      setLicenseLoaded(true);
    });
  };

  const upgradePlan = () => {
    setUpgradeLoading(true);
    const { viewersCount, editorsCount, subscriptionType, couponCode, promoCode } = planForm;
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
      coupon_code: couponCode,
      promo_code: promoCode,
    };
    licenseService
      .upgradePlan(planDetails)
      .then((data) => {
        window.location.href = data.redirectUrl;
      })
      .catch(({ error }) => {
        console.log({ error });
        toast.error(error);
      })
      .finally(() => {
        setUpgradeLoading(false);
      });
  };

  const updatePlanDetailsForm = (key, value) => {
    setPlanForm({
      ...planForm,
      [key]: value,
    });
  };

  useEffect(() => {
    fetchCurrentPlanDetails();
  }, []);

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

  const { viewersCount, editorsCount, subscriptionType, couponCode, promoCode } = planForm;

  const isUpgradeDisabled = () => {
    const { licenseStatus: { expiryDate, isExpired } = {} } = currentPlan?.viewersCount ?? {};
    const daysLeft = expiryDate && getDateDifferenceInDays(new Date(), new Date(expiryDate));
    return daysLeft > 14 && !isExpired;
  };

  return licenseLoaded ? (
    <>
      <div className="upgrade-plan-wrapper">
        <div className="requirements-form">
          <div className="input-container">
            <div className="label-container">
              <label className="tj-text-xsm tj-text font-weight-500">No. of builders</label>
              <div className="price tj-text-sm">${costing.builderValue}/month</div>
            </div>
            <div className="input-wrapper">
              <input
                readOnly={isUpgradeDisabled()}
                type="number"
                onChange={(e) => updatePlanDetailsForm('editorsCount', e.target.value)}
                className="form-control"
                value={editorsCount}
              />
            </div>
          </div>
          <div className="input-container">
            <div className="label-container">
              <label className="tj-text-xsm tj-text font-weight-500">No. of end users</label>
              <div className="price tj-text-sm">${costing.viewerValue}/month</div>
            </div>
            <div className="input-wrapper">
              <input
                readOnly={isUpgradeDisabled()}
                type="number"
                onChange={(e) => updatePlanDetailsForm('viewersCount', e.target.value)}
                className="form-control"
                value={viewersCount}
              />
            </div>
          </div>
          <div className="input-container">
            <div className="label-container">
              <label className="tj-text-xsm tj-text font-weight-500">Coupon code</label>
            </div>
            <div className="input-wrapper">
              <input
                readOnly={isUpgradeDisabled()}
                placeholder="Enter coupon code"
                onChange={(e) => updatePlanDetailsForm('couponCode', e.target.value)}
                type="text"
                value={couponCode}
                className="form-control"
              />
            </div>
          </div>
          <div className="input-container">
            <div className="label-container">
              <label className="tj-text-xsm tj-text font-weight-500">Promo code</label>
            </div>
            <div className="input-wrapper">
              <input
                readOnly={isUpgradeDisabled()}
                placeholder="Enter promo code"
                onChange={(e) => updatePlanDetailsForm('promoCode', e.target.value)}
                type="text"
                value={promoCode}
                className="form-control"
              />
            </div>
          </div>
        </div>

        <div style={{ marginLeft: '120px' }} className="input-container">
          <div>
            <label className="form-check form-switch">
              <input
                disabled={isUpgradeDisabled()}
                className="form-check-input"
                type="checkbox"
                checked={subscriptionType === 'yearly'}
                onChange={(e) => updatePlanDetailsForm('subscriptionType', e.target.checked ? 'yearly' : 'monthly')}
              />
              <span className="tj-text-sm font-weight-500">
                Pay {subscriptionType}{' '}
                <span
                  className={cx('text-muted', { ' text-striked': subscriptionType !== 'yearly' })}
                >{`${PLAN_VALUES.YEARLY_OFF}% $(${costing.valueOff}) off`}</span>
              </span>
            </label>
          </div>
        </div>

        <div className="total-amount">
          <div className="text-muted tj-text-sm font-weight-500">Total amount</div>
          <div className="font-weight-500 text-primary">
            ${costing.totalValue}/
            <span className="text-muted font-weight-500">{subscriptionType === 'yearly' ? 'year' : 'month'}</span>
          </div>
        </div>
        <div className="terms-info">
          <div className="tj-text-xsm font-weight-400 mt-1">
            By upgrading, you agree to the{' '}
            <a
              href="https://www.tooljet.com/terms"
              target="_blank"
              className="link-btn cursor-pointer"
              rel="noreferrer"
            >
              terms and conditions
            </a>
          </div>
          <div className="help-box">
            <div className="info-box">
              <SolidIcon name="informationPrimary" />
            </div>
            <div className="tailored-plan text-primary">
              Want a custom plan tailored to your needs? Contact us at{' '}
              <a target="_blank" href="mailto:hello@tooljet.com" className="link-btn font-weight-500" rel="noreferrer">
                hello@tooljet.com
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="form-footer">
        <ButtonSolid
          disabled={isUpgradeDisabled() || upgradeLoading}
          isLoading={upgradeLoading}
          onClick={upgradePlan}
          variant="primary"
          className="sso-footer-save-btn"
        >
          Upgrade
        </ButtonSolid>
      </div>
    </>
  ) : (
    <LoadingScreen />
  );
}
