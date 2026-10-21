/** @group platform */
import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { BASIC_PLAN_TERMS } from '@modules/licensing/constants/PlanTerms';
import { LICENSE_FIELD, LICENSE_TYPE } from '@modules/licensing/constants';
import { getLicenseFieldValue } from '@modules/licensing/helper';
import { FEATURES } from '@modules/versions/constants/features';
import { FEATURE_KEY } from '@modules/versions/constants';
import { MODULES } from '@modules/app/constants/modules';

// Version compare, AI-turn snapshots and reviews are on trial and Pro and above.
describe('version review licence term', () => {
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
    expect(licence({ type: LICENSE_TYPE.TRIAL }).versionReview).toBe(true);
  });

  it.each(['pro', 'team', 'enterprise', 'flexible', 'business'])('is on for the %s plan', (plan) => {
    expect(licence({}, plan).versionReview).toBe(true);
  });

  it.each(['starter', 'basicplus', 'Starter'])('is off for the %s plan', (plan) => {
    expect(licence({}, plan).versionReview).toBe(false);
  });

  it('is off once the licence has expired', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(licence({}, 'pro', yesterday).versionReview).toBe(false);
  });

  it('follows the licence when it names the feature either way', () => {
    expect(licence({ app: { features: { versionReview: false } } }, 'pro').versionReview).toBe(false);
    expect(licence({ app: { features: { versionReview: true } } }, 'starter').versionReview).toBe(true);
  });

  it('is reported to the frontend and to the feature guard', () => {
    const pro = licence({}, 'pro');
    const starter = licence({}, 'starter');
    expect((pro.features as any).versionReview).toBe(true);
    expect((starter.features as any).versionReview).toBe(false);
    expect(getLicenseFieldValue(LICENSE_FIELD.VERSION_REVIEW, pro)).toBe(true);
    expect(getLicenseFieldValue(LICENSE_FIELD.VERSION_REVIEW, starter)).toBe(false);
  });

  it.each([
    FEATURE_KEY.COMPARE,
    FEATURE_KEY.REVIEW_APPROVE,
    FEATURE_KEY.REVIEW_OVERRIDE,
    FEATURE_KEY.SNAPSHOT_CREATE,
    FEATURE_KEY.SNAPSHOT_RESTORE,
  ])('gates the %s endpoints on it', (feature) => {
    expect(FEATURES[MODULES.VERSION][feature].license).toBe(LICENSE_FIELD.VERSION_REVIEW);
  });

  // Taking and restoring snapshots change the app's history, so each is its own audit event.
  it('audits snapshot creation and restore under their own action types', () => {
    expect(FEATURES[MODULES.VERSION][FEATURE_KEY.SNAPSHOT_CREATE].auditLogsKey).toBe('APP_SNAPSHOT_CREATE');
    expect(FEATURES[MODULES.VERSION][FEATURE_KEY.SNAPSHOT_RESTORE].auditLogsKey).toBe('APP_SNAPSHOT_RESTORE');
  });
});
