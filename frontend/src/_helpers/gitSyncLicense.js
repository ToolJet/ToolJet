// Single source of truth for "git sync is not covered by the current license".
//
// featureAccess.gitSync is already false on an expired/basic plan, but we also check the license
// status explicitly so an expired-but-feature-still-present edge case still locks. Returns false
// until featureAccess has actually loaded, so the UI never flashes a frozen state on first paint.
export function isGitSyncLicenseInvalid(featureAccess) {
  if (!featureAccess || Object.keys(featureAccess).length === 0) return false;
  const status = featureAccess.licenseStatus;
  return featureAccess.gitSync === false || status?.isExpired === true || status?.isLicenseValid === false;
}

// Message for the "git configured but not covered by the current license" lock banner. Two distinct
// cases both trip isGitSyncLicenseInvalid, but they read very differently to the user:
//   - Expired / invalid license → renew to restore access.
//   - Valid license whose plan simply doesn't include git sync → renewing wouldn't help; the plan
//     doesn't cover the feature. Telling this user their "plan has expired" is wrong and confusing.
// Both cases share the same escape hatch: disable git sync to keep working.
export function getGitSyncLicenseLockMessage(featureAccess) {
  const status = featureAccess?.licenseStatus;
  const isExpiredOrInvalid = status?.isExpired === true || status?.isLicenseValid === false;
  return isExpiredOrInvalid
    ? 'Your plan has expired. Renew your plan or disable git sync to continue.'
    : 'Git sync is not enabled as per your current plan. Disable git sync to continue.';
}
