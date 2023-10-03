import React from 'react';
import { buildURLWithQuery } from '@/_helpers/utils';

export default function GoogleSSOLoginButton(props) {
  const randomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };
  const googleLogin = (e) => {
    e.preventDefault();
    props.setRedirectUrlToCookie && props.setRedirectUrlToCookie();
    const { client_id } = props.configs;
    const authUrl = buildURLWithQuery('https://accounts.google.com/o/oauth2/auth', {
      redirect_uri: `${window.public_config?.TOOLJET_HOST}${window.public_config?.SUB_PATH ?? '/'}sso/google${
        props.configId ? `/${props.configId}` : ''
      }`,
      response_type: 'id_token',
      scope: 'email profile',
      client_id,
      nonce: randomString(10), //for some security purpose
    });
    window.location.href = authUrl;
  };
  return (
    <div data-cy="git-tile">
      <div onClick={googleLogin} className="sso-button border-0 rounded-2">
        <img src="assets/images/onboardingassets/SSO/Google.svg" data-cy="google-sso-icon" />
        <span className="px-1 sso-info-text" data-cy="google-sso-text">
          {props.text || 'Sign in with Google'}
        </span>
      </div>
    </div>
  );
}
