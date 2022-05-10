import React from 'react';
import { buildURLWithQuery } from '@/_helpers/utils';

export default function GitSSOLoginButton({ configs }) {
  const gitLogin = (e) => {
    e.preventDefault();
    window.location.href = buildURLWithQuery('https://github.com/login/oauth/authorize', {
      client_id: configs?.client_id,
      scope: 'user:email',
    });
  };
  return (
    <div>
      <button onClick={gitLogin} className="btn border-0 rounded-2">
        <img src="/assets/images/sso-buttons/git.svg" className="h-4" />
        <span className="px-1">Sign in with Github</span>
      </button>
    </div>
  );
}
