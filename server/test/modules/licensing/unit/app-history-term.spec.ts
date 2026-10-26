/** @group platform */
import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { BASIC_PLAN_TERMS } from '@modules/licensing/constants/PlanTerms';
import { LICENSE_FIELD, LICENSE_TYPE } from '@modules/licensing/constants';
import { getLicenseFieldValue } from '@modules/licensing/helper';

// App history is on the same plans as version compare (trial and Pro and above): AI turns are
// compared and undone through it.
describe('app history licence term', () => {
  const nextMonth = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  };
  const licence = (terms: Record<string, any>, plan?: string, expiry: Date = nextMonth()) =>
    new LicenseBase(
      BASIC_PLAN_TERMS,
      { type: LICENSE_TYPE.ENTERPRISE, ...terms },
      new Date(),
      new Date(),
      expiry,
      plan
    );

  it('is on for a trial, which has no plan name', () => {
    expect(licence({ type: LICENSE_TYPE.TRIAL }).appHistory).toBe(true);
  });

  it.each(['pro', 'team', 'enterprise', 'flexible', 'business'])('is on for the %s plan', (plan) => {
    expect(licence({}, plan).appHistory).toBe(true);
  });

  it.each(['starter', 'basicplus', 'Starter'])('is off for the %s plan', (plan) => {
    expect(licence({}, plan).appHistory).toBe(false);
  });

  it('is off once the licence has expired', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(licence({}, 'pro', yesterday).appHistory).toBe(false);
  });

  it('follows the licence when it names the feature either way', () => {
    expect(licence({ app: { features: { history: false } } }, 'pro').appHistory).toBe(false);
    expect(licence({ app: { features: { history: true } } }, 'starter').appHistory).toBe(true);
  });

  it('matches version compare on every plan', () => {
    for (const plan of [undefined, 'pro', 'business', 'starter', 'basicplus']) {
      const terms = plan ? {} : { type: LICENSE_TYPE.TRIAL };
      expect(licence(terms, plan).appHistory).toBe(licence(terms, plan).versionReview);
    }
  });

  it('is reported to the frontend and to the feature guard', () => {
    expect((licence({}, 'pro').features as any).appHistory).toBe(true);
    expect((licence({}, 'starter').features as any).appHistory).toBe(false);
    expect(getLicenseFieldValue(LICENSE_FIELD.APP_HISTORY, licence({}, 'pro'))).toBe(true);
  });
});
