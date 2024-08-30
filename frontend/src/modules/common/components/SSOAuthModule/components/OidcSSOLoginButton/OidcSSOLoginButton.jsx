import config from 'config';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import cx from 'classnames';
import { ToolTip } from '@/_components';
import SSOButtonWrapper from '../SSOButtonWrapper';

export default function OIDCSSOLoginButton({
  configId,
  buttonText,
  setRedirectUrlToCookie,
  setSignupOrganizationDetails,
  name,
  featureIncluded,
  bannerMessage = '',
}) {
  const [isLoading, setLoading] = useState(false);

  const doLogin = (e) => {
    e.preventDefault();
    setRedirectUrlToCookie && setRedirectUrlToCookie();
    setSignupOrganizationDetails && setSignupOrganizationDetails();
    setLoading(true);
    fetch(`${config.apiUrl}/oauth/openid/configs${configId ? `/${configId}` : ''}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((json) => {
        setLoading(false);
        if (json.authorizationUrl) {
          return (window.location.href = json.authorizationUrl);
        }
        toast.error('Open ID login failed');
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
          text={`${buttonText} ${name || 'OpenID'}`}
          dataCy="oidc-sso-button"
        />
      </div>
    </ToolTip>
  );
}
