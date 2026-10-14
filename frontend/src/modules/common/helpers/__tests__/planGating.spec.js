/**
 * @jest-environment node
 */
import { getGateState, getPlanRank, isGateUnlocked } from '../planGating';

const catalog = {
  plans: [
    { id: 'basic', label: 'Free' },
    { id: 'basicplus', label: 'Basic' },
    { id: 'pro', label: 'Pro' },
    { id: 'team', label: 'Team' },
    { id: 'enterprise', label: 'Enterprise' },
  ],
  gates: { gitSync: 'team', customStyling: 'pro', byok: null, appPermissionPages: 'enterprise' },
};

const access = ({
  planTier = 'basic',
  licenseType = 'basic',
  isLicenseValid = true,
  isExpired = false,
  ...flags
} = {}) => ({
  planTier,
  licenseStatus: { licenseType, isLicenseValid, isExpired },
  ...flags,
});

const gate = (gateKey, featureAccess, overrides = {}) =>
  getGateState({
    edition: 'cloud',
    featureAccess,
    featuresLoaded: true,
    catalog,
    catalogLoaded: true,
    gateKey,
    ...overrides,
  });

describe('planGating', () => {
  describe('getGateState', () => {
    it.each([
      ['free workspace', access({ planTier: 'basic' }), 'Team plan'],
      ['expired license', access({ planTier: 'basic', isExpired: true }), 'Team plan'],
      ['lower paid plan', access({ planTier: 'pro', licenseType: 'business' }), 'Team plan'],
      [
        'plan already high enough but flag off',
        access({ planTier: 'enterprise', licenseType: 'enterprise' }),
        'Upgrade',
      ],
      ['unknown plan tier', access({ planTier: null, licenseType: 'business' }), 'Upgrade'],
    ])('should tag a locked gate for a %s with "%s"', (_scenario, featureAccess, tagLabel) => {
      expect(gate('gitSync', featureAccess)).toMatchObject({ showTag: true, tagLabel, isTrial: false });
    });

    it('should hide the tag when the feature is available on a paid plan', () => {
      expect(gate('gitSync', access({ planTier: 'team', licenseType: 'business', gitSync: true })).showTag).toBe(false);
    });

    it('should keep the tag during a trial, naming the plan needed to keep the feature', () => {
      const trial = access({ planTier: null, licenseType: 'trial', gitSync: true });
      expect(gate('gitSync', trial)).toMatchObject({ showTag: true, tagLabel: 'Team plan', isTrial: true });
    });

    it.each([
      ['on CE', { edition: 'ce' }],
      ['before feature access loads', { featuresLoaded: false }],
      ['before the catalog loads', { catalogLoaded: false }],
    ])('should hide the tag %s', (_when, overrides) => {
      expect(gate('gitSync', access(), overrides).showTag).toBe(false);
    });

    it('should hide the tag for a gate the deployment does not offer', () => {
      expect(gate('byok', access()).showTag).toBe(false);
      expect(gate('unknownGate', access()).showTag).toBe(false);
    });

    it('should let the call site override availability', () => {
      expect(gate('customStyling', access({ customStyling: false }), { isUnlocked: true }).showTag).toBe(false);
    });
  });

  describe('isGateUnlocked', () => {
    it('should read flat feature flags', () => {
      expect(isGateUnlocked({ gitSync: true }, 'gitSync')).toBe(true);
      expect(isGateUnlocked({ gitSync: false }, 'gitSync')).toBe(false);
      expect(isGateUnlocked({}, 'gitSync')).toBe(false);
    });

    it('should derive byok from the AI plan', () => {
      expect(isGateUnlocked({ aiPlan: 'byok' }, 'byok')).toBe(true);
      expect(isGateUnlocked({ aiPlan: 'selfhostai' }, 'byok')).toBe(true);
      expect(isGateUnlocked({ aiPlan: 'credits' }, 'byok')).toBe(false);
    });
  });

  it('getPlanRank should return -1 for plans off the ladder', () => {
    expect(getPlanRank(catalog, 'team')).toBe(3);
    expect(getPlanRank(catalog, null)).toBe(-1);
    expect(getPlanRank(undefined, 'team')).toBe(-1);
  });
});
