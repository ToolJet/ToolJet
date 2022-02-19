import React from 'react';
import { buildURLWithQuery } from '@/_helpers/utils';

export default function OIDCSSOLoginButton() {
    const clientId = window.public_config.SSO_OIDC_CLIENT_ID;
    const authorizeUrl = window.public_config.SSO_OIDC_AUTHORIZE_URL;
    const oidcName = window.public_config.SSO_OIDC_NAME;
    const responseType = window.public_config.SSO_OIDC_RESPONSE_TYPE || "id_token";
    const scopes = window.public_config.SSO_OIDC_SCOPES || "openid email profile";

    const gitLogin = (e) => {
        e.preventDefault();
        window.location.href = buildURLWithQuery(authorizeUrl, { client_id: clientId, scope: scopes, responseType: responseType });
    };
    return (
        <div>
            <button onClick={gitLogin} className="btn border-0 rounded-2">
                <img src="/assets/images/sso-buttons/unknown.svg" className="h-4" />
                <span className="px-1">Sign in with {oidcName}</span>
            </button>
        </div>
    );
}
