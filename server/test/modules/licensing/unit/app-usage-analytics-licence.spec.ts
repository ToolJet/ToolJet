/** @group platform */
import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { BASIC_PLAN_TERMS } from '@modules/licensing/constants/PlanTerms';
import { Terms } from '@modules/licensing/interfaces/terms';

const licence = (terms: Partial<Terms>, daysLeft = 30): LicenseBase => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + daysLeft);
  return new LicenseBase(BASIC_PLAN_TERMS, terms, new Date(), new Date(), expiry);
};

describe('LicenseBase.appUsageAnalytics', () => {
  it('should be on only when the licence sets appUsageAnalytics to true', () => {
    expect(
      licence({ type: 'enterprise', features: { appUsageAnalytics: true } } as Partial<Terms>).appUsageAnalytics
    ).toBe(true);
  });

  it('should be off when a paid licence does not mention appUsageAnalytics', () => {
    expect(licence({ type: 'enterprise', features: {} } as Partial<Terms>).appUsageAnalytics).toBe(false);
  });

  it('should be off when the licence sets appUsageAnalytics to false', () => {
    expect(
      licence({ type: 'enterprise', features: { appUsageAnalytics: false } } as Partial<Terms>).appUsageAnalytics
    ).toBe(false);
  });

  it('should be off once the licence expires and the basic plan applies', () => {
    expect(
      licence({ type: 'enterprise', features: { appUsageAnalytics: true } } as Partial<Terms>, -1).appUsageAnalytics
    ).toBe(false);
  });
});
