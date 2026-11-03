/**
 * @group working
 * @group security
 */
jest.mock('@modules/mcp-oauth/service', () => ({ McpOAuthService: class {} }));
import 'reflect-metadata';

jest.mock('@modules/mcp-oauth/identity.service', () => ({
  McpOAuthIdentityService: class {},
}));
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: (operation, manager) => operation(manager),
}));
jest.mock('@helpers/utils.helper', () => ({
  isHttpsEnabled: () => false,
  isSuperAdmin: () => false,
  applyCustomDomainCookieOptions: jest.fn(),
}));
jest.mock('@modules/request-context/service', () => ({
  RequestContext: { currentContext: undefined },
}));
jest.mock('@otel/tracing', () => ({
  trackUserActivity: jest.fn(),
  extractAppIdFromPath: jest.fn(),
}));
import { JwtStrategy } from '@modules/session/jwt/jwt.strategy';

describe('MCP OAuth account session context', () => {
  const owner = {
    id: 'synthetic-owner',
    email: 'operator@synthetic.example',
    sessionId: 'synthetic-pat-session',
  };
  const organization = {
    id: 'synthetic-workspace',
    name: 'Garden operations',
    slug: 'garden',
    status: 'active',
  };
  const evidence = {
    organizationId: organization.id,
    method: 'form',
    providerId: null,
    verifiedAt: 123,
    policyFingerprint: 'synthetic-fingerprint',
  };
  function strategy() {
    const instance: any = Object.create(JwtStrategy.prototype);
    instance.transactionLogger = { log: jest.fn() };
    instance.sessionUtilService = {
      getDefaultBranchId: jest.fn().mockResolvedValue('garden-default-branch'),
      validateUserSession: jest.fn().mockResolvedValue(undefined),
      findOrganization: jest.fn().mockResolvedValue(organization),
      handleUnauthorizedUser: jest.fn(),
    };
    instance.userRepository = {
      findByEmail: jest.fn().mockImplementation(async () => ({ ...owner })),
    };
    instance.mcpOAuthIdentityService = { validateDelegation: jest.fn() };
    return instance;
  }
  const pat = {
    username: owner.id,
    sub: owner.email,
    sessionId: owner.sessionId,
    organizationIds: [organization.id],
    isPATLogin: true,
    isSSOLogin: false,
    isPasswordLogin: false,
    patScope: 'workspace',
    tj_api_source: 'personal_access_token',
  };

  test('OAuth account lookup retains the source workspace SSO context for enterprise token refresh checks', async () => {
    const instance = strategy();
    const user = await instance.validate(
      {
        headers: { 'tj-workspace-id': 'selected-workspace' },
        isGetUserSession: true,
        isMcpOAuthAccount: true,
      },
      {
        ...pat,
        isPATLogin: false,
        isSSOLogin: true,
        workspaceAuthentication: { ...evidence, method: 'openid' },
      }
    );
    expect(user).toMatchObject({
      organizationId: organization.id,
      isSSOLogin: true,
      workspaceAuthentication: { ...evidence, method: 'openid' },
    });
  });
});
