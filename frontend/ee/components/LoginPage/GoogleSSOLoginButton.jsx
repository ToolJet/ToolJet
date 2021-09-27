import React from 'react';
import GoogleLogin from 'react-google-login';
import config from 'config';
import { authenticationService } from '@/_services';

export default function GoogleSSOLoginButton(props) {
  const googleSSOSuccessHandler = (googleUser) => {
    const idToken = googleUser.getAuthResponse().id_token;
    authenticationService.signInViaOAuth(idToken).then(props.authSuccessHandler).catch(props.authFailureHandler);
  };

  return (
    <div className="mt-2">
      <GoogleLogin
        clientId={config.ssoGoogleOauth2ClientId}
        buttonText="Login"
        onSuccess={googleSSOSuccessHandler}
        onFailure={props.authFailureHandler}
        cookiePolicy={'single_host_origin'}
        render={(renderProps) => (
          <div>
            <button {...renderProps} className="btn border-0 rounded-2">
              <img
                onClick={renderProps.onClick}
                disabled={renderProps.disabled}
                src="/assets/images/sso-buttons/google.svg"
                className="h-4"
              />
              <span className="px-1">Sign in with Google</span>
            </button>
          </div>
        )}
      />
    </div>
  );
}
