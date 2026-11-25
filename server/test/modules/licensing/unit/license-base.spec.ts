/**
 * Unit tests for the LicenseBase getters that encode plan entitlements: release/promote, license type,
 * page limits and automatic SSO login.
 *
 * LicenseBase is a plain class with no DI. Its constructor has a NODE_ENV==='test' && !licenseData
 * shortcut that stubs every flag to a hardcoded "always valid" state - passing a (possibly empty)
 * licenseData object bypasses that shortcut so the real parsing logic below runs, which is required
 * to exercise these getters meaningfully.
 */

import LicenseBase from '../../../../src/modules/licensing/configs/LicenseBase';
import { LICENSE_TYPE } from '../../../../src/modules/licensing/constants';

const BASIC_PLAN_TERMS_STUB = {
  features: { automaticSsoLogin: false },
  app: { features: { release: false }, pages: { count: 20, groupCount: 20 } },
} as any;

const EXPIRED = new Date(Date.now() - 86_400_000);

const ENTERPRISE_KEY = { type: LICENSE_TYPE.ENTERPRISE, plan: { name: 'team' } };
const TEAM_KEY = { type: LICENSE_TYPE.BUSINESS, plan: { name: 'team' } };
const TRIAL_KEY = { type: LICENSE_TYPE.TRIAL };

describe('LicenseBase.canRelease / canPromote', () => {
  it('falls back to the basic-plan term when the license is expired', () => {
    const license = new LicenseBase(
      BASIC_PLAN_TERMS_STUB,
      { type: LICENSE_TYPE.BUSINESS } as any,
      undefined,
      undefined,
      EXPIRED
    );

    expect(license.canRelease).toBe(false);
    expect(license.canPromote).toBe(false);
  });

  it('defaults to true on an Enterprise license (plan team) that omits app.features.release', () => {
    const license = new LicenseBase(BASIC_PLAN_TERMS_STUB, ENTERPRISE_KEY as any);

    expect(license.canRelease).toBe(true);
    expect(license.canPromote).toBe(true);
  });

  it.each([
    ['Team', TEAM_KEY],
    ['trial', TRIAL_KEY],
  ])('defaults to false on a %s license that omits app.features.release', (_label, key) => {
    const license = new LicenseBase(BASIC_PLAN_TERMS_STUB, key as any);

    expect(license.canRelease).toBe(false);
    expect(license.canPromote).toBe(false);
  });

  it('reflects an explicit false value on a valid license', () => {
    const license = new LicenseBase(BASIC_PLAN_TERMS_STUB, {
      app: { features: { release: false } },
    } as any);

    expect(license.canRelease).toBe(false);
    expect(license.canPromote).toBe(false);
  });
});

describe('LicenseBase.licenseType', () => {
  it('collapses to BASIC when the license is expired, regardless of its stated type', () => {
    const license = new LicenseBase(
      BASIC_PLAN_TERMS_STUB,
      { type: LICENSE_TYPE.BUSINESS } as any,
      undefined,
      undefined,
      EXPIRED
    );

    expect(license.licenseType).toBe(LICENSE_TYPE.BASIC);
  });
});

describe('LicenseBase page limits', () => {
  it('defaults to 100 pages and page groups on an Enterprise license (plan team) that omits them', () => {
    const license = new LicenseBase(BASIC_PLAN_TERMS_STUB, ENTERPRISE_KEY as any);

    expect(license.appPagesLimit).toBe(100);
    expect(license.appPageGroupsLimit).toBe(100);
  });

  it.each([
    ['Team', TEAM_KEY],
    ['trial', TRIAL_KEY],
  ])('defaults to 20 pages and page groups on a %s license that omits them', (_label, key) => {
    const license = new LicenseBase(BASIC_PLAN_TERMS_STUB, key as any);

    expect(license.appPagesLimit).toBe(20);
    expect(license.appPageGroupsLimit).toBe(20);
  });

  it('uses the limits set in the license key over the plan default', () => {
    const license = new LicenseBase(
      BASIC_PLAN_TERMS_STUB,
      { app: { pages: { count: 7, groupCount: 3 } } } as any,
      undefined,
      undefined,
      undefined,
      'team'
    );

    expect(license.appPagesLimit).toBe(7);
    expect(license.appPageGroupsLimit).toBe(3);
  });

  it('falls back to the basic-plan limits when the license is expired', () => {
    const license = new LicenseBase(
      BASIC_PLAN_TERMS_STUB,
      { app: { pages: { count: 100, groupCount: 100 } } } as any,
      undefined,
      undefined,
      EXPIRED
    );

    expect(license.appPagesLimit).toBe(20);
    expect(license.appPageGroupsLimit).toBe(20);
  });
});

describe('LicenseBase.automaticSsoLogin', () => {
  it('is on for an Enterprise license (plan team) that omits the flag', () => {
    const license = new LicenseBase(BASIC_PLAN_TERMS_STUB, ENTERPRISE_KEY as any);

    expect(license.automaticSsoLogin).toBe(true);
  });

  it.each([
    ['Pro', { type: LICENSE_TYPE.BUSINESS, plan: { name: 'pro' } }],
    ['trial', TRIAL_KEY],
  ])('is off for a %s license that omits the flag', (_label, key) => {
    const license = new LicenseBase(BASIC_PLAN_TERMS_STUB, key as any);

    expect(license.automaticSsoLogin).toBe(false);
  });

  it('uses an explicit flag in the license key over the plan default', () => {
    const team = new LicenseBase(BASIC_PLAN_TERMS_STUB, {
      ...TEAM_KEY,
      features: { automaticSsoLogin: true },
    } as any);
    const enterprise = new LicenseBase(BASIC_PLAN_TERMS_STUB, {
      ...ENTERPRISE_KEY,
      features: { automaticSsoLogin: false },
    } as any);

    expect(team.automaticSsoLogin).toBe(true);
    expect(enterprise.automaticSsoLogin).toBe(false);
  });

  it('falls back to the basic-plan term when the license is expired', () => {
    const license = new LicenseBase(
      BASIC_PLAN_TERMS_STUB,
      { features: { automaticSsoLogin: true } } as any,
      undefined,
      undefined,
      EXPIRED
    );

    expect(license.automaticSsoLogin).toBe(false);
  });
});
