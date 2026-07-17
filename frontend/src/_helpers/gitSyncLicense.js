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
