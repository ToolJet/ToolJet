import React, { useState } from 'react';
import { ToolTip } from '@/_components';
import { authenticationService } from '@/_services';

const LicenseTooltip = ({
  feature,
  limits = {},
  isAvailable,
  children,
  placement = 'right',
  noTooltipIfValid = false,
}) => {
  const { percentage, licenseStatus } = limits;
  const { isExpired, isLicenseValid } = licenseStatus ?? {};
  const allowedFeaturesOnExpiry = ['workspaces', 'apps'];

  const currentUser = authenticationService.currentSessionValue;

  const generateMessage = () => {
    switch (true) {
      case Object.keys(limits).length === 0:
        return '';
      case !currentUser.admin && !isExpired && percentage >= 100:
        return `You have reached your limit for number of ${feature}`;
      case (!isLicenseValid || isExpired || !isAvailable) && !allowedFeaturesOnExpiry.includes(feature):
        return `You can only access ${feature} in our paid plans`;
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
