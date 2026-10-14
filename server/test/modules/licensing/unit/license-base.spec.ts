/**
 * Unit tests for LicenseBase.canRelease / canPromote / licenseType — the getters the release-flag
 * consolidation depends on (see RolesUtilService.checkIfBuilderLevelEnvironmentPermissions and
 * GranularPermissionsUtilService.validateEnvironmentPermissions, which both read LICENSE_FIELD.RELEASE
 * resolved from these).
 *
 * LicenseBase is a plain class with no DI. Its constructor has a NODE_ENV==='test' && !licenseData
 * shortcut that stubs every flag to a hardcoded "always valid" state - passing a (possibly empty)
 * licenseData object bypasses that shortcut so the real parsing logic below runs, which is required
 * to exercise these getters meaningfully.
 */

import LicenseBase from '../../../../src/modules/licensing/configs/LicenseBase';
import { LICENSE_TYPE } from '../../../../src/modules/licensing/constants';

const BASIC_PLAN_TERMS_STUB = {
  app: { features: { release: false } },
} as any;

describe('LicenseBase.canRelease / canPromote', () => {
  it('falls back to the basic-plan term when the license is expired', () => {
    const license = new LicenseBase(
      BASIC_PLAN_TERMS_STUB,
      { type: LICENSE_TYPE.BUSINESS } as any,
      undefined,
      undefined,
      new Date(Date.now() - 86_400_000)
    );

    expect(license.canRelease).toBe(false);
    expect(license.canPromote).toBe(false);
  });

  it('defaults to true when a valid license omits the app.features.release key (legacy license format)', () => {
    const license = new LicenseBase(BASIC_PLAN_TERMS_STUB, {} as any);

    expect(license.canRelease).toBe(true);
    expect(license.canPromote).toBe(true);
  });

  it('reflects an explicit false value on a valid license', () => {
    const license = new LicenseBase(BASIC_PLAN_TERMS_STUB, {
      app: { features: { release: false } },
    } as any);

    expect(license.canRelease).toBe(false);
    expect(license.canPromote).toBe(false);
  });
});

describe('LicenseBase.publicApp', () => {
  const originalEdition = process.env.TOOLJET_EDITION;
  const BASIC_TERMS_WITHOUT_PUBLIC_APP = { app: { features: { publicApp: false } } } as any;

  afterEach(() => {
    process.env.TOOLJET_EDITION = originalEdition;
  });

  describe.each(['ce', 'ee'])('%s edition', (edition) => {
    beforeEach(() => {
      process.env.TOOLJET_EDITION = edition;
    });

    it('allows public apps when the license is expired (basic-plan fallback)', () => {
      const license = new LicenseBase(
        BASIC_TERMS_WITHOUT_PUBLIC_APP,
        { type: LICENSE_TYPE.BUSINESS } as any,
        undefined,
        undefined,
        new Date(Date.now() - 86_400_000)
      );

      expect(license.publicApp).toBe(true);
    });

    it('allows public apps even when a valid license sets app.features.publicApp to false', () => {
      const license = new LicenseBase(BASIC_TERMS_WITHOUT_PUBLIC_APP, {
        app: { features: { publicApp: false } },
      } as any);

      expect(license.publicApp).toBe(true);
    });
  });

  describe('cloud edition', () => {
    beforeEach(() => {
      process.env.TOOLJET_EDITION = 'cloud';
    });

    it('falls back to the basic-plan term when the license is expired', () => {
      const license = new LicenseBase(
        BASIC_TERMS_WITHOUT_PUBLIC_APP,
        { type: LICENSE_TYPE.BUSINESS, app: { features: { publicApp: true } } } as any,
        undefined,
        undefined,
        new Date(Date.now() - 86_400_000)
      );

      expect(license.publicApp).toBe(false);
    });

    it('allows public apps when a valid license sets app.features.publicApp to true', () => {
      const license = new LicenseBase(BASIC_TERMS_WITHOUT_PUBLIC_APP, {
        app: { features: { publicApp: true } },
      } as any);

      expect(license.publicApp).toBe(true);
    });

    it('blocks public apps when a valid license omits app.features.publicApp', () => {
      const license = new LicenseBase(BASIC_TERMS_WITHOUT_PUBLIC_APP, {} as any);

      expect(license.publicApp).toBe(false);
    });
  });
});

describe('LicenseBase.licenseType', () => {
  it('collapses to BASIC when the license is expired, regardless of its stated type', () => {
    const license = new LicenseBase(
      BASIC_PLAN_TERMS_STUB,
      { type: LICENSE_TYPE.BUSINESS } as any,
      undefined,
      undefined,
      new Date(Date.now() - 86_400_000)
    );

    expect(license.licenseType).toBe(LICENSE_TYPE.BASIC);
  });
});
