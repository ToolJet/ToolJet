import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { LICENSE_FIELD, LICENSE_TYPE } from '@modules/licensing/constants';
import { getLicenseFieldValue } from '@modules/licensing/helper';
import { Terms } from '@modules/licensing/interfaces/terms';
import OrganizationLicense from '@ee/licensing/configs/organization-license';
import { BASIC_PLAN_TERMS, TEAM_PLAN_TERMS_CLOUD } from '@ee/licensing/constants/PlanTerms';

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000);

/** Self-hosted: a decrypted licence key (`License` extends LicenseBase with these basic terms). */
const selfHosted = (terms: Partial<Terms>, expiry = inDays(30)) =>
  new (LicenseBase as unknown as new (...args: unknown[]) => LicenseBase)(
    BASIC_PLAN_TERMS,
    terms,
    new Date(),
    new Date(),
    expiry
  );

/** Cloud: the workspace's organization_license row. */
const cloud = (terms: Partial<Terms>, plan?: string, expiry = inDays(30)) =>
  new OrganizationLicense(terms as Terms, new Date(), expiry, plan);

const withType = (type: LICENSE_TYPE, extra: Partial<Terms> = {}): Partial<Terms> => ({
  ...(TEAM_PLAN_TERMS_CLOUD as Partial<Terms>),
  type,
  ...extra,
});

const limits = (license: LicenseBase) => getLicenseFieldValue(LICENSE_FIELD.AI_CREDIT_LIMITS, license);

/** @group ai */
describe('Per-builder AI credit limits licence gate', () => {
  describe.each([
    ['self-hosted', (terms: Partial<Terms>) => selfHosted(terms)],
    ['cloud', (terms: Partial<Terms>) => cloud(terms, 'team')],
  ])('%s', (_edition, license) => {
    it.each([
      [LICENSE_TYPE.ENTERPRISE, true],
      [LICENSE_TYPE.TRIAL, true],
      [LICENSE_TYPE.BUSINESS, false],
      [LICENSE_TYPE.BASIC, false],
    ])('licence type %s → %s', (type, expected) => {
      expect(limits(license(withType(type)))).toBe(expected);
    });

    it('an explicit ai.creditLimits term wins over the type', () => {
      expect(limits(license(withType(LICENSE_TYPE.BUSINESS, { ai: { creditLimits: true } } as Partial<Terms>)))).toBe(
        true
      );
      expect(
        limits(license(withType(LICENSE_TYPE.ENTERPRISE, { ai: { creditLimits: false } } as Partial<Terms>)))
      ).toBe(false);
    });

    it('needs the AI feature', () => {
      const terms = withType(LICENSE_TYPE.ENTERPRISE);
      expect(limits(license({ ...terms, features: { ...terms.features, ai: false } }))).toBe(false);
    });
  });

  // A missing licence can't be built here: NODE_ENV=test turns a licence without data into a test enterprise one.
  it('an expired licence (basic plan) has no limits, even with an enterprise type', () => {
    expect(limits(selfHosted(withType(LICENSE_TYPE.ENTERPRISE), inDays(-1)))).toBe(false);
    expect(limits(cloud(withType(LICENSE_TYPE.ENTERPRISE), 'team', inDays(-1)))).toBe(false);
  });

  it('Cloud plans as written by checkout and trial signup', () => {
    // organization-payments: every self-serve plan (starter, basicplus, pro, team) is type business.
    expect(limits(cloud({ ...(TEAM_PLAN_TERMS_CLOUD as Partial<Terms>), type: LICENSE_TYPE.BUSINESS }, 'team'))).toBe(
      false
    );
    // licensing util generateCloudTrialLicense: type trial, features without `ai` (absent = on).
    expect(limits(cloud({ type: LICENSE_TYPE.TRIAL, features: { oidc: true } }))).toBe(true);
  });

  it('is listed in the licence features', () => {
    expect((selfHosted(withType(LICENSE_TYPE.ENTERPRISE)).features as Record<string, unknown>).aiCreditLimits).toBe(
      true
    );
  });
});
