/**
 * @jest-environment node
 */
// Pure decision core behind the git-sync license lock. This is the condition the dashboard
// WorkspaceLockedBanner reads, and (combined with isGitSyncConfigured) the same condition that now
// disables the app/module create buttons on the dashboard. gitSyncLicense.js has no imports, so no
// mocking is needed.
import { isGitSyncLicenseInvalid, getGitSyncLicenseLockMessage } from '../gitSyncLicense';

describe('isGitSyncLicenseInvalid', () => {
  it('returns false until featureAccess has loaded (no premature frozen UI)', () => {
    expect(isGitSyncLicenseInvalid(undefined)).toBe(false);
    expect(isGitSyncLicenseInvalid(null)).toBe(false);
    expect(isGitSyncLicenseInvalid({})).toBe(false);
  });

  it('locks when the plan does not include git sync (gitSync === false)', () => {
    expect(isGitSyncLicenseInvalid({ gitSync: false, licenseStatus: { isExpired: false, isLicenseValid: true } })).toBe(
      true
    );
  });

  it('locks when the license is expired', () => {
    expect(isGitSyncLicenseInvalid({ gitSync: true, licenseStatus: { isExpired: true, isLicenseValid: true } })).toBe(
      true
    );
  });

  it('locks when the license is invalid', () => {
    expect(isGitSyncLicenseInvalid({ gitSync: true, licenseStatus: { isExpired: false, isLicenseValid: false } })).toBe(
      true
    );
  });

  it('does NOT lock on a valid license that covers git sync', () => {
    expect(isGitSyncLicenseInvalid({ gitSync: true, licenseStatus: { isExpired: false, isLicenseValid: true } })).toBe(
      false
    );
  });
});

describe('getGitSyncLicenseLockMessage', () => {
  it('tells an expired/invalid license to renew or disable git sync', () => {
    expect(getGitSyncLicenseLockMessage({ licenseStatus: { isExpired: true } })).toBe(
      'Your plan has expired. Renew your plan or disable git sync to continue.'
    );
    expect(getGitSyncLicenseLockMessage({ licenseStatus: { isLicenseValid: false } })).toBe(
      'Your plan has expired. Renew your plan or disable git sync to continue.'
    );
  });

  it('tells a valid plan that simply lacks git sync to disable git sync (renewing would not help)', () => {
    // This is the exact message reused on the disabled create-module tooltip.
    expect(
      getGitSyncLicenseLockMessage({ gitSync: false, licenseStatus: { isExpired: false, isLicenseValid: true } })
    ).toBe('Git sync is not enabled as per your current plan. Disable git sync to continue.');
  });
});
