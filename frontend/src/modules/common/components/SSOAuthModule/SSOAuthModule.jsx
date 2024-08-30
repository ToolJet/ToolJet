import React, { useEffect } from 'react';
import {
  GoogleSSOLoginButton,
  GitSSOLoginButton,
  OidcSSOLoginButton,
  LdapSSOLoginButton,
  SamlSSOLoginButton,
} from './components';
const SSOAuthModule = ({
  configs,
  setRedirectUrlToCookie,
  organizationSlug,
  buttonText,
  setSignupOrganizationDetails,
}) => {
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
      {configs?.ldap?.enabled && (
        <div className="login-sso-wrapper">
          <LdapSSOLoginButton
            configs={configs?.ldap?.configs}
            organizationSlug={organizationSlug}
            name={configs?.ldap?.configs?.name}
            featureIncluded={configs?.ldap?.feature_included}
            bannerMessage={configs?.ldap?.banner_message}
            setRedirectUrlToCookie={setRedirectUrlToCookie}
            setSignupOrganizationDetails={setSignupOrganizationDetails}
            buttonText={buttonText}
          />
        </div>
      )}
      {configs?.openid?.enabled && (
        <div className="login-sso-wrapper">
          <OidcSSOLoginButton
            configId={configs?.openid?.config_id}
            name={configs?.openid?.configs?.name}
            featureIncluded={configs?.openid?.feature_included}
            bannerMessage={configs?.openid?.banner_message}
            setRedirectUrlToCookie={setRedirectUrlToCookie}
            setSignupOrganizationDetails={setSignupOrganizationDetails}
            buttonText={buttonText}
          />
        </div>
      )}
      {configs?.saml?.enabled && (
        <div className="login-sso-wrapper">
          <SamlSSOLoginButton
            configs={configs?.saml?.configs}
            configId={configs?.saml?.config_id}
            setRedirectUrlToCookie={setRedirectUrlToCookie}
            name={configs?.saml?.configs?.name}
            featureIncluded={configs?.saml?.feature_included}
            setSignupOrganizationDetails={setSignupOrganizationDetails}
            bannerMessage={configs?.saml?.banner_message}
            buttonText={buttonText}
          />
        </div>
      )}
    </>
  );
};

export default SSOAuthModule;
