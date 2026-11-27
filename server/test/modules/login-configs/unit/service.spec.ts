import { HttpException } from '@nestjs/common';
import { LoginConfigsService } from '../../../../src/modules/login-configs/service';
import { RequestContext } from '../../../../src/modules/request-context/service';
import { SSOType } from '../../../../src/entities/sso_config.entity';
import { LICENSE_FIELD } from '../../../../src/modules/licensing/constants';

const user = { id: 'user-1', organizationId: 'org-1' } as any;

function makeService(isAutomaticSsoLoginLicensed: boolean) {
  const organizationsRepository = {
    findOne: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Org' }),
    updateOne: jest.fn(),
  };
  const loginConfigsUtilService = {
    // One SSO enabled and password login off: the only state that allows automatic SSO login.
    fetchOrganizationDetails: jest.fn().mockResolvedValue({
      google: { sso: SSOType.GOOGLE, enabled: true },
      form: { sso: SSOType.FORM, enabled: false },
    }),
  };
  const licenseTermsService = { getLicenseTerms: jest.fn().mockResolvedValue(isAutomaticSsoLoginLicensed) };
  const service = new LoginConfigsService(
    null as any,
    organizationsRepository as any,
    null as any,
    null as any,
    loginConfigsUtilService as any,
    null as any,
    null as any,
    licenseTermsService as any
  );
  return { service, organizationsRepository, licenseTermsService };
}

describe('LoginConfigsService.updateGeneralOrganizationConfigs (automatic SSO login)', () => {
  beforeEach(() => {
    jest.spyOn(RequestContext, 'setLocals').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects turning it on with 451 when the plan does not include it, and saves nothing', async () => {
    const { service, organizationsRepository, licenseTermsService } = makeService(false);

    const error = await service
      .updateGeneralOrganizationConfigs(user, { automaticSsoLogin: true } as any)
      .catch((e) => e);

    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(451);
    expect(licenseTermsService.getLicenseTerms).toHaveBeenCalledWith(LICENSE_FIELD.AUTOMATIC_SSO_LOGIN, 'org-1');
    expect(organizationsRepository.updateOne).not.toHaveBeenCalled();
  });

  it('saves it when the plan includes it', async () => {
    const { service, organizationsRepository } = makeService(true);

    await service.updateGeneralOrganizationConfigs(user, { automaticSsoLogin: true } as any);

    expect(organizationsRepository.updateOne).toHaveBeenCalledWith('org-1', { automaticSsoLogin: true });
  });

  it('lets anyone turn it off without checking the license', async () => {
    const { service, organizationsRepository, licenseTermsService } = makeService(false);

    await service.updateGeneralOrganizationConfigs(user, { automaticSsoLogin: false } as any);

    expect(licenseTermsService.getLicenseTerms).not.toHaveBeenCalled();
    expect(organizationsRepository.updateOne).toHaveBeenCalledWith('org-1', { automaticSsoLogin: false });
  });
});
