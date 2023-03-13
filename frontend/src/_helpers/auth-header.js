import { authenticationService } from '@/_services';
import { handleUnSubscription } from './utils';

export function authHeader(isMultipartData = false) {
  // return authorization header with jwt token
  let session = authenticationService.currentSessionValue;

  let subsciption;
  if (!subsciption || (subsciption?.isClosed && subsciption?.isStopped)) {
    subsciption = authenticationService.currentSession.subscribe((newSession) => {
      session = newSession;
    });
    handleUnSubscription(subsciption);
  }

  return {
    ...(!isMultipartData && {
      'Content-Type': 'application/json',
    }),
    ...(session.current_organization_id && {
      'tj-workspace-id': session.current_organization_id,
    }),
  };
}
