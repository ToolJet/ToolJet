import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getRedirectTo } from '@/_helpers/routes';
import { ToolTip } from '@/_components';
import cx from 'classnames';
import SSOButtonWrapper from '../SSOButtonWrapper';

export default function LdapSSOLoginButton({
  organizationSlug,
  name,
  featureIncluded,
  bannerMessage,
  buttonText,
  setSignupOrganizationDetails,
}) {
  const navigate = useNavigate();
  const ssoIcon = featureIncluded
    ? 'assets/images/onboardingassets/SSO/OpenProtocolEnabled.svg'
    : 'assets/images/onboardingassets/SSO/OpenProtocolDisabled.svg';
  const redirectToLdapPage = (e) => {
    e.preventDefault();
    const redirectPath = getRedirectTo();
    setSignupOrganizationDetails && setSignupOrganizationDetails();
    organizationSlug && navigate(`/ldap/${organizationSlug}${redirectPath ? `?redirectTo=${redirectPath}` : ''}`);
  };
  return (
    <ToolTip message={bannerMessage} show={!featureIncluded}>
      <div
        className={cx({
          'sso-btn-disabled': !featureIncluded,
        })}
        data-cy="ldap-tile"
      >
        <SSOButtonWrapper
          onClick={redirectToLdapPage}
          icon={ssoIcon}
          text={`${buttonText} ${name || 'LDAP'}`}
          dataCy="ldap-sso-button"
        />
      </div>
    </ToolTip>
  );
}
