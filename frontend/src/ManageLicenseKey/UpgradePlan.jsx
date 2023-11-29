import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import cx from 'classnames';
import { authenticationService, licenseService, userService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { getDateDifferenceInDays } from '@/_helpers/utils';
import toast from 'react-hot-toast';
import { LoadingScreen } from './LoadingScreen';

const PLAN_VALUES = {
  BUILDER: 24,
  VIEWER: 8,
  YEARLY_OFF: 20,
};

export default function UpgradePlan() {
  const [licenseLoaded, setLicenseLoaded] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({});
  const { workspaceId } = useParams();
  const [costing, setCosting] = useState({
    totalValue: '',
    valueOff: '',
  });
  const [planForm, setPlanForm] = useState({
    viewersCount: '',
    editorsCount: '',
    subscriptionType: 'yearly',
    couponCode: '',
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
        viewersCount: viewersCount?.total,
        editorsCount: editorsCount?.total,
      });
      setLicenseLoaded(true);
    });
  };

  const upgradePlan = () => {
    setUpgradeLoading(true);
    const { viewersCount, editorsCount, subscriptionType, couponCode } = planForm;
    const planDetails = {
      workspaceId: workspaceId,
      subsribtionType: subscriptionType,
      mode: 'subscription',
      customer_email: current_user?.email,
      NumberOfEditor: editorsCount,
      NumberOfBuilder: viewersCount,
      success_url: `${REDIRECT_URL}?payment=success`,
      cancel_url: `${REDIRECT_URL}?payment=failure`,
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
    let valueOff = totalValue * (PLAN_VALUES.YEARLY_OFF / 100);
    if (subscriptionType === 'yearly') {
      totalValue = totalValue - valueOff;
    }
    setCosting({ valueOff, totalValue });
  }, [planForm]);

  const { viewersCount, editorsCount, subscriptionType, couponCode } = planForm;

  const isUpgradeDisabled = () => {
    const { licenseStatus: { expiryDate, isExpired } = {} } = viewersCount?.licenseStatus ?? {};
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
              <div className="price tj-text-sm">${PLAN_VALUES.BUILDER}/month</div>
            </div>
            <div className="input-wrapper">
              <input
                readOnly={isUpgradeDisabled()}
                type="text"
                onChange={(e) => updatePlanDetailsForm('editorsCount', e.target.value)}
                className="form-control"
                value={editorsCount}
              />
            </div>
          </div>
          <div className="input-container">
            <div className="label-container">
              <label className="tj-text-xsm tj-text font-weight-500">No. of end users</label>
              <div className="price tj-text-sm">${PLAN_VALUES.VIEWER}/month</div>
            </div>
            <div className="input-wrapper">
              <input
                readOnly={isUpgradeDisabled()}
                type="text"
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
          <div style={{ marginLeft: '120px' }} className="input-container">
            <div>
              <label className="form-check form-switch">
                <input
                  disabled={isUpgradeDisabled}
                  className="form-check-input"
                  type="checkbox"
                  checked={subscriptionType === 'yearly'}
                  onChange={(e) => updatePlanDetailsForm('subscriptionType', e.target.checked ? 'yearly' : 'monthly')}
                />
                <span className="tj-text-sm font-weight-500">
                  Pay {subscriptionType}{' '}
                  <span
                    className={cx('text-muted', { ' text-striked': subscriptionType === 'yearly' })}
                  >{`${PLAN_VALUES.YEARLY_OFF}% $(${costing.valueOff}) off`}</span>
                </span>
              </label>
            </div>
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
            By clicking continue, you agree to the <span className="link-btn cursor-pointer">terms and conditions</span>
          </div>
          <div className="help-box">
            <div className="info-box">
              <SolidIcon name="informationPrimary" />
            </div>
            <div className="tailored-plan text-primary">
              Want a custom plan tailored to your needs? Contact us at{' '}
              <span className="link-btn font-weight-500">hello@tooljet.com</span>
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
