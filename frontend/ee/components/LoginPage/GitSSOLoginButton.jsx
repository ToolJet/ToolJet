import React from 'react';
import { buildURLWithQuery } from '@/_helpers/utils';
import { useParams } from 'react-router-dom';
import { authenticationService } from '../../../src/_services/authentication.service';

export default function GitSSOLoginButton({ configs, text }) {
  const { organizationId } = useParams();

  const gitLogin = (e) => {
    e.preventDefault();
    authenticationService.saveLoginOrganizationId(organizationId);
    window.location.href = buildURLWithQuery(`${configs.host_name || 'https://github.com'}/login/oauth/authorize`, {
      client_id: configs?.client_id,
      scope: 'user:email',
    });
  };
  return (
    <div data-cy="git-tile">
      <div onClick={gitLogin} className="sso-button border-0 rounded-2">
        <img src="assets/images/onboardingassets/SSO/GitHub.svg" data-cy="git-sso-icon" />
        <span className="px-1 sso-info-text" data-cy="git-sso-text">
          {text || 'Sign in with GitHub'}
        </span>
      </div>
    </div>
  );
}
