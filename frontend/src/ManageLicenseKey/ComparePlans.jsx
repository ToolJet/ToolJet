import React from 'react';
import cx from 'classnames';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { capitalize } from 'lodash';

const PLAN_VALUES = {
  BUILDER: 30,
  VIEWER: 10,
  YEARLY_OFF: 20,
};

export default function ComparePlans({ planForm, updatePlanDetailsForm, costing, toggleUpgradeModal, featureAccess }) {
  const { subscriptionType } = planForm;
  const isExpired = featureAccess?.licenseStatus?.isExpired;
  const plans = [
    {
      name: 'Basic plan',
      className: 'basic',
      builderPrice: 0,
      endUserPrice: 0,
      perks: [
        'Unlimited applications',
        'SSO (Google & Github)',
        'Community support',
        'Unlimited ToolJet tables and rows',
        'Multiplayer editing',
      ],
      bottomAction: {
        text: 'Current plan',
        onClick: null,
        className: 'action-btn',
      },
    },
    {
      name: 'Business plan',
      className: 'business',
      builderPrice: costing.builderValue,
      endUserPrice: costing.viewerValue,
      tagAdornment: (
        <div>
          <label className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={subscriptionType === 'yearly'}
              onChange={(e) => updatePlanDetailsForm('subscriptionType', e.target.checked ? 'yearly' : 'monthly')}
              data-cy="offer-toggle"
            />
            <span className="tj-text-sm type-toggle" data-cy="offer-toggle-label">
              {capitalize(subscriptionType)}
              <br />
              <span
                className={cx('text-muted percent-off', { ' text-striked': subscriptionType !== 'yearly' })}
              >{`${PLAN_VALUES.YEARLY_OFF}% off`}</span>
            </span>
          </label>
        </div>
      ),
      perks: [
        'Multi-instance deployments',
        'SSO (Okta, Google, OpenID Connect & more)',
        'Granular access control',
        'Unlimited users',
        'Custom branding/white labelling',
        'Audit logging',
        'Unlimited ToolJet tables and rows',
        'Multiple environments',
        'Air-gapped deployment',
        'Priority support via email',
      ],
      bottomAction: {
        text: 'Upgrade',
        onClick: toggleUpgradeModal,
        className: 'action-btn cursor-pointer',
        rightIcon: 'arrowright',
        fill: 'var(--slate1)',
        disabled: isExpired,
      },
    },
    {
      name: 'Enterprise',
      className: 'enterprise',
      builderPrice: null,
      endUserPrice: null,
      isCustomPricing: true,
      perks: [
        'All features of business plan',
        'Unlimited applications',
        'SSO (Google & Github)',
        'Community support',
        'Unlimited ToolJet tables and rows',
        'Multiplayer editing',
      ],
      bottomAction: {
        text: 'Schedule a call',
        onClick: () => {
          window.open('https://www.tooljet.com/schedule-demo', '_blank');
        },
        className: 'action-btn cursor-pointer',
        rightIcon: 'arrowright',
        fill: 'var(--slate1)',
      },
    },
  ];

  return (
    <div className="wrapper license-page compare-plans">
      <div className="row gx-0 body-wrapper">
        <div className={'col license-content-wrapper'}>
          <div className={`col tj-dashboard-header-wrap font-weight-500 license-header-wrap`}>
            <div data-cy="compare-plans-label">Compare plans</div>
          </div>

          <div className="content-wrapper">
            <div className="plans-container">
              {plans.map((plan, index) => (
                <div key={index} className={`plan ${plan.className}`}>
                  <div className="header">
                    <div className="tag-container">
                      <span className={`tag`} data-cy={`${plan.name.toLowerCase().replace(/\s+/g, '-')}-header`}>
                        {plan.name}
                      </span>
                      {plan.tagAdornment}
                    </div>
                    <div className="pricing-container">
                      {plan.isCustomPricing ? (
                        <div className="price" data-cy="custom-pricing-label">
                          Custom pricing
                        </div>
                      ) : (
                        <>
                          <div className="price" data-cy="builder-price">
                            ${plan.builderPrice}
                            <span className="sub-text" data-cy="builder-price-sub-text">
                              {' '}
                              / month <br /> per builder
                            </span>
                          </div>
                          <span className="add" data-cy="plus-icon">
                            +
                          </span>
                          <div className="price" data-cy="end-user-price">
                            ${plan.endUserPrice}
                            <span className="sub-text" data-cy="end-user-price-sub-text">
                              {' '}
                              / month <br /> per end user
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <ul className="perks-container">
                      {plan.perks.map((perk, index) => (
                        <li
                          key={index}
                          className="perk"
                          data-cy={`${plan.name.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`}
                        >
                          {' '}
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`action-container ${plan.bottomAction.className} ${
                      plan.bottomAction.disabled && 'disabled'
                    }`}
                  >
                    <ButtonSolid
                      onClick={plan.bottomAction.onClick}
                      fill={plan.bottomAction.fill}
                      rightIcon={plan.bottomAction.rightIcon}
                      className={plan.bottomAction.className}
                      data-cy={`${plan.bottomAction.text.toLowerCase().replace(/\s+/g, '-')}-button`}
                    >
                      {plan.bottomAction.text}
                    </ButtonSolid>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
