import React, { useState } from 'react';
import './resources/styles/compare-plans.styles.scss';
import ArrowUp from './resources/images/arrow-up.svg';
import Spinner from '@/_ui/Spinner';
import cx from 'classnames';

const ComparePlans = ({ plans, currentPlan, onUpgrade, onScheduleCall, onStartTrial }) => {
  const [isYearly, setIsYearly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const renderPlanHeader = (plan) => {
    return (
      <div className={`plan-header ${plan.id}`}>
        <span className="plan-name">{plan.name}</span>
        {plan.id === 'business' && (
          <div className="yearly-toggle">
            <label className="switch">
              <input type="checkbox" checked={isYearly} onChange={() => setIsYearly(!isYearly)} />
              <span className="slider round"></span>
            </label>
            <span className="toggle-label">
              <span>{isYearly ? 'Yearly' : 'Monthly'}</span>
              <span
                className="discount"
                style={isYearly ? { textDecoration: 'none' } : { textDecoration: 'line-through' }}
              >
                20% off
              </span>
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderPlanPrice = (plan) => {
    if (plan.id === 'enterprise') {
      return (
        <div className="enterprise-plan-name">
          <span>Custom pricing</span>
        </div>
      );
    }

    if (plan.id === 'business') {
      const builderPrice = isYearly ? plan.builderPrice : 30;
      const endUserPrice = isYearly ? plan.endUserPrice : 10;
      return (
        <div className="plan-price business-price">
          <div className="price-row">
            <span className="price">${builderPrice}</span>
            <span className="price-period">/month</span>
            <div className="price-description">per builder</div>
          </div>
          <div className="price-separator">+</div>
          <div className="price-row">
            <span className="price">${endUserPrice}</span>
            <span className="price-period">/month</span>
            <div className="price-description">per end user</div>
          </div>
        </div>
      );
    }

    return (
      <div className="plan-price">
        <span className="price">${plan.builderPrice}</span>
        <span className="price-period">/{plan.billingCycle}</span>
        <div className="price-description">per {plan.perUser ? 'user' : 'application'}</div>
      </div>
    );
  };

  const renderFeatures = (features) => (
    <ul className="feature-list">
      {features.map((feature, index) => (
        <li key={index} className="feature-item">
          {feature}
        </li>
      ))}
    </ul>
  );

  const renderAddOns = (addOns) => {
    if (!addOns || addOns.length === 0) return null;
    return (
      <div className="add-ons">
        <h4 className="add-ons-title">Add-ons:</h4>
        <ul className="add-ons-list">
          {addOns.map((addOn, index) => (
            <li key={index} className="add-on-item">
              {addOn.name} (${addOn.price}/{addOn.billingCycle})
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderNotes = (notes) => {
    if (!notes || notes.length === 0) return null;
    return (
      <div className="notes">
        {notes.map((note, index) => (
          <p key={index} className="note-item">
            {note}
          </p>
        ))}
      </div>
    );
  };

  const renderActionArea = (plan) => {
    if (plan.id === currentPlan) {
      return <div className="current-plan">Current plan</div>;
    }

    let buttonText, onClick;
    if (plan.id === 'enterprise') {
      buttonText = 'Schedule a call';
      onClick = onScheduleCall;
    } else if (plan.id === 'business') {
      buttonText = 'Start free trial';
      onClick = async () => {
        setIsLoading(true);
        try {
          await onStartTrial();
        } finally {
          setIsLoading(false);
        }
      };
    } else {
      buttonText = 'Upgrade';
      onClick = () => onUpgrade(plan.id);
    }

    const disabled = plan.id === 'business' && isLoading;
    const buttonClasses = cx(`action-button ${plan.id}`, {
      disabled,
    });

    return (
      <button className={buttonClasses} onClick={onClick}>
        {disabled ? (
          <div className="spinner-center">
            <Spinner />
          </div>
        ) : (
          <div className="action-button-content">
            {buttonText}
            <ArrowUp />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="compare-plans-container">
      <div className="compare-plans">
        <div className="banner-header">
          <h2 className="compare-plans-title">Compare plans</h2>
          <p className="compare-plans-description">
            The plan reflects the features available in the latest version of ToolJet and some feature may not be
            available in your version.{' '}
            <a href="https://www.tooljet.com/pricing?payment=onpremise" target="_blank" rel="noopener noreferrer">
              Click here
            </a>{' '}
            <br></br> to check out the details plan comparison & prices on our website.
          </p>
        </div>
        <div className="plans-grid">
          {plans.map((plan) => (
            <div key={plan.id} className={`plan-card ${plan.id}`}>
              <div className="plan-card-wrapper">
                {renderPlanHeader(plan)}
                {renderPlanPrice(plan)}
              </div>
              <div className="plan-content">
                {renderFeatures(plan.features)}
                {renderAddOns(plan.additionalInfo?.addOns)}
                {renderNotes(plan.additionalInfo?.notes)}
              </div>
              <div className="plan-action">{renderActionArea(plan)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComparePlans;
