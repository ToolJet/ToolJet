import config from 'config';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Spinner from '@/_ui/Spinner';
import cx from 'classnames';
import { ToolTip } from '@/_components';
import SSO from './icons/SSO';
import { authenticationService } from '@/_services';
import { authHeader } from '@/_helpers';

export default function OIDCSSOLoginButton({
  configId,
  buttonText,
  setRedirectUrlToCookie,
  setSignupOrganizationDetails,
  name,
  featureIncluded,
  bannerMessage,
}) {
  const [isLoading, setLoading] = useState(false);

  const doLogin = (e) => {
    e.preventDefault();
    setRedirectUrlToCookie && setRedirectUrlToCookie();
    setSignupOrganizationDetails && setSignupOrganizationDetails();
    setLoading(true);

    const organizationId =
      authenticationService.getSignupOrganizationId() || authenticationService.getLoginOrganizationId();
    fetch(`${config.apiUrl}/oauth/openid/configs${configId ? `/${configId}` : ''}`, {
      method: 'GET',
      credentials: 'include',
      headers: authHeader(false, organizationId),
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
  return (
    <ToolTip message={bannerMessage} show={!featureIncluded}>
      <div
        className={cx({
          'sso-btn-disabled': !featureIncluded,
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
                <span className="px-1 sso-info-text" data-cy="oidc-sso-text">
                  {buttonText} {name || 'Open ID'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </ToolTip>
  );
}
