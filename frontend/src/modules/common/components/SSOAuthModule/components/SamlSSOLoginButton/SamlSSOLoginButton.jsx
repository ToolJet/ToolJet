import config from 'config';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ToolTip } from '@/_components';
import cx from 'classnames';
import SSOButtonWrapper from '../SSOButtonWrapper';

export default function SamlSSOLoginButton({
  configId,
  buttonText,
  setRedirectUrlToCookie,
  name,
  featureIncluded,
  bannerMessage,
  setSignupOrganizationDetails,
}) {
  const [isLoading, setLoading] = useState(false);

  const doLogin = (e) => {
    e.preventDefault();
    setRedirectUrlToCookie && setRedirectUrlToCookie();
    setSignupOrganizationDetails && setSignupOrganizationDetails();
    setLoading(true);
    fetch(`${config.apiUrl}/oauth/saml/configs/${configId}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((json) => {
        setLoading(false);
        if (json.authorizationUrl) {
          return (window.location.href = json.authorizationUrl);
        }
        toast.error('SAML login failed');
      })
      .catch((reason) => {
        setLoading(false);
        toast.error(reason.error);
      });
  };
  const ssoIcon = featureIncluded
    ? 'assets/images/onboardingassets/SSO/OpenProtocolEnabled.svg'
    : 'assets/images/onboardingassets/SSO/OpenProtocolDisabled.svg';
  return (
    <ToolTip message={bannerMessage} show={!featureIncluded}>
      <div
        className={cx({
          'sso-btn-disabled': !featureIncluded,
        })}
      >
        <SSOButtonWrapper
          onClick={doLogin}
          icon={ssoIcon}
          text={`${buttonText} ${name || 'SAML'}`}
          dataCy="saml-sso-button"
        />
      </div>
    </ToolTip>
  );
}
