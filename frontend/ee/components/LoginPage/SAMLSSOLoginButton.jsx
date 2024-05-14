import config from 'config';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';
import { ToolTip } from '@/_components';
import cx from 'classnames';
import SSO from './icons/SSO';

export default function SAMLSSOLoginButton({
  configId,
  text = 'Sign in with ',
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
  return (
    <ToolTip message={bannerMessage} show={!featureIncluded}>
      <div
        className={cx({
          'sso-btn-disabled': isLoading || !featureIncluded,
        })}
      >
        <div className="login-sso-wrapper">
          <div
            onClick={doLogin}
            className={`border-0 sso-button rounded-2 sso-btn`}
            disabled={isLoading || !featureIncluded}
          >
            {isLoading ? (
              <div className="spinner-center">
                <Spinner className="flex" />
              </div>
            ) : (
              <>
                <SSO disabled={!featureIncluded} />
                <span className="px-1 sso-info-text" data-cy="saml-sso-text">
                  {text} {name || 'SAML'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </ToolTip>
  );
}
