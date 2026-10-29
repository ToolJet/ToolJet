import React, { forwardRef, useImperativeHandle } from 'react';
import { buildURLWithQuery } from '@/_helpers/utils';
import SSOButtonWrapper from '../SSOButtonWrapper';
import { toast } from 'react-hot-toast';

const GitSSOLoginButton = forwardRef(
  ({ configs, buttonText, setRedirectUrlToCookie, setSignupOrganizationDetails, redirectTo }, ref) => {
    const gitLogin = (e) => {
      e?.preventDefault();
      try {
        setSignupOrganizationDetails && setSignupOrganizationDetails();
        setRedirectUrlToCookie && setRedirectUrlToCookie();
        // Encode redirectTo in state so it survives the OAuth round-trip back to the base
        // domain — the base domain cannot read a cookie set on a custom domain.
        const state = redirectTo ? encodeURIComponent(JSON.stringify({ redirectTo })) : undefined;
        const authUrl = buildURLWithQuery(`${configs.host_name || 'https://github.com'}/login/oauth/authorize`, {
          client_id: configs?.client_id,
          scope: 'user:email',
          ...(state && { state }),
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
