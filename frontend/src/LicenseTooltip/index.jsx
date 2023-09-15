import React from 'react';
import { ToolTip } from '@/_components';
import { authenticationService } from '@/_services';

const LicenseTooltip = ({
  feature,
  limits = {},
  isAvailable,
  children,
  placement = 'right',
  noTooltipIfValid = false,
  customMessage,
}) => {
  const { percentage, licenseStatus, canAddUnlimited } = limits ?? {};
  const { isExpired, isLicenseValid } = licenseStatus ?? {};
  const allowedFeaturesOnExpiry = ['workspaces', 'apps', 'workflows'];

  const currentUser = authenticationService.currentSessionValue;
  const paidFeatures = { 'White labelling': 'whiteLabelling' };

  const generateMessage = () => {
    switch (true) {
      case !currentUser.admin && !canAddUnlimited && percentage >= 100:
        return `You have reached your limit for number of ${feature}`;
      case (!isLicenseValid || isExpired || !isAvailable) && !allowedFeaturesOnExpiry.includes(feature):
        return `You can only access ${feature} in our paid plans`;
      case limits?.[paidFeatures?.[feature]] === false:
        return (
          customMessage ??
          `${feature} is not a part of your 
        plan. Contact us to know more.`
        );
      default:
        return '';
    }
  };

  const message = generateMessage();

  return message ? (
    <ToolTip message={message} placement={placement}>
      <div className="license-tooltip">{children}</div>
    </ToolTip>
  ) : percentage >= 100 || noTooltipIfValid ? (
    <>{children}</>
  ) : (
    <ToolTip message={feature} placement="right">
      <div>{children}</div>
    </ToolTip>
  );
};

export { LicenseTooltip };
