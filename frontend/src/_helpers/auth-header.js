import { authenticationService } from '@/_services';
import { handleUnSubscription } from './utils';

export function authHeader(isMultipartData = false, current_organization_id) {
  // return authorization header with jwt token
  let session = authenticationService.currentSessionValue;

  let subsciption;
  if (!subsciption || (subsciption?.isClosed && subsciption?.isStopped)) {
    subsciption = authenticationService.currentSession.subscribe((newSession) => {
      session = newSession;
    });
    handleUnSubscription(subsciption);
  }

  const wid = current_organization_id || session.current_organization_id;

  return {
    ...(!isMultipartData && {
      'Content-Type': 'application/json',
    }),
    ...(wid && {
      'tj-workspace-id': wid,
    }),
  };
}
