import React from 'react';
import GoogleLogin from 'react-google-login';

export default function GoogleSSOLoginButton(props) {
  return (
    <GoogleLogin
      clientId={props.configs?.client_id}
      buttonText="Login"
      cookiePolicy={'single_host_origin'}
      uxMode="redirect"
      redirectUri={`${window.public_config?.TOOLJET_HOST}/sso/google${props.configId ? `/${props.configId}` : ''}`}
      render={(renderProps) => (
        <div>
          <div {...renderProps} className="sso-button  border-0 rounded-2">
            <img
              onClick={renderProps.onClick}
              disabled={renderProps.disabled}
              src="assets/images/onboardingassets/SSO/Google.svg"
              data-cy="google-sso-icon"
            />
            <span className="px-1 sso-info-text" data-cy="google-sso-text">
              {props.text || 'Sign in with Google'}
            </span>
          </div>
        </div>
      )}
    />
  );
}
