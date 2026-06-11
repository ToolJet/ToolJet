import React, { forwardRef, useImperativeHandle } from 'react';
import SSOButtonWrapper from '../SSOButtonWrapper';
import { buildURLWithQuery, stripTrailingSlash } from '@/_helpers/utils';
import { getSubpath } from '@/_helpers/routes';

const GoogleSSOLoginButton = forwardRef((props, ref) => {
  const randomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  const handleGoogleLogin = (e) => {
    e?.preventDefault();
    props.setSignupOrganizationDetails && props.setSignupOrganizationDetails();
    props.setRedirectUrlToCookie && props.setRedirectUrlToCookie();

    // Always use the base domain (TOOLJET_HOST) for redirect_uri so it
    // matches what's registered with Google, even on custom domains.
    const base = stripTrailingSlash(window.public_config?.TOOLJET_HOST || window.location.origin);
    const { client_id } = props.configs;
    const authUrl = buildURLWithQuery('https://accounts.google.com/o/oauth2/auth', {
      redirect_uri: `${base}${getSubpath() ?? ''}/sso/google${props.configId ? `/${props.configId}` : ''}`,
      response_type: 'id_token',
      scope: 'email profile',
      client_id,
      nonce: randomString(10),
    });
    window.location.href = authUrl;
  };

  useImperativeHandle(
    ref,
    () => ({
      triggerLogin: handleGoogleLogin,
    }),
    []
  );

  return (
    <SSOButtonWrapper
      onClick={handleGoogleLogin}
      icon="assets/images/onboardingassets/SSO/Google.svg"
      text={`${props.buttonText} Google`}
      dataCy="google-sso-button"
    />
  );
});

export default GoogleSSOLoginButton;
