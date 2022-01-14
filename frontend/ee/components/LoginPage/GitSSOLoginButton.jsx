import React from 'react';
import { toQuery } from '@/_helpers/utils';

export default function GitSSOLoginButton({ clientId }) {
  const gitLogin = (e) => {
    e.preventDefault();
    const search = toQuery({
      client_id: clientId,
    });
    window.location.href = `https://github.com/login/oauth/authorize?${search}`;
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
