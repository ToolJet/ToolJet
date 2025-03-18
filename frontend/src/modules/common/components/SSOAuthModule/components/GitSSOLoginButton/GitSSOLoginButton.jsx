import React, { forwardRef, useImperativeHandle } from 'react';
import { buildURLWithQuery } from '@/_helpers/utils';
import SSOButtonWrapper from '../SSOButtonWrapper';
import { toast } from 'react-hot-toast';

const GitSSOLoginButton = forwardRef(
  ({ configs, buttonText, setRedirectUrlToCookie, setSignupOrganizationDetails }, ref) => {
    const gitLogin = (e) => {
      e?.preventDefault();
      try {
        setSignupOrganizationDetails && setSignupOrganizationDetails();
        setRedirectUrlToCookie && setRedirectUrlToCookie();
        const authUrl = buildURLWithQuery(`${configs.host_name || 'https://github.com'}/login/oauth/authorize`, {
          client_id: configs?.client_id,
          scope: 'user:email',
        });
        window.location.href = authUrl;
      } catch (error) {
        toast.error(error || 'GitHub login failed');
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        triggerLogin: gitLogin,
      }),
      []
    );

    const iconSrc = 'assets/images/onboardingassets/SSO/GitHub.svg';

    return (
      <div data-cy="git-tile">
        <SSOButtonWrapper onClick={gitLogin} icon={iconSrc} text={`${buttonText} GitHub`} dataCy="git-sso-button" />
      </div>
    );
  }
);

export default GitSSOLoginButton;
