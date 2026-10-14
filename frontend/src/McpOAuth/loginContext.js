import config from 'config';
import { isMcpOAuthConsentPath } from '@/_helpers/routes';

export const ssoStateRedirect = (state) => {
  if (typeof state !== 'string') return null;
  try {
    const value = JSON.parse(decodeURIComponent(state));
    return typeof value?.redirectTo === 'string' ? value.redirectTo : null;
  } catch {
    return null;
  }
};

// State supplies only a lookup key. The issuer's HttpOnly interaction cookie
// proves this browser owns it; workspace identity comes from the backend.
export const loadMcpOAuthLoginContext = async (redirectTo) => {
  if (!isMcpOAuthConsentPath(redirectTo)) throw new Error('Invalid AI connection return path');
  const id = new URL(redirectTo, window.location.origin).searchParams.get('request');
  const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/mcp-oauth/interactions/${id}`, {
    credentials: 'include',
    headers: { 'x-tooljet-oauth-origin': window.location.origin },
  });
  if (!response.ok) throw new Error('This AI connection expired or changed. Start again from your AI client.');
  const flow = await response.json();
  if (typeof flow.organizationId !== 'string' || !flow.organizationId) {
    throw new Error('Unable to identify the workspace for this AI connection. Start again from your AI client.');
  }
  return { organizationId: flow.organizationId, redirectTo };
};
