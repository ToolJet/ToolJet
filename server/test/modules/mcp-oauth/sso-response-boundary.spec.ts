import 'reflect-metadata';

jest.mock('@modules/session/util.service', () => ({
  SessionUtilService: class {
    async generateSessionPayload(user, organization) {
      return { id: user.id, email: user.email, current_organization_id: organization?.id };
    }
  },
}));
jest.mock('@modules/auth/util.service', () => ({ AuthUtilService: class {} }));
jest.mock('@modules/setup-organization/util.service', () => ({ SetupOrganizationsUtilService: class {} }));
jest.mock('@ee/meta/util.service', () => ({ MetadataUtilService: class {} }));
jest.mock('@ee/encryption/service', () => ({ EncryptionService: class {} }));
jest.mock('@helpers/database.helper', () => ({ dbTransactionWrap: (operation, manager) => operation(manager || {}) }));
jest.mock('@helpers/utils.helper', () => ({
  decamelizeKeysExcept: (value) => value,
  isSuperAdmin: () => false,
}));
jest.mock('@modules/request-context/service', () => ({ RequestContext: { setLocals: jest.fn() } }));

import { SessionUtilService } from '@ee/session/util.service';
import { AuthService } from '@modules/auth/service';

/** Real response builders are exercised; only repositories and unrelated base metadata are stubbed. */
describe('OAuth bootstrap never exports upstream SSO credentials', () => {
  const organization = { id: 'synthetic-meadow-workspace', slug: 'meadow', name: 'Meadow Operations' };
  const owner = { id: 'synthetic-operator', email: 'operator@meadow.example', firstName: 'Jamie',
    lastName: 'Fern', organizationId: organization.id, defaultOrganizationId: organization.id };
  const ssoInfo = Object.freeze({
    email: owner.email,
    department: 'Garden planning',
    access_token: 'synthetic-upstream-access',
    refresh_token: 'synthetic-upstream-refresh',
    id_token: 'synthetic-upstream-id',
    nested: Object.freeze({ opaque_credential: 'synthetic-custom-provider-secret',
      entries: Object.freeze([{ refresh_token: 'synthetic-nested-refresh' }]) }),
  });
  const permissionData = Object.freeze({ id: owner.id, email: owner.email, ssoUserInfo: ssoInfo,
    metadata: { location: 'Meadow' }, role: { name: 'builder' }, groupPermissions: [{ name: 'gardeners' }] });
  let sessions: any;
  let auth: any;

  beforeEach(() => {
    sessions = Object.create(SessionUtilService.prototype);
    sessions.getPermissionDataToAuthorize = jest.fn().mockResolvedValue(permissionData);
    auth = Object.create(AuthService.prototype);
    auth.sessionUtilService = sessions;
    auth.organizationRepository = { get: jest.fn().mockResolvedValue(organization) };
    auth.userRepository = { updateOne: jest.fn() };
  });

  test.each([
    { oauthGrantId: 'synthetic-grant', oauthAppId: 'synthetic-app' },
    { oauthGrantId: 'synthetic-grant' },
  ])('session and authorize responses withhold every SSO field for OAuth principal %j', async (claims) => {
    const user = { ...owner, ...claims };
    const session = await sessions.generateSessionPayload(user, organization);
    const authorization = await auth.authorizeOrganization(user);
    expect(session.sso_user_info).toEqual({});
    expect(authorization.ssoUserInfo).toEqual({});
    expect(authorization.currentUser.ssoUserInfo).toEqual({});
    expect(session.email).toBe(owner.email);
    expect(authorization.currentUser.firstName).toBe(owner.firstName);
    expect(authorization.role).toEqual(permissionData.role);
    expect(authorization.groupPermissions).toEqual(permissionData.groupPermissions);
    expect(JSON.stringify([session, authorization])).not.toContain('synthetic-upstream');
    expect(JSON.stringify([session, authorization])).not.toContain('synthetic-custom-provider-secret');
  });

  test.each([{ isSSOLogin: true }, { isPasswordLogin: true }, { isPATLogin: true }])(
    'ordinary browser and PAT responses preserve existing SSO fields: %j', async (claims) => {
      const user = { ...owner, ...claims };
      const session = await sessions.generateSessionPayload(user, organization);
      const authorization = await auth.authorizeOrganization(user);
      expect(session.sso_user_info).toBe(ssoInfo);
      expect(authorization.ssoUserInfo).toBe(ssoInfo);
      expect(authorization.currentUser.ssoUserInfo).toBe(ssoInfo);
    }
  );

  test('response filtering leaves shared permission data and server-side SSO query globals unchanged', async () => {
    const user = { ...owner, oauthGrantId: 'synthetic-grant', oauthAppId: 'synthetic-app' };
    await sessions.generateSessionPayload(user, organization);
    await auth.authorizeOrganization(user);
    const serverGlobals = await sessions.getGlobalCurrentUserDetails(user);
    expect(permissionData.ssoUserInfo).toBe(ssoInfo);
    expect(permissionData.ssoUserInfo.nested.opaque_credential).toBe('synthetic-custom-provider-secret');
    expect(serverGlobals.ssoUserInfo).toBe(ssoInfo);
    expect(serverGlobals.groups).toEqual(['all_users', 'gardeners', 'builder']);
  });
});
