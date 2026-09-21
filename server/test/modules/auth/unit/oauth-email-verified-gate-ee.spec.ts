import { UnauthorizedException } from '@nestjs/common';
import { OauthService } from '@ee/auth/oauth/service';
import { SSOType } from '@entities/sso_config.entity';
import { SSOResponse } from '@modules/auth/oauth/interfaces/ISSOResponse';

function makeService(deps: {
  googleOAuthService: any;
  loginConfigsUtilService: any;
  authUtilService: any;
  userRepository: any;
}) {
  return new OauthService(
    deps.googleOAuthService,
    {} as any, // gitOAuthService
    {} as any, // oidcOAuthService
    {} as any, // ldapService
    {} as any, // samlService
    deps.loginConfigsUtilService,
    deps.authUtilService,
    { getLicenseTerms: jest.fn().mockResolvedValue(true) } as any, // licenseTermsService
    {} as any, // organizationUsersUtilService
    deps.userRepository,
    {} as any, // instanceSettingsUtilService
    {} as any, // organizationRepository
    {} as any, // organizationUsersRepository
    {} as any, // licenseUserService
    {} as any, // onboardingUtilService
    {} as any, // sessionUtilService
    {} as any, // setupOrganizationsUtilService
    {} as any, // encryptionService
    {} as any // eventEmitter
  );
}

describe('EE OauthService.signIn — GHSA-7g4q email_verified gate', () => {
  const ssoResponse = { token: 'some-token', organizationId: 'org-1' } as SSOResponse;
  const loginConfigsUtilService = {
    getConfigs: jest.fn().mockResolvedValue({
      organization: { id: 'org-1', enableSignUp: true, domain: undefined },
      sso: 'google',
      configs: { clientId: 'google-client-id' },
    }),
  };

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
    const authUtilService = {};
    const userRepository = { findByEmail: jest.fn() };
    const service = makeService({ googleOAuthService, loginConfigsUtilService, authUtilService, userRepository });

    await expect(
      service.signIn({} as any, ssoResponse, 'config-1', SSOType.GOOGLE, undefined, undefined)
    ).rejects.toThrow(UnauthorizedException);

    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('does not block sign-in when the SSO provider reports the email as verified', async () => {
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
    const authUtilService = {};
    // Probe: stub the very next real collaborator call after the gate to fail with a
    // recognizable marker, proving execution passed the gate rather than fully re-stubbing
    // EE's much deeper post-gate pipeline (group sync, audit context, CRM events, ...).
    const userRepository = { findByEmail: jest.fn().mockRejectedValue(new Error('REACHED_PAST_GATE')) };
    const service = makeService({ googleOAuthService, loginConfigsUtilService, authUtilService, userRepository });

    await expect(
      service.signIn({} as any, ssoResponse, 'config-1', SSOType.GOOGLE, undefined, undefined)
    ).rejects.toThrow('REACHED_PAST_GATE');
  });
});
