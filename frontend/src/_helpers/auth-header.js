import { authenticationService } from '@/_services';
import { handleUnSubscription } from './utils';
import { getPatToken } from '@/AppBuilder/EmbedApp';

export function authHeader(isMultipartData = false, current_organization_id) {
  let session = authenticationService.currentSessionValue;

  let subsciption;
  if (!subsciption || (subsciption?.isClosed && subsciption?.isStopped)) {
    subsciption = authenticationService.currentSession.subscribe((newSession) => {
      session = newSession;
    });
    handleUnSubscription(subsciption);
  }

  const wid = current_organization_id || session?.current_organization_id;

  const headers = {
    ...(!isMultipartData && {
      'Content-Type': 'application/json',
    }),
    ...(wid && {
      'tj-workspace-id': wid,
    }),
  };

  // ✅ Explicitly remove PAT on login or logout routes
  const path = window.location.pathname;
  const isLoginOrLogout = path.includes('/login') || path.includes('/logout');

  if (!isLoginOrLogout) {
    const pat = getPatToken();
    if (pat) {
      headers['tj_auth_token'] = pat;
    }
  }

  return headers;
}
