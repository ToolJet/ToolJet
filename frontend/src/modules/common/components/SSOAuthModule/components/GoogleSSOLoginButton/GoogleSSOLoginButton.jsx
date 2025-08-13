import React, { forwardRef, useImperativeHandle } from 'react';
import SSOButtonWrapper from '../SSOButtonWrapper';
import { buildURLWithQuery } from '@/_helpers/utils';

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

    const { client_id } = props.configs;
    const urlParams = new URLSearchParams(window.location.search);
    const utmData = {};

    // Extract all UTM parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((param) => {
      const value = urlParams.get(param);
      if (value) {
        utmData[param] = value;
      }
    });

    // Create state object with UTM data and CSRF protection
    const stateData = {
      nonce: randomString(10),
      timestamp: Date.now(),
      utm: utmData,
      // Add any other data you want to preserve
      configId: props.configId,
    };

    // Encode state as base64 JSON
    const state = btoa(JSON.stringify(stateData));
    const authUrl = buildURLWithQuery('https://accounts.google.com/o/oauth2/auth', {
      redirect_uri: `${window.public_config?.TOOLJET_HOST}${window.public_config?.SUB_PATH ?? '/'}sso/google${
        props.configId ? `/${props.configId}` : ''
      }`,
      response_type: 'id_token',
      scope: 'email profile',
      client_id,
      nonce: randomString(10),
      state,
    });
    console.log('State data before encoding:', stateData);
    console.log('Encoded state:', state);
    console.log('Final auth URL:', authUrl);
    // window.location.href = authUrl;
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
