import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { LICENSE_FIELD, LICENSE_TYPE } from '@modules/licensing/constants';
import { getLicenseFieldValue } from '@modules/licensing/helper';
import { Terms } from '@modules/licensing/interfaces/terms';
import OrganizationLicense from '@ee/licensing/configs/organization-license';
import { BASIC_PLAN_TERMS } from '@ee/licensing/constants/PlanTerms';

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
const cloud = (terms: Partial<Terms>, expiry = inDays(30)) =>
  new OrganizationLicense(terms as Terms, new Date(), expiry, 'team');

const limitsAvailable = (license: LicenseBase) => getLicenseFieldValue(LICENSE_FIELD.AI_CREDIT_LIMITS, license);

/** @group ai */
describe('Per-builder AI credit limits: which licences have them', () => {
  it.each([
    [LICENSE_TYPE.ENTERPRISE, true],
    [LICENSE_TYPE.TRIAL, true],
    [LICENSE_TYPE.BUSINESS, false],
    [LICENSE_TYPE.BASIC, false],
  ])('self-hosted licence of type %s: %s', (type, available) => {
    expect(limitsAvailable(selfHosted({ type, features: { ai: true } } as Partial<Terms>))).toBe(available);
  });

  it.each([
    [LICENSE_TYPE.ENTERPRISE, true],
    [LICENSE_TYPE.TRIAL, true],
    [LICENSE_TYPE.BUSINESS, false],
    [LICENSE_TYPE.BASIC, false],
  ])('Cloud licence of type %s: %s', (type, available) => {
    expect(limitsAvailable(cloud({ type, features: { ai: true } } as Partial<Terms>))).toBe(available);
  });

  it('an explicit ai.creditLimits term wins over the type', () => {
    const businessOn = { type: LICENSE_TYPE.BUSINESS, features: { ai: true }, ai: { creditLimits: true } };
    const enterpriseOff = { type: LICENSE_TYPE.ENTERPRISE, features: { ai: true }, ai: { creditLimits: false } };

    expect(limitsAvailable(selfHosted(businessOn as Partial<Terms>))).toBe(true);
    expect(limitsAvailable(cloud(businessOn as Partial<Terms>))).toBe(true);
    expect(limitsAvailable(selfHosted(enterpriseOff as Partial<Terms>))).toBe(false);
    expect(limitsAvailable(cloud(enterpriseOff as Partial<Terms>))).toBe(false);
  });

  it('needs the AI feature', () => {
    const aiOff = { type: LICENSE_TYPE.ENTERPRISE, features: { ai: false } } as Partial<Terms>;

    expect(limitsAvailable(selfHosted(aiOff))).toBe(false);
    expect(limitsAvailable(cloud(aiOff))).toBe(false);
  });

  // A missing licence can't be built here: NODE_ENV=test turns a licence without data into a test enterprise one.
  it('an expired licence has none, even with an Enterprise type and the explicit term', () => {
    const terms = {
      type: LICENSE_TYPE.ENTERPRISE,
      features: { ai: true },
      ai: { creditLimits: true },
    } as Partial<Terms>;

    expect(limitsAvailable(selfHosted(terms, inDays(-1)))).toBe(false);
    expect(limitsAvailable(cloud(terms, inDays(-1)))).toBe(false);
  });

  it('a Cloud trial as trial signup writes it (no ai feature key, which means on) has them', () => {
    expect(limitsAvailable(cloud({ type: LICENSE_TYPE.TRIAL, features: { oidc: true } } as Partial<Terms>))).toBe(true);
  });
});
