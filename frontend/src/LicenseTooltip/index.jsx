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
  const paidFeatures = {
    'Audit logs': 'auditLogs',
    'Custom styles': 'customStyling',
    'OpenID Connect': 'openid',
    LDAP: 'ldap',
    'Multi-environments': 'multiEnvironment',
  };

  const generateMessage = () => {
    switch (true) {
      case !currentUser.admin && !canAddUnlimited && percentage >= 100:
        return `${customMessage ?? `You have reached your limit for number of ${feature}`}`;
      case isLicenseValid &&
        !isExpired &&
        limits?.[paidFeatures?.[feature]] === false &&
        !allowedFeaturesOnExpiry.includes(feature):
        return `${
          customMessage ??
          `${feature} is not included in your
          current plan. For more, Upgrade`
        }`;
      case (!isLicenseValid || isExpired) &&
        (!isAvailable || limits?.[paidFeatures?.[feature]] === false) &&
        !allowedFeaturesOnExpiry.includes(feature):
        return `${
          customMessage ??
          `${feature} is available only
        in paid plans`
        }`;
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
