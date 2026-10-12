/**
 * @jest-environment node
 */
// Pure decision core behind the multi-environment license lock. This is the condition that
// gates the ToolJet Database promote ("Run in ...") action and the migration-history
// environment tabs. multiEnvLicense.js has no imports, so no mocking is needed.
import { isMultiEnvLicenseInvalid, getMultiEnvLicenseLockMessage } from '../multiEnvLicense';

describe('isMultiEnvLicenseInvalid', () => {
  it('returns false until featureAccess has loaded (no premature locked UI)', () => {
    expect(isMultiEnvLicenseInvalid(undefined)).toBe(false);
    expect(isMultiEnvLicenseInvalid(null)).toBe(false);
    expect(isMultiEnvLicenseInvalid({})).toBe(false);
  });

  it('locks when the plan does not include multi-environment (multiEnvironment === false)', () => {
    expect(
      isMultiEnvLicenseInvalid({ multiEnvironment: false, licenseStatus: { isExpired: false, isLicenseValid: true } })
    ).toBe(true);
  });

  it('locks when the license is expired', () => {
    expect(
      isMultiEnvLicenseInvalid({ multiEnvironment: true, licenseStatus: { isExpired: true, isLicenseValid: true } })
    ).toBe(true);
  });

  it('locks when the license is invalid', () => {
    expect(
      isMultiEnvLicenseInvalid({ multiEnvironment: true, licenseStatus: { isExpired: false, isLicenseValid: false } })
    ).toBe(true);
  });

  it('does NOT lock on a valid license that covers multi-environment', () => {
    expect(
      isMultiEnvLicenseInvalid({ multiEnvironment: true, licenseStatus: { isExpired: false, isLicenseValid: true } })
    ).toBe(false);
  });
});

describe('getMultiEnvLicenseLockMessage', () => {
  it('tells an expired/invalid license that multi-environments need a paid plan', () => {
    expect(getMultiEnvLicenseLockMessage({ licenseStatus: { isExpired: true } })).toBe(
      'Multi-environments are available only in paid plans'
    );
    expect(getMultiEnvLicenseLockMessage({ licenseStatus: { isLicenseValid: false } })).toBe(
      'Multi-environments are available only in paid plans'
    );
  });

  it('tells a valid plan that simply lacks multi-environment that the plan does not support it', () => {
    expect(
      getMultiEnvLicenseLockMessage({
        multiEnvironment: false,
        licenseStatus: { isExpired: false, isLicenseValid: true },
      })
    ).toBe("Your plan doesn't support multiple environments");
  });
});
