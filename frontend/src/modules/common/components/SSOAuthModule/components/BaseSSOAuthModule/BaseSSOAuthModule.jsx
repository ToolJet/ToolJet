import React from 'react';
import { GoogleSSOLoginButton, GitSSOLoginButton } from '..';

const BaseSSOAuthModule = ({
  configs,
  setRedirectUrlToCookie,
  buttonText,
  setSignupOrganizationDetails,
  gitSSORef,
  googleSSORef,
}) => {
  return (
    <>
      {configs?.git?.enabled && (
        <div className="login-sso-wrapper">
          <GitSSOLoginButton
            ref={gitSSORef}
            configs={configs?.git?.configs}
            setRedirectUrlToCookie={setRedirectUrlToCookie}
            setSignupOrganizationDetails={setSignupOrganizationDetails}
            buttonText={buttonText}
          />
        </div>
      )}
      {configs?.google?.enabled && (
        <div className="login-sso-wrapper">
          <GoogleSSOLoginButton
            ref={googleSSORef}
            configs={configs?.google?.configs}
            configId={configs?.google?.config_id}
            setRedirectUrlToCookie={setRedirectUrlToCookie}
            setSignupOrganizationDetails={setSignupOrganizationDetails}
            buttonText={buttonText}
          />
        </div>
      )}
    </>
  );
};

export default BaseSSOAuthModule;
