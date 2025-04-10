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
  customTitle = '',
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
    SAML: 'saml',
    'Multi-environments': 'multiEnvironment',
    'Import from git': 'gitSync',
    GitSync: 'gitSync',
    'Custom themes': 'customThemes',
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
          current plan`
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
    <ToolTip message={customTitle ? customTitle : feature} placement={placement}>
      <div>{children}</div>
    </ToolTip>
  );
};

export { LicenseTooltip };
