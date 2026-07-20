import { authenticationService } from '@/_services/authentication.service';

export function buildSession(overrides = {}) {
  return {
    current_organization_id: 'test-org-id',
    current_organization_name: 'Test Workspace',
    super_admin: false,
    admin: true,
    user_permissions: null,
    group_permissions: null,
    app_group_permissions: null,
    data_source_group_permissions: null,
    workflow_group_permissions: null,
    role: 'admin',
    organizations: [{ id: 'test-org-id', name: 'Test Workspace' }],
    isUserLoggingIn: false,
    authentication_status: true,
    authentication_failed: null,
    isOrgSwitchingFailed: null,
    isUserUpdated: false,
    load_app: false,
    instance_id: 'test-instance-id',
    noWorkspaceAttachedInTheSession: false,
    triggeredOnce: null,
    createdAt: null,
    ...overrides,
  };
}

/**
 * Seeds authenticationService.currentSession so HttpClient sends the
 * `tj-workspace-id` header exactly as it would for a logged-in user.
 * Returns the seeded session.
 */
export function seedSession(overrides = {}) {
  const session = buildSession(overrides);
  authenticationService.updateCurrentSession(session);
  return session;
}
