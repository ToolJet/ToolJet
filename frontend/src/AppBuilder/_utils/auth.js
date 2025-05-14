import { authenticationService } from '@/_services/authentication.service';
import { setCookie } from '@/_helpers/cookie';
import { sessionService } from '@/_services';

export function fetchOAuthToken(authUrl, dataSourceId) {
  localStorage.setItem('sourceWaitingForOAuth', dataSourceId);
  const currentSessionValue = authenticationService.currentSessionValue;
  currentSessionValue?.current_organization_id &&
    setCookie('orgIdForOauth', currentSessionValue?.current_organization_id);
  window.open(authUrl);
}

export function logoutAction() {
  localStorage.clear();
  sessionService.logout(true);

  return Promise.resolve();
}

export function fetchOauthTokenForSlackAndGSheet(dataSourceId, data) {
  const provider = data?.kind;
  let scope = '';
  let authUrl = data.auth_url;

  switch (provider) {
    case 'slack': {
      scope =
        data?.options?.access_type === 'chat:write'
          ? 'chat:write,users:read,chat:write:bot,chat:write:user'
          : 'chat:write,users:read';
      authUrl = `${authUrl}&scope=${scope}&access_type=offline&prompt=select_account`;
      break;
    }
    case 'googlesheets': {
      scope =
        data?.options?.access_type === 'read'
          ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
          : 'https://www.googleapis.com/auth/spreadsheets';
      authUrl = `${authUrl}&scope=${scope}&access_type=offline&prompt=consent`;
      break;
    }
    case 'zendesk': {
      scope = data?.options?.access_type === 'read' ? 'read' : 'read%20write';
      authUrl = `${authUrl}&scope=${scope}`;
      break;
    }
    default:
      break;
  }

  localStorage.setItem('sourceWaitingForOAuth', dataSourceId);
  window.open(authUrl);
}
