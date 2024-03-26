import React from 'react';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
const SSOLoginModule = ({ configs, setRedirectUrlToCookie, buttonText, setSignupOrganizationDetails }) => {
  return (
    <>
      {configs?.git?.enabled && (
        <div className="login-sso-wrapper">
          <GitSSOLoginButton
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
export default SSOLoginModule;
