import React from 'react';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
import OidcSSOLoginButton from '@ee/components/LoginPage/OidcSSOLoginButton';
import LdapSSOLoginButton from '@ee/components/LoginPage/LdapSSOLoginButton';
import SAMLSSOLoginButton from '@ee/components/LoginPage/SAMLSSOLoginButton';

const SSOLoginModule = ({
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
      )}
      {configs?.openid?.enabled && (
        <OidcSSOLoginButton
          configId={configs?.openid?.config_id}
          name={configs?.openid?.configs?.name}
          featureIncluded={configs?.openid?.feature_included}
          bannerMessage={configs?.openid?.banner_message}
          setRedirectUrlToCookie={setRedirectUrlToCookie}
          setSignupOrganizationDetails={setSignupOrganizationDetails}
          buttonText={buttonText}
        />
      )}
      {configs?.saml?.enabled && (
        <SAMLSSOLoginButton
          configs={configs?.saml?.configs}
          configId={configs?.saml?.config_id}
          setRedirectUrlToCookie={setRedirectUrlToCookie}
          name={configs?.saml?.configs?.name}
          featureIncluded={configs?.saml?.feature_included}
          setSignupOrganizationDetails={setSignupOrganizationDetails}
          bannerMessage={configs?.saml?.banner_message}
          buttonText={buttonText}
        />
      )}
    </>
  );
};

export default SSOLoginModule;
