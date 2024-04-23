import React from 'react';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { LoadingScreen } from './LoadingScreen';

export default function UpgradePlan({ costing, planForm, licenseLoaded, updatePlanDetailsForm }) {
  const { viewersCount, editorsCount, subscriptionType, promoCode } = planForm;

  const formatInput = (e) => {
    const validCharacters = /^[0-9+-]*$/;

    if (!validCharacters.test(e.key) && e.key !== 'Backspace') {
      e.preventDefault();
    }
  };

  return licenseLoaded ? (
    <>
      <div className="upgrade-plan-wrapper">
        <div className="requirements-form">
          <div className="input-container">
            <div className="label-container">
              <label className="tj-text-xsm tj-text font-weight-500" data-cy="plan-type-label">
                Plan type
              </label>
            </div>
            <div className="price tj-text-sm input-wrapper">
              <div className={`tag valid-status`} data-cy="business-plan-label">
                Business plan
              </div>
            </div>
          </div>
          <div className="input-container">
            <div className="label-container">
              <label className="tj-text-xsm tj-text font-weight-500" data-cy="no-of-builder-label">
                No. of builders
              </label>
              <div className="price tj-text-sm" data-cy="monthly-builder-cost-label">
                ${costing.builderValue}/month
              </div>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                onChange={(e) => updatePlanDetailsForm('editorsCount', e.target.value)}
                className="form-control"
                onWheel={(e) => e.currentTarget.blur()}
                value={editorsCount}
                data-cy="no-of-builder-input"
                onKeyDown={formatInput}
              />
            </div>
          </div>
          <div className="input-container">
            <div className="label-container">
              <label className="tj-text-xsm tj-text font-weight-500" data-cy="no-of-end-user-label">
                No. of end users
              </label>
              <div className="price tj-text-sm" data-cy="monthly-end-user-cost-label">
                ${costing.viewerValue}/month
              </div>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                onChange={(e) => updatePlanDetailsForm('viewersCount', e.target.value)}
                className="form-control"
                onWheel={(e) => e.currentTarget.blur()}
                value={viewersCount}
                data-cy="no-of-end-user-input"
                onKeyDown={formatInput}
              />
            </div>
          </div>
          <div className="input-container">
            <div className="label-container">
              <label className="tj-text-xsm tj-text font-weight-500" data-cy="promo-code-label">
                Promo code
              </label>
            </div>
            <div className="input-wrapper">
              <input
                placeholder="Enter promo code"
                onChange={(e) => updatePlanDetailsForm('promoCode', e.target.value)}
                type="text"
                value={promoCode}
                className="form-control"
                data-cy="promo-code-input"
              />
            </div>
          </div>
        </div>

        <div
          style={{ marginLeft: '120px', flexDirection: 'column', alignItems: 'flex-start' }}
          className="input-container"
        >
          <div>
            <label className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={subscriptionType === 'yearly'}
                onChange={(e) => updatePlanDetailsForm('subscriptionType', e.target.checked ? 'yearly' : 'monthly')}
                data-cy="offer-toggle"
              />
              <span className="tj-text-sm font-weight-500" data-cy="offer-toggle-label">
                Pay {subscriptionType} <br />
                <span className={cx('text-muted tj-text-400 tj-text-sm')}>
                  {subscriptionType === 'monthly'
                    ? `Avail 20% discount on yearly payment`
                    : `You saved $${costing.valueOff} by opting for the yearly plan!`}
                </span>
              </span>
            </label>
          </div>
        </div>
        <div className="terms-info">
          <div className="help-box tj-text-sm">
            <div className="info-box">
              <SolidIcon viewBox="0 0 20 20" name="informationPrimary" />
            </div>
            <div className="tailored-plan text-primary" data-cy="contact-us-helper-text">
              Want a custom plan tailored to your needs? Contact us at{' '}
              <a target="_blank" href="mailto:hello@tooljet.com" className="link-btn font-weight-500" rel="noreferrer">
                hello@tooljet.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : (
    <LoadingScreen />
  );
}
