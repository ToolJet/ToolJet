// signIn wraps the login-completion branch in dbTransactionWrap, which opens a real DB
// transaction — stub it to just invoke the callback, matching
// test/modules/git-sync-configs/unit/service.spec.ts.
let currentManager: any;
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn((operation: any, manager?: any) => operation(manager ?? currentManager)),
}));

import { UnauthorizedException } from '@nestjs/common';
import { OauthService } from '@modules/auth/oauth/service';
import { SSOType } from '@entities/sso_config.entity';
import { SSOResponse } from '@modules/auth/oauth/interfaces/ISSOResponse';

function makeService(deps: { googleOAuthService: any; loginConfigsUtilService: any; userRepository: any }) {
  return new OauthService(
    deps.googleOAuthService,
    {} as any, // gitOAuthService
    {} as any, // oidcOAuthService
    {} as any, // ldapService
    {} as any, // samlService
    deps.loginConfigsUtilService,
    {} as any, // authUtilService
    {} as any, // licenseTermsService
    { activateOrganization: jest.fn() } as any, // organizationUsersUtilService
    deps.userRepository,
    {} as any, // instanceSettingsUtilService
    {} as any, // organizationRepository
    {} as any, // organizationUsersRepository
    {} as any, // licenseUserService
    {} as any, // onboardingUtilService
    { generateLoginResultPayload: jest.fn().mockResolvedValue({ ok: true }) } as any, // sessionUtilService
    {} as any // setupOrganizationsUtilService
  );
}

describe('OauthService.signIn — GHSA-7g4q email_verified gate', () => {
  const ssoResponse = { token: 'some-token', organizationId: 'org-1' } as SSOResponse;
  const activeUser = {
    id: 'user-1',
    email: 'user@tooljet.io',
    invitationToken: null,
    forgotPasswordToken: null,
    organizationUsers: [{ status: 'active' }],
  };

  beforeEach(() => {
    currentManager = {};
  });

  it('rejects sign-in when the SSO provider reports the email as unverified', async () => {
    const googleOAuthService = {
      signIn: jest.fn().mockResolvedValue({
        userSSOId: 'sso-id',
        firstName: 'SSO',
        lastName: 'User',
        email: 'user@tooljet.io',
        emailVerified: false,
        sso: 'google',
      }),
    };
    const loginConfigsUtilService = {
      getConfigs: jest.fn().mockResolvedValue({
        organization: { id: 'org-1', enableSignUp: true, domain: undefined },
        sso: 'google',
        configs: { clientId: 'google-client-id' },
      }),
    };
    const userRepository = { findByEmail: jest.fn().mockResolvedValue(activeUser) };
    const service = makeService({ googleOAuthService, loginConfigsUtilService, userRepository });

    await expect(
      service.signIn({} as any, ssoResponse, 'config-1', SSOType.GOOGLE, undefined, undefined)
    ).rejects.toThrow(UnauthorizedException);
  });

  it('still signs in when the SSO provider reports the email as verified', async () => {
    const googleOAuthService = {
      signIn: jest.fn().mockResolvedValue({
        userSSOId: 'sso-id',
        firstName: 'SSO',
        lastName: 'User',
        email: 'user@tooljet.io',
        emailVerified: true,
        sso: 'google',
      }),
    };
    const loginConfigsUtilService = {
      getConfigs: jest.fn().mockResolvedValue({
        organization: { id: 'org-1', enableSignUp: true, domain: undefined },
        sso: 'google',
        configs: { clientId: 'google-client-id' },
      }),
    };
    const userRepository = { findByEmail: jest.fn().mockResolvedValue(activeUser) };
    const service = makeService({ googleOAuthService, loginConfigsUtilService, userRepository });

    const result = await service.signIn({} as any, ssoResponse, 'config-1', SSOType.GOOGLE, undefined, undefined);

    expect(result).toEqual({ ok: true });
  });

  it('still signs in when the SSO provider never reports an emailVerified value (e.g. Git without it wired up yet)', async () => {
    const googleOAuthService = {
      signIn: jest.fn().mockResolvedValue({
        userSSOId: 'sso-id',
        firstName: 'SSO',
        lastName: 'User',
        email: 'user@tooljet.io',
        sso: 'google',
      }),
    };
    const loginConfigsUtilService = {
      getConfigs: jest.fn().mockResolvedValue({
        organization: { id: 'org-1', enableSignUp: true, domain: undefined },
        sso: 'google',
        configs: { clientId: 'google-client-id' },
      }),
    };
    const userRepository = { findByEmail: jest.fn().mockResolvedValue(activeUser) };
    const service = makeService({ googleOAuthService, loginConfigsUtilService, userRepository });

    const result = await service.signIn({} as any, ssoResponse, 'config-1', SSOType.GOOGLE, undefined, undefined);

    expect(result).toEqual({ ok: true });
  });
});
