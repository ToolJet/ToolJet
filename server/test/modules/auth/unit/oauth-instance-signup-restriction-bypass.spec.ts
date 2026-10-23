// signIn opens a real DB transaction via dbTransactionWrap for the user-creation branch —
// stub it to just invoke the callback, matching test/modules/git-sync-configs/unit/service.spec.ts.
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn((operation: any, manager?: any) => operation(manager ?? {})),
}));

import { UnauthorizedException } from '@nestjs/common';
import { OauthService } from '@modules/auth/oauth/service';
import { SSOType } from '@entities/sso_config.entity';
import { SSOResponse } from '@modules/auth/oauth/interfaces/ISSOResponse';

function makeService(deps: {
  googleOAuthService: any;
  authUtilService: any;
  userRepository: any;
  setupOrganizationsUtilService: any;
  organizationUsersRepository: any;
  organizationUsersUtilService: any;
  sessionUtilService?: any;
}) {
  return new OauthService(
    deps.googleOAuthService,
    {} as any, // gitOAuthService
    {} as any, // oidcOAuthService
    {} as any, // ldapService
    {} as any, // samlService
    {} as any, // loginConfigsUtilService
    deps.authUtilService,
    {} as any, // licenseTermsService
    deps.organizationUsersUtilService,
    deps.userRepository,
    {} as any, // instanceSettingsUtilService
    {} as any, // organizationRepository
    deps.organizationUsersRepository,
    {} as any, // licenseUserService
    {} as any, // onboardingUtilService
    deps.sessionUtilService ?? ({} as any),
    deps.setupOrganizationsUtilService
  );
}

describe('OauthService.signIn — GHSA-mqm7 instance-SSO signup-restriction bypass guard', () => {
  const ssoResponse = { token: 'some-token' } as SSOResponse;

  it('rejects a new user via instance SSO login when instance signup is disabled', async () => {
    const googleOAuthService = {
      signIn: jest.fn().mockResolvedValue({
        userSSOId: 'sso-id',
        firstName: 'SSO',
        lastName: 'User',
        email: 'newuser@tooljet.io',
        sso: 'google',
      }),
    };
    const authUtilService = {
      getInstanceSSOConfigsOfType: jest.fn().mockResolvedValue({
        organization: { enableSignUp: false, domain: undefined },
        sso: 'google',
        configs: { clientId: 'google-client-id' },
      }),
    };
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(undefined),
      createOrUpdate: jest.fn().mockResolvedValue({ id: 'user-1', email: 'newuser@tooljet.io' }),
    };
    const setupOrganizationsUtilService = {
      create: jest.fn().mockResolvedValue({ id: 'org-1', name: 'My workspace', slug: 'my-workspace' }),
    };
    const organizationUsersRepository = { createOne: jest.fn().mockResolvedValue(undefined) };
    const organizationUsersUtilService = { attachUserGroup: jest.fn().mockResolvedValue(undefined) };
    const sessionUtilService = { generateLoginResultPayload: jest.fn().mockResolvedValue({ ok: true }) };

    const service = makeService({
      googleOAuthService,
      authUtilService,
      userRepository,
      setupOrganizationsUtilService,
      organizationUsersRepository,
      organizationUsersUtilService,
      sessionUtilService,
    });

    await expect(
      service.signIn({} as any, ssoResponse, undefined, SSOType.GOOGLE, undefined, undefined)
    ).rejects.toThrow(UnauthorizedException);

    expect(setupOrganizationsUtilService.create).not.toHaveBeenCalled();
  });

  it('still signs up a new user via instance SSO login when instance signup is enabled', async () => {
    const googleOAuthService = {
      signIn: jest.fn().mockResolvedValue({
        userSSOId: 'sso-id',
        firstName: 'SSO',
        lastName: 'User',
        email: 'newuser@tooljet.io',
        sso: 'google',
      }),
    };
    const authUtilService = {
      getInstanceSSOConfigsOfType: jest.fn().mockResolvedValue({
        organization: { enableSignUp: true, domain: undefined },
        sso: 'google',
        configs: { clientId: 'google-client-id' },
      }),
    };
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(undefined),
      createOrUpdate: jest.fn().mockResolvedValue({ id: 'user-1', email: 'newuser@tooljet.io' }),
    };
    const setupOrganizationsUtilService = {
      create: jest.fn().mockResolvedValue({ id: 'org-1', name: 'My workspace', slug: 'my-workspace' }),
    };
    const organizationUsersRepository = { createOne: jest.fn().mockResolvedValue(undefined) };
    const organizationUsersUtilService = { attachUserGroup: jest.fn().mockResolvedValue(undefined) };
    const sessionUtilService = { generateLoginResultPayload: jest.fn().mockResolvedValue({ ok: true }) };

    const service = makeService({
      googleOAuthService,
      authUtilService,
      userRepository,
      setupOrganizationsUtilService,
      organizationUsersRepository,
      organizationUsersUtilService,
      sessionUtilService,
    });

    await service.signIn({} as any, ssoResponse, undefined, SSOType.GOOGLE, undefined, undefined);

    expect(setupOrganizationsUtilService.create).toHaveBeenCalled();
  });
});
