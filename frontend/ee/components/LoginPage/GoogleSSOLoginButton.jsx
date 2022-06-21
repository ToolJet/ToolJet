import React from 'react';
import GoogleLogin from 'react-google-login';

export default function GoogleSSOLoginButton(props) {
  return (
    <div className="mt-2" data-cy="google-sign-in-tile">
      <GoogleLogin
        clientId={props.configs?.client_id}
        buttonText="Login"
        cookiePolicy={'single_host_origin'}
        uxMode="redirect"
        redirectUri={`${window.location.protocol}//${window.location.host}/sso/google/${props.configId}`}
        render={(renderProps) => (
          <div>
            <button {...renderProps} className="btn border-0 rounded-2">
              <img
                onClick={renderProps.onClick}
                disabled={renderProps.disabled}
                src="/assets/images/sso-buttons/google.svg"
                className="h-4"
                data-cy="google-icon"
              />
              <span className="px-1" data-cy="google-sign-in-text">
                Sign in with Google
              </span>
            </button>
          </div>
        )}
      />
    </div>
  );
}
