import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { ExternalApiSecurityGuard as CeExternalApiSecurityGuard } from '@modules/auth/guards/external-api-security.guard';
import { ExternalApiSecurityGuard } from '@ee/auth/guards/external-api-security.guard';
import { LICENSE_FIELD } from '@modules/licensing/constants';

/**
 * The three gates every External API endpoint shares — config-disabled, unlicensed,
 * and (CE) always-off — have no coverage anywhere in `external-apis/`, e2e or unit,
 * despite gating every /ext/* route. Per testing.md's pruning rule this is tested
 * ONCE here, at the guard, rather than duplicated per endpoint spec.
 */
/** @group platform */
describe('ExternalApiSecurityGuard', () => {
  let mockConfigService: { get: jest.Mock };
  let mockLicenseTermsService: { getLicenseTermsInstance: jest.Mock };
  let guard: ExternalApiSecurityGuard;
  const ORIGINAL_EDITION = process.env.TOOLJET_EDITION;

  const makeContext = (authHeader?: string): ExecutionContext => {
    const request = { headers: authHeader ? { authorization: authHeader } : {} };
    return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    mockConfigService = { get: jest.fn() };
    mockLicenseTermsService = { getLicenseTermsInstance: jest.fn() };
    // appRepository is never touched by canActivate — null-injected per testing.md's
    // boundary rule (prefer null-injecting real collaborators over jest.mock).
    guard = new ExternalApiSecurityGuard(mockConfigService as any, mockLicenseTermsService as any, null as any);
  });

  afterEach(() => {
    process.env.TOOLJET_EDITION = ORIGINAL_EDITION;
  });

  describe('CE', () => {
    it('always denies, regardless of config/license/auth', async () => {
      const ceGuard = new CeExternalApiSecurityGuard(
        mockConfigService as any,
        mockLicenseTermsService as any,
        null as any
      );
      await expect(ceGuard.canActivate(makeContext('Basic anything'))).resolves.toBe(false);
    });
  });

  describe('EE (plan: enterprise)', () => {
    describe('config gate', () => {
      it('throws when ENABLE_EXTERNAL_API is not "true", before the auth token is ever checked', async () => {
        mockConfigService.get.mockImplementation((key: string) =>
          key === 'ENABLE_EXTERNAL_API' ? 'false' : undefined
        );
        // The license lookup runs unconditionally before this gate (see canActivate) —
        // asserting on it here would pin an implementation quirk, not behavior.
        mockLicenseTermsService.getLicenseTermsInstance.mockResolvedValue(true);

        await expect(guard.canActivate(makeContext('Basic anything'))).rejects.toThrow(
          new ForbiddenException('External API is disabled')
        );
      });
    });

    describe('license gate', () => {
      beforeEach(() => {
        mockConfigService.get.mockImplementation((key: string) => (key === 'ENABLE_EXTERNAL_API' ? 'true' : undefined));
      });

      it('throws when unlicensed on a non-Cloud edition', async () => {
        process.env.TOOLJET_EDITION = 'ee';
        mockLicenseTermsService.getLicenseTermsInstance.mockResolvedValue(false);

        await expect(guard.canActivate(makeContext())).rejects.toThrow(
          new ForbiddenException('You do not have access to this resource')
        );
        expect(mockLicenseTermsService.getLicenseTermsInstance).toHaveBeenCalledWith(LICENSE_FIELD.EXTERNAL_API);
      });

      it('skips the license check on Cloud — falls through to the auth-token gate instead', async () => {
        process.env.TOOLJET_EDITION = 'cloud';
        mockLicenseTermsService.getLicenseTermsInstance.mockResolvedValue(false);

        // No license and no valid token on Cloud → rejected by the auth-token gate,
        // not the license gate — proves the license check was skipped, not just lenient.
        await expect(guard.canActivate(makeContext())).rejects.toThrow(new ForbiddenException('Unauthorized'));
      });
    });

    describe('auth-token gate', () => {
      beforeEach(() => {
        process.env.TOOLJET_EDITION = 'ee';
        mockConfigService.get.mockImplementation((key: string) => {
          if (key === 'ENABLE_EXTERNAL_API') return 'true';
          if (key === 'EXTERNAL_API_ACCESS_TOKEN') return 'the-real-token';
          return undefined;
        });
        mockLicenseTermsService.getLicenseTermsInstance.mockResolvedValue(true);
      });

      it('throws when the Authorization header is missing', async () => {
        await expect(guard.canActivate(makeContext())).rejects.toThrow(new ForbiddenException('Unauthorized'));
      });

      it('throws when the Authorization header carries the wrong token', async () => {
        await expect(guard.canActivate(makeContext('Basic wrong-token'))).rejects.toThrow(
          new ForbiddenException('Unauthorized')
        );
      });

      it('allows the request through when licensed, config-enabled, and the token matches', async () => {
        await expect(guard.canActivate(makeContext('Basic the-real-token'))).resolves.toBe(true);
      });
    });
  });
});
