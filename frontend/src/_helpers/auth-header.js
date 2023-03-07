import { authenticationService } from '@/_services';
import { handleUnSubscription } from './utils';

export function authHeader(isMultipartData = false) {
  // return authorization header with jwt token
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  let org_details = authenticationService.currentOrgValue;

  let subsciption;
  if (!subsciption || (subsciption?.isClosed && subsciption?.isStopped)) {
    subsciption = authenticationService.currentOrganization.subscribe((newOrgDetails) => {
      org_details = newOrgDetails;
    });
    handleUnSubscription(subsciption);
  }

  if (currentUser && currentUser.auth_token) {
    return {
      Authorization: `Bearer ${currentUser.auth_token}`,
      'tj-workspace-id': org_details.current_organization_id,
      ...(!isMultipartData && {
        'Content-Type': 'application/json',
      }),
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}
