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
describe('LicenseBase', () => {
  describe('aiCreditLimits', () => {
    describe('on a self-hosted licence', () => {
      it.each([
        [LICENSE_TYPE.ENTERPRISE, true],
        [LICENSE_TYPE.TRIAL, true],
        [LICENSE_TYPE.BUSINESS, false],
        [LICENSE_TYPE.BASIC, false],
      ])('should map type %s to %s', (type, available) => {
        expect(limitsAvailable(selfHosted({ type, features: { ai: true } } as Partial<Terms>))).toBe(available);
      });
    });

    describe('on a Cloud licence', () => {
      it.each([
        [LICENSE_TYPE.ENTERPRISE, true],
        [LICENSE_TYPE.TRIAL, true],
        [LICENSE_TYPE.BUSINESS, false],
        [LICENSE_TYPE.BASIC, false],
      ])('should map type %s to %s', (type, available) => {
        expect(limitsAvailable(cloud({ type, features: { ai: true } } as Partial<Terms>))).toBe(available);
      });
    });

    describe('without the AI feature', () => {
      it('should be false', () => {
        const aiOff = { type: LICENSE_TYPE.ENTERPRISE, features: { ai: false } } as Partial<Terms>;

        expect(limitsAvailable(selfHosted(aiOff))).toBe(false);
        expect(limitsAvailable(cloud(aiOff))).toBe(false);
      });
    });

    describe('with an expired licence', () => {
      // A missing licence can't be built here: NODE_ENV=test turns a licence without data into a test enterprise one.
      it('should be false even with an Enterprise type', () => {
        const terms = { type: LICENSE_TYPE.ENTERPRISE, features: { ai: true } } as Partial<Terms>;

        expect(limitsAvailable(selfHosted(terms, inDays(-1)))).toBe(false);
        expect(limitsAvailable(cloud(terms, inDays(-1)))).toBe(false);
      });
    });

    describe('with a Cloud trial written by trial signup (no ai feature key, which means on)', () => {
      it('should be true', () => {
        expect(limitsAvailable(cloud({ type: LICENSE_TYPE.TRIAL, features: { oidc: true } } as Partial<Terms>))).toBe(
          true
        );
      });
    });
  });
});
