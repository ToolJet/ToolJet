import { authenticationService } from '@/_services';

export function authHeader() {
  // return authorization header with jwt token
  const currentUser = authenticationService.currentUserValue;
  let org_details = authenticationService.currentOrgValue;

  //TODO: found a way to unsubscribe all rxjs subscriptions (Prevent memmory leak)
  authenticationService.currentOrganization.subscribe((newOrgDetails) => {
    org_details = newOrgDetails;
  });

  if (currentUser && currentUser.auth_token) {
    return {
      Authorization: `Bearer ${currentUser.auth_token}`,
      'tj-workspace-id': org_details.current_organization_id,
      'Content-Type': 'application/json',
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}
