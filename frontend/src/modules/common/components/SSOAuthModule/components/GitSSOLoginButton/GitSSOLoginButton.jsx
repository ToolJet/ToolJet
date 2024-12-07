import React from 'react';
import { buildURLWithQuery } from '@/_helpers/utils';
import SSOButtonWrapper from '../SSOButtonWrapper';

export default function GitSSOLoginButton({
  configs,
  buttonText,
  setRedirectUrlToCookie,
  setSignupOrganizationDetails,
}) {
  const gitLogin = (e) => {
    e.preventDefault();
    setSignupOrganizationDetails && setSignupOrganizationDetails();
    setRedirectUrlToCookie && setRedirectUrlToCookie();
    window.location.href = buildURLWithQuery(`${configs.host_name || 'https://github.com'}/login/oauth/authorize`, {
      client_id: configs?.client_id,
      scope: 'user:email',
    });
  };

  const iconSrc = 'assets/images/onboardingassets/SSO/GitHub.svg';

  return (
    <div data-cy="git-tile">
      <SSOButtonWrapper onClick={gitLogin} icon={iconSrc} text={`${buttonText} GitHub`} dataCy="git-sso-button" />
    </div>
  );
}
