import React, { useState } from 'react';
import { calculateDueDate } from '@/_helpers/utils';
import { licenseService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import moment from 'moment';

export default function SubscriptionFooter({ toggleUpgradeModal, costing, featureAccess, planForm, redirectUrl }) {
  const [isLoading, setIsLoading] = useState(false);

  const licenseType = featureAccess?.licenseStatus?.licenseType;
  const isExpired = featureAccess?.licenseStatus?.isExpired;
  const { subscriptionType, currentPeriodEnd, customer, invoice } = planForm ?? {};
  const { status, currentPeriodEnd: dueOn } = invoice ?? {};

  const handleCreatePortal = () => {
    setIsLoading(true);
    licenseService
      .getPortalLink({
        customerId: customer,
        returnUrl: redirectUrl,
      })
      .then((data) => {
        window.location.href = data.url;
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const currentPeriodEndInMilliSeconds = status !== 'paid' ? moment(dueOn).unix() : currentPeriodEnd;

  return (
    <div className="subscription-footer">
      {licenseType === 'trial' || licenseType === 'basic' ? (
        <ButtonSolid variant="" onClick={toggleUpgradeModal} className={`${'tj-base-btn upgrade-btn'}`}>
          Upgrade
        </ButtonSolid>
      ) : (
        <div className="manage-subscription-container">
          <div className="due-container">
            <div className="tj-text-md font-weight-500">
              ${costing.totalValue}/{subscriptionType === 'yearly' ? 'year' : 'month'}
            </div>
            <div className="tj-text-xsm text-muted">{calculateDueDate(currentPeriodEndInMilliSeconds)}</div>
          </div>
          <div className="action-btn-container">
            <ButtonSolid isLoading={isLoading} rightIcon="oubound" variant="tertiary" onClick={handleCreatePortal}>
              View invoices
            </ButtonSolid>
            <ButtonSolid disabled={isExpired || status == 'failed'} onClick={toggleUpgradeModal}>
              Manage subscription
            </ButtonSolid>
          </div>
        </div>
      )}
    </div>
  );
}
